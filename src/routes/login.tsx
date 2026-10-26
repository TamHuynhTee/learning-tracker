import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpenCheck, Chrome, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Đăng nhập — Sổ Học Tập" },
      {
        name: "description",
        content: "Đăng nhập Sổ Học Tập để quản lý tài liệu tự học của bạn.",
      },
      { property: "og:title", content: "Đăng nhập — Sổ Học Tập" },
      {
        property: "og:description",
        content: "Đăng nhập Sổ Học Tập để quản lý tài liệu tự học của bạn.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

// Bản demo giao diện: form chỉ mô phỏng đăng nhập, sẽ nối Auth thật ở bước sau.
function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      toast.success("Đăng nhập thành công (bản demo)!");
      void navigate({ to: "/resources" });
    }, 700);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-10 sm:py-16">
      <div className="flex items-center justify-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <BookOpenCheck className="size-5" />
        </span>
        <span className="text-lg font-bold tracking-tight">Sổ Học Tập</span>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-xl">Đăng nhập</CardTitle>
          <CardDescription>
            Đăng nhập để lưu và theo dõi tài liệu tự học của riêng bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="ban@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
            </Button>
          </form>
          <Button variant="outline" className="mt-3 w-full" onClick={() => toast.info("Đăng nhập bằng Google sẽ có ở bước sau.")}>
            <Chrome className="size-4" />
            Đăng nhập bằng Google
          </Button>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          <span>
            Chưa có tài khoản?{" "}
            <button
              type="button"
              className="font-medium text-foreground underline-offset-4 hover:underline"
              onClick={() => toast.info("Đăng ký sẽ được nối với Auth ở bước sau.")}
            >
              Đăng ký
            </button>
          </span>
        </CardFooter>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Bản demo giao diện — đăng nhập thật sẽ được kết nối ở bước sau.
      </p>
    </div>
  );
}
