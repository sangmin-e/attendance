import { getSupabase } from "./supabase";

export type Roster = {
  id: string;
  title: string;
  updatedAt: string;
  students: StudentInfo[];
};

export type StudentInfo = {
  studentId: string;
  name: string;
  studentType: string;
};

type RosterRow = {
  id: string;
  title: string;
  updated_at: string;
};

type StudentRow = {
  roster_id: string;
  student_id: string;
  name: string;
  student_type: string | null;
};

async function fetchStudentsForRosters(rosterIds: string[]): Promise<StudentRow[]> {
  if (rosterIds.length === 0) return [];
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("roster_students")
    .select("roster_id, student_id, name, student_type")
    .in("roster_id", rosterIds);
  if (error) throw new Error(error.message);
  return (data ?? []) as StudentRow[];
}

function rowsToStudents(rows: StudentRow[]): StudentInfo[] {
  return rows.map((row) => ({
    studentId: row.student_id,
    name: row.name,
    studentType: row.student_type ?? "",
  }));
}

export async function readRostersList(): Promise<Roster[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("rosters")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as RosterRow[];
  if (rows.length === 0) return [];

  const students = await fetchStudentsForRosters(rows.map((r) => r.id));
  const studentsByRoster: Record<string, StudentRow[]> = {};
  for (const student of students) {
    if (!studentsByRoster[student.roster_id]) studentsByRoster[student.roster_id] = [];
    studentsByRoster[student.roster_id].push(student);
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
    students: rowsToStudents(studentsByRoster[row.id] ?? []),
  }));
}

export async function getActiveRoster(): Promise<Roster | null> {
  const rosters = await readRostersList();
  return rosters[0] ?? null;
}

export async function getRosterById(rosterId: string): Promise<Roster | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("rosters")
    .select("id, title, updated_at")
    .eq("id", rosterId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as RosterRow;
  const students = await fetchStudentsForRosters([row.id]);
  return {
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
    students: rowsToStudents(students),
  };
}

export async function deleteRosterById(rosterId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("rosters").delete().eq("id", rosterId);
  if (error) throw new Error(error.message);
}

export async function saveUploadedRoster(
  title: string,
  students: StudentInfo[],
): Promise<Roster> {
  const rosters = await saveUploadedRosters(title, students);
  const first = rosters[0];
  if (!first) throw new Error("No students to save.");
  return first;
}

export async function saveUploadedRosters(
  title: string,
  students: StudentInfo[],
): Promise<Roster[]> {
  const normalized = normalizeStudents(students);
  const groups = groupStudentsByType(normalized, title);
  const saved: Roster[] = [];

  for (const [groupTitle, groupStudents] of groups) {
    saved.push(await insertRoster(groupTitle, groupStudents));
  }

  return saved;
}

async function insertRoster(title: string, students: StudentInfo[]): Promise<Roster> {
  const supabase = getSupabase();
  const updatedAt = new Date().toISOString();
  const { data: rosterData, error: rosterError } = await supabase
    .from("rosters")
    .insert({ title: title.trim() || "학생 명단", updated_at: updatedAt })
    .select()
    .single();
  if (rosterError) throw new Error(rosterError.message);

  const roster = rosterData as RosterRow;
  const studentRows = students.map((student) => ({
    roster_id: roster.id,
    student_id: student.studentId,
    name: student.name,
    student_type: student.studentType,
  }));

  if (studentRows.length > 0) {
    const { error: studentsError } = await supabase
      .from("roster_students")
      .insert(studentRows);
    if (studentsError) throw new Error(studentsError.message);
  }

  return {
    id: roster.id,
    title: roster.title,
    updatedAt: roster.updated_at,
    students,
  };
}

function groupStudentsByType(
  students: StudentInfo[],
  fallbackTitle: string,
): Array<[string, StudentInfo[]]> {
  const groups = new Map<string, StudentInfo[]>();
  const fallback = fallbackTitle.trim() || "학생 명단";

  for (const student of students) {
    const groupTitle = student.studentType || fallback;
    const group = groups.get(groupTitle) ?? [];
    group.push(student);
    groups.set(groupTitle, group);
  }

  return Array.from(groups.entries());
}

function normalizeStudents(students: StudentInfo[]): StudentInfo[] {
  const byKey = new Map<string, StudentInfo>();
  for (const rawStudent of students) {
    const studentId = normalizeStudentId(rawStudent?.studentId ?? "");
    const name = String(rawStudent?.name ?? "").trim();
    const studentType = String(rawStudent?.studentType ?? "").trim();
    if (!studentId || !name) continue;
    byKey.set(`${studentId}\u0000${studentType}`, { studentId, name, studentType });
  }
  return Array.from(byKey.values());
}

export function normalizeStudentId(input: string): string {
  return input.replace(/\D+/g, "").slice(0, 12);
}

export function idFromCell(cell: unknown): string {
  if (typeof cell === "number" && Number.isFinite(cell)) {
    return normalizeStudentId(String(Math.trunc(cell)));
  }
  if (typeof cell === "string") {
    return normalizeStudentId(cell);
  }
  return "";
}
