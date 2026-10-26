import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RESOURCE_STATUSES } from "@/lib/resources";
import type { ResourceInput } from "@/lib/resource-api";

export function ResourceForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ResourceInput;
  onSave: (input: ResourceInput) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState<ResourceInput>(
    initial ?? {
      title: "",
      url: "",
      topic: "",
      notes: "",
      status: "not_started",
    },
  );
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});
  const [failed, setFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  function field(key: "title" | "url" | "topic" | "notes", value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const next: typeof errors = {};
    if (!values.title.trim()) next.title = "resource.titleRequired";
    if (values.url.trim()) {
      try {
        const parsed = new URL(values.url.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) next.url = "resource.urlInvalid";
      } catch {
        next.url = "resource.urlInvalid";
      }
    }
    setErrors(next);
    setFailed(false);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      await onSave(values);
    } catch {
      setFailed(true);
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="resource-title">{t("resource.titleLabel")}</Label>
        <Input
          id="resource-title"
          value={values.title}
          onChange={(e) => field("title", e.target.value)}
          aria-invalid={!!errors.title}
          disabled={submitting}
          required
        />
        {errors.title ? (
          <p role="alert" className="text-sm text-destructive">
            {t(errors.title)}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="resource-url">{t("resource.urlOptional")}</Label>
        <Input
          id="resource-url"
          type="url"
          placeholder="https://…"
          value={values.url}
          onChange={(e) => field("url", e.target.value)}
          aria-invalid={!!errors.url}
          disabled={submitting}
        />
        {errors.url ? (
          <p role="alert" className="text-sm text-destructive">
            {t(errors.url)}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="resource-topic">{t("resource.topicOptional")}</Label>
        <Input
          id="resource-topic"
          value={values.topic}
          onChange={(e) => field("topic", e.target.value)}
          disabled={submitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="resource-notes">{t("resource.notes")}</Label>
        <Textarea
          id="resource-notes"
          value={values.notes}
          onChange={(e) => field("notes", e.target.value)}
          disabled={submitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="resource-status">{t("resource.status")}</Label>
        <select
          id="resource-status"
          value={values.status}
          disabled={submitting}
          onChange={(e) =>
            setValues((previous) => ({
              ...previous,
              status: e.target.value as ResourceInput["status"],
            }))
          }
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {RESOURCE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`status.${status}`)}
            </option>
          ))}
        </select>
      </div>
      {failed ? (
        <p role="alert" className="text-sm text-destructive">
          {t("resource.saveFailed")}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {t(submitting ? "resource.saving" : "resource.save")}
        </Button>
      </div>
    </form>
  );
}
