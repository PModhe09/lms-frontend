"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Info } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError, unwrap } from "@/lib/api/client";
import type { BorrowerProfile } from "@/lib/api/types";
import { completedYears, hintFailures } from "@/lib/bre";
import { rupeesToPaise, todayIST } from "@/lib/format";
import { breRulesQuery, keys } from "@/lib/queries";

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  pan: z.string().trim().min(1, "Enter your PAN").max(10, "PAN has 10 characters"),
  dob: z.iso.date("Enter your date of birth"),
  monthlySalary: z.number({ error: "Enter your monthly salary" }).min(0).max(10_000_000),
  employmentMode: z.enum(["SALARIED", "SELF_EMPLOYED", "UNEMPLOYED"], { error: "Choose one" }),
});
type Values = z.infer<typeof schema>;

const EMPLOYMENT_LABEL = {
  SALARIED: "Salaried",
  SELF_EMPLOYED: "Self-employed",
  UNEMPLOYED: "Unemployed",
};

export function DetailsForm({
  profile,
  onDone,
}: {
  profile: BorrowerProfile;
  onDone?: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: rules } = useQuery(breRulesQuery);
  const p = profile.profile;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: p
      ? {
          fullName: p.fullName,
          pan: p.pan,
          dob: p.dob,
          monthlySalary: p.monthlySalaryPaise / 100,
          employmentMode: p.employmentMode,
        }
      : { fullName: "", pan: "", dob: "", monthlySalary: undefined, employmentMode: undefined },
  });
  const { errors } = form.formState;
  const watched = useWatch({ control: form.control });

  // Instant hints from the server's rule set. Advisory only: the server re-checks on submit.
  const hints = rules
    ? hintFailures(rules, {
        age:
          watched.dob && /^\d{4}-\d{2}-\d{2}$/.test(watched.dob)
            ? completedYears(watched.dob, todayIST())
            : undefined,
        monthlySalary:
          typeof watched.monthlySalary === "number" ? watched.monthlySalary : undefined,
        pan: watched.pan && watched.pan.length >= 10 ? watched.pan.toUpperCase() : undefined,
        employmentMode: watched.employmentMode,
      })
    : [];
  const hintFor = (field: string) => hints.find((h) => h.field === field)?.message;

  const submit = useMutation({
    mutationFn: (v: Values) =>
      unwrap(
        api.PUT("/borrower/profile", {
          body: {
            fullName: v.fullName,
            pan: v.pan.toUpperCase(),
            dob: v.dob,
            monthlySalaryPaise: rupeesToPaise(v.monthlySalary),
            employmentMode: v.employmentMode,
          },
        }),
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(keys.profile, data);
      onDone?.();
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.profile }),
  });

  const serverError = submit.error instanceof ApiError ? submit.error : null;
  const breFailures =
    serverError?.code === "BRE_REJECTED" && Array.isArray(serverError.details)
      ? (serverError.details as { rule: string; message: string }[])
      : profile.onboardingStage === "BRE_REJECTED" && !submit.isSuccess
        ? (profile.breResult?.failures ?? [])
        : [];

  return (
    <form onSubmit={form.handleSubmit((v) => submit.mutate(v))} noValidate>
      <FieldGroup>
        {breFailures.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Not eligible yet</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4">
                {breFailures.map((f) => (
                  <li key={f.rule}>{f.message}</li>
                ))}
              </ul>
              <p className="mt-1">Update your details if something was entered incorrectly.</p>
            </AlertDescription>
          </Alert>
        )}
        {serverError && serverError.code !== "BRE_REJECTED" && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{serverError.message}</AlertDescription>
          </Alert>
        )}

        <Field data-invalid={!!errors.fullName}>
          <FieldLabel htmlFor="fullName">Full name (as on PAN)</FieldLabel>
          <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
          <FieldError errors={[errors.fullName]} />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={!!errors.pan}>
            <FieldLabel htmlFor="pan">PAN</FieldLabel>
            <Input
              id="pan"
              maxLength={10}
              placeholder="ABCDE1234F"
              className="font-mono uppercase"
              {...form.register("pan", { setValueAs: (v: string) => v.toUpperCase() })}
            />
            <FieldError errors={[errors.pan]} />
            <Hint text={hintFor("pan")} />
          </Field>
          <Field data-invalid={!!errors.dob}>
            <FieldLabel htmlFor="dob">Date of birth</FieldLabel>
            <Input id="dob" type="date" max={todayIST()} {...form.register("dob")} />
            <FieldError errors={[errors.dob]} />
            <Hint text={hintFor("age")} />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={!!errors.monthlySalary}>
            <FieldLabel htmlFor="monthlySalary">Monthly salary (₹)</FieldLabel>
            <Input
              id="monthlySalary"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              {...form.register("monthlySalary", { valueAsNumber: true })}
            />
            <FieldError errors={[errors.monthlySalary]} />
            <Hint text={hintFor("monthlySalary")} />
          </Field>
          <Field data-invalid={!!errors.employmentMode}>
            <FieldLabel htmlFor="employmentMode">Employment</FieldLabel>
            <Controller
              control={form.control}
              name="employmentMode"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="employmentMode" className="w-full">
                    <SelectValue placeholder="Choose one" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMPLOYMENT_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.employmentMode]} />
            <Hint text={hintFor("employmentMode")} />
          </Field>
        </div>

        <FieldDescription>
          We check eligibility instantly: age 23–50, monthly salary of at least ₹25,000, a valid
          PAN, and current employment.
        </FieldDescription>
        <Button type="submit" disabled={submit.isPending} className="w-full sm:w-auto">
          {submit.isPending ? "Checking eligibility…" : "Check eligibility & continue"}
        </Button>
      </FieldGroup>
    </form>
  );
}

function Hint({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
      <Info className="size-3.5 shrink-0" /> {text}
    </p>
  );
}
