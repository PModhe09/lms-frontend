"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Loan } from "@/lib/api/types";
import { formatINRWhole } from "@/lib/format";
import { Permission } from "@/lib/rbac";
import { opsActions } from "./ops-api";
import { useCan } from "./session-context";
import { useOpsMutation } from "./use-ops-mutation";

export function DisburseAction({ loan }: { loan: Loan }) {
  const canExecute = useCan(Permission.DISBURSEMENT_EXECUTE);
  const [open, setOpen] = useState(false);
  const disburse = useOpsMutation(
    () => opsActions.disburse(loan.id),
    "Marked as disbursed",
    () => setOpen(false),
  );

  if (!canExecute || loan.status !== "SANCTIONED") return null;
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Disburse
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm disbursement</DialogTitle>
            <DialogDescription>
              Mark {formatINRWhole(loan.principalPaise)} to {loan.borrower?.fullName} as released.
              The repayment period starts today.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={disburse.isPending} onClick={() => disburse.mutate(undefined)}>
              Confirm disbursement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
