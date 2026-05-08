import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionCookie,
} from "@/lib/admin-session";
import { parseStudentWorkbook } from "@/lib/parse-student-xlsx";
import { saveUploadedRoster } from "@/lib/students-store";

export async function POST(req: Request) {
  const adminSecret = process.env.ADMIN_SESSION_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: "서버 설정 오류입니다." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifyAdminSessionCookie(token, adminSecret)) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }

  const form = await req.formData();
  const title = String(form.get("title") ?? "").trim() || "학생 명단";
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "업로드 파일이 필요합니다." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const students = parseStudentWorkbook(Buffer.from(bytes));
  const count = students.length;
  if (count === 0) {
    return NextResponse.json(
      { error: "엑셀에서 학생 정보를 읽지 못했습니다." },
      { status: 400 },
    );
  }

  const roster = await saveUploadedRoster(title, students);
  return NextResponse.json({ ok: true, rosterId: roster.id, count });
}
