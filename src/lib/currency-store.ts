// Currency / exchange-rate / price formatter.
// Display currency is derived from the active locale (see i18n.tsx).
// Base product prices are stored in USD; this module converts + rounds for display.

import { useSyncExternalStore } from "react";
import {
  DEFAULT_CURRENCIES,
  type StorefrontCurrency,
  type StorefrontCurrencyConfig,
  type RoundingRule,
} from "./admin-i18n";

export type Currency = StorefrontCurrency;

export const CURRENCIES: { code: Currency; label: string; flag: string }[] = [
  { code: "USD", label: "USD", flag: "🇺🇸" },
  { code: "CAD", label: "CAD", flag: "🇨🇦" },
  { code: "GBP", label: "GBP", flag: "🇬🇧" },
  { code: "EUR", label: "EUR", flag: "🇪🇺" },
  { code: "AUD", label: "AUD", flag: "🇦🇺" },
];

const KEY = "mv-currency";

// ── store ──────────────────────────────────────────────────────────────────
let value: Currency = load();
let lastUpdated: number = Date.now();
const listeners = new Set<() => void>();

function load(): Currency {
  if (typeof window === "undefined") return "USD";
  try {
    const v = localStorage.getItem(KEY) as Currency | null;
    if (v && DEFAULT_CURRENCIES.some((c) => c.code === v)) return v;
  } catch { /* noop */ }
  return "USD";
}

export const currencyStore = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  get() { return value; },
  set(v: Currency) {
    if (v === value) return;
    value = v;
    try { localStorage.setItem(KEY, v); } catch { /* noop */ }
    listeners.forEach((l) => l());
  },
  lastUpdated() { return lastUpdated; },
};

export function useCurrency() {
  return useSyncExternalStore(currencyStore.subscribe, currencyStore.get, () => "USD" as Currency);
}

// ── config lookup ──────────────────────────────────────────────────────────
function cfg(c: Currency): StorefrontCurrencyConfig {
  return DEFAULT_CURRENCIES.find((x) => x.code === c) ?? DEFAULT_CURRENCIES[0];
}

export function getExchangeRate(c: Currency): number {
  const x = cfg(c);
  return x.overrideRate ?? x.baseRate ?? 1;
}

export function getCurrencySymbol(c: Currency): string {
  return cfg(c).symbol;
}

// ── conversion + rounding ──────────────────────────────────────────────────
export function convertFromUSD(usd: number, c: Currency): number {
  return usd * getExchangeRate(c);
}

export function applyRounding(n: number, rule: RoundingRule): number {
  if (!isFinite(n)) return n;
  switch (rule) {
    case "nearest-1":         return Math.round(n);
    case "nearest-0.5":       return Math.round(n * 2) / 2;
    case "psychological-99":  return Math.max(0, Math.floor(n)) + 0.99;
    case "psychological-95":  return Math.max(0, Math.floor(n)) + 0.95;
    case "none":
    default:                  return Math.round(n * 100) / 100;
  }
}

// Main display formatter. Pure: takes a USD value + currency, returns string.
export function formatPrice(usd: number, currency: Currency = value): string {
  const c = cfg(currency);
  const converted = convertFromUSD(usd, currency);
  const rounded = applyRounding(converted, c.rounding);
  const fixed =
    c.rounding === "nearest-1" ? rounded.toFixed(0) :
    c.rounding === "nearest-0.5" ? rounded.toFixed(2).replace(/\.?0+$/, "") :
    rounded.toFixed(2);
  return `${c.symbol}${fixed}`;
}

// React hook variant — re-renders when currency changes.
export function usePriceFormatter() {
  const c = useCurrency();
  return (usd: number) => formatPrice(usd, c);
}
