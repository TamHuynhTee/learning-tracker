import { useTranslation } from "react-i18next";
import { defaultT } from "@/lib/i18n";
import { createFileRoute, Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { ResourceForm } from "@/components/resource-form";
import { useResource } from "@/hooks/use-resources";
import { useAuth } from "@/hooks/use-auth";
import { updateResource, deleteResource, type ResourceInput } from "@/lib/resource-api";
import { toast } from "sonner";
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
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { type ResourceStatus, STATUS_BADGE_CLASS, formatDate, urlHostname } from "@/lib/resources";

export const Route = createFileRoute("/resources/$resourceId")({
  head: () => ({
    meta: [
      {
        title: defaultT("resource.detailTitle"),
      },
      {
        name: "description",
        content: defaultT("resource.detailMeta"),
      },
      {
        property: "og:title",
        content: defaultT("resource.detailTitle"),
      },
      {
        property: "og:description",
        content: defaultT("resource.detailMeta"),
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AuthGate>
      <ResourceDetailPage />
    </AuthGate>
  ),
  errorComponent: ResourceDetailError,
  notFoundComponent: ResourceNotFound,
});

function StatusIcon({ status }: { status: ResourceStatus }) {
  if (status === "not_started") return <Circle className="size-4" />;
  if (status === "learning") return <CircleDashed className="size-4" />;
  return <CheckCircle2 className="size-4" />;
}

function ResourceDetailPage() {
  const { t } = useTranslation();
  const { resourceId } = Route.useParams();
  const result = useResource(resourceId);
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const resource = result.data;

  async function save(input: ResourceInput) {
    const updated = await updateResource(session!.user.id, resourceId, input);
    queryClient.setQueryData(["resources", session!.user.id, resourceId], updated);
    await queryClient.invalidateQueries({ queryKey: ["resources", session!.user.id] });
    setEditing(false);
    toast.success(t("resource.saved"));
  }
  async function remove() {
    if (deleting) return;
    setDeleting(true);
    setDeleteFailed(false);
    try {
      await deleteResource(session!.user.id, resourceId);
      queryClient.removeQueries({
        queryKey: ["resources", session!.user.id, resourceId],
        exact: true,
      });
      await queryClient.invalidateQueries({
        queryKey: ["resources", session!.user.id],
        exact: true,
      });
      toast.success(t("resource.deleted"));
      await router.navigate({ to: "/resources" });
    } catch {
      setDeleteFailed(true);
    } finally {
      setDeleting(false);
    }
  }
  if (result.isPending)
    return (
      <p role="status" className="p-8">
        {t("resource.loading")}
      </p>
    );
  if (result.isError)
    return (
      <div role="alert" className="p-8">
        <p>{t("resource.loadErrorHint")}</p>
        <Button onClick={() => void result.refetch()}>{t("common.retry")}</Button>
      </div>
    );
  if (!resource) return <ResourceNotFound />;
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

function ResourceDetailError({ error, reset }: ErrorComponentProps) {
  const { t } = useTranslation();
  console.error(error);
  const router = useRouter();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 text-center">
      <h1 className="text-lg font-semibold">{t("resource.loadError")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("resource.loadErrorHint")}</p>
      <div className="mt-5 flex justify-center gap-2">
        <Button
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          {t("common.retry")}
        </Button>
        <Button asChild variant="outline">
          <Link to="/resources">{t("common.back")}</Link>
        </Button>
      </div>
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
