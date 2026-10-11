import { queryOptions } from "@tanstack/react-query";
import { api, unwrap } from "./api/client";

export const keys = {
  me: ["me"] as const,
  breRules: ["bre-rules"] as const,
  profile: ["borrower", "profile"] as const,
  myLoans: ["borrower", "loans"] as const,
  myLoan: (id: string) => ["borrower", "loans", id] as const,
  ops: ["ops"] as const,
  queue: (module: string, page: number) => ["ops", module, page] as const,
  leads: (stage: string | undefined, page: number) =>
    ["ops", "leads", stage ?? "all", page] as const,
  opsLoan: (id: string) => ["ops", "loan", id] as const,
};

export const breRulesQuery = queryOptions({
  queryKey: keys.breRules,
  queryFn: () => unwrap(api.GET("/bre/rules")),
  staleTime: 5 * 60_000,
});

export const profileQuery = queryOptions({
  queryKey: keys.profile,
  queryFn: () => unwrap(api.GET("/borrower/profile")),
});

export const myLoansQuery = queryOptions({
  queryKey: keys.myLoans,
  queryFn: () => unwrap(api.GET("/borrower/loans")),
});

export const myLoanQuery = (id: string) =>
  queryOptions({
    queryKey: keys.myLoan(id),
    queryFn: () => unwrap(api.GET("/borrower/loans/{id}", { params: { path: { id } } })),
  });

export const opsLoanQuery = (id: string) =>
  queryOptions({
    queryKey: keys.opsLoan(id),
    queryFn: () => unwrap(api.GET("/ops/loans/{id}", { params: { path: { id } } })),
  });
