"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import type { Loan } from "@/lib/api/types";
import { formatINR, rupeesToPaise, todayIST } from "@/lib/format";
import { Permission } from "@/lib/rbac";
import { opsActions } from "./ops-api";
import { useCan } from "./session-context";
import { useOpsMutation } from "./use-ops-mutation";

const istDate = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(iso));

export function PaymentAction({ loan }: { loan: Loan }) {
  const canRecord = useCan(Permission.COLLECTION_RECORD);
  const [open, setOpen] = useState(false);
  if (!canRecord || loan.status !== "DISBURSED") return null;
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Record payment
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {open && <PaymentForm loan={loan} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PaymentForm({ loan, onDone }: { loan: Loan; onDone: () => void }) {
  const outstandingRupees = loan.outstandingPaise / 100;
  const minDate = loan.disbursedAt ? istDate(loan.disbursedAt) : todayIST();
  const maxDate = todayIST();
  const schema = z.object({
    utr: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9]{6,30}$/, "6–30 letters or digits"),
    amount: z
      .number({ error: "Enter an amount" })
      .positive("Must be more than zero")
      .max(outstandingRupees, `Cannot exceed ${formatINR(loan.outstandingPaise)}`),
    paidAt: z.iso
      .date()
      .refine((d) => d >= minDate && d <= maxDate, `Between ${minDate} and ${maxDate}`),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { utr: "", amount: outstandingRupees, paidAt: maxDate },
  });
  const { errors } = form.formState;
  const record = useOpsMutation(
    (v: Values) =>
      opsActions.recordPayment(loan.id, {
        utr: v.utr.toUpperCase(),
        amountPaise: rupeesToPaise(v.amount),
        paidAt: v.paidAt,
      }),
    "Payment recorded",
    onDone,
  );
  const serverError = record.error instanceof ApiError ? record.error : null;

  return (
    <form onSubmit={form.handleSubmit((v) => record.mutate(v))} noValidate>
      <DialogHeader>
        <DialogTitle>Record payment</DialogTitle>
        <DialogDescription>
          {loan.borrower?.fullName} · outstanding {formatINR(loan.outstandingPaise)}. The loan
          closes automatically when fully paid.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup className="my-6">
        {serverError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{serverError.message}</AlertDescription>
          </Alert>
        )}
        <Field data-invalid={!!errors.utr}>
          <FieldLabel htmlFor="utr">UTR number</FieldLabel>
          <Input
            id="utr"
            className="font-mono uppercase"
            autoComplete="off"
            {...form.register("utr")}
          />
          <FieldError errors={[errors.utr]} />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={!!errors.amount}>
            <FieldLabel htmlFor="amount">Amount (₹)</FieldLabel>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min={0}
              inputMode="decimal"
              {...form.register("amount", { valueAsNumber: true })}
            />
            <FieldError errors={[errors.amount]} />
          </Field>
          <Field data-invalid={!!errors.paidAt}>
            <FieldLabel htmlFor="paidAt">Payment date</FieldLabel>
            <Input
              id="paidAt"
              type="date"
              min={minDate}
              max={maxDate}
              {...form.register("paidAt")}
            />
            <FieldError errors={[errors.paidAt]} />
          </Field>
        </div>
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={record.isPending}>
          Record payment
        </Button>
      </DialogFooter>
    </form>
  );
}
