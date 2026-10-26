import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { AuthContext } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // INITIAL_SESSION restores the persisted session; later events keep every
    // consumer in sync after sign-in, sign-out, refresh, or another tab changing it.
    try {
      const { data } = getSupabase().auth.onAuthStateChange((_event, next) => {
        setSession(next);
        setLoading(false);
      });
      return () => data.subscription.unsubscribe();
    } catch {
      // Login/register report configuration failures when submitted.
      setLoading(false);
      return undefined;
    }
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return undefined;
    return () => {
      // Abort in-flight queries and remove private data on logout/account change,
      // including auth events originating from another browser tab.
      void queryClient.cancelQueries({ queryKey: ["resources", userId] });
      queryClient.removeQueries({ queryKey: ["resources", userId] });
    };
  }, [queryClient, userId]);

  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>;
}
