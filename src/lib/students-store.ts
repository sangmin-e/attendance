import { supabase } from "./supabase";

export type Roster = {
  id: string;
  title: string;
  updatedAt: string;
  students: Record<string, string>;
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
};

async function fetchStudentsForRosters(rosterIds: string[]): Promise<StudentRow[]> {
  if (rosterIds.length === 0) return [];
  const { data, error } = await supabase
    .from("roster_students")
    .select("roster_id, student_id, name")
    .in("roster_id", rosterIds);
  if (error) throw new Error(error.message);
  return (data ?? []) as StudentRow[];
}

export async function readRostersList(): Promise<Roster[]> {
  const { data, error } = await supabase
    .from("rosters")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as RosterRow[];
  if (rows.length === 0) return [];

  const students = await fetchStudentsForRosters(rows.map((r) => r.id));
  const studentsByRoster: Record<string, Record<string, string>> = {};
  for (const s of students) {
    if (!studentsByRoster[s.roster_id]) studentsByRoster[s.roster_id] = {};
    studentsByRoster[s.roster_id][s.student_id] = s.name;
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    updatedAt: r.updated_at,
    students: studentsByRoster[r.id] ?? {},
  }));
}

export async function getActiveRoster(): Promise<Roster | null> {
  const rosters = await readRostersList();
  return rosters[0] ?? null;
}

export async function saveUploadedRoster(
  title: string,
  students: Record<string, string>,
): Promise<Roster> {
  const normalized = normalizeStudents(students);
  const updatedAt = new Date().toISOString();

  const { data: rosterData, error: rosterError } = await supabase
    .from("rosters")
    .insert({ title: title.trim() || "학생 명단", updated_at: updatedAt })
    .select()
    .single();
  if (rosterError) throw new Error(rosterError.message);

  const roster = rosterData as RosterRow;

  const studentRows = Object.entries(normalized).map(([studentId, name]) => ({
    roster_id: roster.id,
    student_id: studentId,
    name,
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
    students: normalized,
  };
}

function normalizeStudents(students: Record<string, string>): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [rawId, rawName] of Object.entries(students)) {
    const id = normalizeStudentId(rawId);
    const name = String(rawName ?? "").trim();
    if (!id || !name) continue;
    next[id] = name;
  }
  return next;
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
