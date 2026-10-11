import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { fetchMe } from "@/lib/api/me";

export default async function ApplyLayout({ children }: LayoutProps<"/apply">) {
  const me = await fetchMe();
  if (!me) redirect("/login");
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader home="/apply" email={me.email} role={me.role} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
