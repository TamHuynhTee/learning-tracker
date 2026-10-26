import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"];
const supabaseKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

let client: SupabaseClient | undefined;

// Browser sessions stay in browser storage. Do not create a shared authenticated
// client during SSR; server-side queries will need a separate per-request client.
export function getSupabase() {
  if (typeof window === "undefined") {
    throw new Error("Supabase Auth chỉ được khởi tạo trong trình duyệt.");
  }
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Thiếu cấu hình Supabase trong .env.local.");
  }
  client ??= createClient(supabaseUrl, supabaseKey);
  return client;
}
