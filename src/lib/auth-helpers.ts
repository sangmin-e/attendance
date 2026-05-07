import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionCookie,
} from "@/lib/admin-session";
import { GATE_SESSION_COOKIE, verifyGateSessionCookie } from "@/lib/gate-session";

export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionCookie(session, secret);
}

export async function isGateUnlocked(): Promise<boolean> {
  const secret = process.env.ATTENDANCE_GATE_SECRET;
  if (!secret) return false;

  const cookieStore = await cookies();
  const session = cookieStore.get(GATE_SESSION_COOKIE)?.value;
  return verifyGateSessionCookie(session, secret);
}
