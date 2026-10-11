import type { Metadata } from "next";
import { BorrowerLoanDetail } from "@/components/borrower/loan-detail";

export const metadata: Metadata = { title: "Loan" };

export default async function LoanPage({ params }: PageProps<"/apply/loans/[id]">) {
  const { id } = await params;
  return <BorrowerLoanDetail id={id} />;
}
