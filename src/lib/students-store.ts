import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type Roster = {
  id: string;
  title: string;
  updatedAt: string;
  students: Record<string, string>;
};

type RostersFile = {
  rosters: Roster[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const ROSTERS_FILE = path.join(DATA_DIR, "rosters.json");
const LEGACY_STUDENTS_FILE = path.join(DATA_DIR, "students.json");

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

async function readJsonSafe<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readLegacyAsRoster(): Promise<Roster | null> {
  const legacy = await readJsonSafe<{
    title?: unknown;
    updatedAt?: unknown;
    students?: unknown;
  }>(LEGACY_STUDENTS_FILE);
  if (!legacy || typeof legacy.students !== "object" || !legacy.students) return null;

  const students = normalizeStudents(legacy.students as Record<string, string>);
  if (Object.keys(students).length === 0) return null;

  return {
    id: randomUUID(),
    title: typeof legacy.title === "string" && legacy.title.trim() ? legacy.title.trim() : "학생 명단",
    updatedAt:
      typeof legacy.updatedAt === "string" && legacy.updatedAt
        ? legacy.updatedAt
        : new Date().toISOString(),
    students,
  };
}

export async function readRostersList(): Promise<Roster[]> {
  const parsed = await readJsonSafe<RostersFile>(ROSTERS_FILE);
  if (parsed?.rosters?.length) {
    return parsed.rosters.map((r) => ({
      id: r.id,
      title: r.title,
      updatedAt: r.updatedAt,
      students: normalizeStudents(r.students ?? {}),
    }));
  }

  const fallback = await readLegacyAsRoster();
  if (!fallback) return [];

  await writeJson(ROSTERS_FILE, { rosters: [fallback] });
  return [fallback];
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
  const nextRoster: Roster = {
    id: randomUUID(),
    title: title.trim() || "학생 명단",
    updatedAt: new Date().toISOString(),
    students: normalized,
  };

  const current = await readRostersList();
  const updated = [nextRoster, ...current];
  await writeJson(ROSTERS_FILE, { rosters: updated });
  await writeJson(LEGACY_STUDENTS_FILE, {
    title: nextRoster.title,
    updatedAt: nextRoster.updatedAt,
    students: nextRoster.students,
  });
  return nextRoster;
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
