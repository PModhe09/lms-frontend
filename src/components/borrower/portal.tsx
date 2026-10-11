"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LoanSummary } from "@/components/loans/loan-summary";
import { StatusBadge } from "@/components/loans/status-badge";
import { StatusTimeline } from "@/components/loans/status-timeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Loan, OnboardingStage } from "@/lib/api/types";
import { formatDate, formatINRWhole } from "@/lib/format";
import { myLoansQuery, profileQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { DetailsForm } from "./details-form";
import { LoanConfigurator } from "./loan-configurator";
import { SlipUpload } from "./slip-upload";

type Step = 1 | 2 | 3;

const STEPS: { step: Step; title: string; description: string }[] = [
  { step: 1, title: "Personal details", description: "We check your eligibility instantly." },
  { step: 2, title: "Salary slip", description: "Upload your latest salary slip." },
  { step: 3, title: "Choose your loan", description: "Pick an amount and tenure, then apply." },
];

/** Highest step the borrower may open, from the server's onboarding stage. */
const reachable = (stage: OnboardingStage): Step =>
  stage === "SLIP_UPLOADED" ? 3 : stage === "DETAILS_SUBMITTED" ? 2 : 1;

export function BorrowerPortal() {
  const profile = useQuery(profileQuery);
  const loans = useQuery(myLoansQuery);
  const [picked, setPicked] = useState<Step | null>(null);

  if (profile.isPending || loans.isPending) return <PortalSkeleton />;
  if (profile.isError || loans.isError) {
    return (
      <p className="text-destructive text-sm">
        Could not load your application. Refresh to try again.
      </p>
    );
  }

  const stage = profile.data.onboardingStage;
  const openLoan = loans.data.find((l) =>
    ["APPLIED", "SANCTIONED", "DISBURSED"].includes(l.status),
  );
  const pastLoans = loans.data.filter((l) => l !== openLoan);

  if (openLoan) {
    return (
      <div className="space-y-8">
        <Header title="Your loan" subtitle="Track your application and repayments here." />
        <OpenLoanCard loan={openLoan} />
        <PastLoans loans={pastLoans} />
      </div>
    );
  }

  const max = reachable(stage);
  const active = picked && picked <= max ? picked : max;
  const done = (s: Step) => s < max;

  return (
    <div className="space-y-8">
      <Header
        title={pastLoans.length ? "Apply for a new loan" : "Apply for a personal loan"}
        subtitle="₹50,000 – ₹5,00,000 · 30 – 365 days · 12% p.a. simple interest"
      />
      <ol className="grid grid-cols-3 gap-2">
        {STEPS.map(({ step, title }) => (
          <li key={step}>
            <button
              type="button"
              disabled={step > max}
              onClick={() => setPicked(step)}
              aria-current={step === active ? "step" : undefined}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors sm:p-3 sm:text-sm",
                step === active ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                step > max && "cursor-not-allowed opacity-50",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                  done(step)
                    ? "bg-primary text-primary-foreground border-primary"
                    : step === active && "border-primary text-primary",
                )}
              >
                {done(step) ? <Check className="size-3.5" /> : step}
              </span>
              <span className="hidden font-medium sm:inline">{title}</span>
            </button>
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[active - 1].title}</CardTitle>
          <CardDescription>{STEPS[active - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {active === 1 && <DetailsForm profile={profile.data} onDone={() => setPicked(null)} />}
          {active === 2 && <SlipUpload profile={profile.data} onDone={() => setPicked(null)} />}
          {active === 3 && <LoanConfigurator />}
        </CardContent>
      </Card>
      <PastLoans loans={pastLoans} />
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
    </div>
  );
}

const NEXT_STEP: Partial<Record<Loan["status"], string>> = {
  APPLIED: "Our team is reviewing your application.",
  SANCTIONED: "Approved. Funds will be released to your account shortly.",
  DISBURSED: "Funds released. Repay by the end of your tenure.",
};

function OpenLoanCard({ loan }: { loan: Loan }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-xl tabular-nums">
            {formatINRWhole(loan.principalPaise)}
          </CardTitle>
          <CardDescription>
            Applied {formatDate(loan.appliedAt)} · {NEXT_STEP[loan.status]}
          </CardDescription>
        </div>
        <StatusBadge status={loan.status} />
      </CardHeader>
      <CardContent className="grid gap-8 md:grid-cols-[1fr_auto]">
        <LoanSummary loan={loan} />
        <StatusTimeline history={loan.statusHistory} />
      </CardContent>
      <CardContent>
        <Link
          href={`/apply/loans/${loan.id}`}
          className="text-primary inline-flex items-center text-sm font-medium hover:underline"
        >
          View details and payments <ChevronRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

function PastLoans({ loans }: { loans: Loan[] }) {
  if (loans.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">Previous loans</h2>
      <ul className="divide-y rounded-lg border">
        {loans.map((l) => (
          <li key={l.id}>
            <Link
              href={`/apply/loans/${l.id}`}
              className="hover:bg-muted/50 flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium tabular-nums">{formatINRWhole(l.principalPaise)}</p>
                <p className="text-muted-foreground text-xs">
                  {l.tenureDays} days · applied {formatDate(l.appliedAt)}
                </p>
              </div>
              <StatusBadge status={l.status} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PortalSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
