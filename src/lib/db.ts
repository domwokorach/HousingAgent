/**
 * The data layer.
 *
 * This demo has no server, so "the database" is a single object held in memory
 * and mirrored into localStorage. It is exposed as an external store
 * (`subscribe` / `getSnapshot`) so React can read it through
 * `useSyncExternalStore`: React uses the server snapshot while hydrating and
 * swaps in the stored state immediately after, which keeps markup consistent
 * without a syncing effect.
 *
 * Everything above this file goes through `src/services/*`, so replacing this
 * module with real API calls is a contained change.
 */

import type { Enquiry, Session, User } from "@/types/user";
import type { Property } from "@/types/property";
import { properties as seedProperties } from "./seed";

export const STORAGE_KEYS = {
  users: "ha.users",
  session: "ha.session",
  saved: "ha.saved",
  listings: "ha.listings",
  enquiries: "ha.enquiries",
} as const;

/* ------------------------------------------------------- storage primitives */

/**
 * localStorage access that never throws — private mode, blocked site data and
 * SSR all return the fallback instead of breaking a render.
 */
export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded or storage blocked — the app still works in memory */
  }
}

export function removeKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/* -------------------------------------------------------------- app state */

export interface AppState {
  /** False in the server snapshot; true once localStorage has been read. */
  hydrated: boolean;
  users: User[];
  session: Session | null;
  /** Saved property ids keyed by account email, or "guest". */
  saved: Record<string, string[]>;
  /** Per-listing patches applied over the seed data. */
  overrides: Record<string, Partial<Property>>;
  created: Property[];
  removed: string[];
  enquiries: Enquiry[];
}

export const EMPTY_STATE: AppState = {
  hydrated: false,
  users: [],
  session: null,
  saved: {},
  overrides: {},
  created: [],
  removed: [],
  enquiries: [],
};

let snapshot: AppState = EMPTY_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function load(): AppState {
  const listings = readJSON<{
    overrides: Record<string, Partial<Property>>;
    created: Property[];
    removed: string[];
  }>(STORAGE_KEYS.listings, { overrides: {}, created: [], removed: [] });

  return {
    hydrated: true,
    users: readJSON<User[]>(STORAGE_KEYS.users, []),
    session: readJSON<Session | null>(STORAGE_KEYS.session, null),
    saved: readJSON<Record<string, string[]>>(STORAGE_KEYS.saved, {}),
    overrides: listings.overrides ?? {},
    created: listings.created ?? [],
    removed: listings.removed ?? [],
    enquiries: readJSON<Enquiry[]>(STORAGE_KEYS.enquiries, []),
  };
}

function persist(state: AppState): void {
  writeJSON(STORAGE_KEYS.users, state.users);
  writeJSON(STORAGE_KEYS.saved, state.saved);
  writeJSON(STORAGE_KEYS.enquiries, state.enquiries);
  writeJSON(STORAGE_KEYS.listings, {
    overrides: state.overrides,
    created: state.created,
    removed: state.removed,
  });
  if (state.session) writeJSON(STORAGE_KEYS.session, state.session);
  else removeKey(STORAGE_KEYS.session);
}

export function getSnapshot(): AppState {
  if (!loaded) {
    snapshot = load();
    loaded = true;
  }
  return snapshot;
}

export function getServerSnapshot(): AppState {
  return EMPTY_STATE;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Keep other tabs of the same browser in step.
  const onStorage = (event: StorageEvent) => {
    const keys: string[] = Object.values(STORAGE_KEYS);
    if (event.key === null || keys.includes(event.key)) {
      snapshot = load();
      loaded = true;
      listeners.forEach((l) => l());
    }
  };

  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Applies a change, writes it through to storage and notifies subscribers. */
export function update(updater: (state: AppState) => AppState): AppState {
  snapshot = updater(getSnapshot());
  persist(snapshot);
  listeners.forEach((listener) => listener());
  return snapshot;
}

/** Test seam: drops everything, including what is already in storage. */
export function resetForTests(state: Partial<AppState> = {}): void {
  snapshot = { ...EMPTY_STATE, hydrated: true, ...state };
  loaded = true;
  persist(snapshot);
  listeners.forEach((listener) => listener());
}

/* -------------------------------------------------------------- selectors */

/** Seed listings merged with anything created, edited or removed locally. */
export function selectListings(state: AppState): Property[] {
  const apply = (property: Property) =>
    state.overrides[property.id]
      ? { ...property, ...state.overrides[property.id] }
      : property;

  return [
    ...state.created.filter((p) => !state.removed.includes(p.id)).map(apply),
    ...seedProperties.filter((p) => !state.removed.includes(p.id)).map(apply),
  ];
}

export function selectUser(state: AppState): User | null {
  if (!state.session) return null;
  const email = state.session.email;
  return state.users.find((user) => user.email === email) ?? null;
}

/** Shortlists are keyed per account, with a shared bucket for guests. */
export function selectSavedKey(state: AppState): string {
  return selectUser(state)?.email ?? "guest";
}

export function selectSavedIds(state: AppState): string[] {
  return state.saved[selectSavedKey(state)] ?? [];
}
