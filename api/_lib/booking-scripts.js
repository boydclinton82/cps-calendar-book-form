// Atomic booking mutations. Each script does GET -> cjson.decode -> logic ->
// cjson.encode -> SET inside a single EVAL, so concurrent invocations cannot lose
// each other's writes (fixes the read-modify-write lost-update race).
//
// Data shape at KEYS[1] (instance:<slug>:bookings):
//   { "YYYY-MM-DD": { "HH:00": { user, duration } } }
// Slots are whole hours; a booking with duration D occupies [startH, startH+D).
//
// Signalling: each script returns a plain string ('OK' | 'CONFLICT' | 'NOTFOUND'
// | 'BADTIME'). These are not valid JSON tokens, so the Upstash SDK's auto-parse
// leaves them as strings. Never return numbers (RESP truncates floats).
//
// cjson note: Upstash's managed Redis does NOT expose
// cjson.encode_empty_table_as_object (it throws "attempt to call a non-function").
// Any non-empty table here has string keys, so lua-cjson encodes it as an object.
// The only empty-table case is a fully-drained top-level blob, which default
// lua-cjson would encode as '[]'; we write a literal '{}' instead to keep the
// stored shape an object (matching what kv.set({}) produced before).

// CREATE: ARGV = [date, hour, user, duration]
// Returns: 'OK' | 'CONFLICT' | 'BADTIME'
export const CREATE_BOOKING_LUA = `
local raw = redis.call('GET', KEYS[1])
local data = raw and cjson.decode(raw) or {}
local date = ARGV[1]
local hour = ARGV[2]
local user = ARGV[3]
local duration = tonumber(ARGV[4])
local startH = tonumber(string.sub(hour, 1, 2))
if startH == nil or duration == nil then return 'BADTIME' end
local day = data[date]
if type(day) ~= 'table' then day = {}; data[date] = day end
-- reject if the new range [startH, startH+duration) overlaps any existing booking,
-- in either direction (this is stricter and more correct than the old JS check).
for h = 0, 23 do
  local key = string.format('%02d:00', h)
  local existing = day[key]
  if type(existing) == 'table' then
    local exDur = tonumber(existing.duration) or 1
    if h < (startH + duration) and startH < (h + exDur) then
      return 'CONFLICT'
    end
  end
end
day[hour] = { user = user, duration = duration }
if next(data) == nil then redis.call('SET', KEYS[1], '{}') else redis.call('SET', KEYS[1], cjson.encode(data)) end
return 'OK'
`;

// UPDATE: ARGV = [date, hour, newUser('' = keep), newDuration('' = keep)]
// Returns: 'OK' | 'CONFLICT' | 'NOTFOUND'
export const UPDATE_BOOKING_LUA = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 'NOTFOUND' end
local data = cjson.decode(raw)
local date = ARGV[1]
local hour = ARGV[2]
local day = data[date]
if type(day) ~= 'table' or type(day[hour]) ~= 'table' then return 'NOTFOUND' end
local cur = day[hour]
local startH = tonumber(string.sub(hour, 1, 2))
local curDur = tonumber(cur.duration) or 1
if ARGV[4] ~= '' then
  local newDur = tonumber(ARGV[4])
  if newDur ~= nil and newDur > curDur then
    for h = startH + curDur, startH + newDur - 1 do
      if day[string.format('%02d:00', h)] ~= nil then return 'CONFLICT' end
    end
  end
  cur.duration = newDur
end
if ARGV[3] ~= '' then cur.user = ARGV[3] end
day[hour] = cur
if next(data) == nil then redis.call('SET', KEYS[1], '{}') else redis.call('SET', KEYS[1], cjson.encode(data)) end
return 'OK'
`;

// DELETE: ARGV = [date, hour]
// Returns: 'OK' | 'NOTFOUND'
export const DELETE_BOOKING_LUA = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 'NOTFOUND' end
local data = cjson.decode(raw)
local date = ARGV[1]
local hour = ARGV[2]
local day = data[date]
if type(day) ~= 'table' or day[hour] == nil then return 'NOTFOUND' end
day[hour] = nil
if next(day) == nil then data[date] = nil end
if next(data) == nil then redis.call('SET', KEYS[1], '{}') else redis.call('SET', KEYS[1], cjson.encode(data)) end
return 'OK'
`;

// ---------------------------------------------------------------------------
// PER-DAY HASH MODEL (KEYS[1] = instance:<slug>:bookings:<date>)
// Field = "HH:00", value = JSON {user, duration}. Same overlap correctness as the
// blob scripts above, but scoped to one day so a write is O(one day), not O(all dates).
// ---------------------------------------------------------------------------

// CREATE_DAY: ARGV = [hour, user, duration]
// Returns: 'OK' | 'CONFLICT' | 'BADTIME'
export const CREATE_BOOKING_DAY_LUA = `
local hour = ARGV[1]
local user = ARGV[2]
local duration = tonumber(ARGV[3])
local startH = tonumber(string.sub(hour, 1, 2))
if startH == nil or duration == nil then return 'BADTIME' end
-- half-open overlap test against every existing booking in this day, both directions
local arr = redis.call('HGETALL', KEYS[1])
for i = 1, #arr, 2 do
  local exH = tonumber(string.sub(arr[i], 1, 2))
  local rec = cjson.decode(arr[i + 1])
  local exDur = tonumber(rec.duration) or 1
  if exH ~= nil and exH < (startH + duration) and startH < (exH + exDur) then
    return 'CONFLICT'
  end
end
redis.call('HSET', KEYS[1], hour, cjson.encode({ user = user, duration = duration }))
return 'OK'
`;

// UPDATE_DAY: ARGV = [hour, newUser('' = keep), newDuration('' = keep)]
// Returns: 'NOTFOUND' | 'CONFLICT' | the stored record as JSON (auto-parsed by the SDK)
export const UPDATE_BOOKING_DAY_LUA = `
local hour = ARGV[1]
local raw = redis.call('HGET', KEYS[1], hour)
if not raw then return 'NOTFOUND' end
local cur = cjson.decode(raw)
local startH = tonumber(string.sub(hour, 1, 2))
local curDur = tonumber(cur.duration) or 1
if ARGV[3] ~= '' then
  local newDur = tonumber(ARGV[3])
  if newDur ~= nil and newDur > curDur then
    -- full half-open interval test against OTHER bookings (fixes the weak blob check)
    local arr = redis.call('HGETALL', KEYS[1])
    for i = 1, #arr, 2 do
      if arr[i] ~= hour then
        local exH = tonumber(string.sub(arr[i], 1, 2))
        local rec = cjson.decode(arr[i + 1])
        local exDur = tonumber(rec.duration) or 1
        if exH ~= nil and exH < (startH + newDur) and startH < (exH + exDur) then
          return 'CONFLICT'
        end
      end
    end
  end
  cur.duration = newDur
end
if ARGV[2] ~= '' then cur.user = ARGV[2] end
redis.call('HSET', KEYS[1], hour, cjson.encode(cur))
return cjson.encode(cur)
`;

// DELETE_DAY: ARGV = [hour]
// Returns: 'OK' | 'NOTFOUND'  (Redis auto-removes the hash when its last field goes)
export const DELETE_BOOKING_DAY_LUA = `
local removed = redis.call('HDEL', KEYS[1], ARGV[1])
if removed == 0 then return 'NOTFOUND' end
return 'OK'
`;
