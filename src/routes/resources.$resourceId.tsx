import { ResourceForm } from "@/components/resource-form";
import type { ResourceInput } from "@/lib/resource-model";
import { useServerFn } from "@tanstack/react-start";
import { defaultT } from "@/lib/i18n";
import { ResourcePending, ResourceLoadError } from "@/components/resource-route-state";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate, STATUS_BADGE_CLASS, urlHostname, type ResourceStatus } from "@/lib/resources";
import { getResourceFn, updateResourceFn, deleteResourceFn } from "@/lib/resources.functions";

export const Route = createFileRoute("/resources/$resourceId")({
  loader: ({ params }) =>
    getResourceFn({
      data: { id: params.resourceId },
    }),
  component: ResourceDetailPage,
  pendingComponent: ResourcePending,
  errorComponent: ResourceLoadError,
  notFoundComponent: ResourceNotFound,
  head: () => ({
    meta: [
      { title: defaultT("resource.detailTitle") },
      { name: "description", content: defaultT("resource.detailMeta") },
    ],
  }),
});

function StatusIcon({ status }: { status: ResourceStatus }) {
  if (status === "not_started") return <Circle className="size-4" />;
  if (status === "learning") return <CircleDashed className="size-4" />;
  return <CheckCircle2 className="size-4" />;
}

function ResourceDetailPage() {
  const { t } = useTranslation();
  const { resourceId } = Route.useParams();
  const resource = Route.useLoaderData();
  const updateResource = useServerFn(updateResourceFn);
  const deleteResource = useServerFn(deleteResourceFn);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  async function save(input: ResourceInput) {
    const updated = await updateResource({ data: { ...input, id: resourceId } });
    if (!updated) return;
    await router.invalidate({ sync: true });
    setEditing(false);
    toast.success(t("resource.saved"));
  }
  async function remove() {
    if (deleting) return;
    setDeleting(true);
    setDeleteFailed(false);
    try {
      const result = await deleteResource({ data: { id: resourceId } });
      if (!result?.success) return;
      await router.navigate({ to: "/resources" });
      await router.invalidate({ sync: true });
      toast.success(t("resource.deleted"));
    } catch {
      setDeleteFailed(true);
    } finally {
      setDeleting(false);
    }
  }
  if (editing)
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">{t("resource.edit")}</h1>
        <ResourceForm
          initial={{ ...resource, notes: resource.notes ?? "" }}
          onSave={save}
          onCancel={() => setEditing(false)}
        />
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <Link
        to="/resources"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("resource.all")}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{resource.topic || t("resource.noTopic")}</Badge>
        <Badge className={STATUS_BADGE_CLASS[resource.status]}>
          <StatusIcon status={resource.status} />
          {t(`status.${resource.status}`)}
        </Badge>
      </div>

      <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{resource.title}</h1>
      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarDays className="size-4" />
        {t("resource.addedOn", { date: formatDate(resource.createdAt) })}
      </p>

      <Card className="mt-6">
        <CardContent className="space-y-5 p-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("resource.link")}
            </h2>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/50 p-4">
              <span className="min-w-0 truncate text-sm">{urlHostname(resource.url)}</span>
              {/^https?:\/\//i.test(resource.url) ? (
                <Button asChild size="sm">
                  <a
                    href={/^https?:\/\//i.test(resource.url) ? resource.url : undefined}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="size-4" />
                    {t("resource.open")}
                  </a>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">{t("resource.noUrl")}</p>
              )}
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <StickyNote className="size-4" />
              {t("resource.notes")}
            </h2>
            {resource.notes ? (
              <p className="mt-2 text-sm leading-relaxed">{resource.notes}</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">{t("resource.noNotes")}</p>
            )}
          </section>

          <Separator />

          <section className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">{t("resource.topic")}</p>
              <p className="mt-1 text-sm font-medium">{resource.topic || t("resource.noTopic")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("resource.status")}</p>
              <p className="mt-1 text-sm font-medium">{t(`status.${resource.status}`)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("resource.createdAt")}</p>
              <p className="mt-1 text-sm font-medium">{formatDate(resource.createdAt)}</p>
            </div>
          </section>
        </CardContent>
        <CardFooter className="flex-col items-start gap-3 border-t p-6">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditing(true)}
              disabled={deleting || confirmDelete}
            >
              <Pencil className="size-4" />
              {t("resource.edit")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={deleting || confirmDelete}
            >
              {t("resource.delete")}
            </Button>
          </div>
          {confirmDelete ? (
            <div
              role="group"
              aria-label={t("resource.deleteConfirm")}
              className="space-y-3 rounded-lg border p-4"
            >
              <p>{t("resource.deleteConfirm")}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={deleting}
                  onClick={() => {
                    setConfirmDelete(false);
                    setDeleteFailed(false);
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button variant="destructive" disabled={deleting} onClick={remove}>
                  {t(deleting ? "resource.deleting" : "resource.delete")}
                </Button>
              </div>
            </div>
          ) : null}
          {deleteFailed ? (
            <p role="alert" className="text-sm text-destructive">
              {t("resource.deleteFailed")}
            </p>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
}

function ResourceNotFound() {
  const { t } = useTranslation();
  const { resourceId } = Route.useParams();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 text-center">
      <h1 className="text-lg font-semibold">{t("resource.notFound")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("resource.missingId", { id: resourceId })}
      </p>
      <div className="mt-5 flex justify-center">
        <Button asChild>
          <Link to="/resources">{t("common.back")}</Link>
        </Button>
      </div>
    </div>
  );
}
