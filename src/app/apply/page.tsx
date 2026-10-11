import type { Metadata } from "next";
import { BorrowerPortal } from "@/components/borrower/portal";

export const metadata: Metadata = { title: "Apply" };

export default function ApplyPage() {
  return <BorrowerPortal />;
}
