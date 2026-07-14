/**
 * Centralized API error normalizer.
 * Every fetch/server-fn call should route through this to produce a consistent shape.
 */
import type { ApiError } from "@/types";

export class AppError extends Error implements ApiError {
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, code = "UNKNOWN", details?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export function normalizeError(err: unknown): ApiError {
  if (err instanceof AppError) {
    return { code: err.code, message: err.message, details: err.details };
  }
  if (err instanceof Error) {
    return { code: "UNKNOWN", message: err.message };
  }
  return { code: "UNKNOWN", message: "Unexpected error" };
}
