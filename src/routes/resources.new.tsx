import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Circle, CircleDashed, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RESOURCE_STATUSES,
  STATUS_LABELS,
  type ResourceStatus,
} from "@/lib/resources";

export const Route = createFileRoute("/resources/new")({
  head: () => ({
    meta: [
      { title: "Thêm tài liệu — Sổ Học Tập" },
      {
        name: "description",
        content: "Thêm một tài liệu tự học mới: tiêu đề, URL, chủ đề và trạng thái học.",
      },
      { property: "og:title", content: "Thêm tài liệu — Sổ Học Tập" },
      {
        property: "og:description",
        content: "Thêm một tài liệu tự học mới: tiêu đề, URL, chủ đề và trạng thái học.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewResourcePage,
});

const COMMON_TOPICS = [
  "Frontend",
  "Backend",
  "TypeScript",
  "Database",
  "AI / Machine Learning",
  "Phương pháp học",
  "Tiếng Anh",
];

// Bản demo giao diện: form chưa lưu vào database, sẽ nối Supabase ở bước sau.
function NewResourcePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState<ResourceStatus>("chua-hoc");
  const [errors, setErrors] = useState<{ title?: string; url?: string; topic?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next: typeof errors = {};
    if (!title.trim()) next.title = "Vui lòng nhập tiêu đề.";
    if (!/^https?:\/\/\S+\.\S+/.test(url.trim())) {
      next.url = "URL phải bắt đầu bằng https:// và trỏ đến một trang hợp lệ.";
    }
    if (!topic.trim()) next.topic = "Vui lòng nhập chủ đề.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!validate()) return;
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      toast.success(`Đã nhận "${title.trim()}" — sẽ lưu vào database ở bước sau.`);
      void navigate({ to: "/resources" });
    }, 500);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Thêm tài liệu mới</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Lưu lại đường dẫn bạn muốn học, gắn chủ đề và chọn trạng thái bắt đầu.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Thông tin tài liệu</CardTitle>
          <CardDescription>
            Các trường có dấu * là bắt buộc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                placeholder="VD: Hiểu sâu về closure trong JavaScript"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title ? <p className="text-sm text-destructive">{errors.title}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                aria-invalid={Boolean(errors.url)}
              />
              <p className="text-xs text-muted-foreground">
                Đường dẫn tới bài viết, khoá học hoặc video, bắt đầu bằng https://
              </p>
              {errors.url ? <p className="text-sm text-destructive">{errors.url}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Chủ đề *</Label>
              <Input
                id="topic"
                list="common-topics"
                placeholder="VD: Frontend, Database…"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                aria-invalid={Boolean(errors.topic)}
              />
              <datalist id="common-topics">
                {COMMON_TOPICS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              {errors.topic ? <p className="text-sm text-destructive">{errors.topic}</p> : null}
            </div>

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Trạng thái">
                {RESOURCE_STATUSES.map((s) => {
                  const active = status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setStatus(s)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background text-foreground hover:bg-accent"
                      }`}
                    >
                      {s === "chua-hoc" ? <Circle className="size-4" /> : null}
                      {s === "dang-hoc" ? <CircleDashed className="size-4" /> : null}
                      {s === "hoan-thanh" ? <CheckCircle2 className="size-4" /> : null}
                      {STATUS_LABELS[s]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => void navigate({ to: "/resources" })}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                {submitting ? "Đang thêm…" : "Thêm tài liệu"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
