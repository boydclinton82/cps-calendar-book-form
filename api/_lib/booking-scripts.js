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
