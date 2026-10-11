"use client";

import { LoanQueue } from "@/components/ops/loan-queue";
import { PaymentAction } from "@/components/ops/payment-action";

export default function CollectionPage() {
  return (
    <LoanQueue
      module="collection"
      title="Collection"
      description="Active loans. Record repayments by UTR; a loan closes automatically once fully repaid."
      empty="No active loans. Disbursed loans appear here."
      showOutstanding
      actions={(loan) => <PaymentAction loan={loan} />}
    />
  );
}
