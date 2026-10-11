import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sales" };

export default function SalesPage() {
  return <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>;
}
