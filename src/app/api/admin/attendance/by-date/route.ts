import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionCookie,
} from "@/lib/admin-session";
import { getAttendanceByDate } from "@/lib/attendance-store";
import { getRosterById } from "@/lib/students-store";

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

  const roster = rosterId ? await getRosterById(rosterId) : null;
  const entries = await getAttendanceByDate({ rosterId, dateKey: date });
  const normalizedEntries = entries.map((entry) => {
    const student =
      roster?.students.find(
        (candidate) =>
          candidate.studentId === entry.studentId &&
          (!entry.studentType || candidate.studentType === entry.studentType),
      ) ?? roster?.students.find((candidate) => candidate.studentId === entry.studentId);
    return {
      ...entry,
      name: entry.name ?? student?.name ?? null,
      studentType: student?.studentType || entry.studentType || null,
    };
  });

  const filteredEntries = studentType
    ? normalizedEntries.filter((entry) => entry.studentType === studentType)
    : normalizedEntries;

  return NextResponse.json({ entries: filteredEntries });
}
