import type { Loan } from "@/lib/api/types";
import { formatINR } from "@/lib/format";

/** Key money figures of a loan as a definition grid. */
export function LoanSummary({ loan }: { loan: Loan }) {
  const rows = [
    ["Principal", formatINR(loan.principalPaise)],
    ["Tenure", `${loan.tenureDays} days`],
    ["Interest (12% p.a.)", formatINR(loan.interestPaise)],
    ["Total repayment", formatINR(loan.totalRepaymentPaise)],
    ["Paid", formatINR(loan.amountPaidPaise)],
    ["Outstanding", formatINR(loan.outstandingPaise)],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
