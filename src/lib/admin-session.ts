import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";

export function signAdminSession(expMs: number, secret: string): string {
  const payload = JSON.stringify({ exp: expMs });
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${sig}`;
}

export function verifyAdminSessionCookie(
  value: string | undefined,
  secret: string,
): boolean {
  if (!value) return false;
  const dot = value.indexOf(".");
  if (dot < 0) return false;
  const b64 = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  let payload: string;
  try {
    payload = Buffer.from(b64, "base64url").toString("utf8");
  } catch {
    return false;
  }
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  if (sig.length !== expected.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  } catch {
    return false;
  }
  let exp: number;
  try {
    const parsed = JSON.parse(payload) as { exp?: unknown };
    exp = typeof parsed.exp === "number" ? parsed.exp : 0;
  } catch {
    return false;
  }
  return exp > Date.now();
}
