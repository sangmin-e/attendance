import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionCookie,
} from "@/lib/admin-session";
import { getAttendanceByDate } from "@/lib/attendance-store";

export async function GET(req: Request) {
  const adminSecret = process.env.ADMIN_SESSION_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: "서버 설정 오류입니다." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifyAdminSessionCookie(token, adminSecret)) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? "";
  const rosterId = searchParams.get("rosterId") ?? undefined;
  const studentType = searchParams.get("studentType")?.trim() || undefined;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "날짜 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const entries = await getAttendanceByDate({ rosterId, dateKey: date, studentType });
  return NextResponse.json({ entries });
}
