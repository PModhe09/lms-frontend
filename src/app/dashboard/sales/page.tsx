"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, unwrap } from "@/lib/api/client";
import type { Lead } from "@/lib/api/types";
import { formatDate, formatINR } from "@/lib/format";
import { keys } from "@/lib/queries";

const STAGES = {
  REGISTERED: "Signed up",
  BRE_REJECTED: "Not eligible",
  DETAILS_SUBMITTED: "Details done",
  SLIP_UPLOADED: "Ready to apply",
} as const;
type LeadStage = keyof typeof STAGES;

export default function SalesPage() {
  const [stage, setStage] = useState<LeadStage | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const filter = stage === "ALL" ? undefined : stage;
  const { data, isPending, isError } = useQuery({
    queryKey: keys.leads(filter, page),
    queryFn: () =>
      unwrap(
        api.GET("/ops/sales/leads", { params: { query: { page, limit: 20, stage: filter } } }),
      ),
    placeholderData: keepPreviousData,
  });
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
          <p className="text-muted-foreground text-sm">
            Registered borrowers who have not applied yet. Follow up to convert.
          </p>
        </div>
        <Select
          value={stage}
          onValueChange={(v) => {
            setStage(v as LeadStage | "ALL");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by stage">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All stages</SelectItem>
            {Object.entries(STAGES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending && <Skeleton className="h-64 w-full" />}
      {isError && <p className="text-destructive text-sm">Could not load leads.</p>}
      {data && data.items.length === 0 && (
        <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          No leads in this stage.
        </div>
      )}
      {data && data.items.length > 0 && (
        <>
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Monthly salary</TableHead>
                  <TableHead>Why stuck</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <p className="font-medium">{lead.fullName ?? "—"}</p>
                      <p className="text-muted-foreground text-xs">{lead.email}</p>
                    </TableCell>
                    <TableCell>
                      <StageBadge lead={lead} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {lead.monthlySalaryPaise !== undefined
                        ? formatINR(lead.monthlySalaryPaise)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs text-xs">
                      {reasons(lead)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(lead.registeredAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="space-y-3 md:hidden">
            {data.items.map((lead) => (
              <li key={lead.id} className="space-y-2 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{lead.fullName ?? lead.email}</p>
                    <p className="text-muted-foreground truncate text-xs">{lead.email}</p>
                  </div>
                  <StageBadge lead={lead} />
                </div>
                {reasons(lead) && <p className="text-muted-foreground text-xs">{reasons(lead)}</p>}
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
    </div>
  );
}

function StageBadge({ lead }: { lead: Lead }) {
  const stage = (lead.onboardingStage ?? "REGISTERED") as LeadStage;
  return (
    <Badge variant={stage === "BRE_REJECTED" ? "destructive" : "secondary"}>
      {STAGES[stage] ?? stage}
    </Badge>
  );
}

const reasons = (lead: Lead) =>
  lead.breResult && !lead.breResult.passed
    ? lead.breResult.failures.map((f) => f.message).join("; ")
    : "";
