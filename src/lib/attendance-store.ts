import { getSupabase } from "./supabase";

export type AttendanceEntry = {
  id: string;
  rosterId: string;
  rosterTitle: string;
  studentId: string;
  name: string | null;
  studentType: string | null;
  dateKey: string;
  recordedAt: string;
};

type Row = {
  id: string;
  roster_id: string;
  roster_title: string;
  student_id: string;
  name: string | null;
  student_type: string | null;
  date_key: string;
  recorded_at: string;
};

function rowToEntry(row: Row): AttendanceEntry {
  return {
    id: row.id,
    rosterId: row.roster_id,
    rosterTitle: row.roster_title,
    studentId: row.student_id,
    name: row.name,
    studentType: row.student_type,
    dateKey: row.date_key,
    recordedAt: row.recorded_at,
  };
}

export async function appendAttendance(
  entry: Omit<AttendanceEntry, "id">,
): Promise<AttendanceEntry> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("attendance_entries")
    .insert({
      roster_id: entry.rosterId,
      roster_title: entry.rosterTitle,
      student_id: entry.studentId,
      name: entry.name,
      student_type: entry.studentType,
      date_key: entry.dateKey,
      recorded_at: entry.recordedAt,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToEntry(data as Row);
}

export async function getAttendanceByDate(params: {
  rosterId?: string;
  dateKey: string;
}): Promise<AttendanceEntry[]> {
  const supabase = getSupabase();
  let query = supabase
    .from("attendance_entries")
    .select("*")
    .eq("date_key", params.dateKey);

  if (params.rosterId) {
    query = query.eq("roster_id", params.rosterId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Row[]).map(rowToEntry);
}
