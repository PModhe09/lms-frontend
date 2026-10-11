import { Badge } from "@/components/ui/badge";
import type { LoanStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const STYLES: Record<LoanStatus, string> = {
  APPLIED: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  SANCTIONED: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  REJECTED: "bg-destructive/15 text-destructive",
  DISBURSED: "bg-primary/15 text-primary",
  CLOSED: "bg-muted text-muted-foreground",
};

const LABELS: Record<LoanStatus, string> = {
  APPLIED: "Under review",
  SANCTIONED: "Sanctioned",
  REJECTED: "Rejected",
  DISBURSED: "Active",
  CLOSED: "Closed",
};

export function StatusBadge({ status, staff = false }: { status: LoanStatus; staff?: boolean }) {
  return (
    <Badge variant="secondary" className={cn("border-transparent font-medium", STYLES[status])}>
      {staff ? status.charAt(0) + status.slice(1).toLowerCase() : LABELS[status]}
    </Badge>
  );
}
