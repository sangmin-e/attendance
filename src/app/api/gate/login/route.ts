import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  GATE_SESSION_COOKIE,
  signGateSession,
} from "@/lib/gate-session";
import { getAttendanceGatePassword } from "@/lib/gate-password-store";

const SESSION_MS = 12 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const secret = process.env.ATTENDANCE_GATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "서버 설정 오류입니다." }, { status: 500 });
  }

  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const input = body.password?.trim() ?? "";
  if (!input) {
    return NextResponse.json({ error: "비밀번호를 입력하세요." }, { status: 400 });
  }

  const gatePassword = await getAttendanceGatePassword();
  if (input !== gatePassword) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const exp = Date.now() + SESSION_MS;
  const token = signGateSession(exp, secret);
  const cookieStore = await cookies();
  cookieStore.set(GATE_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_MS / 1000),
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ ok: true });
}
