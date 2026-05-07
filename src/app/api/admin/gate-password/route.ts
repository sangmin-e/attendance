import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionCookie,
} from "@/lib/admin-session";
import { setAttendanceGatePassword } from "@/lib/gate-password-store";

const MIN_LEN = 4;
const MAX_LEN = 64;

export async function POST(req: Request) {
  const adminSecret = process.env.ADMIN_SESSION_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: "서버 설정 오류입니다." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifyAdminSessionCookie(session, adminSecret)) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }

  let body: { password?: string; passwordConfirm?: string };
  try {
    body = (await req.json()) as { password?: string; passwordConfirm?: string };
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const password = body.password?.trim() ?? "";
  const passwordConfirm = body.passwordConfirm?.trim() ?? "";

  if (password.length < MIN_LEN || password.length > MAX_LEN) {
    return NextResponse.json(
      { error: `비밀번호는 ${MIN_LEN}~${MAX_LEN}자로 입력하세요.` },
      { status: 400 },
    );
  }

  if (password !== passwordConfirm) {
    return NextResponse.json(
      { error: "비밀번호 확인이 일치하지 않습니다." },
      { status: 400 },
    );
  }

  await setAttendanceGatePassword(password);

  return NextResponse.json({ ok: true });
}
