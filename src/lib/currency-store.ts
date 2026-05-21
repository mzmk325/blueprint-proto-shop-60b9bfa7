import { useSyncExternalStore } from "react";

export type Currency = "USD" | "CAD" | "GBP" | "EUR" | "AUD";
export const CURRENCIES: { code: Currency; label: string; flag: string }[] = [
  { code: "USD", label: "USD", flag: "🇺🇸" },
  { code: "CAD", label: "CAD", flag: "🇨🇦" },
  { code: "GBP", label: "GBP", flag: "🇬🇧" },
  { code: "EUR", label: "EUR", flag: "🇪🇺" },
  { code: "AUD", label: "AUD", flag: "🇦🇺" },
];

const KEY = "mv-currency";
let value: Currency = load();
const listeners = new Set<() => void>();

function load(): Currency {
  if (typeof window === "undefined") return "USD";
  try {
    const v = localStorage.getItem(KEY) as Currency | null;
    if (v && CURRENCIES.some((c) => c.code === v)) return v;
  } catch {}
  return "USD";
}

export const currencyStore = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  get() { return value; },
  set(v: Currency) {
    value = v;
    try { localStorage.setItem(KEY, v); } catch {}
    listeners.forEach((l) => l());
  },
};

export function useCurrency() {
  return useSyncExternalStore(currencyStore.subscribe, currencyStore.get, () => "USD" as Currency);
}
