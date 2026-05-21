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

export type OrderStatus =
  | "paid"
  | "rx-pending"
  | "rx-clarification"
  | "rx-approved"
  | "sourcing"
  | "sent-to-lab"
  | "in-production"
  | "qc"
  | "ready-to-ship"
  | "shipped"
  | "delivered"
  | "after-sale";

export const STATUS_META: Record<OrderStatus, { label: string; tone: string }> = {
  paid:                 { label: "Paid",                       tone: "bg-slate-500/15 text-slate-700 dark:text-slate-200" },
  "rx-pending":         { label: "Rx Pending Review",          tone: "bg-amber-500/15 text-amber-800 dark:text-amber-200" },
  "rx-clarification":   { label: "Needs Clarification",        tone: "bg-red-500/15 text-red-800 dark:text-red-200" },
  "rx-approved":        { label: "Rx Approved",                tone: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200" },
  sourcing:             { label: "Frame & Lens Sourcing",      tone: "bg-blue-500/15 text-blue-800 dark:text-blue-200" },
  "sent-to-lab":        { label: "Sent to Local Lab",          tone: "bg-indigo-500/15 text-indigo-800 dark:text-indigo-200" },
  "in-production":      { label: "In Production",              tone: "bg-purple-500/15 text-purple-800 dark:text-purple-200" },
  qc:                   { label: "Quality Check",              tone: "bg-fuchsia-500/15 text-fuchsia-800 dark:text-fuchsia-200" },
  "ready-to-ship":      { label: "Ready to Ship",              tone: "bg-teal-500/15 text-teal-800 dark:text-teal-200" },
  shipped:              { label: "Shipped",                    tone: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-200" },
  delivered:            { label: "Delivered",                  tone: "bg-green-500/15 text-green-800 dark:text-green-200" },
  "after-sale":         { label: "After-sale",                 tone: "bg-orange-500/15 text-orange-800 dark:text-orange-200" },
};

export const STATUS_ORDER: OrderStatus[] = [
  "paid", "rx-pending", "rx-approved", "sourcing", "sent-to-lab",
  "in-production", "qc", "ready-to-ship", "shipped", "delivered",
];

export type TimelineEvent = { at: number; status?: OrderStatus; message: string; author?: string };

export type RxReview = {
  status: "pending" | "approved" | "clarification";
  notes?: string;
  reviewedAt?: number;
  reviewer?: string;
};

export type Sourcing = {
  frameSourceUrl?: string;
  frameCost?: number;
  lensSupplier?: string;
  lensCost?: number;
  notes?: string;
};

export type LabInfo = {
  sentToMomAt?: number;
  localShop?: string;
  processingFee?: number;
  qcPhotoName?: string;
  qcNotes?: string;
};

export type ShippingInfo = {
  carrier?: string;
  tracking?: string;
  shippedAt?: number;
  deliveryStatus?: string;
  trackingNotes?: string;
};

export type Order = {
  id: string;
  createdAt: number;
  email: string;
  name: string;
  phone?: string;
  country?: string;
  address: string;
  shipping: string;            // method label (standard / express)
  shippingCost: number;        // what the customer paid for shipping
  subtotal: number;
  total: number;
  lines: CartLine[];
  status: OrderStatus;
  tracking?: string;           // kept for backwards compat
  notes?: string;
  // Admin-only fields:
  rxReview?: RxReview;
  sourcing?: Sourcing;
  lab?: LabInfo;
  shippingInfo?: ShippingInfo;
  intlShippingCost?: number;
  packagingCost?: number;
  paymentFee?: number;
  customerNotes?: string;
  internalNotes?: string;
  timeline?: TimelineEvent[];
};

type State = { lines: CartLine[]; orders: Order[] };

const KEY = "mv-cart-v2";
const MOCK_NOW = Date.UTC(2026, 4, 21, 10, 0, 0);
let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return { lines: [], orders: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { lines: [], orders: seedOrders() };
    const parsed = JSON.parse(raw) as State;
    if (!parsed.orders || parsed.orders.length === 0) parsed.orders = seedOrders();
    return parsed;
  } catch { return { lines: [], orders: seedOrders() }; }
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
    const id = "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const order: Order = {
      ...o, id, createdAt: Date.now(),
      status: "rx-pending",
      lines: state.lines,
      rxReview: { status: "pending" },
      sourcing: {}, lab: {}, shippingInfo: {},
      timeline: [
        { at: Date.now(), status: "paid", message: "Payment received" },
        { at: Date.now(), status: "rx-pending", message: "Prescription submitted for review" },
      ],
    };
    set((s) => ({ orders: [order, ...s.orders], lines: [] }));
    return order;
  },
  updateOrder(id: string, patch: Partial<Order>) {
    set((s) => ({ ...s, orders: s.orders.map((o) => o.id === id ? { ...o, ...patch } : o) }));
  },
  setStatus(id: string, status: OrderStatus, message?: string) {
    set((s) => ({
      ...s,
      orders: s.orders.map((o) => o.id === id ? {
        ...o, status,
        timeline: [...(o.timeline ?? []), { at: Date.now(), status, message: message ?? `Status → ${STATUS_META[status].label}` }],
      } : o),
    }));
  },
  addEvent(id: string, message: string, author = "Admin") {
    set((s) => ({
      ...s,
      orders: s.orders.map((o) => o.id === id ? {
        ...o, timeline: [...(o.timeline ?? []), { at: Date.now(), message, author }],
      } : o),
    }));
  },
  resetMock() {
    set(() => ({ lines: [], orders: seedOrders() }));
  },
};

const EMPTY_STATE: State = { lines: [], orders: [] };
export function useCart() {
  return useSyncExternalStore(cart.subscribe, cart.get, () => EMPTY_STATE);
}

export function lineTotal(l: CartLine) { return (l.unitPrice + l.lens.priceAdd) * l.qty; }
export function cartSubtotal(lines: CartLine[]) { return lines.reduce((s, l) => s + lineTotal(l), 0); }
export const FREE_SHIPPING_THRESHOLD = 75;

// Margin estimation defaults
export function estimateMargin(o: Order) {
  const frameCost = o.sourcing?.frameCost ?? round2(o.lines.reduce((s, l) => s + l.unitPrice * 0.3 * l.qty, 0));
  const lensCost = o.sourcing?.lensCost ?? round2(o.lines.reduce((s, l) => s + l.lens.priceAdd * 0.35 * l.qty, 0));
  const processingFee = o.lab?.processingFee ?? 8;
  const packagingCost = o.packagingCost ?? 2;
  const intlShipping = o.intlShippingCost ?? 12;
  const paymentFee = o.paymentFee ?? round2(o.total * 0.029 + 0.3);
  const totalCost = frameCost + lensCost + processingFee + packagingCost + intlShipping + paymentFee;
  const gross = round2(o.total - totalCost);
  const marginPct = o.total > 0 ? round2((gross / o.total) * 100) : 0;
  return { frameCost, lensCost, processingFee, packagingCost, intlShipping, paymentFee, totalCost: round2(totalCost), gross, marginPct };
}
function round2(n: number) { return Math.round(n * 100) / 100; }

// ── Mock seed ────────────────────────────────────────────────────────────────
function mockLine(over: Partial<CartLine> & { name: string; color: string; unitPrice: number; lens: LensChoice }): CartLine {
  return {
    lineId: `mock-${over.name.toLowerCase()}-${over.color.toLowerCase()}`, productId: "p-" + over.name.toLowerCase(), qty: 1, size: "M", ...over,
  };
}

function seedOrders(): Order[] {
  const now = MOCK_NOW;
  const base = (id: string, over: Partial<Order>): Order => ({
    id,
    createdAt: now, email: "", name: "", address: "",
    shipping: "standard", shippingCost: 6.95, subtotal: 0, total: 0,
    lines: [], status: "paid", timeline: [],
    sourcing: {}, lab: {}, shippingInfo: {},
    ...over,
  });

  const orders: Order[] = [
    base("ORD-RX1001", {
      createdAt: now - 2 * 3600_000, name: "Emma Larsen", email: "emma.l@example.com",
      phone: "+47 412 88 901", country: "Norway",
      address: "Storgata 14, 0184 Oslo, Norway",
      lines: [mockLine({
        name: "Jace", color: "Clear", unitPrice: 38.25,
        lens: {
          type: "single-vision", label: "Single Vision · Blue-light · 1.61", priceAdd: 78,
          rxType: "single-vision", rxTypeLabel: "Single Vision",
          fn: { key: "blue", label: "Blue-light filter", price: 30 },
          thickness: { key: "1.61", label: "1.61 Thin", price: 35 },
          addon: { key: "premium-ar", label: "Premium AR coating", price: 13 },
          rx: { method: "manual", od: { sph: "-2.25", cyl: "-0.75", axis: "175" }, os: { sph: "-2.00", cyl: "-0.50", axis: "180" }, pd: "63" },
        },
      })],
      subtotal: 116.25, total: 123.20, status: "rx-pending",
      rxReview: { status: "pending" },
      timeline: [
        { at: now - 2 * 3600_000, status: "paid", message: "Payment received via Stripe" },
        { at: now - 2 * 3600_000 + 60_000, status: "rx-pending", message: "Prescription submitted for review" },
      ],
    }),
    base("ORD-RX1002", {
      createdAt: now - 6 * 3600_000, name: "Lucas Ferreira", email: "lucas.f@example.com",
      phone: "+55 11 99888 4421", country: "Brazil",
      address: "Av. Paulista 1200, São Paulo, SP 01310-100, Brazil",
      lines: [mockLine({
        name: "Athina", color: "Pink", unitPrice: 45,
        lens: {
          type: "single-vision", label: "Single Vision · Photochromic · 1.67", priceAdd: 145,
          rxType: "single-vision", rxTypeLabel: "Single Vision",
          fn: { key: "photo", label: "Photochromic", price: 75 },
          thickness: { key: "1.67", label: "1.67 Ultra Thin", price: 55 },
          addon: { key: "mr-pro", label: "MR Pro coating", price: 15 },
          rx: { method: "upload", fileName: "rx-lucas.jpg" },
        },
      })],
      subtotal: 190, total: 196.95, status: "rx-clarification",
      rxReview: { status: "clarification", notes: "Uploaded image is blurry — PD not legible. Asked customer for clearer photo.", reviewedAt: now - 4 * 3600_000, reviewer: "Mira (mom)" },
      timeline: [
        { at: now - 6 * 3600_000, status: "paid", message: "Payment received" },
        { at: now - 6 * 3600_000 + 60_000, status: "rx-pending", message: "Rx submitted (upload)" },
        { at: now - 4 * 3600_000, status: "rx-clarification", message: "Requested clearer Rx photo from customer", author: "Mira" },
      ],
    }),
    base("ORD-RX1003", {
      createdAt: now - 1 * 86400000, name: "Sofia Bianchi", email: "sofia.b@example.com",
      phone: "+39 333 555 7788", country: "Italy",
      address: "Via Roma 45, 20121 Milano, Italy",
      lines: [mockLine({
        name: "Mira", color: "Tortoise", unitPrice: 52,
        lens: {
          type: "single-vision", label: "Single Vision · Clear · 1.56", priceAdd: 0,
          rxType: "single-vision", rxTypeLabel: "Single Vision",
          fn: { key: "clear", label: "Clear", price: 0 },
          thickness: { key: "1.56", label: "1.56 Standard", price: 0 },
          rx: { method: "manual", od: { sph: "-1.00", cyl: "0", axis: "" }, os: { sph: "-1.25", cyl: "0", axis: "" }, pd: "61" },
        },
      })],
      subtotal: 52, total: 58.95, status: "sourcing",
      rxReview: { status: "approved", reviewedAt: now - 20 * 3600_000, reviewer: "Mira" },
      sourcing: { frameSourceUrl: "https://1688.com/example", frameCost: 14, lensSupplier: "Wenzhou Optical Co.", lensCost: 6, notes: "Frame in stock at workshop." },
      timeline: [
        { at: now - 1 * 86400000, status: "paid", message: "Payment received" },
        { at: now - 22 * 3600_000, status: "rx-pending", message: "Rx submitted" },
        { at: now - 20 * 3600_000, status: "rx-approved", message: "Prescription approved", author: "Mira" },
        { at: now - 18 * 3600_000, status: "sourcing", message: "Started sourcing frame and lenses" },
      ],
    }),
    base("ORD-RX1004", {
      createdAt: now - 3 * 86400000, name: "Daniel Park", email: "d.park@example.com",
      phone: "+82 10 4422 6611", country: "South Korea",
      address: "12 Gangnam-daero, Gangnam-gu, Seoul 06236, South Korea",
      lines: [mockLine({
        name: "Orion", color: "Gold", unitPrice: 58,
        lens: {
          type: "single-vision", label: "Single Vision · Blue-light · 1.67", priceAdd: 120,
          rxType: "single-vision", rxTypeLabel: "Single Vision",
          fn: { key: "blue", label: "Blue-light filter", price: 30 },
          thickness: { key: "1.67", label: "1.67 Ultra Thin", price: 55 },
          addon: { key: "mr-pro", label: "MR Pro coating", price: 15 },
          rx: { method: "manual", od: { sph: "-4.50", cyl: "-1.25", axis: "90" }, os: { sph: "-4.75", cyl: "-1.00", axis: "85" }, pd: "64" },
        },
      })],
      subtotal: 178, total: 184.95, status: "in-production",
      rxReview: { status: "approved", reviewedAt: now - 2 * 86400000, reviewer: "Mira" },
      sourcing: { frameCost: 17, lensCost: 28, lensSupplier: "Wenzhou Optical Co.", notes: "Lenses ordered, ETA 2 days." },
      lab: { sentToMomAt: now - 2 * 86400000, localShop: "Mira's Optical Workshop", processingFee: 10, qcNotes: "" },
      timeline: [
        { at: now - 3 * 86400000, status: "paid", message: "Payment received" },
        { at: now - 2.5 * 86400000, status: "rx-approved", message: "Rx approved" },
        { at: now - 2 * 86400000, status: "sent-to-lab", message: "Frame + lenses sent to mom" },
        { at: now - 1 * 86400000, status: "in-production", message: "Lab started edging lenses" },
      ],
    }),
    base("ORD-RX1005", {
      createdAt: now - 5 * 86400000, name: "Aisha Khan", email: "aisha.k@example.com",
      phone: "+971 50 123 4567", country: "United Arab Emirates",
      address: "Marina Plaza, Dubai Marina, Dubai, UAE",
      lines: [mockLine({
        name: "Luna", color: "Black", unitPrice: 48,
        lens: {
          type: "reading", label: "Reading · Clear · 1.61", priceAdd: 45,
          rxType: "reading", rxTypeLabel: "Reading",
          fn: { key: "clear", label: "Clear", price: 0 },
          thickness: { key: "1.61", label: "1.61 Thin", price: 35 },
          addon: { key: "premium-ar", label: "Premium AR", price: 10 },
          rx: { method: "manual", od: { sph: "+1.50", cyl: "0", axis: "" }, os: { sph: "+1.50", cyl: "0", axis: "" }, pd: "60" },
        },
      })],
      subtotal: 93, total: 99.95, status: "ready-to-ship",
      rxReview: { status: "approved", reviewedAt: now - 4 * 86400000, reviewer: "Mira" },
      sourcing: { frameCost: 15, lensCost: 12, lensSupplier: "Wenzhou Optical Co." },
      lab: { sentToMomAt: now - 4 * 86400000, localShop: "Mira's Optical Workshop", processingFee: 8, qcNotes: "Passed QC. No scratches." },
      timeline: [
        { at: now - 5 * 86400000, status: "paid", message: "Payment received" },
        { at: now - 4.5 * 86400000, status: "rx-approved", message: "Rx approved" },
        { at: now - 4 * 86400000, status: "sent-to-lab", message: "Sent to mom" },
        { at: now - 2 * 86400000, status: "in-production", message: "In production" },
        { at: now - 1 * 86400000, status: "qc", message: "Quality check" },
        { at: now - 12 * 3600_000, status: "ready-to-ship", message: "Packed, ready for Yanwen pickup" },
      ],
    }),
    base("ORD-RX1006", {
      createdAt: now - 9 * 86400000, name: "Thomas Müller", email: "t.muller@example.com",
      phone: "+49 151 2233 4455", country: "Germany",
      address: "Friedrichstraße 200, 10117 Berlin, Germany",
      lines: [mockLine({
        name: "Denzel", color: "Black", unitPrice: 40.5,
        lens: {
          type: "single-vision", label: "Single Vision · Clear · 1.56", priceAdd: 0,
          rxType: "single-vision", rxTypeLabel: "Single Vision",
          fn: { key: "clear", label: "Clear", price: 0 },
          thickness: { key: "1.56", label: "1.56 Standard", price: 0 },
          rx: { method: "manual", od: { sph: "-0.75", cyl: "0", axis: "" }, os: { sph: "-1.00", cyl: "0", axis: "" }, pd: "65" },
        },
      })],
      subtotal: 40.5, total: 47.45, status: "shipped",
      rxReview: { status: "approved", reviewedAt: now - 8 * 86400000, reviewer: "Mira" },
      sourcing: { frameCost: 12, lensCost: 4, lensSupplier: "Wenzhou Optical Co." },
      lab: { sentToMomAt: now - 8 * 86400000, localShop: "Mira's Optical Workshop", processingFee: 8, qcNotes: "OK" },
      shippingInfo: { carrier: "Yanwen", tracking: "YW123456789CN", shippedAt: now - 3 * 86400000, deliveryStatus: "In transit (Frankfurt)", trackingNotes: "Customs cleared" },
      timeline: [
        { at: now - 9 * 86400000, status: "paid", message: "Payment received" },
        { at: now - 3 * 86400000, status: "shipped", message: "Handed to Yanwen — YW123456789CN" },
      ],
    }),
  ];
  return orders;
}
