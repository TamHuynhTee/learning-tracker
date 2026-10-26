import { createSupabaseServer } from "@/lib/supabase.server";
import { setResponseHeader } from "@tanstack/react-start/server";

export async function handleAuthCallback(request: Request) {
  setResponseHeader("Cache-Control", "private, no-store");
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const target = new URL("/login", url.origin);
  target.searchParams.set("confirmation", "error");
  if (code) {
    try {
      const { error } = await createSupabaseServer().auth.exchangeCodeForSession(code);
      if (!error) target.searchParams.set("confirmation", "success");
    } catch {
      // Do not leak the authorization code or raw auth error into the URL/logs.
    }
  }
  return new Response(null, {
    status: 303,
    headers: { Location: target.href, "Cache-Control": "private, no-store" },
  });
}
