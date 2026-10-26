import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie, setResponseHeader } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";

export function createSupabaseServer() {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Thiếu cấu hình Supabase.");

  // Never share an authenticated client between requests/users.
  return createServerClient(url, key, {
    cookies: {
      getAll: () => Object.entries(getCookies()).map(([name, value]) => ({ name, value })),
      setAll(cookies, headers) {
        for (const { name, value, options } of cookies) setCookie(name, value, options);
        for (const [name, value] of Object.entries(headers)) setResponseHeader(name, value);
      },
    },
  });
}

export async function readUser() {
  setResponseHeader("Cache-Control", "private, no-store");
  const supabase = createSupabaseServer();
  // Validate with Auth; never trust an unverified cookie/session user object.
  const { data, error } = await supabase.auth.getUser();
  if (error && (error.status === 0 || !error.status || error.status >= 500)) {
    throw new Error("Không kiểm tra được phiên đăng nhập. Vui lòng thử lại.");
  }
  return { supabase, user: error ? null : data.user };
}

export async function requireUser() {
  const result = await readUser();
  if (!result.user) {
    throw redirect({ to: "/login", headers: { "Cache-Control": "private, no-store" } });
  }
  return { supabase: result.supabase, user: result.user };
}
