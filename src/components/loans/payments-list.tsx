import type { Payment } from "@/lib/api/types";
import { formatDate, formatINR } from "@/lib/format";

export function PaymentsList({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return <p className="text-muted-foreground text-sm">No payments recorded yet.</p>;
  }
  return (
    <ul className="divide-y rounded-md border text-sm">
      {payments.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate font-mono text-xs">{p.utr}</p>
            <p className="text-muted-foreground text-xs">{formatDate(p.paidAt)}</p>
          </div>
          <span className="font-medium tabular-nums">{formatINR(p.amountPaise)}</span>
        </li>
      ))}
    </ul>
  );
}
