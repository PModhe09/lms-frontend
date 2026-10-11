import type { Metadata } from "next";
import { ModuleCounts } from "@/components/ops/module-counts";
import { fetchMe } from "@/lib/api/me";
import { modulesFor } from "@/lib/rbac";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const me = await fetchMe();
  const modules = me ? modulesFor(me.role).map(({ slug, label }) => ({ slug, label })) : [];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm">
          {me?.role === "ADMIN" ? "You have access to every module." : "Your work queue."}
        </p>
      </div>
      <ModuleCounts modules={modules} />
    </div>
  );
}
