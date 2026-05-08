import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GATE_SESSION_COOKIE, verifyGateSessionCookie } from "@/lib/gate-session";
import { appendAttendance } from "@/lib/attendance-store";
import { getActiveRoster, normalizeStudentId } from "@/lib/students-store";

export async function POST(req: Request) {
  const secret = process.env.ATTENDANCE_GATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "서버 설정 오류입니다." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const gateRaw = cookieStore.get(GATE_SESSION_COOKIE)?.value;
  if (!verifyGateSessionCookie(gateRaw, secret)) {
    return NextResponse.json(
      { error: "출석 화면에 먼저 입장해 주세요." },
      { status: 403 },
    );
  }

  let body: { studentId?: string; clientDateKey?: string };
  try {
    body = (await req.json()) as { studentId?: string; clientDateKey?: string };
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const raw = body.studentId?.trim() ?? "";
  if (!raw) {
    return NextResponse.json({ error: "학번을 입력하세요." }, { status: 400 });
  }

  const id = normalizeStudentId(raw);
  if (!id) {
    return NextResponse.json({ error: "잘못 입력하였습니다." }, { status: 400 });
  }

  const roster = await getActiveRoster();
  const student = roster?.students[id] ?? null;
  if (!roster || !student) {
    return NextResponse.json(
      { error: "잘못 입력하였습니다.", studentId: id },
      { status: 400 },
    );
  }

  const dateKey =
    typeof body.clientDateKey === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.clientDateKey)
      ? body.clientDateKey
      : new Date().toISOString().slice(0, 10);

  const recordedAt = new Date().toISOString();

  await appendAttendance({
    rosterId: roster.id,
    rosterTitle: roster.title,
    studentId: id,
    name: student.name,
    studentType: student.studentType || null,
    dateKey,
    recordedAt,
  });

  const studentLabel = student.studentType
    ? `${student.studentType} ${id} ${student.name}`
    : `${id} ${student.name}`;

  return NextResponse.json({
    ok: true,
    message: `${studentLabel} 학생\n출석했습니다.`,
    studentId: id,
    name: student.name,
    studentType: student.studentType,
  });
}
