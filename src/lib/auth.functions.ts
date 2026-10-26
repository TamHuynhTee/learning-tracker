import { createServerFn } from "@tanstack/react-start";
import { readUser } from "@/lib/supabase.server";

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(async () => {
  const { user } = await readUser();
  // Do not serialize access tokens, refresh tokens or the full session into HTML.
  return user ? { id: user.id, email: user.email ?? null } : null;
});
