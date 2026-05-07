import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  signAdminSession,
} from "@/lib/admin-session";

const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!username || !password || !secret) {
    return NextResponse.json(
      { error: "서버에 관리자 환경 변수가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = (await req.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (body.username !== username || body.password !== password) {
    return NextResponse.json(
      { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }

  const exp = Date.now() + SESSION_MS;
  const token = signAdminSession(exp, secret);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_MS / 1000),
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ ok: true });
}
