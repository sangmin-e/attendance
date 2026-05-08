import { createClient } from "@supabase/supabase-js";

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// JWT payload에서 Supabase 프로젝트 ref 추출
function getProjectRef(key: string): string {
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64").toString());
    return payload.ref as string;
  } catch {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY가 올바르지 않습니다.");
  }
}

const supabaseUrl = `https://${getProjectRef(supabaseServiceRoleKey)}.supabase.co`;

// 서버 전용 클라이언트 (service_role key — RLS 우회)
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
