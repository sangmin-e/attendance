import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedSupabase: SupabaseClient | null = null;

function getProjectRef(key: string): string {
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64").toString());
    if (typeof payload.ref !== "string" || !payload.ref) {
      throw new Error();
    }
    return payload.ref;
  } catch {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is invalid.");
  }
}

export function getSupabase(): SupabaseClient {
  if (cachedSupabase) return cachedSupabase;

  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const supabaseUrl = `https://${getProjectRef(supabaseServiceRoleKey)}.supabase.co`;

  cachedSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  return cachedSupabase;
}
