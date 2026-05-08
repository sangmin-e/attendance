import { getSupabase } from "./supabase";

export async function getAttendanceGatePassword(): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("gate_password")
    .select("password")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return process.env.ATTENDANCE_GATE_PASSWORD?.trim() || "1225";
  }
  return (data as { password: string }).password;
}

export async function setAttendanceGatePassword(password: string): Promise<void> {
  const next = password.trim();
  if (!next) throw new Error("Gate password cannot be empty");

  const supabase = getSupabase();
  const { error } = await supabase
    .from("gate_password")
    .upsert({ id: 1, password: next, updated_at: new Date().toISOString() }, { onConflict: "id" });

  if (error) throw new Error(error.message);
}
