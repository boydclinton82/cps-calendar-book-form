import { kv } from '@vercel/kv';

const AUDIT_CAP = 1000; // keep the most recent N events per instance

function auditKey() {
  const slug = process.env.INSTANCE_SLUG || 'cps-software';
  return `instance:${slug}:audit`;
}

// Same IP extraction as api/_lib/security.js
export function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    'unknown'
  );
}

// Fire-and-forget append. MUST NOT throw into the request path.
// event: { action:'create'|'update'|'delete'|'conflict', dateKey, timeKey, user?, duration?, ip?, result }
export async function logAudit(event) {
  try {
    const key = auditKey();
    await kv.lpush(key, { ts: Date.now(), ...event });
    await kv.ltrim(key, 0, AUDIT_CAP - 1);
  } catch (err) {
    console.error('Audit log write failed:', err);
  }
}

export async function readAudit(limit = 50) {
  try {
    return await kv.lrange(auditKey(), 0, Math.max(0, limit - 1));
  } catch (err) {
    console.error('Audit log read failed:', err);
    return [];
  }
}
