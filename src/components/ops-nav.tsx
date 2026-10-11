"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { OpsModule } from "@/lib/rbac";

/** Only the modules the role may read. Sidebar on desktop, scrollable tabs on mobile. */
export function OpsNav({ modules }: { modules: readonly Pick<OpsModule, "slug" | "label">[] }) {
  const pathname = usePathname();
  const items = [{ href: "/dashboard", label: "Overview" }].concat(
    modules.map((m) => ({ href: `/dashboard/${m.slug}`, label: m.label })),
  );
  return (
    <nav aria-label="Modules" className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map((item) => {
        const active =
          item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
