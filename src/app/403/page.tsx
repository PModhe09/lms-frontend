import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "No access" };

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-primary text-sm font-semibold">403</p>
      <h1 className="text-2xl font-semibold tracking-tight">You do not have access to this page</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Your role does not include this module. Ask an admin if you think this is wrong.
      </p>
      <Button asChild>
        <Link href="/">Go to my home</Link>
      </Button>
    </main>
  );
}
