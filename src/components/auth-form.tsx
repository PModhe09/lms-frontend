"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api, ApiError, unwrap } from "@/lib/api/client";
import { homeFor } from "@/lib/rbac";

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
const signupSchema = schema.extend({
  password: z.string().min(8, "Use at least 8 characters").max(72),
});
type Values = z.infer<typeof schema>;

type Mode = "login" | "signup";

const COPY: Record<Mode, { title: string; description: string; submit: string }> = {
  login: { title: "Welcome back", description: "Log in to continue.", submit: "Log in" },
  signup: {
    title: "Create your account",
    description: "Check your eligibility and apply for a personal loan in minutes.",
    submit: "Create account",
  },
};

/** Only same-site paths, so `?next=` cannot redirect off the site. */
const safeNext = (next: string | null) =>
  next && next.startsWith("/") && !next.startsWith("//") ? next : null;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const form = useForm<Values>({
    resolver: zodResolver(mode === "signup" ? signupSchema : schema),
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: Values) {
    try {
      const user = await unwrap(
        mode === "signup"
          ? api.POST("/auth/signup", { body: values })
          : api.POST("/auth/login", { body: values }),
      );
      const home = homeFor(user.role);
      router.replace(next?.startsWith(home) ? next : home);
      router.refresh();
    } catch (err) {
      form.setError("root", {
        message: err instanceof ApiError ? err.message : "Could not reach the server. Try again.",
      });
    }
  }

  const copy = COPY[mode];
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {errors.root && (
              <Alert variant="destructive">
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            )}
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...form.register("email")}
              />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                aria-invalid={!!errors.password}
                {...form.register("password")}
              />
              <FieldError errors={[errors.password]} />
            </Field>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Please wait…" : copy.submit}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              {mode === "login" ? (
                <>
                  New here?{" "}
                  <Link href="/signup" className="text-primary font-medium hover:underline">
                    Create an account
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary font-medium hover:underline">
                    Log in
                  </Link>
                </>
              )}
            </p>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
