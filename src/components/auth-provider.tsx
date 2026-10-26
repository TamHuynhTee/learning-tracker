import { useEffect, useRef, useState, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";
import { AuthContext, type AuthUser } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

export function AuthProvider({
  children,
  initialUser,
  onUserChange,
}: {
  children: ReactNode;
  initialUser?: AuthUser | null;
  onUserChange?: () => void;
}) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(initialUser ?? null);
  const [loading, setLoading] = useState(initialUser === undefined);
  const previousId = useRef(initialUser?.id);

  useEffect(() => {
    try {
      const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
        setUser(session ? { id: session.user.id, email: session.user.email ?? null } : null);
        setLoading(false);
      });
      return () => data.subscription.unsubscribe();
    } catch {
      setLoading(false);
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (previousId.current !== user?.id) {
      queryClient.clear();
      onUserChange?.();
      previousId.current = user?.id;
    }
  }, [user?.id, loading, queryClient, onUserChange]);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}
