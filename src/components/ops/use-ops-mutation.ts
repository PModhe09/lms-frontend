"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { keys } from "@/lib/queries";

/**
 * Wraps an ops action: toasts the outcome and refreshes every ops list. A 409 means someone else
 * already acted on this loan, so the list is refreshed to show the current state.
 */
export function useOpsMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  success: string,
  onDone?: () => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(success);
      onDone?.();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409)
        toast.warning(`${err.message}. The list has been refreshed.`);
      else if (!(err instanceof ApiError && err.status === 422)) {
        toast.error(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.ops }),
  });
}
