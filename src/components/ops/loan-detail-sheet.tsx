"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { LoanSummary } from "@/components/loans/loan-summary";
import { PaymentsList } from "@/components/loans/payments-list";
import { StatusBadge } from "@/components/loans/status-badge";
import { StatusTimeline } from "@/components/loans/status-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import type { Loan } from "@/lib/api/types";
import { formatBytes, formatINR } from "@/lib/format";
import { opsLoanQuery } from "@/lib/queries";
import { Permission } from "@/lib/rbac";
import { opsActions } from "./ops-api";
import { useCan } from "./session-context";

const EMPLOYMENT = {
  SALARIED: "Salaried",
  SELF_EMPLOYED: "Self-employed",
  UNEMPLOYED: "Unemployed",
} as const;

export function LoanDetailSheet({
  loanId,
  onOpenChange,
  actions,
}: {
  loanId: string | null;
  onOpenChange: (open: boolean) => void;
  actions?: (loan: Loan) => ReactNode;
}) {
  const {
    data: loan,
    isPending,
    error,
  } = useQuery({ ...opsLoanQuery(loanId ?? ""), enabled: !!loanId });
  const canViewSlip = useCan(Permission.SANCTION_READ);

  // Presigned URLs live 5 minutes, so fetch one on click rather than with the page.
  const viewSlip = useMutation({
    mutationFn: (id: string) => opsActions.slipUrl(id),
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener,noreferrer"),
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Could not open the slip"),
  });

  const b = loan?.borrower;
  return (
    <Sheet open={!!loanId} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{b?.fullName ?? "Loan"}</SheetTitle>
          <SheetDescription>{b?.email}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-8">
          {isPending && <Skeleton className="h-96 w-full" />}
          {error && <p className="text-destructive text-sm">Could not load this loan.</p>}
          {loan && (
            <>
              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={loan.status} staff />
                {actions && loan.status !== "CLOSED" && loan.status !== "REJECTED" && (
                  <div className="flex gap-2">{actions(loan)}</div>
                )}
              </div>
              {loan.rejectionReason && (
                <p className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                  Rejected: {loan.rejectionReason}
                </p>
              )}
              <LoanSummary loan={loan} />
              <Separator />

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Borrower</h3>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Item label="PAN" value={<span className="font-mono">{b?.pan ?? "—"}</span>} />
                  <Item
                    label="Employment"
                    value={b?.employmentMode ? EMPLOYMENT[b.employmentMode] : "—"}
                  />
                  <Item
                    label="Monthly salary"
                    value={b?.monthlySalaryPaise ? formatINR(b.monthlySalaryPaise) : "—"}
                  />
                  <Item
                    label="Eligibility"
                    value={
                      b?.breResult ? (
                        <Badge variant={b.breResult.passed ? "secondary" : "destructive"}>
                          {b.breResult.passed ? "Passed" : "Failed"} · rules v
                          {b.breResult.rulesVersion}
                        </Badge>
                      ) : (
                        "—"
                      )
                    }
                  />
                </dl>
                <div className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{loan.salarySlip.originalName}</p>
                    <p className="text-muted-foreground text-xs">
                      Salary slip · {formatBytes(loan.salarySlip.size)} · snapshot at apply time
                    </p>
                  </div>
                  {canViewSlip && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewSlip.mutate(loan.id)}
                      disabled={viewSlip.isPending}
                    >
                      <ExternalLink /> View
                    </Button>
                  )}
                </div>
              </section>
              <Separator />

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">History</h3>
                <StatusTimeline history={loan.statusHistory} showActor />
              </section>

              {(loan.status === "DISBURSED" || loan.status === "CLOSED") && (
                <>
                  <Separator />
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold">Payments</h3>
                    <PaymentsList payments={loan.payments} />
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Item({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
