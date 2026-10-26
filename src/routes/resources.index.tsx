import { useTranslation } from "react-i18next";
import { defaultT } from "@/lib/i18n";
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
  formatDate,
  urlHostname,
  type Resource,
  type ResourceStatus,
} from "@/lib/resources";

import { AuthGate } from "@/components/auth-gate";
import { useResources } from "@/hooks/use-resources";

type StatusFilter = "all" | ResourceStatus;
const EMPTY_RESOURCES: Resource[] = [];

export const Route = createFileRoute("/resources/")({
  head: () => ({
    meta: [
      { title: defaultT("resources.pageTitle") },
      {
        name: "description",
        content: defaultT("resources.description"),
      },
      { property: "og:title", content: defaultT("resources.pageTitle") },
      {
        property: "og:description",
        content: defaultT("resources.description"),
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AuthGate>
      <ResourcesPage />
    </AuthGate>
  ),
});

function ResourcesPage() {
  const { t } = useTranslation();
  const result = useResources();
  const resources = result.data ?? EMPTY_RESOURCES;
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const countByStatus = useMemo(() => {
    const counts: Record<ResourceStatus, number> = {
      not_started: 0,
      learning: 0,
      completed: 0,
    };
    for (const r of resources) counts[r.status] += 1;
    return counts;
  }, [resources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      const matchesStatus = filter === "all" || r.status === filter;
      const matchesQuery =
        !q || r.title.toLowerCase().includes(q) || r.topic.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [filter, query, resources]);

  if (result.isPending)
    return (
      <p role="status" className="p-8">
        {t("resource.loading")}
      </p>
    );
  if (result.isError)
    return (
      <div className="p-8" role="alert">
        <p>{t("resource.loadErrorHint")}</p>
        <Button variant="outline" className="mt-3" onClick={() => void result.refetch()}>
          {t("common.retry")}
        </Button>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("resources.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("resources.count", { count: resources.length })}
          </p>
        </div>
        <Button asChild>
          <Link to="/resources/new">
            <Plus className="size-4" />
            {t("nav.add")}
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("resources.searchPlaceholder")}
            className="pl-9"
            aria-label={t("resources.search")}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("resources.filter")}>
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            {t("resources.all", { count: resources.length })}
          </Button>
          {RESOURCE_STATUSES.map((status) => (
            <Button
              key={status}
              size="sm"
              variant={filter === status ? "default" : "outline"}
              onClick={() => setFilter(status)}
            >
              {t(`status.${status}`)} ({countByStatus[status]})
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed p-10 text-center">
          <BookOpen className="size-10 text-muted-foreground" />
          <p className="mt-3 font-medium">{t("resources.empty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("resources.emptyHint")}</p>
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
  const { t } = useTranslation();
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{resource.topic || t("resource.noTopic")}</Badge>
          <Badge className={STATUS_BADGE_CLASS[resource.status]}>
            {t(`status.${resource.status}`)}
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
