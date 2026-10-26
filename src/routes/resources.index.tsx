import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, Globe, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  RESOURCE_STATUSES,
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
  formatDate,
  sampleResources,
  urlHostname,
  type Resource,
  type ResourceStatus,
} from "@/lib/resources";

type StatusFilter = "all" | ResourceStatus;

export const Route = createFileRoute("/resources/")({
  head: () => ({
    meta: [
      { title: "Tài liệu tự học — Sổ Học Tập" },
      {
        name: "description",
        content:
          "Danh sách tài liệu tự học theo chủ đề, lọc theo trạng thái: Chưa học, Đang học, Hoàn thành.",
      },
      { property: "og:title", content: "Tài liệu tự học — Sổ Học Tập" },
      {
        property: "og:description",
        content:
          "Danh sách tài liệu tự học theo chủ đề, lọc theo trạng thái: Chưa học, Đang học, Hoàn thành.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const countByStatus = useMemo(() => {
    const counts: Record<ResourceStatus, number> = {
      "chua-hoc": 0,
      "dang-hoc": 0,
      "hoan-thanh": 0,
    };
    for (const r of sampleResources) counts[r.status] += 1;
    return counts;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sampleResources.filter((r) => {
      const matchesStatus = filter === "all" || r.status === filter;
      const matchesQuery =
        !q || r.title.toLowerCase().includes(q) || r.topic.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [filter, query]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tài liệu tự học</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sampleResources.length} tài liệu (dữ liệu mẫu trước khi kết nối database).
          </p>
        </div>
        <Button asChild>
          <Link to="/resources/new">
            <Plus className="size-4" />
            Thêm tài liệu
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc chủ đề…"
            className="pl-9"
            aria-label="Tìm tài liệu"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo trạng thái">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Tất cả ({sampleResources.length})
          </Button>
          {RESOURCE_STATUSES.map((status) => (
            <Button
              key={status}
              size="sm"
              variant={filter === status ? "default" : "outline"}
              onClick={() => setFilter(status)}
            >
              {STATUS_LABELS[status]} ({countByStatus[status]})
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed p-10 text-center">
          <BookOpen className="size-10 text-muted-foreground" />
          <p className="mt-3 font-medium">Không tìm thấy tài liệu nào</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Thử đổi từ khóa tìm kiếm hoặc chọn trạng thái khác.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{resource.topic}</Badge>
          <Badge className={STATUS_BADGE_CLASS[resource.status]}>
            {STATUS_LABELS[resource.status]}
          </Badge>
        </div>
        <Link
          to="/resources/$resourceId"
          params={{ resourceId: resource.id }}
          className="line-clamp-2 font-semibold leading-snug hover:underline"
        >
          {resource.title}
        </Link>
        {resource.notes ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{resource.notes}</p>
        ) : null}
      </CardContent>
      <CardFooter className="justify-between gap-2 border-t p-5 text-xs text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Globe className="size-3.5 shrink-0" />
          <span className="truncate">{urlHostname(resource.url)}</span>
        </span>
        <span className="shrink-0">{formatDate(resource.createdAt)}</span>
      </CardFooter>
    </Card>
  );
}
