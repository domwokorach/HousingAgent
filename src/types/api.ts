/**
 * Transport-agnostic envelopes. Services return these today from the
 * client-side store; if this app grows a backend, the same shapes come back
 * from `fetch` and nothing above the service layer changes.
 */

export type Result<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };

export function ok(): Result<void>;
export function ok<T>(data: T): Result<T>;
export function ok<T>(data?: T): Result<T | void> {
  return { ok: true, data: data as T };
}

export function fail<T = never>(error: string, field?: string): Result<T> {
  return { ok: false, error, field };
}

