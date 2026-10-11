"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api/client";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  SALES: "Sales executive",
  SANCTION: "Sanction executive",
  DISBURSEMENT: "Disbursement executive",
  COLLECTION: "Collection executive",
  BORROWER: "Borrower",
};

export function UserMenu({ email, role }: { email: string; role: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function logout() {
    await api.POST("/auth/logout");
    queryClient.clear();
    router.replace("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-56 truncate">
          {email}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="truncate text-sm font-medium">{email}</div>
          <div className="text-muted-foreground text-xs">{ROLE_LABEL[role] ?? role}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout}>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
