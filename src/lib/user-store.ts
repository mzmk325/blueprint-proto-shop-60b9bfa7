import { useSyncExternalStore } from "react";

type State = { wishlist: string[]; recent: string[] };
const KEY = "mv-user-v1";
const MAX_RECENT = 8;

function load(): State {
  if (typeof window === "undefined") return { wishlist: [], recent: [] };
  try { return JSON.parse(localStorage.getItem(KEY) || "") || { wishlist: [], recent: [] }; }
  catch { return { wishlist: [], recent: [] }; }
}

let state: State = load();
const listeners = new Set<() => void>();
function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}
function set(updater: (s: State) => State) { state = updater(state); persist(); }

export const user = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  get() { return state; },
  toggleWish(id: string) {
    set((s) => ({ ...s, wishlist: s.wishlist.includes(id) ? s.wishlist.filter((x) => x !== id) : [id, ...s.wishlist] }));
  },
  pushRecent(id: string) {
    set((s) => ({ ...s, recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, MAX_RECENT) }));
  },
};

export function useUser() {
  return useSyncExternalStore(user.subscribe, user.get, user.get);
}
