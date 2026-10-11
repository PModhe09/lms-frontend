"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { api, ApiError, unwrap } from "@/lib/api/client";
import { formatINR, formatINRWhole, rupeesToPaise } from "@/lib/format";
import { LOAN_LIMITS, simpleInterestPaise } from "@/lib/loan-math";

export function LoanConfigurator() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(2_00_000);
  const [tenure, setTenure] = useState(180);

  const principalPaise = rupeesToPaise(amount);
  const interestPaise = simpleInterestPaise(principalPaise, tenure);

  const apply = useMutation({
    mutationFn: () =>
      unwrap(api.POST("/borrower/loans", { body: { principalPaise, tenureDays: tenure } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["borrower"] }),
  });

  return (
    <div className="space-y-8">
      <SliderRow
        label="Loan amount"
        value={formatINRWhole(principalPaise)}
        min={LOAN_LIMITS.minPrincipalRupees}
        max={LOAN_LIMITS.maxPrincipalRupees}
        step={LOAN_LIMITS.stepRupees}
        current={amount}
        onChange={setAmount}
        minLabel="₹50,000"
        maxLabel="₹5,00,000"
      />
      <SliderRow
        label="Tenure"
        value={`${tenure} days`}
        min={LOAN_LIMITS.minTenureDays}
        max={LOAN_LIMITS.maxTenureDays}
        step={1}
        current={tenure}
        onChange={setTenure}
        minLabel="30 days"
        maxLabel="365 days"
      />

      <div className="bg-muted/50 grid gap-4 rounded-lg border p-4 sm:grid-cols-3">
        <Figure label="Interest rate" value="12% p.a. simple" />
        <Figure label="Interest" value={formatINR(interestPaise)} />
        <Figure label="Total repayment" value={formatINR(principalPaise + interestPaise)} strong />
      </div>
      <p className="text-muted-foreground text-xs">
        Simple interest = principal × 12% × days ÷ 365. Final figures are confirmed by the server
        when you apply.
      </p>

      {apply.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>
            {apply.error instanceof ApiError ? apply.error.message : "Could not submit. Try again."}
          </AlertDescription>
        </Alert>
      )}
      <Button
        size="lg"
        className="w-full sm:w-auto"
        onClick={() => apply.mutate()}
        disabled={apply.isPending}
      >
        {apply.isPending ? "Submitting…" : `Apply for ${formatINRWhole(principalPaise)}`}
      </Button>
    </div>
  );
}

function SliderRow(props: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (n: number) => void;
  minLabel: string;
  maxLabel: string;
}) {
  const id = props.label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <label id={id} className="text-sm font-medium">
          {props.label}
        </label>
        <span className="text-lg font-semibold tabular-nums">{props.value}</span>
      </div>
      <Slider
        aria-labelledby={id}
        min={props.min}
        max={props.max}
        step={props.step}
        value={[props.current]}
        onValueChange={([v]) => props.onChange(v)}
      />
      <div className="text-muted-foreground flex justify-between text-xs">
        <span>{props.minLabel}</span>
        <span>{props.maxLabel}</span>
      </div>
    </div>
  );
}

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className={
          strong ? "text-primary text-lg font-semibold tabular-nums" : "font-medium tabular-nums"
        }
      >
        {value}
      </p>
    </div>
  );
}
