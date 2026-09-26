"use client";

import { useSyncExternalStore } from "react";
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
  type AppState,
} from "@/lib/db";

/**
 * The one place React subscribes to the store. React renders the server
 * snapshot while hydrating and swaps in stored state straight afterwards, so
 * `state.hydrated` is the signal for "localStorage has been read" — render a
 * skeleton until it is true rather than risking a markup mismatch.
 */
export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
