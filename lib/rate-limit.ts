type Entry = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000;
const LIMIT = 20;
const bucket = new Map<string, Entry>();

function cleanup(now: number) {
  for (const [key, value] of bucket.entries()) {
    if (value.resetAt <= now) bucket.delete(key);
  }
}

export function checkRateLimit(key: string): { ok: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  cleanup(now);

  const current = bucket.get(key);
  if (!current || current.resetAt <= now) {
    bucket.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (current.count >= LIMIT) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  bucket.set(key, current);
  return { ok: true };
}
