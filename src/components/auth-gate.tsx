import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/login", replace: true });
  }, [loading, session, navigate]);
  if (loading || !session) {
    return (
      <p role="status" className="mx-auto max-w-6xl px-4 py-10 text-muted-foreground">
        {t("auth.loadingSession")}
      </p>
    );
  }
  // Remount forms when the account changes to prevent carrying drafts across users.
  return <div key={session.user.id}>{children}</div>;
}
