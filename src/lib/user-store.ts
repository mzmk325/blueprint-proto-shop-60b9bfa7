import { useEffect, useSyncExternalStore } from "react";

type State = { wishlist: string[]; recent: string[] };
const KEY = "mv-user-v1";
const MAX_RECENT = 8;

function load(): State {
  if (typeof window === "undefined") return { wishlist: [], recent: [] };
  try { return JSON.parse(localStorage.getItem(KEY) || "") || { wishlist: [], recent: [] }; }
  catch { return { wishlist: [], recent: [] }; }
}

let state: State = { wishlist: [], recent: [] };
const listeners = new Set<() => void>();
function notify() { listeners.forEach((l) => l()); }
function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  notify();
}
function set(updater: (s: State) => State) { state = updater(state); persist(); }

export const user = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  get() { return state; },
  hydrate() {
    state = load();
    notify();
  },
  toggleWish(id: string) {
    set((s) => ({ ...s, wishlist: s.wishlist.includes(id) ? s.wishlist.filter((x) => x !== id) : [id, ...s.wishlist] }));
  },
  pushRecent(id: string) {
    set((s) => ({ ...s, recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, MAX_RECENT) }));
  },
};

export function useUser() {
  useEffect(() => { user.hydrate(); }, []);
  return useSyncExternalStore(user.subscribe, user.get, () => ({ wishlist: [], recent: [] }));
}
