import { useSyncExternalStore } from "react";

export type LensChoice = {
  type: "frame-only" | "non-rx" | "blue-light" | "single-vision" | "reading";
  label: string;
  priceAdd: number;
  rxType?: "single-vision" | "reading" | "non-rx" | "frame-only";
  rxTypeLabel?: string;
  fn?: { key: string; label: string; price: number };
  thickness?: { key: string; label: string; price: number };
  addon?: { key: string; label: string; price: number };
  rx?: {
    method: "upload" | "manual" | "later";
    fileName?: string;
    od?: { sph: string; cyl: string; axis: string };
    os?: { sph: string; cyl: string; axis: string };
    pd?: string;
    dontKnowPd?: boolean;
    hasPrism?: boolean;
  };
};

export type CartLine = {
  lineId: string;
  productId: string;
  name: string;
  color: string;
  size?: string;
  unitPrice: number;
  lens: LensChoice;
  qty: number;
};

export type OrderStatus = "pending-review" | "approved" | "needs-clarification" | "fulfillment" | "shipped";
export type Order = {
  id: string;
  createdAt: number;
  email: string;
  name: string;
  address: string;
  shipping: string;
  shippingCost: number;
  subtotal: number;
  total: number;
  lines: CartLine[];
  status: OrderStatus;
  tracking?: string;
  notes?: string;
};

type State = { lines: CartLine[]; orders: Order[] };

const KEY = "mv-cart-v1";
let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return { lines: [], orders: [] };
  try { return JSON.parse(localStorage.getItem(KEY) || "") || { lines: [], orders: [] }; }
  catch { return { lines: [], orders: [] }; }
}
function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}
function set(updater: (s: State) => State) { state = updater(state); persist(); }

export const cart = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  get() { return state; },
  add(line: Omit<CartLine, "lineId" | "qty"> & { qty?: number }) {
    set((s) => ({ ...s, lines: [...s.lines, { ...line, qty: line.qty ?? 1, lineId: crypto.randomUUID() }] }));
  },
  setQty(lineId: string, qty: number) {
    set((s) => ({ ...s, lines: s.lines.map((l) => l.lineId === lineId ? { ...l, qty: Math.max(1, qty) } : l) }));
  },
  remove(lineId: string) { set((s) => ({ ...s, lines: s.lines.filter((l) => l.lineId !== lineId) })); },
  clear() { set((s) => ({ ...s, lines: [] })); },
  placeOrder(o: Omit<Order, "id" | "createdAt" | "status" | "lines">) {
    const order: Order = { ...o, id: "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase(), createdAt: Date.now(), status: "pending-review", lines: state.lines };
    set((s) => ({ orders: [order, ...s.orders], lines: [] }));
    return order;
  },
  updateOrder(id: string, patch: Partial<Order>) {
    set((s) => ({ ...s, orders: s.orders.map((o) => o.id === id ? { ...o, ...patch } : o) }));
  },
};

export function useCart() {
  return useSyncExternalStore(cart.subscribe, cart.get, cart.get);
}

export function lineTotal(l: CartLine) { return (l.unitPrice + l.lens.priceAdd) * l.qty; }
export function cartSubtotal(lines: CartLine[]) { return lines.reduce((s, l) => s + lineTotal(l), 0); }
export const FREE_SHIPPING_THRESHOLD = 75;
