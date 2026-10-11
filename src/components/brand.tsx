import Link from "next/link";
import { Landmark } from "lucide-react";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md">
        <Landmark className="size-4" />
      </span>
      <span>LMS</span>
    </Link>
  );
}
