"use client";

import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, unwrap } from "@/lib/api/client";
import type { OpsModule } from "@/lib/rbac";

const DESCRIPTIONS: Record<OpsModule["slug"], { text: string; unit: string }> = {
  sales: { text: "Registered borrowers who have not applied yet", unit: "leads" },
  sanction: { text: "Applications awaiting a decision", unit: "to review" },
  disbursement: { text: "Sanctioned loans awaiting release", unit: "to disburse" },
  collection: { text: "Active loans being repaid", unit: "active" },
};

const page = { params: { query: { page: 1, limit: 1 } } };
const COUNT: Record<OpsModule["slug"], () => Promise<{ total: number }>> = {
  sales: () => unwrap(api.GET("/ops/sales/leads", page)),
  sanction: () => unwrap(api.GET("/ops/sanction/loans", page)),
  disbursement: () => unwrap(api.GET("/ops/disbursement/loans", page)),
  collection: () => unwrap(api.GET("/ops/collection/loans", page)),
};

/** One card per module the role can read, with the size of its queue. */
export function ModuleCounts({ modules }: { modules: Pick<OpsModule, "slug" | "label">[] }) {
  const counts = useQueries({
    queries: modules.map((m) => ({ queryKey: ["ops", "count", m.slug], queryFn: COUNT[m.slug] })),
  });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {modules.map((m, i) => (
        <Link key={m.slug} href={`/dashboard/${m.slug}`} className="group">
          <Card className="group-hover:border-primary/50 h-full transition-colors">
            <CardHeader>
              <CardDescription>{m.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {counts[i]?.data?.total ?? "–"}{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  {DESCRIPTIONS[m.slug].unit}
                </span>
              </CardTitle>
              <CardDescription>{DESCRIPTIONS[m.slug].text}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
