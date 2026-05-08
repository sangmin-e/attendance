import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionCookie,
} from "@/lib/admin-session";
import { deleteRosterById } from "@/lib/students-store";

export async function DELETE(req: Request) {
  const adminSecret = process.env.ADMIN_SESSION_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: "서버 설정 오류입니다." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifyAdminSessionCookie(token, adminSecret)) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }

  let body: { rosterId?: string };
  try {
    body = (await req.json()) as { rosterId?: string };
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const rosterId = body.rosterId?.trim() ?? "";
  if (!rosterId) {
    return NextResponse.json({ error: "삭제할 명단을 선택하세요." }, { status: 400 });
  }

  await deleteRosterById(rosterId);
  return NextResponse.json({ ok: true });
}
