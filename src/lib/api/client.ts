import createClient from "openapi-fetch";
import type { components, paths } from "./schema";

export type ErrorEnvelope = components["schemas"]["ErrorEnvelope"];

/** Same-origin calls; next.config.ts rewrites /api/* to the Express API. */
export const api = createClient<paths>({ baseUrl: "/api", credentials: "same-origin" });

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Unwraps an openapi-fetch result: returns data, or throws ApiError built from the error envelope.
 * Lets TanStack Query see failures as errors.
 */
export async function unwrap<T>(
  call: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await call;
  if (response.ok) return data as T;
  const envelope = error as Partial<ErrorEnvelope> | undefined;
  throw new ApiError(
    response.status,
    envelope?.error?.code ?? "UNKNOWN",
    envelope?.error?.message ?? "Something went wrong. Please try again.",
    envelope?.error?.details,
  );
}

/** For calls openapi-fetch does not cover well (multipart upload). Same error mapping as `unwrap`. */
export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { credentials: "same-origin", ...init });
  const body = await response.json().catch(() => undefined);
  if (response.ok) return body as T;
  const envelope = body as Partial<ErrorEnvelope> | undefined;
  throw new ApiError(
    response.status,
    envelope?.error?.code ?? (response.status === 413 ? "PAYLOAD_TOO_LARGE" : "UNKNOWN"),
    envelope?.error?.message ??
      (response.status === 413
        ? "That file is too large to upload."
        : "Something went wrong. Please try again."),
    envelope?.error?.details,
  );
}
