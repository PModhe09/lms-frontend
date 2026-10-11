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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { Loan } from "@/lib/api/types";
import { formatINRWhole } from "@/lib/format";
import { Permission } from "@/lib/rbac";
import { opsActions } from "./ops-api";
import { useCan } from "./session-context";
import { useOpsMutation } from "./use-ops-mutation";

export function SanctionActions({ loan }: { loan: Loan }) {
  const canDecide = useCan(Permission.SANCTION_DECIDE);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const approve = useOpsMutation(() => opsActions.approve(loan.id), "Loan sanctioned");
  const reject = useOpsMutation(
    () => opsActions.reject(loan.id, reason.trim()),
    "Loan rejected",
    () => setRejecting(false),
  );

  if (!canDecide || loan.status !== "APPLIED") return null;
  return (
    <>
      <Button size="sm" onClick={() => approve.mutate(undefined)} disabled={approve.isPending}>
        Approve
      </Button>
      <Button size="sm" variant="outline" onClick={() => setRejecting(true)}>
        Reject
      </Button>
      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              {loan.borrower?.fullName} · {formatINRWhole(loan.principalPaise)}. The borrower sees
              this reason.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor={`reason-${loan.id}`}>Reason</FieldLabel>
            <Textarea
              id={`reason-${loan.id}`}
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Salary slip does not match declared salary"
            />
            <FieldDescription>{reason.length}/500</FieldDescription>
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || reject.isPending}
              onClick={() => reject.mutate(undefined)}
            >
              Reject loan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
