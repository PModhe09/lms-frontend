import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { OpsNav } from "@/components/ops-nav";
import { fetchMe } from "@/lib/api/me";
import { modulesFor } from "@/lib/rbac";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const me = await fetchMe();
  if (!me) redirect("/login");
  if (me.role === "BORROWER") redirect("/apply");
  const modules = modulesFor(me.role).map(({ slug, label }) => ({ slug, label }));

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader home="/dashboard" email={me.email} role={me.role} />
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="border-b p-2 md:w-56 md:shrink-0 md:border-r md:border-b-0 md:p-4">
          <OpsNav modules={modules} />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
