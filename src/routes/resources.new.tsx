import { useTranslation } from "react-i18next";
import { defaultT } from "@/lib/i18n";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AuthGate } from "@/components/auth-gate";
import { ResourceForm } from "@/components/resource-form";
import { useAuth } from "@/hooks/use-auth";
import { createResource, type ResourceInput } from "@/lib/resource-api";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/resources/new")({
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
  component: () => (
    <AuthGate>
      <NewResourcePage />
    </AuthGate>
  ),
});

function NewResourcePage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  async function save(input: ResourceInput) {
    const resource = await createResource(session!.user.id, input);
    await queryClient.invalidateQueries({ queryKey: ["resources", session!.user.id] });
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
