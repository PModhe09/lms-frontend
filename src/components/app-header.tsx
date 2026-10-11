import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";

export function AppHeader({
  home,
  email,
  role,
  children,
}: {
  home: string;
  email: string;
  role: string;
  children?: ReactNode;
}) {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-30 border-b backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        {children}
        <Brand href={home} />
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <UserMenu email={email} role={role} />
        </div>
      </div>
    </header>
  );
}
