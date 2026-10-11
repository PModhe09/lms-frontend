"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Loan } from "@/lib/api/types";
import { formatDate, formatINR, formatINRWhole } from "@/lib/format";
import { keys } from "@/lib/queries";
import { LoanDetailSheet } from "./loan-detail-sheet";
import { fetchQueue, type QueueModule } from "./ops-api";

export function LoanQueue({
  module,
  title,
  description,
  empty,
  actions,
  showOutstanding = false,
}: {
  module: QueueModule;
  title: string;
  description: string;
  empty: string;
  actions: (loan: Loan) => ReactNode;
  showOutstanding?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isPending, isError } = useQuery({
    queryKey: keys.queue(module, page),
    queryFn: () => fetchQueue(module, page),
    placeholderData: keepPreviousData,
  });
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {isPending && <Skeleton className="h-64 w-full" />}
      {isError && (
        <p className="text-destructive text-sm">Could not load this list. Refresh to try again.</p>
      )}
      {data && data.items.length === 0 && (
        <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          {empty}
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          {/* Desktop: table */}
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Borrower</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Tenure</TableHead>
                  <TableHead className="text-right">
                    {showOutstanding ? "Outstanding" : "Total repayment"}
                  </TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((loan) => (
                  <TableRow
                    key={loan.id}
                    className="cursor-pointer"
                    onClick={() => setOpenId(loan.id)}
                  >
                    <TableCell>
                      <p className="font-medium">{loan.borrower?.fullName ?? "—"}</p>
                      <p className="text-muted-foreground text-xs">{loan.borrower?.email}</p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatINRWhole(loan.principalPaise)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{loan.tenureDays} d</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatINR(
                        showOutstanding ? loan.outstandingPaise : loan.totalRepaymentPaise,
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(loan.appliedAt)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">{actions(loan)}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: cards */}
          <ul className="space-y-3 md:hidden">
            {data.items.map((loan) => (
              <li key={loan.id} className="rounded-lg border p-4">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setOpenId(loan.id)}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-medium">
                      {loan.borrower?.fullName ?? loan.borrower?.email}
                    </p>
                    <p className="font-semibold tabular-nums">
                      {formatINRWhole(loan.principalPaise)}
                    </p>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {loan.tenureDays} days ·{" "}
                    {showOutstanding
                      ? `${formatINR(loan.outstandingPaise)} outstanding`
                      : `applied ${formatDate(loan.appliedAt)}`}
                  </p>
                </button>
                <div className="mt-3 flex gap-2">{actions(loan)}</div>
              </li>
            ))}
          </ul>

          {pages > 1 && (
            <div className="flex items-center justify-end gap-2 text-sm">
              <span className="text-muted-foreground">
                Page {page} of {pages}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next page"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </>
      )}

      <LoanDetailSheet
        loanId={openId}
        onOpenChange={(open) => !open && setOpenId(null)}
        actions={actions}
      />
    </div>
  );
}
