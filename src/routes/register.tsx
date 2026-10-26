import { useTranslation } from "react-i18next";
import { defaultT } from "@/lib/i18n";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getSupabase } from "@/lib/supabase";
import { authErrorKey } from "@/lib/auth-errors";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterValues } from "@/lib/auth-validation";
import { BookOpenCheck, Eye, EyeOff } from "lucide-react";
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

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: defaultT("auth.registerTitle") },
      {
        name: "description",
        content: defaultT("auth.registerMeta"),
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    resetField,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmation: "" },
  });

  async function onSubmit({ email, password }: RegisterValues) {
    clearErrors("root");
    try {
      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      resetField("password");
      resetField("confirmation");
      toast.success(t(data.session ? "auth.accountCreated" : "auth.confirmationSent"), {
        duration: 10000,
      });
      await navigate({ to: "/login", replace: true });
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
          <CardTitle className="text-xl">{t("auth.createAccount")}</CardTitle>
          <CardDescription>{t("auth.registerDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="register-email">{t("auth.email")}</Label>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                placeholder={t("auth.emailPlaceholder")}
                {...register("email")}
                readOnly={isSubmitting}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email?.message ? (
                <p id="email-error" role="alert" className="text-sm text-destructive">
                  {t(errors.email.message)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">{t("auth.password")}</Label>
              <div className="relative">
                <Input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder={t("auth.passwordPlaceholder")}
                  className="pr-12"
                  {...register("password")}
                  readOnly={isSubmitting}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={`password-hint${errors.password ? " password-error" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 text-muted-foreground"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              <p id="password-hint" className="text-xs text-muted-foreground">
                {t("auth.passwordHint")}
              </p>
              {errors.password?.message ? (
                <p id="password-error" role="alert" className="text-sm text-destructive">
                  {t(errors.password.message)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("auth.confirmPassword")}</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder={t("auth.confirmPlaceholder")}
                {...register("confirmation")}
                readOnly={isSubmitting}
                aria-invalid={Boolean(errors.confirmation)}
                aria-describedby={errors.confirmation ? "confirmation-error" : undefined}
              />
              {errors.confirmation?.message ? (
                <p id="confirmation-error" role="alert" className="text-sm text-destructive">
                  {t(errors.confirmation.message)}
                </p>
              ) : null}
            </div>

            {errors.root?.["server"]?.message ? (
              <p role="alert" className="text-sm text-destructive">
                {t(errors.root["server"].message)}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("auth.registering") : t("auth.register")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          <span>
            {t("auth.hasAccount")}{" "}
            <Link
              to="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("auth.login")}
            </Link>
          </span>
        </CardFooter>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground">{t("auth.connected")}</p>
    </div>
  );
}
