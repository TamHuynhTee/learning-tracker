import {
  createFileRoute,
  Link,
  notFound,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  CircleDashed,
  ExternalLink,
  Pencil,
  StickyNote,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getResourceById,
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
  formatDate,
  urlHostname,
} from "@/lib/resources";

export const Route = createFileRoute("/resources/$resourceId")({
  loader: ({ params }) => {
    const resource = getResourceById(params.resourceId);
    if (!resource) throw notFound();
    return { resource };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.resource
          ? `${loaderData.resource.title} — Sổ Học Tập`
          : "Chi tiết tài liệu — Sổ Học Tập",
      },
      {
        name: "description",
        content: "Chi tiết một tài liệu tự học: liên kết, chủ đề, ghi chú và trạng thái học.",
      },
      {
        property: "og:title",
        content: loaderData?.resource
          ? `${loaderData.resource.title} — Sổ Học Tập`
          : "Chi tiết tài liệu — Sổ Học Tập",
      },
      {
        property: "og:description",
        content: "Chi tiết một tài liệu tự học: liên kết, chủ đề, ghi chú và trạng thái học.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResourceDetailPage,
  errorComponent: ResourceDetailError,
  notFoundComponent: ResourceNotFound,
});

function StatusIcon({ status }: { status: keyof typeof STATUS_LABELS }) {
  if (status === "chua-hoc") return <Circle className="size-4" />;
  if (status === "dang-hoc") return <CircleDashed className="size-4" />;
  return <CheckCircle2 className="size-4" />;
}

function ResourceDetailPage() {
  const { resource } = Route.useLoaderData();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <Link
        to="/resources"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Tất cả tài liệu
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{resource.topic}</Badge>
        <Badge className={STATUS_BADGE_CLASS[resource.status]}>
          <StatusIcon status={resource.status} />
          {STATUS_LABELS[resource.status]}
        </Badge>
      </div>

      <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{resource.title}</h1>
      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarDays className="size-4" />
        Ngày thêm: {formatDate(resource.createdAt)}
      </p>

      <Card className="mt-6">
        <CardHeader className="pb-0" />
        <CardContent className="space-y-5 p-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Liên kết
            </h2>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/50 p-4">
              <span className="min-w-0 truncate text-sm">{urlHostname(resource.url)}</span>
              <Button asChild size="sm">
                <a href={resource.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  Mở tài liệu
                </a>
              </Button>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <StickyNote className="size-4" />
              Ghi chú
            </h2>
            {resource.notes ? (
              <p className="mt-2 text-sm leading-relaxed">{resource.notes}</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Chưa có ghi chú cho tài liệu này.</p>
            )}
          </section>

          <Separator />

          <section className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Chủ đề</p>
              <p className="mt-1 text-sm font-medium">{resource.topic}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Trạng thái</p>
              <p className="mt-1 text-sm font-medium">{STATUS_LABELS[resource.status]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ngày thêm</p>
              <p className="mt-1 text-sm font-medium">{formatDate(resource.createdAt)}</p>
            </div>
          </section>
        </CardContent>
        <CardFooter className="border-t p-6">
          <Button variant="outline" disabled onClick={() => toastInfoEdit()}>
            <Pencil className="size-4" />
            Chỉnh sửa (sắp có)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Nút sửa đang tắt — sẽ mở form chỉnh sửa sau khi có database.
function toastInfoEdit() {
  // Placeholder: thay bằng toast.info("…") khi có dữ liệu thật.
}

function ResourceDetailError({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 text-center">
      <h1 className="text-lg font-semibold">Không tải được tài liệu này</h1>
      <p className="mt-2 text-sm text-muted-foreground">Đã có lỗi xảy ra, bạn thử lại nhé.</p>
      <div className="mt-5 flex justify-center gap-2">
        <Button
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Thử lại
        </Button>
        <Button asChild variant="outline">
          <Link to="/resources">Về danh sách tài liệu</Link>
        </Button>
      </div>
    </div>
  );
}

function ResourceNotFound() {
  const { resourceId } = Route.useParams();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 text-center">
      <h1 className="text-lg font-semibold">Không tìm thấy tài liệu</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Không có tài liệu nào với mã “{resourceId}” trong dữ liệu mẫu.
      </p>
      <div className="mt-5 flex justify-center">
        <Button asChild>
          <Link to="/resources">Về danh sách tài liệu</Link>
        </Button>
      </div>
    </div>
  );
}
