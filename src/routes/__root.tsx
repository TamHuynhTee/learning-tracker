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
import { useEffect, type ReactNode } from "react";
import { BookOpenCheck, Plus } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Không tìm thấy trang</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Trang bạn cần không tồn tại hoặc đã bị di chuyển.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link to="/resources">Về danh sách tài liệu</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Trang này không tải được
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Có lỗi phía hệ thống. Bạn có thể thử lại hoặc quay về danh sách tài liệu.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Thử lại
          </button>
          <a
            href="/resources"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Về danh sách tài liệu
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
      { title: "Sổ Học Tập — Quản lý tài liệu tự học" },
      {
        name: "description",
        content:
          "Sổ Học Tập giúp bạn lưu tài liệu tự học theo chủ đề và theo dõi trạng thái: Chưa học, Đang học, Hoàn thành.",
      },
      { name: "author", content: "Sổ Học Tập" },
      { property: "og:title", content: "Sổ Học Tập — Quản lý tài liệu tự học" },
      {
        property: "og:description",
        content:
          "Lưu tài liệu tự học theo chủ đề và theo dõi trạng thái: Chưa học, Đang học, Hoàn thành.",
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
  return (
    <html lang="vi">
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
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          to="/resources"
          className="flex items-center gap-2.5"
          resetScroll={false}
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpenCheck className="size-5" />
          </span>
          <span className="text-base font-bold tracking-tight">Sổ Học Tập</span>
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link
              to="/resources"
              activeProps={{ className: "font-semibold text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground" }}
            >
              Tài liệu
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link
              to="/resources/new"
              activeProps={{ className: "font-semibold text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground" }}
            >
              <Plus className="size-4" />
              Thêm tài liệu
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/login">Đăng nhập</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function AppFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>Sổ Học Tập — bản demo giao diện với dữ liệu mẫu.</span>
        <span>Chưa học · Đang học · Hoàn thành</span>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <AppHeader />
        <main className="flex-1">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </main>
        <AppFooter />
      </div>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
