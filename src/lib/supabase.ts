import { createBrowserClient } from "@supabase/ssr";

export function getSupabase() {
  if (typeof window === "undefined") {
    throw new Error("Client này chỉ dùng trong trình duyệt.");
  }
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Thiếu cấu hình Supabase.");
  return createBrowserClient(url, key);
}
