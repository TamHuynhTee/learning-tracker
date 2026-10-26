import { I18nextProvider, useTranslation } from "react-i18next";
import { createAppI18n, LANGUAGE_STORAGE_KEY, defaultT } from "@/lib/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { BookOpenCheck, Plus } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { authErrorKey } from "@/lib/auth-errors";
import { toast } from "sonner";

function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("error.notFound")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("error.notFoundDescription")}</p>
        <div className="mt-6">
          <Button asChild>
            <Link to="/resources">{t("common.back")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const { t } = useTranslation();
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{t("error.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("error.description")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("common.retry")}
          </button>
          <a
            href="/resources"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("common.back")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: defaultT("app.title") },
      {
        name: "description",
        content: defaultT("app.description"),
      },
      { name: "author", content: defaultT("app.name") },
      { property: "og:title", content: defaultT("app.title") },
      {
        property: "og:description",
        content: defaultT("app.socialDescription"),
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const [i18n] = useState(createAppI18n);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === "en" || saved === "vi") void i18n.changeLanguage(saved);
    } catch {
      // Language switching remains available when browser storage is disabled.
    }
  }, [i18n]);
  return (
    <I18nextProvider i18n={i18n}>
      <LocalizedShell>{children}</LocalizedShell>
    </I18nextProvider>
  );
}

function LocalizedShell({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  return (
    <html lang={i18n.resolvedLanguage ?? "en"}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppHeader() {
  const { t } = useTranslation();
  const { session, loading } = useAuth();
  const router = useRouter();
  const { queryClient } = Route.useRouteContext();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const { error } = await getSupabase().auth.signOut({ scope: "local" });
      if (error) throw error;
      queryClient.clear();
      await router.navigate({ to: "/login" });
      toast.success(t("auth.signedOut"));
    } catch (error) {
      toast.error(t(authErrorKey(error)));
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/resources" className="flex items-center gap-2.5" resetScroll={false}>
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpenCheck className="size-5" />
          </span>
          <span className="text-base font-bold tracking-tight">{t("app.name")}</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link
              to="/resources"
              activeProps={{ className: "font-semibold text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground" }}
            >
              {t("nav.resources")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link
              to="/resources/new"
              activeProps={{ className: "font-semibold text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground" }}
            >
              <Plus className="size-4" />
              {t("nav.add")}
            </Link>
          </Button>
          {loading ? (
            <span role="status" className="text-xs text-muted-foreground">
              {t("auth.loadingSession")}
            </span>
          ) : session ? (
            <>
              <span
                className="max-w-40 truncate text-xs text-muted-foreground"
                title={session.user.email}
              >
                {session.user.email}
              </span>
              <Button size="sm" onClick={signOut} disabled={signingOut}>
                {t("auth.signOut")}
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/login">{t("auth.login")}</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

function AppFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>{t("app.footer")}</span>
        <span>{t("app.statuses")}</span>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex min-h-screen flex-col bg-background text-foreground">
          <AppHeader />
          <main className="flex-1">
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
          </main>
          <AppFooter />
        </div>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  return (
    <select
      aria-label={t("language.label")}
      value={i18n.resolvedLanguage ?? "en"}
      className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onChange={(event) => {
        const language = event.target.value;
        void i18n.changeLanguage(language);
        try {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        } catch {
          // A blocked storage API should not prevent language switching.
        }
      }}
    >
      <option value="en" lang="en">
        English
      </option>
      <option value="vi" lang="vi">
        Tiếng Việt
      </option>
    </select>
  );
}
