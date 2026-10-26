import { useTranslation } from "react-i18next";
import { defaultT } from "@/lib/i18n";
import { getSupabase } from "@/lib/supabase";
import { authErrorKey } from "@/lib/auth-errors";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginValues } from "@/lib/auth-validation";
import { BookOpenCheck, Chrome, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: defaultT("auth.loginTitle") },
      {
        name: "description",
        content: defaultT("auth.loginMeta"),
      },
      { property: "og:title", content: defaultT("auth.loginTitle") },
      {
        property: "og:description",
        content: defaultT("auth.loginMeta"),
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    resetField,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    clearErrors("root");
    try {
      const { error } = await getSupabase().auth.signInWithPassword(values);
      if (error) throw error;
      resetField("password");
      toast.success(t("auth.loginSuccess"));
      await navigate({ to: "/resources" });
    } catch (error) {
      setError("root.server", { message: authErrorKey(error) });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-10 sm:py-16">
      <div className="flex items-center justify-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <BookOpenCheck className="size-5" />
        </span>
        <span className="text-lg font-bold tracking-tight">{t("app.name")}</span>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-xl">{t("auth.login")}</CardTitle>
          <CardDescription>{t("auth.loginDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder={t("auth.emailPlaceholder")}
                {...register("email")}
                readOnly={isSubmitting}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "login-email-error" : undefined}
              />
              {errors.email?.message ? (
                <p id="login-email-error" role="alert" className="text-sm text-destructive">
                  {t(errors.email.message)}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                readOnly={isSubmitting}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "login-password-error" : undefined}
              />
              {errors.password?.message ? (
                <p id="login-password-error" role="alert" className="text-sm text-destructive">
                  {t(errors.password.message)}
                </p>
              ) : null}
            </div>
            {errors.root?.["server"]?.message ? (
              <p role="alert" className="text-sm text-destructive">
                {t(errors.root["server"].message)}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {isSubmitting ? t("auth.loggingIn") : t("auth.login")}
            </Button>
          </form>
          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={() => toast.info(t("auth.googleDemo"))}
          >
            <Chrome className="size-4" />
            {t("auth.google")}
          </Button>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          <span>
            {t("auth.noAccount")}{" "}
            <Link
              to="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("auth.register")}
            </Link>
          </span>
        </CardFooter>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground">{t("auth.connected")}</p>
    </div>
  );
}
