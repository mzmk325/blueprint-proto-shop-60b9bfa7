import { useSyncExternalStore } from "react";

export type FulfillmentType = "frame-only" | "non-rx" | "prescription";
export type PrescriptionStatus =
  | "none"
  | "pending"
  | "uploaded"
  | "pd-unknown"
  | "prism-review"
  | "clarification";

export type LensChoice = {
  type: "frame-only" | "non-rx" | "blue-light" | "single-vision" | "reading";
  label: string;
  priceAdd: number;
  fulfillmentType?: FulfillmentType;
  prescriptionStatus?: PrescriptionStatus;
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
    pdRight?: string;
    pdLeft?: string;
    dontKnowPd?: boolean;
    hasPrism?: boolean;
  };
};

export const FULFILLMENT_LABEL: Record<FulfillmentType, string> = {
  "frame-only": "Frame only",
  "non-rx": "Non-prescription lens",
  prescription: "Prescription lens",
};

export const RX_STATUS_LABEL: Record<PrescriptionStatus, string> = {
  none: "No prescription required",
  pending: "Pending human review",
  uploaded: "Uploaded — pending review",
  "pd-unknown": "PD unknown — pending review",
  "prism-review": "Prism — pending review",
  clarification: "Needs clarification",
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
  sourcing:             { label: "Sourcing",                   tone: "bg-blue-500/15 text-blue-800 dark:text-blue-200" },
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

// Per-fulfillment-type pipelines
export const PIPELINE: Record<FulfillmentType, OrderStatus[]> = {
  prescription: ["paid", "rx-pending", "rx-approved", "sourcing", "sent-to-lab", "in-production", "qc", "ready-to-ship", "shipped", "delivered"],
  "non-rx":     ["paid", "sourcing", "sent-to-lab", "in-production", "qc", "ready-to-ship", "shipped", "delivered"],
  "frame-only": ["paid", "sourcing", "ready-to-ship", "shipped", "delivered"],
};

export type TimelineEvent = { at: number; status?: OrderStatus; message: string; author?: string };

export type RxReview = {
  status: "pending" | "approved" | "clarification";
  notes?: string;
  reviewedAt?: number;
  reviewer?: string;
};

export type FrameSourcing = {
  platform?: string;          // 1688 / Taobao / Local supplier
  sourceUrl?: string;
  supplier?: string;
  sku?: string;
  color?: string;
  size?: string;
  costRMB?: number;
  costUSD?: number;
  domesticTracking?: string;
  status?: "not-ordered" | "ordered" | "received";
  notes?: string;
};

export type LensSourcing = {
  supplier?: string;
  fn?: string;
  index?: string;
  costRMB?: number;
  costUSD?: number;
  domesticTracking?: string;
  status?: "not-ordered" | "ordered" | "received";
  notes?: string;
};

// Backwards-compatible aggregate Sourcing (legacy reads still work)
export type Sourcing = {
  frame?: FrameSourcing;
  lens?: LensSourcing;
  // legacy flat fields
  frameSourceUrl?: string;
  frameCost?: number;
  lensSupplier?: string;
  lensCost?: number;
  notes?: string;
};

export type QcChecklist = {
  frameModel?: boolean;
  frameColor?: boolean;
  lensFunction?: boolean;
  lensThickness?: boolean;
  rxChecked?: boolean;
  pdChecked?: boolean;
  noScratches?: boolean;
  hingesAlignment?: boolean;
  packingPhoto?: boolean;
  readyToShip?: boolean;
  // legacy keys kept for back-compat with previously saved orders
  frameMatches?: boolean;
  lensMatches?: boolean;
};

export type QcResult = "pass" | "remake" | "needs-customer-confirm";

export type LabInfo = {
  sentToMomAt?: number;
  momReceivedAt?: number;
  localShop?: string;
  sentToShopAt?: number;
  expectedCompletionAt?: number;
  processingFeeRMB?: number;
  processingFeeUSD?: number;
  productionStatus?: "not-started" | "in-progress" | "completed";
  qcPhotoName?: string;
  qcNotes?: string;
  qcChecklist?: QcChecklist;
  qcResult?: QcResult;
  // legacy
  processingFee?: number;
};

export type ShippingInfo = {
  carrier?: "Yanwen" | "4PX" | "China Post" | "Other" | string;
  tracking?: string;
  trackingUrl?: string;
  weightG?: number;
  costRMB?: number;
  costUSD?: number;
  labelCreatedAt?: number;
  shippedAt?: number;
  etaStart?: number;
  etaEnd?: number;
  deliveredAt?: number;
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
  shipping: string;
  shippingCost: number;
  subtotal: number;
  total: number;
  lines: CartLine[];
  status: OrderStatus;
  tracking?: string;
  notes?: string;
  rxReview?: RxReview;
  sourcing?: Sourcing;
  lab?: LabInfo;
  shippingInfo?: ShippingInfo;
  // Margin
  exchangeRate?: number;       // RMB per USD, default 7.2
  intlShippingCost?: number;   // legacy USD
  packagingCost?: number;      // legacy USD
  packagingRMB?: number;
  paymentFee?: number;
  defectReserveUSD?: number;
  customerNotes?: string;
  internalNotes?: string;
  timeline?: TimelineEvent[];
};

type State = { lines: CartLine[]; orders: Order[] };

const KEY = "mv-cart-v3";
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
    const ft = state.lines[0] ? getFulfillmentType(state.lines[0].lens) : "prescription";
    const initial: OrderStatus = ft === "prescription" ? "rx-pending" : "sourcing";
    const order: Order = {
      ...o, id, createdAt: Date.now(),
      status: initial,
      lines: state.lines,
      rxReview: ft === "prescription" ? { status: "pending" } : undefined,
      sourcing: { frame: {}, lens: {} }, lab: { qcChecklist: {} }, shippingInfo: {},
      exchangeRate: 7.2,
      timeline: [
        { at: Date.now(), status: "paid", message: "Payment received" },
        { at: Date.now(), status: initial, message: ft === "prescription" ? "Prescription submitted for review" : "Order entered sourcing queue" },
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

export function getFulfillmentType(l: LensChoice): FulfillmentType {
  if (l.fulfillmentType) return l.fulfillmentType;
  if (l.rxType === "frame-only" || l.type === "frame-only") return "frame-only";
  if (l.rxType === "non-rx" || l.type === "non-rx") return "non-rx";
  return "prescription";
}
export function getPrescriptionStatus(l: LensChoice): PrescriptionStatus {
  if (l.prescriptionStatus) return l.prescriptionStatus;
  const ft = getFulfillmentType(l);
  if (ft !== "prescription") return "none";
  if (l.rx?.hasPrism) return "prism-review";
  if (l.rx?.dontKnowPd) return "pd-unknown";
  if (l.rx?.method === "upload") return "uploaded";
  return "pending";
}

export function orderFulfillmentType(o: Order): FulfillmentType {
  return o.lines[0] ? getFulfillmentType(o.lines[0].lens) : "prescription";
}

// ── Risks / alerts ───────────────────────────────────────────────────────────
export type Risk = { level: "warn" | "danger"; message: string };

export function computeRisks(o: Order): Risk[] {
  const risks: Risk[] = [];
  const ft = orderFulfillmentType(o);
  const rx = o.lines[0]?.lens.rx;

  if (ft === "prescription" && rx) {
    if (!rx.pd && !rx.dontKnowPd && !rx.pdRight && !rx.pdLeft) {
      risks.push({ level: "danger", message: "PD missing — required for lens cutting." });
    } else if (rx.dontKnowPd) {
      risks.push({ level: "warn", message: "PD unknown — measure from photo or contact customer." });
    }
    const checkAxis = (eye?: { cyl: string; axis: string }) =>
      eye && eye.cyl && eye.cyl !== "None" && parseFloat(eye.cyl) !== 0 && !eye.axis;
    if (checkAxis(rx.od) || checkAxis(rx.os)) {
      risks.push({ level: "danger", message: "Axis missing while CYL is present." });
    }
    if (rx.hasPrism) {
      risks.push({ level: "warn", message: "Prism prescription — requires manual lab review." });
    }
    if (rx.method === "upload" && o.status === "rx-pending") {
      risks.push({ level: "warn", message: "Uploaded Rx awaiting optician verification." });
    }
    const sphMax = Math.max(
      Math.abs(parseFloat(rx.od?.sph ?? "0") || 0),
      Math.abs(parseFloat(rx.os?.sph ?? "0") || 0),
    );
    if (sphMax >= 4 && o.lines[0]?.lens.thickness?.key === "1.56") {
      risks.push({ level: "warn", message: "Strong prescription — consider thinner 1.67/1.74 lens." });
    }
  }
  if (!o.address || o.address.length < 10) {
    risks.push({ level: "danger", message: "Shipping address looks incomplete." });
  }
  if (o.status === "rx-pending") {
    const hoursWaiting = (Date.now() - o.createdAt) / 3600_000;
    if (hoursWaiting > 4) risks.push({ level: "warn", message: `Rx awaiting review for ${Math.round(hoursWaiting)}h.` });
  }
  if (o.status === "rx-clarification") {
    risks.push({ level: "danger", message: "Customer reply needed — order on hold." });
  }
  if (o.status === "sent-to-lab" && !o.lab?.expectedCompletionAt) {
    risks.push({ level: "warn", message: "No expected completion date set with local lab." });
  }
  if (o.status === "in-production" && !o.lab?.momReceivedAt) {
    risks.push({ level: "warn", message: "Mom hasn't confirmed receipt of frame/lenses yet." });
  }
  if (o.status === "qc") {
    if (!o.lab?.qcPhotoName) risks.push({ level: "warn", message: "QC photo not uploaded yet." });
    const cl = o.lab?.qcChecklist ?? {};
    const required: (keyof QcChecklist)[] = [
      "frameModel", "frameColor", "lensFunction",
      ...(ft !== "frame-only" ? (["lensThickness"] as (keyof QcChecklist)[]) : []),
      ...(ft === "prescription" ? (["rxChecked", "pdChecked"] as (keyof QcChecklist)[]) : []),
      "noScratches", "hingesAlignment", "packingPhoto",
    ];
    const missing = required.filter((k) => !cl[k]).length;
    if (missing > 0) risks.push({ level: "warn", message: `QC checklist incomplete (${missing} item${missing > 1 ? "s" : ""} pending).` });
    if (o.lab?.qcResult === "remake") risks.push({ level: "danger", message: "QC flagged remake — production restart required." });
    if (o.lab?.qcResult === "needs-customer-confirm") risks.push({ level: "warn", message: "QC needs customer confirmation before shipping." });
  }
  if ((o.status === "ready-to-ship" || o.status === "shipped") && !o.shippingInfo?.tracking) {
    risks.push({ level: "danger", message: "Tracking number missing." });
  }
  if (o.status === "ready-to-ship" && !o.shippingInfo?.weightG) {
    risks.push({ level: "warn", message: "Package weight not recorded — needed for Yanwen label." });
  }
  if (o.status === "shipped" && o.shippingInfo?.tracking && !o.shippingInfo?.shippedAt) {
    risks.push({ level: "warn", message: "Tracking entered but ship date not set." });
  }
  if (o.status === "shipped" && o.shippingInfo?.shippedAt) {
    const daysSinceShip = (Date.now() - o.shippingInfo.shippedAt) / 86400_000;
    if (daysSinceShip > 21) risks.push({ level: "warn", message: `Shipped ${Math.round(daysSinceShip)}d ago — possible delivery delay, check tracking.` });
  }
  if (o.status === "sourcing") {
    const fc = o.sourcing?.frame?.costRMB ?? o.sourcing?.frame?.costUSD ?? o.sourcing?.frameCost;
    if (!fc) risks.push({ level: "warn", message: "Frame sourcing info incomplete." });
    if (ft !== "frame-only") {
      const lc = o.sourcing?.lens?.costRMB ?? o.sourcing?.lens?.costUSD ?? o.sourcing?.lensCost;
      if (!lc) risks.push({ level: "warn", message: "Lens sourcing info incomplete." });
    }
  }
  const m = estimateMargin(o);
  if (m.marginPct < 35 && o.total > 0) {
    risks.push({ level: "warn", message: `Margin ${m.marginPct}% below 35% target.` });
  }
  return risks;
}

// ── Next action ──────────────────────────────────────────────────────────────
export function nextAction(o: Order): { label: string; nextStatus?: OrderStatus } {
  const ft = orderFulfillmentType(o);
  switch (o.status) {
    case "paid":
      return ft === "prescription"
        ? { label: "Review prescription", nextStatus: "rx-pending" }
        : { label: "Start sourcing", nextStatus: "sourcing" };
    case "rx-pending":          return { label: "Review prescription" };
    case "rx-clarification":    return { label: "Contact customer" };
    case "rx-approved":         return { label: "Start frame & lens sourcing", nextStatus: "sourcing" };
    case "sourcing":            return ft === "frame-only"
      ? { label: "Mark frame ready & ship", nextStatus: "ready-to-ship" }
      : { label: "Send to local lab", nextStatus: "sent-to-lab" };
    case "sent-to-lab":         return { label: "Follow up with optical shop" };
    case "in-production":       return { label: "Prepare quality check", nextStatus: "qc" };
    case "qc":                  return { label: "Upload QC photo & approve", nextStatus: "ready-to-ship" };
    case "ready-to-ship":       return { label: "Create Yanwen label & enter tracking", nextStatus: "shipped" };
    case "shipped":             return { label: "Monitor delivery", nextStatus: "delivered" };
    case "delivered":           return { label: "Close order" };
    case "after-sale":          return { label: "Resolve after-sale" };
  }
}

// ── Margin estimation (RMB + USD) ────────────────────────────────────────────
export function estimateMargin(o: Order) {
  const rate = o.exchangeRate ?? 7.2;
  const ft = orderFulfillmentType(o);

  const rmbToUsd = (rmb?: number, usd?: number) => usd ?? (rmb ? rmb / rate : 0);

  // Defaults from line prices if nothing entered
  const fallbackFrame = round2(o.lines.reduce((s, l) => s + l.unitPrice * 0.3 * l.qty, 0));
  const fallbackLens = round2(o.lines.reduce((s, l) => s + l.lens.priceAdd * 0.35 * l.qty, 0));

  const frameRMB = o.sourcing?.frame?.costRMB ?? (o.sourcing?.frameCost ? o.sourcing.frameCost * rate : undefined);
  const frameUSD = round2(rmbToUsd(frameRMB, o.sourcing?.frame?.costUSD ?? o.sourcing?.frameCost) || fallbackFrame);

  const lensRMB = ft === "frame-only" ? 0 : (o.sourcing?.lens?.costRMB ?? (o.sourcing?.lensCost ? o.sourcing.lensCost * rate : undefined));
  const lensUSD = ft === "frame-only" ? 0 : round2(rmbToUsd(lensRMB, o.sourcing?.lens?.costUSD ?? o.sourcing?.lensCost) || fallbackLens);

  const processingRMB = ft === "frame-only" ? 0 : (o.lab?.processingFeeRMB ?? (o.lab?.processingFee ? o.lab.processingFee * rate : undefined));
  const processingUSD = ft === "frame-only" ? 0 : round2(rmbToUsd(processingRMB, o.lab?.processingFeeUSD ?? o.lab?.processingFee) || 8);

  const packagingRMB = o.packagingRMB;
  const packagingUSD = round2(rmbToUsd(packagingRMB, o.packagingCost) || 2);

  const intlRMB = o.shippingInfo?.costRMB;
  const intlUSD = round2(rmbToUsd(intlRMB, o.shippingInfo?.costUSD ?? o.intlShippingCost) || 12);

  const paymentFee = o.paymentFee ?? round2(o.total * 0.029 + 0.3);
  const defectReserve = o.defectReserveUSD ?? round2(o.total * 0.02);

  const totalCost = round2(frameUSD + lensUSD + processingUSD + packagingUSD + intlUSD + paymentFee + defectReserve);
  const gross = round2(o.total - totalCost);
  const marginPct = o.total > 0 ? round2((gross / o.total) * 100) : 0;

  return {
    rate, ft,
    frameCost: frameUSD, frameCostRMB: round2(frameRMB ?? frameUSD * rate),
    lensCost: lensUSD,   lensCostRMB: round2(lensRMB ?? lensUSD * rate),
    processingFee: processingUSD, processingFeeRMB: round2(processingRMB ?? processingUSD * rate),
    packagingCost: packagingUSD, packagingRMB: round2(packagingRMB ?? packagingUSD * rate),
    intlShipping: intlUSD, intlShippingRMB: round2(intlRMB ?? intlUSD * rate),
    paymentFee, defectReserve,
    totalCost, gross, marginPct,
  };
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
    sourcing: { frame: {}, lens: {} }, lab: { qcChecklist: {} }, shippingInfo: {},
    exchangeRate: 7.2,
    ...over,
  });

  const orders: Order[] = [
    // 1. Prescription · pending Rx review
    base("ORD-RX1001", {
      createdAt: now - 2 * 3600_000, name: "Emma Larsen", email: "emma.l@example.com",
      phone: "+47 412 88 901", country: "Norway",
      address: "Storgata 14, 0184 Oslo, Norway",
      lines: [mockLine({
        name: "Jace", color: "Clear", unitPrice: 38.25,
        lens: {
          type: "single-vision", label: "Single Vision · Blue-light · 1.61", priceAdd: 78,
          fulfillmentType: "prescription", rxType: "single-vision", rxTypeLabel: "Single Vision",
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
    // 2. Prescription · PD missing / clarification
    base("ORD-RX1002", {
      createdAt: now - 6 * 3600_000, name: "Lucas Ferreira", email: "lucas.f@example.com",
      phone: "+55 11 99888 4421", country: "Brazil",
      address: "Av. Paulista 1200, São Paulo, SP 01310-100, Brazil",
      lines: [mockLine({
        name: "Athina", color: "Pink", unitPrice: 45,
        lens: {
          type: "single-vision", label: "Single Vision · Photochromic · 1.67", priceAdd: 145,
          fulfillmentType: "prescription", rxType: "single-vision", rxTypeLabel: "Single Vision",
          fn: { key: "photo", label: "Photochromic", price: 75 },
          thickness: { key: "1.67", label: "1.67 Ultra Thin", price: 55 },
          addon: { key: "mr-pro", label: "MR Pro coating", price: 15 },
          rx: { method: "upload", fileName: "rx-lucas.jpg", dontKnowPd: true, od: { sph: "-3.50", cyl: "-1.00", axis: "90" }, os: { sph: "-3.25", cyl: "-1.25", axis: "85" } },
        },
      })],
      subtotal: 190, total: 196.95, status: "rx-clarification",
      rxReview: { status: "clarification", notes: "Uploaded image is blurry — PD not legible. Asked customer for clearer photo.", reviewedAt: now - 4 * 3600_000, reviewer: "Mira" },
      timeline: [
        { at: now - 6 * 3600_000, status: "paid", message: "Payment received" },
        { at: now - 6 * 3600_000 + 60_000, status: "rx-pending", message: "Rx submitted (upload)" },
        { at: now - 4 * 3600_000, status: "rx-clarification", message: "Requested PD measurement", author: "Mira" },
      ],
    }),
    // 3. Prescription · approved, waiting sourcing
    base("ORD-RX1003", {
      createdAt: now - 1 * 86400000, name: "Sofia Bianchi", email: "sofia.b@example.com",
      phone: "+39 333 555 7788", country: "Italy",
      address: "Via Roma 45, 20121 Milano, Italy",
      lines: [mockLine({
        name: "Mira", color: "Tortoise", unitPrice: 52,
        lens: {
          type: "single-vision", label: "Single Vision · Clear · 1.56", priceAdd: 0,
          fulfillmentType: "prescription", rxType: "single-vision", rxTypeLabel: "Single Vision",
          fn: { key: "clear", label: "Clear", price: 0 },
          thickness: { key: "1.56", label: "1.56 Standard", price: 0 },
          rx: { method: "manual", od: { sph: "-1.00", cyl: "0", axis: "" }, os: { sph: "-1.25", cyl: "0", axis: "" }, pd: "61" },
        },
      })],
      subtotal: 52, total: 58.95, status: "rx-approved",
      rxReview: { status: "approved", reviewedAt: now - 20 * 3600_000, reviewer: "Mira" },
      sourcing: { frame: { status: "not-ordered" }, lens: { status: "not-ordered" } },
      timeline: [
        { at: now - 1 * 86400000, status: "paid", message: "Payment received" },
        { at: now - 22 * 3600_000, status: "rx-pending", message: "Rx submitted" },
        { at: now - 20 * 3600_000, status: "rx-approved", message: "Prescription approved", author: "Mira" },
      ],
    }),
    // 4. Prescription · sent to local lab
    base("ORD-RX1004", {
      createdAt: now - 3 * 86400000, name: "Daniel Park", email: "d.park@example.com",
      phone: "+82 10 4422 6611", country: "South Korea",
      address: "12 Gangnam-daero, Gangnam-gu, Seoul 06236, South Korea",
      lines: [mockLine({
        name: "Orion", color: "Gold", unitPrice: 58,
        lens: {
          type: "single-vision", label: "Single Vision · Blue-light · 1.67", priceAdd: 120,
          fulfillmentType: "prescription", rxType: "single-vision", rxTypeLabel: "Single Vision",
          fn: { key: "blue", label: "Blue-light filter", price: 30 },
          thickness: { key: "1.67", label: "1.67 Ultra Thin", price: 55 },
          addon: { key: "mr-pro", label: "MR Pro coating", price: 15 },
          rx: { method: "manual", od: { sph: "-4.50", cyl: "-1.25", axis: "90" }, os: { sph: "-4.75", cyl: "-1.00", axis: "85" }, pd: "64" },
        },
      })],
      subtotal: 178, total: 184.95, status: "sent-to-lab",
      rxReview: { status: "approved", reviewedAt: now - 2.5 * 86400000, reviewer: "Mira" },
      sourcing: {
        frame: { platform: "1688", sourceUrl: "https://1688.com/item/orion-gold", supplier: "Wenzhou Frame Co.", sku: "ORN-GLD-52", color: "Gold", size: "52-18-145", costRMB: 95, domesticTracking: "SF1029384756", status: "received" },
        lens:  { supplier: "Wenzhou Optical Co.", fn: "Blue-light", index: "1.67", costRMB: 180, domesticTracking: "YT8273645", status: "received" },
      },
      lab: { sentToMomAt: now - 2 * 86400000, momReceivedAt: now - 1.5 * 86400000, localShop: "Hangzhou Bright Optical", sentToShopAt: now - 1 * 86400000, expectedCompletionAt: now + 1 * 86400000, processingFeeRMB: 60, productionStatus: "in-progress", qcChecklist: {} },
      timeline: [
        { at: now - 3 * 86400000, status: "paid", message: "Payment received" },
        { at: now - 2.5 * 86400000, status: "rx-approved", message: "Rx approved" },
        { at: now - 2 * 86400000, status: "sent-to-lab", message: "Frame + lenses sent to mom" },
      ],
    }),
    // 5. Prescription · quality check
    base("ORD-RX1005", {
      createdAt: now - 5 * 86400000, name: "Aisha Khan", email: "aisha.k@example.com",
      phone: "+971 50 123 4567", country: "United Arab Emirates",
      address: "Marina Plaza, Dubai Marina, Dubai, UAE",
      lines: [mockLine({
        name: "Luna", color: "Black", unitPrice: 48,
        lens: {
          type: "reading", label: "Reading · Clear · 1.61", priceAdd: 45,
          fulfillmentType: "prescription", rxType: "reading", rxTypeLabel: "Reading",
          fn: { key: "clear", label: "Clear", price: 0 },
          thickness: { key: "1.61", label: "1.61 Thin", price: 35 },
          addon: { key: "premium-ar", label: "Premium AR", price: 10 },
          rx: { method: "manual", od: { sph: "+1.50", cyl: "0", axis: "" }, os: { sph: "+1.50", cyl: "0", axis: "" }, pd: "60" },
        },
      })],
      subtotal: 93, total: 99.95, status: "qc",
      rxReview: { status: "approved", reviewedAt: now - 4 * 86400000, reviewer: "Mira" },
      sourcing: {
        frame: { platform: "Taobao", supplier: "Luna Acetate Studio", sku: "LUN-BLK-50", color: "Black", costRMB: 105, status: "received" },
        lens:  { supplier: "Wenzhou Optical Co.", fn: "Clear", index: "1.61", costRMB: 90, status: "received" },
      },
      lab: { sentToMomAt: now - 4 * 86400000, momReceivedAt: now - 3.5 * 86400000, localShop: "Hangzhou Bright Optical", sentToShopAt: now - 3 * 86400000, processingFeeRMB: 55, productionStatus: "completed", qcNotes: "Awaiting final QC photo upload.", qcChecklist: { frameMatches: true, lensMatches: true, rxChecked: true } },
      timeline: [
        { at: now - 5 * 86400000, status: "paid", message: "Payment received" },
        { at: now - 4.5 * 86400000, status: "rx-approved", message: "Rx approved" },
        { at: now - 4 * 86400000, status: "sent-to-lab", message: "Sent to mom" },
        { at: now - 2 * 86400000, status: "in-production", message: "In production" },
        { at: now - 12 * 3600_000, status: "qc", message: "Awaiting QC photo" },
      ],
    }),
    // 6. Non-prescription · in production
    base("ORD-NR2001", {
      createdAt: now - 2 * 86400000, name: "Marcus Berg", email: "marcus.b@example.com",
      phone: "+46 70 111 2233", country: "Sweden",
      address: "Drottninggatan 35, 111 51 Stockholm, Sweden",
      lines: [mockLine({
        name: "Atlas", color: "Matte Black", unitPrice: 55,
        lens: {
          type: "non-rx", label: "Non-prescription · Blue-light · 1.56", priceAdd: 30,
          fulfillmentType: "non-rx", rxType: "non-rx", rxTypeLabel: "Non-prescription",
          fn: { key: "blue", label: "Blue-light filter", price: 30 },
          thickness: { key: "1.56", label: "1.56 Standard", price: 0 },
        },
      })],
      subtotal: 85, total: 91.95, status: "in-production",
      sourcing: {
        frame: { platform: "1688", supplier: "Atlas Eyewear Factory", sku: "ATL-MB-54", color: "Matte Black", costRMB: 88, status: "received" },
        lens:  { supplier: "Wenzhou Optical Co.", fn: "Blue-light", index: "1.56", costRMB: 35, status: "received" },
      },
      lab: { sentToMomAt: now - 1.5 * 86400000, momReceivedAt: now - 1 * 86400000, localShop: "Hangzhou Bright Optical", sentToShopAt: now - 20 * 3600_000, processingFeeRMB: 45, productionStatus: "in-progress", qcChecklist: {} },
      timeline: [
        { at: now - 2 * 86400000, status: "paid", message: "Payment received" },
        { at: now - 1.8 * 86400000, status: "sourcing", message: "Started sourcing (no Rx)" },
        { at: now - 1.5 * 86400000, status: "sent-to-lab", message: "Sent to mom" },
        { at: now - 20 * 3600_000, status: "in-production", message: "Lab cutting lenses" },
      ],
    }),
    // 7. Frame only · ready to ship
    base("ORD-FO3001", {
      createdAt: now - 1.5 * 86400000, name: "Hannah Schultz", email: "hannah.s@example.com",
      phone: "+49 160 8877 3322", country: "Germany",
      address: "Kantstraße 22, 10623 Berlin, Germany",
      lines: [mockLine({
        name: "Denzel", color: "Tortoise", unitPrice: 65,
        lens: {
          type: "frame-only", label: "Frame only (demo lenses)", priceAdd: 0,
          fulfillmentType: "frame-only", rxType: "frame-only", rxTypeLabel: "Frame only",
        },
      })],
      subtotal: 65, total: 71.95, status: "ready-to-ship",
      sourcing: {
        frame: { platform: "1688", sourceUrl: "https://1688.com/item/denzel-tort", supplier: "Denzel Acetate", sku: "DNZ-TRT-52", color: "Tortoise", costRMB: 78, domesticTracking: "JD192837465", status: "received" },
        lens: {},
      },
      shippingInfo: { carrier: "Yanwen", weightG: 180, costRMB: 38, labelCreatedAt: now - 4 * 3600_000 },
      timeline: [
        { at: now - 1.5 * 86400000, status: "paid", message: "Payment received (frame only)" },
        { at: now - 1.3 * 86400000, status: "sourcing", message: "Frame ordered from supplier" },
        { at: now - 6 * 3600_000, status: "ready-to-ship", message: "Frame packed, awaiting Yanwen pickup" },
      ],
    }),
    // 8. Shipped with Yanwen tracking
    base("ORD-RX1006", {
      createdAt: now - 9 * 86400000, name: "Thomas Müller", email: "t.muller@example.com",
      phone: "+49 151 2233 4455", country: "Germany",
      address: "Friedrichstraße 200, 10117 Berlin, Germany",
      lines: [mockLine({
        name: "Denzel", color: "Black", unitPrice: 40.5,
        lens: {
          type: "single-vision", label: "Single Vision · Clear · 1.56", priceAdd: 0,
          fulfillmentType: "prescription", rxType: "single-vision", rxTypeLabel: "Single Vision",
          fn: { key: "clear", label: "Clear", price: 0 },
          thickness: { key: "1.56", label: "1.56 Standard", price: 0 },
          rx: { method: "manual", od: { sph: "-0.75", cyl: "0", axis: "" }, os: { sph: "-1.00", cyl: "0", axis: "" }, pd: "65" },
        },
      })],
      subtotal: 40.5, total: 47.45, status: "shipped",
      rxReview: { status: "approved", reviewedAt: now - 8 * 86400000, reviewer: "Mira" },
      sourcing: {
        frame: { platform: "1688", supplier: "Denzel Acetate", sku: "DNZ-BLK-50", color: "Black", costRMB: 70, status: "received" },
        lens:  { supplier: "Wenzhou Optical Co.", fn: "Clear", index: "1.56", costRMB: 28, status: "received" },
      },
      lab: { sentToMomAt: now - 7 * 86400000, momReceivedAt: now - 6.5 * 86400000, localShop: "Hangzhou Bright Optical", processingFeeRMB: 50, productionStatus: "completed", qcChecklist: { frameMatches: true, lensMatches: true, rxChecked: true, noScratches: true, packingPhoto: true, readyToShip: true }, qcNotes: "OK" },
      shippingInfo: { carrier: "Yanwen", tracking: "YW123456789CN", trackingUrl: "https://track.yw56.com.cn/YW123456789CN", weightG: 220, costRMB: 42, labelCreatedAt: now - 4 * 86400000, shippedAt: now - 3 * 86400000, etaStart: now + 6 * 86400000, etaEnd: now + 12 * 86400000, deliveryStatus: "In transit (Frankfurt)", trackingNotes: "Customs cleared" },
      timeline: [
        { at: now - 9 * 86400000, status: "paid", message: "Payment received" },
        { at: now - 3 * 86400000, status: "shipped", message: "Handed to Yanwen — YW123456789CN" },
      ],
    }),
  ];
  return orders;
}
