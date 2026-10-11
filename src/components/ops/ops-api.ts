import { api, unwrap } from "@/lib/api/client";

export type QueueModule = "sanction" | "disbursement" | "collection";

/** One list call per module; each lives under its own permission-guarded router. */
export function fetchQueue(module: QueueModule, page: number) {
  const query = { query: { page, limit: 20 } };
  switch (module) {
    case "sanction":
      return unwrap(api.GET("/ops/sanction/loans", { params: query }));
    case "disbursement":
      return unwrap(api.GET("/ops/disbursement/loans", { params: query }));
    case "collection":
      return unwrap(api.GET("/ops/collection/loans", { params: query }));
  }
}

const path = (id: string) => ({ params: { path: { id } } });

export const opsActions = {
  approve: (id: string) => unwrap(api.POST("/ops/sanction/loans/{id}/approve", path(id))),
  reject: (id: string, reason: string) =>
    unwrap(api.POST("/ops/sanction/loans/{id}/reject", { ...path(id), body: { reason } })),
  disburse: (id: string) => unwrap(api.POST("/ops/disbursement/loans/{id}/disburse", path(id))),
  recordPayment: (id: string, body: { utr: string; amountPaise: number; paidAt: string }) =>
    unwrap(api.POST("/ops/collection/loans/{id}/payments", { ...path(id), body })),
  slipUrl: (id: string) => unwrap(api.GET("/ops/sanction/loans/{id}/salary-slip", path(id))),
};
