"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LoanSummary } from "@/components/loans/loan-summary";
import { PaymentsList } from "@/components/loans/payments-list";
import { StatusBadge } from "@/components/loans/status-badge";
import { StatusTimeline } from "@/components/loans/status-timeline";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { formatDate, formatINRWhole } from "@/lib/format";
import { myLoanQuery } from "@/lib/queries";

export function BorrowerLoanDetail({ id }: { id: string }) {
  const { data: loan, error, isPending } = useQuery(myLoanQuery(id));

  return (
    <div className="space-y-6">
      <Link
        href="/apply"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Back
      </Link>
      {isPending && <Skeleton className="h-96 w-full" />}
      {error && (
        <p className="text-destructive text-sm">
          {error instanceof ApiError && error.status === 404
            ? "Loan not found."
            : "Could not load this loan."}
        </p>
      )}
      {loan && (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight tabular-nums">
                {formatINRWhole(loan.principalPaise)}
              </h1>
              <p className="text-muted-foreground text-sm">
                {loan.tenureDays} days · applied {formatDate(loan.appliedAt)}
              </p>
            </div>
            <StatusBadge status={loan.status} />
          </div>
          {loan.status === "REJECTED" && loan.rejectionReason && (
            <Alert>
              <AlertTitle>Application not approved</AlertTitle>
              <AlertDescription>
                {loan.rejectionReason}. You can apply again from your home page.
              </AlertDescription>
            </Alert>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <LoanSummary loan={loan} />
            </CardContent>
          </Card>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusTimeline history={loan.statusHistory} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payments</CardTitle>
                <CardDescription>Recorded by our collections team.</CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentsList payments={loan.payments} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
