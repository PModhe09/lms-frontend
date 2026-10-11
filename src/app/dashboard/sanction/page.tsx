"use client";

import { LoanQueue } from "@/components/ops/loan-queue";
import { SanctionActions } from "@/components/ops/sanction-actions";

export default function SanctionPage() {
  return (
    <LoanQueue
      module="sanction"
      title="Sanction"
      description="Applications awaiting a decision. Open one to review the borrower, eligibility result and salary slip."
      empty="No applications waiting. New ones appear here as borrowers apply."
      actions={(loan) => <SanctionActions loan={loan} />}
    />
  );
}
