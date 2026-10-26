import { useTranslation } from "react-i18next";
import { defaultT } from "@/lib/i18n";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ResourcePending, ResourceLoadError } from "@/components/resource-route-state";
import { ResourceForm } from "@/components/resource-form";
import { createResourceFn, requireResourceUserFn } from "@/lib/resources.functions";
import type { ResourceInput } from "@/lib/resource-model";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/resources/new")({
  loader: () => requireResourceUserFn(),
  pendingComponent: ResourcePending,
  errorComponent: ResourceLoadError,
  head: () => ({
    meta: [
      { title: defaultT("resource.newTitle") },
      {
        name: "description",
        content: defaultT("resource.newMeta"),
      },
      { property: "og:title", content: defaultT("resource.newTitle") },
      {
        property: "og:description",
        content: defaultT("resource.newMeta"),
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewResourcePage,
});

function NewResourcePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const router = useRouter();
  const createResource = useServerFn(createResourceFn);
  async function save(input: ResourceInput) {
    const resource = await createResource({ data: input });
    if (!resource) return;
    await router.invalidate({ sync: true });
    toast.success(t("resource.created"));
    await navigate({ to: "/resources/$resourceId", params: { resourceId: resource.id } });
  }
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("resource.new")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("resource.newDescription")}</p>
      <Card className="mt-6">
        <CardContent className="p-6">
          <ResourceForm onSave={save} onCancel={() => void navigate({ to: "/resources" })} />
        </CardContent>
      </Card>
    </div>
  );
}
