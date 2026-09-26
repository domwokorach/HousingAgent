import type { z } from "zod";

/** Field name -> first error message, ready to drop into form state. */
export type FieldErrors<T> = Partial<Record<keyof T | "form", string>>;

/**
 * Runs a schema and returns either the parsed value or a map of field errors.
 * Only the first message per field is kept — that is all a form shows.
 */
export function validate<S extends z.ZodType>(
  schema: S,
  value: unknown,
): { ok: true; data: z.output<S> } | { ok: false; errors: Record<string, string> } {
  const result = schema.safeParse(value);
  if (result.success) return { ok: true, data: result.data };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "form";
    if (!(key in errors)) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

export * from "./auth.schema";
export * from "./property.schema";
export * from "./agent.schema";
export * from "./account.schema";
