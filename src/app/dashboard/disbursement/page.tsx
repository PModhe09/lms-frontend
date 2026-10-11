"use client";

import { DisburseAction } from "@/components/ops/disburse-action";
import { LoanQueue } from "@/components/ops/loan-queue";

export default function DisbursementPage() {
  return (
    <LoanQueue
      module="disbursement"
      title="Disbursement"
      description="Sanctioned loans waiting for funds to be released."
      empty="Nothing to disburse. Sanctioned loans appear here."
      actions={(loan) => <DisburseAction loan={loan} />}
    />
  );
}
