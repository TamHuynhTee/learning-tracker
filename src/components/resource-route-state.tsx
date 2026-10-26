import { Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function ResourcePending() {
  const { t } = useTranslation();
  return (
    <p role="status" className="p-8 text-muted-foreground">
      {t("resource.loading")}
    </p>
  );
}
export function ResourceLoadError({ reset }: ErrorComponentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <div role="alert" className="mx-auto max-w-3xl px-4 py-10">
      <p>{t("resource.loadErrorHint")}</p>
      <div className="mt-4 flex gap-2">
        <Button
          onClick={() => {
            void router.invalidate();
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
