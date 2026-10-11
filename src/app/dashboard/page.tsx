import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchMe } from "@/lib/api/me";
import { modulesFor, type OpsModule } from "@/lib/rbac";

export const metadata: Metadata = { title: "Dashboard" };

const DESCRIPTIONS: Record<OpsModule["slug"], string> = {
  sales: "Registered borrowers who have not applied yet",
  sanction: "Approve or reject loan applications",
  disbursement: "Release funds for sanctioned loans",
  collection: "Record repayments; loans close when fully paid",
};

export default async function DashboardPage() {
  const me = await fetchMe();
  const modules = me ? modulesFor(me.role) : [];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((m) => (
          <Link key={m.slug} href={`/dashboard/${m.slug}`} className="group">
            <Card className="group-hover:border-primary/50 h-full transition-colors">
              <CardHeader>
                <CardTitle>{m.label}</CardTitle>
                <CardDescription>{DESCRIPTIONS[m.slug]}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
