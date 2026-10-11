import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="bg-muted/40 flex min-h-svh flex-col">
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <Brand href="/login" />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">{children}</main>
    </div>
  );
}
