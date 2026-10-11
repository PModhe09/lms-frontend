import type { Loan } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";

const VERB: Record<Loan["status"], string> = {
  APPLIED: "Applied",
  SANCTIONED: "Sanctioned",
  REJECTED: "Rejected",
  DISBURSED: "Disbursed",
  CLOSED: "Closed — fully repaid",
};

export function StatusTimeline({
  history,
  showActor = false,
}: {
  history: Loan["statusHistory"];
  showActor?: boolean;
}) {
  return (
    <ol className="relative space-y-4 border-l pl-5">
      {history.map((h, i) => (
        <li key={i} className="relative">
          <span className="bg-primary ring-background absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4" />
          <p className="text-sm font-medium">{VERB[h.to]}</p>
          <p className="text-muted-foreground text-xs">
            {formatDateTime(h.at)}
            {showActor && ` · by ${actor(h)}`}
          </p>
          {h.note && <p className="mt-1 text-sm">“{h.note}”</p>}
        </li>
      ))}
    </ol>
  );
}

const actor = (h: Loan["statusHistory"][number]) =>
  h.by === "SYSTEM"
    ? "system (fully repaid)"
    : h.to === "APPLIED"
      ? "borrower"
      : `staff #${h.by.slice(-6)}`;
