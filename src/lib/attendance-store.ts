import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type AttendanceEntry = {
  id: string;
  rosterId: string;
  rosterTitle: string;
  studentId: string;
  name: string | null;
  dateKey: string;
  recordedAt: string;
};

type AttendanceFile = {
  entries: AttendanceEntry[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const ATTENDANCE_FILE = path.join(DATA_DIR, "attendance.json");

async function readAttendanceFile(): Promise<AttendanceFile> {
  try {
    const raw = await fs.readFile(ATTENDANCE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<AttendanceFile>;
    return { entries: Array.isArray(parsed.entries) ? parsed.entries as AttendanceEntry[] : [] };
  } catch {
    return { entries: [] };
  }
}

async function writeAttendanceFile(value: AttendanceFile): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ATTENDANCE_FILE, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function appendAttendance(
  entry: Omit<AttendanceEntry, "id">,
): Promise<AttendanceEntry> {
  const saved = await readAttendanceFile();
  const next: AttendanceEntry = { id: randomUUID(), ...entry };
  saved.entries.push(next);
  await writeAttendanceFile(saved);
  return next;
}

export async function getAttendanceByDate(params: {
  rosterId?: string;
  dateKey: string;
}): Promise<AttendanceEntry[]> {
  const saved = await readAttendanceFile();
  return saved.entries.filter((e) => {
    if (e.dateKey !== params.dateKey) return false;
    if (params.rosterId && e.rosterId !== params.rosterId) return false;
    return true;
  });
}
