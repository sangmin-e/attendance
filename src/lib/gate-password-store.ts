import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const GATE_PASSWORD_FILE = path.join(DATA_DIR, "gate-password.json");

type GatePasswordData = {
  password: string;
  updatedAt: string;
};

function defaultGatePassword(): string {
  return process.env.ATTENDANCE_GATE_PASSWORD?.trim() || "1225";
}

async function readGatePasswordFile(): Promise<GatePasswordData | null> {
  try {
    const raw = await fs.readFile(GATE_PASSWORD_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<GatePasswordData>;
    const password = typeof parsed.password === "string" ? parsed.password.trim() : "";
    if (!password) return null;
    return {
      password,
      updatedAt:
        typeof parsed.updatedAt === "string" && parsed.updatedAt
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getAttendanceGatePassword(): Promise<string> {
  const saved = await readGatePasswordFile();
  return saved?.password ?? defaultGatePassword();
}

export async function setAttendanceGatePassword(password: string): Promise<void> {
  const next = password.trim();
  if (!next) {
    throw new Error("Gate password cannot be empty");
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  const payload: GatePasswordData = {
    password: next,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(GATE_PASSWORD_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}
