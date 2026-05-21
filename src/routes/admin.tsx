import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useCart, cart, estimateMargin,
  STATUS_META, STATUS_ORDER, PIPELINE,
  FULFILLMENT_LABEL,
  orderFulfillmentType, computeRisks, nextAction,
  type Order, type OrderStatus, type FulfillmentType,
} from "@/lib/cart-store";
import {
  LayoutDashboard, Package, Eye, ArrowLeft, RotateCcw, Search,
  CircleDollarSign, Truck, Factory, ClipboardCheck, AlertCircle, Clock,
  TrendingUp, CheckCircle2, MessageSquare, Copy, ShieldAlert, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Operations — MIRAVUE Admin" }] }),
  component: AdminApp,
});

// ── Helpers ─────────────────────────────────────────────────────────────────
const FT_BADGE: Record<FulfillmentType, string> = {
  "frame-only": "bg-slate-500/15 text-slate-700 dark:text-slate-200",
  "non-rx":     "bg-sky-500/15 text-sky-800 dark:text-sky-200",
  prescription: "bg-violet-500/15 text-violet-800 dark:text-violet-200",
};

function FtBadge({ ft }: { ft: FulfillmentType }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${FT_BADGE[ft]}`}>{FULFILLMENT_LABEL[ft]}</span>;
}

const FILTERS: { key: string; label: string; match: (o: Order) => boolean }[] = [
  { key: "all",              label: "All",                  match: () => true },
  { key: "ft-frame-only",    label: "Frame only",           match: (o) => orderFulfillmentType(o) === "frame-only" },
  { key: "ft-non-rx",        label: "Non-prescription",     match: (o) => orderFulfillmentType(o) === "non-rx" },
  { key: "ft-prescription",  label: "Prescription",         match: (o) => orderFulfillmentType(o) === "prescription" },
  { key: "rx-pending",       label: "Pending Rx review",    match: (o) => o.status === "rx-pending" },
  { key: "rx-clarification", label: "Need clarification",   match: (o) => o.status === "rx-clarification" },
  { key: "sourcing",         label: "Sourcing",             match: (o) => o.status === "rx-approved" || o.status === "sourcing" },
  { key: "production",       label: "In production",        match: (o) => ["sent-to-lab","in-production"].includes(o.status) },
  { key: "qc",               label: "Quality check",        match: (o) => o.status === "qc" },
  { key: "ready",            label: "Ready to ship",        match: (o) => o.status === "ready-to-ship" },
  { key: "shipped",          label: "Shipped",              match: (o) => o.status === "shipped" || o.status === "delivered" },
  { key: "after-sale",       label: "After-sale",           match: (o) => o.status === "after-sale" },
];

function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${m.tone}`}>{m.label}</span>;
}

function money(n: number) { return "$" + n.toFixed(2); }
function rmb(n: number) { return "¥" + n.toFixed(2); }
function fmtDate(t?: number) { return t ? new Date(t).toLocaleString() : "—"; }
function fmtShort(t?: number) { return t ? new Date(t).toLocaleDateString() : "—"; }

function copy(text: string, label = "Copied") {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => toast.success(label));
  }
}

// ── Root ────────────────────────────────────────────────────────────────────
function AdminApp() {
  const { orders } = useCart();
  const [view, setView] = useState<"dashboard" | "orders">("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = orders.find((o) => o.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <Sidebar view={view} onView={(v) => { setView(v); setSelectedId(null); }} />
      <main className="md:pl-60">
        <Topbar />
        <div className="px-6 py-6 max-w-[1400px] mx-auto">
          {selected ? (
            <OrderDetail order={selected} onBack={() => setSelectedId(null)} />
          ) : view === "dashboard" ? (
            <Dashboard orders={orders} onOpen={(id) => setSelectedId(id)} onJump={() => setView("orders")} />
          ) : (
            <OrdersList orders={orders} onOpen={(id) => setSelectedId(id)} />
          )}
        </div>
      </main>
    </div>
  );
}

// ── Chrome ──────────────────────────────────────────────────────────────────
function Sidebar({ view, onView }: { view: string; onView: (v: "dashboard" | "orders") => void }) {
  const item = "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors";
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 bg-background border-r border-border flex-col">
      <div className="px-5 h-16 flex items-center border-b border-border">
        <span className="font-semibold tracking-tight">MIRAVUE <span className="text-muted-foreground font-normal">Ops</span></span>
      </div>
      <nav className="p-3 space-y-1">
        <button onClick={() => onView("dashboard")} className={`${item} w-full ${view === "dashboard" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"}`}>
          <LayoutDashboard className="size-4" /> Dashboard
        </button>
        <button onClick={() => onView("orders")} className={`${item} w-full ${view === "orders" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"}`}>
          <Package className="size-4" /> Orders
        </button>
      </nav>
      <div className="mt-auto p-3 border-t border-border">
        <button onClick={() => { if (confirm("Reset all mock orders?")) cart.resetMock(); }} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <RotateCcw className="size-3.5" /> Reset mock data
        </button>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <div className="h-16 bg-background border-b border-border flex items-center justify-between px-6 md:pl-6">
      <div className="text-sm text-muted-foreground">Eyewear order operations</div>
      <div className="flex items-center gap-4">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">↗ View store</Link>
        <div className="size-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">M</div>
      </div>
    </div>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ orders, onOpen, onJump }: { orders: Order[]; onOpen: (id: string) => void; onJump: () => void }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = Date.now() - 7 * 86400_000;
  const stats = useMemo(() => {
    const todayCount = orders.filter((o) => o.createdAt >= today.getTime()).length;
    const pendingRx = orders.filter((o) => o.status === "rx-pending").length;
    const ready = orders.filter((o) => o.status === "ready-to-ship").length;
    const shippedWeek = orders.filter((o) => o.status === "shipped" && (o.shippingInfo?.shippedAt ?? 0) >= weekAgo).length;
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const profit = orders.reduce((s, o) => s + estimateMargin(o).gross, 0);
    const aov = orders.length ? revenue / orders.length : 0;
    return { todayCount, pendingRx, ready, shippedWeek, revenue, profit, aov };
  }, [orders]);

  const cards = [
    { label: "Orders today",            value: stats.todayCount,         icon: Package,        tone: "text-blue-600" },
    { label: "Estimated revenue",       value: money(stats.revenue),     icon: CircleDollarSign, tone: "text-emerald-600" },
    { label: "Estimated gross profit",  value: money(stats.profit),      icon: TrendingUp,     tone: "text-emerald-700" },
    { label: "Average order value",     value: money(stats.aov),         icon: CheckCircle2,   tone: "text-slate-600" },
  ];

  // Today's work queue groups
  const queues = [
    { key: "rx-review",   title: "Prescription Review", icon: ClipboardCheck, tone: "text-amber-700", match: (o: Order) => o.status === "rx-pending" },
    { key: "follow-up",   title: "Customer Follow-up",  icon: AlertCircle,    tone: "text-red-700",   match: (o: Order) => o.status === "rx-clarification" || computeRisks(o).some((r) => r.level === "danger" && /address|PD missing|Axis/.test(r.message)) },
    { key: "sourcing",    title: "Sourcing",            icon: Package,        tone: "text-blue-700",  match: (o: Order) => o.status === "rx-approved" || o.status === "sourcing" },
    { key: "production",  title: "Production Follow-up",icon: Factory,        tone: "text-purple-700",match: (o: Order) => o.status === "sent-to-lab" || o.status === "in-production" },
    { key: "qc",          title: "Quality Check",       icon: ShieldAlert,    tone: "text-fuchsia-700",match: (o: Order) => o.status === "qc" },
    { key: "ship",        title: "Ready to Ship",       icon: Truck,          tone: "text-teal-700",  match: (o: Order) => o.status === "ready-to-ship" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, Mira 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Here&apos;s today&apos;s work queue across the workshop.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{c.label}</span>
              <c.icon className={`size-4 ${c.tone}`} />
            </div>
            <div className="text-2xl font-semibold mt-2">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Today&apos;s work queue</h2>
        <button onClick={onJump} className="text-xs text-muted-foreground hover:text-foreground">View all orders →</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {queues.map((q) => {
          const items = orders.filter(q.match).slice(0, 6);
          return (
            <div key={q.key} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <q.icon className={`size-4 ${q.tone}`} />
                  <span className="text-sm font-semibold">{q.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              {items.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">All clear.</div>
              ) : (
                <div className="divide-y divide-border">
                  {items.map((o) => {
                    const ft = orderFulfillmentType(o);
                    const na = nextAction(o);
                    return (
                      <button key={o.id} onClick={() => onOpen(o.id)} className="w-full text-left p-3 hover:bg-secondary/40 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{o.name} <span className="text-muted-foreground font-mono text-xs">· {o.id}</span></div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                              <FtBadge ft={ft} />
                              <StatusBadge status={o.status} />
                            </div>
                          </div>
                          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                        </div>
                        <div className="mt-2 text-xs text-foreground bg-secondary/60 rounded px-2 py-1 inline-block">
                          → {na.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Orders list ─────────────────────────────────────────────────────────────
function OrdersList({ orders, onOpen }: { orders: Order[]; onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const active = FILTERS.find((f) => f.key === filter)!;
  const filtered = orders
    .filter(active.match)
    .filter((o) => !q || (o.name + o.id + o.email + (o.country ?? "")).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">{filtered.length} of {orders.length}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const count = orders.filter(f.match).length;
          const isActive = filter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${isActive ? "bg-foreground text-background border-foreground" : "bg-background border-border hover:bg-secondary"}`}>
              {f.label} <span className="opacity-60">· {count}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-3 border-b border-border flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by order, customer, email, country…" className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <Th>Order</Th><Th>Customer</Th><Th>Country</Th><Th>Type</Th>
                <Th>Frame</Th><Th>Lens</Th>
                <Th className="text-right">Paid</Th><Th>Rx</Th><Th>Production</Th><Th>Shipping</Th>
                <Th>Next action</Th>
                <Th className="text-right">Margin</Th><Th>Created</Th><Th></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o) => {
                const m = estimateMargin(o);
                const l = o.lines[0];
                const ft = orderFulfillmentType(o);
                const na = nextAction(o);
                return (
                  <tr key={o.id} className="hover:bg-secondary/30 transition-colors">
                    <Td className="font-mono text-xs">{o.id}</Td>
                    <Td>
                      <div className="font-medium">{o.name}</div>
                      <div className="text-xs text-muted-foreground">{o.email}</div>
                    </Td>
                    <Td className="text-xs">{o.country ?? "—"}</Td>
                    <Td><FtBadge ft={ft} /></Td>
                    <Td>{l?.name} <span className="text-xs text-muted-foreground">/ {l?.color}</span></Td>
                    <Td className="text-xs">{ft === "frame-only" ? "—" : (l?.lens.rxTypeLabel ?? l?.lens.label.split("·")[0])}</Td>
                    <Td className="text-right font-medium">{money(o.total)}</Td>
                    <Td>{ft === "prescription" ? <RxBadge order={o} /> : <span className="text-xs text-muted-foreground">—</span>}</Td>
                    <Td><StatusBadge status={o.status} /></Td>
                    <Td className="text-xs">{o.shippingInfo?.tracking ?? o.shipping}</Td>
                    <Td className="text-xs">{na.label}</Td>
                    <Td className="text-right">
                      <div className="text-sm font-medium">{money(m.gross)}</div>
                      <div className="text-[11px] text-muted-foreground">{m.marginPct}%</div>
                    </Td>
                    <Td className="text-xs text-muted-foreground">{fmtShort(o.createdAt)}</Td>
                    <Td className="text-right">
                      <button onClick={() => onOpen(o.id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-xs hover:bg-secondary/70">
                        <Eye className="size-3" /> Open
                      </button>
                    </Td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={14} className="text-center text-sm text-muted-foreground p-10">No orders match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`text-left font-medium px-3 py-2.5 whitespace-nowrap ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 align-top ${className}`}>{children}</td>;
}
function RxBadge({ order }: { order: Order }) {
  const r = order.rxReview?.status ?? "pending";
  const map = {
    pending: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
    approved: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
    clarification: "bg-red-500/15 text-red-800 dark:text-red-200",
  } as const;
  const label = { pending: "Pending", approved: "Approved", clarification: "Clarify" } as const;
  return <span className={`px-2 py-0.5 rounded-full text-[11px] ${map[r]}`}>{label[r]}</span>;
}

// ── Order Detail ────────────────────────────────────────────────────────────
function OrderDetail({ order, onBack }: { order: Order; onBack: () => void }) {
  const ft = orderFulfillmentType(order);
  const m = estimateMargin(order);
  const na = nextAction(order);
  const risks = computeRisks(order);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to orders
        </button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">{order.id}</h1>
            <FtBadge ft={ft} />
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">{order.name} · {order.country} · Created {fmtDate(order.createdAt)}</p>
        </div>
        <CopyButtons order={order} />
      </div>

      {/* Status / Next / Risks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Current status</div>
          <div className="mt-2"><StatusBadge status={order.status} /></div>
          <PipelineMini status={order.status} ft={ft} />
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Next action</div>
          <div className="mt-2 text-sm font-medium">{na.label}</div>
          {na.nextStatus && (
            <button onClick={() => cart.setStatus(order.id, na.nextStatus!, na.label)} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-medium">
              {na.label} <ChevronRight className="size-3.5" />
            </button>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Risk & alerts</div>
          {risks.length === 0 ? (
            <div className="mt-2 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5"><CheckCircle2 className="size-4" /> No alerts</div>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {risks.map((r, i) => (
                <li key={i} className={`text-xs flex items-start gap-1.5 ${r.level === "danger" ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}`}>
                  <AlertCircle className="size-3.5 mt-0.5 shrink-0" /> <span>{r.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card title="Customer information">
            <KV k="Name" v={order.name} />
            <KV k="Email" v={order.email} />
            <KV k="Phone / WhatsApp" v={order.phone ?? "—"} />
            <KV k="Country" v={order.country ?? "—"} />
            <KV k="Shipping address" v={order.address} />
          </Card>

          <Card title="Product configuration">
            {order.lines.map((line) => (
              <div key={line.lineId} className="space-y-1.5">
                <KV k="Fulfillment type" v={<FtBadge ft={ft} />} />
                <KV k="Frame model" v={`${line.name} × ${line.qty}`} />
                <KV k="Frame color" v={line.color} />
                <KV k="Frame size" v={line.size ?? "—"} />
                <KV k="Frame price" v={money(line.unitPrice)} />
                {ft !== "frame-only" && <>
                  <KV k="Prescription type" v={line.lens.rxTypeLabel ?? "—"} />
                  <KV k="Lens function" v={line.lens.fn?.label ?? "—"} />
                  <KV k="Lens thickness" v={line.lens.thickness?.label ?? "—"} />
                  <KV k="Add-ons" v={line.lens.addon?.label ?? "—"} />
                </>}
              </div>
            ))}
            <div className="border-t border-border mt-3 pt-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Total paid</span>
              <span className="font-semibold">{money(order.total)}</span>
            </div>
          </Card>

          {ft === "prescription" && <RxReviewSection order={order} />}

          <FrameSourcingSection order={order} />
          {ft !== "frame-only" && <LensSourcingSection order={order} />}

          {ft === "frame-only" ? (
            <Card title="Local lab / production">
              <div className="text-sm text-muted-foreground">Not required for frame-only orders.</div>
            </Card>
          ) : (
            <LabSection order={order} />
          )}

          <ShippingSection order={order} />
          <NotesSection order={order} />
        </div>

        <div className="space-y-5">
          <MarginCard order={order} m={m} />
          <TimelineCard order={order} />
        </div>
      </div>
    </div>
  );
}

function PipelineMini({ status, ft }: { status: OrderStatus; ft: FulfillmentType }) {
  const pipeline = PIPELINE[ft];
  const idx = pipeline.indexOf(status);
  return (
    <div className="mt-3 flex items-center gap-1 flex-wrap">
      {pipeline.map((s, i) => (
        <div key={s} className={`h-1.5 flex-1 min-w-[16px] rounded-full ${i <= idx ? "bg-foreground" : "bg-secondary"}`} title={STATUS_META[s].label} />
      ))}
    </div>
  );
}

// ── Copy Buttons ────────────────────────────────────────────────────────────
function CopyButtons({ order }: { order: Order }) {
  const ft = orderFulfillmentType(order);
  const line = order.lines[0];
  const rx = line?.lens.rx;
  const risks = computeRisks(order);
  const first = order.name.split(" ")[0] || "there";

  function customerMsg() {
    const lines = [`Hi ${first},`, ``, `This is Mira from MIRAVUE about your order ${order.id} (${line?.name} · ${line?.color}).`];
    let added = false;
    if (risks.some((r) => /PD/.test(r.message))) {
      lines.push(`We need your pupillary distance (PD) to cut your lenses. You can measure it from a clear selfie or send a photo of your prescription.`); added = true;
    }
    if (risks.some((r) => /Axis/.test(r.message))) {
      lines.push(`Your prescription shows CYL but the AXIS value is missing. Could you double-check your Rx?`); added = true;
    }
    if (risks.some((r) => /Prism/.test(r.message))) {
      lines.push(`Your prescription includes prism — our optician will manually verify it before production.`); added = true;
    }
    if (risks.some((r) => /address/i.test(r.message))) {
      lines.push(`Could you confirm your full shipping address (street, city, postal code, country)?`); added = true;
    }
    if (!added) {
      // Status-based fallback
      switch (order.status) {
        case "rx-pending":
          lines.push(`Just a quick note — your prescription is in our review queue and we'll confirm everything within 24 hours.`); break;
        case "rx-approved":
        case "sourcing":
          lines.push(`Your prescription is approved! We're now sourcing your ${line?.name} frame${ft !== "frame-only" ? " and lenses" : ""} and will keep you posted.`); break;
        case "sent-to-lab":
        case "in-production":
          lines.push(`Quick update — your glasses are being assembled at our partner lab. Expected completion ${fmtShort(order.lab?.expectedCompletionAt) === "—" ? "soon" : fmtShort(order.lab?.expectedCompletionAt)}.`); break;
        case "qc":
          lines.push(`Your glasses are in final quality check. We'll ship as soon as they pass.`); break;
        case "ready-to-ship":
          lines.push(`Good news — your order is packed and ready to hand off to Yanwen today.`); break;
        case "shipped":
          lines.push(`Your order has shipped via ${order.shippingInfo?.carrier ?? "Yanwen"}. Tracking: ${order.shippingInfo?.tracking ?? "—"}${order.shippingInfo?.trackingUrl ? ` (${order.shippingInfo.trackingUrl})` : ""}. Estimated arrival 13–20 days.`); break;
        case "delivered":
          lines.push(`Hope your new ${line?.name} arrived safely. Let us know if anything isn't perfect — we're here for adjustments.`); break;
        default:
          lines.push(`Just a quick update on your order. Let us know if you have any questions!`);
      }
    }
    lines.push(``, `Thanks!`, `Mira · MIRAVUE Team`);
    return lines.join("\n");
  }

  function momNote() {
    const f = order.sourcing?.frame ?? {};
    const l = order.sourcing?.lens ?? {};
    const out = [
      `订单 / Order: ${order.id}`,
      `客户 / Customer: ${order.name} (${order.country ?? "—"})`,
      `Fulfillment: ${FULFILLMENT_LABEL[ft]}`,
      ``,
      `镜框 / Frame: ${line?.name} · ${line?.color} · ${line?.size ?? "M"}`,
      `  平台: ${f.platform ?? "—"}  |  SKU: ${f.sku ?? "—"}`,
      `  到货状态: ${f.status ?? "not-ordered"}  |  国内单号: ${f.domesticTracking ?? "—"}`,
    ];
    if (ft !== "frame-only") {
      out.push(``,
        `镜片 / Lens: ${line?.lens.fn?.label ?? "—"} · ${line?.lens.thickness?.label ?? "—"}`,
        `  供应商: ${l.supplier ?? "—"}  |  到货状态: ${l.status ?? "not-ordered"}`,
        `  本地加工店: ${order.lab?.localShop ?? "—"}`,
      );
    } else {
      out.push(``, `⚠️ Frame only — 不需要加工，直接装 demo 片寄出 / no lens cutting, ship with demo lenses.`);
    }
    if (ft === "prescription" && rx) {
      out.push(``,
        `处方 / Rx: OD ${rx.od?.sph}/${rx.od?.cyl || "—"}/${rx.od?.axis || "—"}  ·  OS ${rx.os?.sph}/${rx.os?.cyl || "—"}/${rx.os?.axis || "—"}  ·  PD ${rx.pd ?? (rx.dontKnowPd ? "未知/UNKNOWN" : "—")}`,
        rx.hasPrism ? `⚠️ 含棱镜 / Has prism — 需手工核对` : ``,
      );
    }
    out.push(``, `寄出国家 / Ship to: ${order.country ?? "—"}`, `备注 / Notes: ${order.internalNotes || "—"}`);
    return out.filter(Boolean).join("\n");
  }

  function labNote() {
    const out = [
      `订单 / Order: ${order.id}`,
      `镜框 / Frame: ${line?.name} · ${line?.color} · ${line?.size ?? "M"}`,
    ];
    if (ft === "frame-only") {
      out.push(``, `⚠️ Frame only — 仅装 demo 镜片，无需配镜片 / install demo lenses only.`);
    } else {
      out.push(
        `镜片功能 / Lens function: ${line?.lens.fn?.label ?? "—"}`,
        `镜片厚度 / Lens index: ${line?.lens.thickness?.label ?? "—"}`,
        `镀膜 / Coating: ${line?.lens.addon?.label ?? "Standard AR only"}`,
      );
    }
    if (ft === "prescription" && rx) {
      out.push(``,
        `OD (右眼): SPH ${rx.od?.sph} / CYL ${rx.od?.cyl || "—"} / AXIS ${rx.od?.axis || "—"}`,
        `OS (左眼): SPH ${rx.os?.sph} / CYL ${rx.os?.cyl || "—"} / AXIS ${rx.os?.axis || "—"}`,
        `PD: ${rx.pd ?? (rx.dontKnowPd ? "未知 — 请手工测量 / UNKNOWN, measure manually" : "—")}`,
        rx.hasPrism ? `⚠️ 含棱镜 — 请人工核对 / PRISM, manual verification required` : ``,
      );
    }
    out.push(``, `预计完工 / Expected completion: ${fmtShort(order.lab?.expectedCompletionAt)}`,
      `特别备注 / Special notes: ${order.internalNotes || "—"}`);
    return out.filter(Boolean).join("\n");
  }

  const btn = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-background hover:bg-secondary";
  return (
    <div className="flex flex-wrap gap-2">
      <button className={btn} onClick={() => copy(customerMsg(), "Customer message copied")}><Copy className="size-3.5" /> Copy customer message</button>
      <button className={btn} onClick={() => copy(momNote(), "Mom note copied")}><Copy className="size-3.5" /> Copy mom note</button>
      <button className={btn} onClick={() => copy(labNote(), "Lab note copied")}><Copy className="size-3.5" /> Copy lab note</button>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      <div className="p-4 text-sm space-y-2">{children}</div>
    </div>
  );
}
function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 text-sm">
      <div className="text-muted-foreground text-xs sm:text-sm">{k}</div>
      <div className="break-words">{v}</div>
    </div>
  );
}

function RxReviewSection({ order }: { order: Order }) {
  const rx = order.lines[0]?.lens.rx;
  const review = order.rxReview ?? { status: "pending" };
  const [notes, setNotes] = useState(review.notes ?? "");
  return (
    <Card title="Prescription review">
      <KV k="Method" v={rx?.method ?? "—"} />
      {rx?.method === "upload" && <KV k="Uploaded file" v={rx.fileName ?? "—"} />}
      {rx?.method === "upload" && (
        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3">
          <div className="text-muted-foreground">Image preview</div>
          <div className="h-32 rounded-md border border-dashed border-border bg-muted/30 grid place-items-center text-xs text-muted-foreground">[ Rx photo preview placeholder ]</div>
        </div>
      )}
      {rx?.od && (
        <>
          <KV k="OD (Right Eye)" v={`SPH ${rx.od.sph} · CYL ${rx.od.cyl || "—"} · Axis ${rx.od.axis || "—"}`} />
          <KV k="OS (Left Eye)" v={`SPH ${rx.os?.sph} · CYL ${rx.os?.cyl || "—"} · Axis ${rx.os?.axis || "—"}`} />
          <KV k="PD" v={rx.pd ?? (rx.dontKnowPd ? "Customer doesn't know" : "—")} />
          <KV k="Prism" v={rx.hasPrism ? "Yes" : "No"} />
        </>
      )}
      <KV k="Review status" v={<RxBadge order={order} />} />
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3">
        <div className="text-muted-foreground pt-1.5">Review notes</div>
        <textarea
          value={notes} onChange={(e) => setNotes(e.target.value)}
          onBlur={() => cart.updateOrder(order.id, { rxReview: { ...review, notes } })}
          rows={2} placeholder="Internal notes about this prescription…"
          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={() => { cart.updateOrder(order.id, { rxReview: { status: "approved", notes, reviewedAt: Date.now(), reviewer: "Mira" } }); cart.setStatus(order.id, "rx-approved", "Prescription approved"); }} className="px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 text-white">Approve prescription</button>
        <button onClick={() => { cart.updateOrder(order.id, { rxReview: { status: "clarification", notes, reviewedAt: Date.now(), reviewer: "Mira" } }); cart.setStatus(order.id, "rx-clarification", "Requested clarification from customer"); }} className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 text-white">Request clarification</button>
      </div>
    </Card>
  );
}

function FrameSourcingSection({ order }: { order: Order }) {
  const f = order.sourcing?.frame ?? {};
  const update = (patch: Partial<typeof f>) => cart.updateOrder(order.id, { sourcing: { ...(order.sourcing ?? {}), frame: { ...f, ...patch } } });
  return (
    <Card title="Frame sourcing" action={<StatusPill value={f.status ?? "not-ordered"} onChange={(v) => update({ status: v })} />}>
      <EditRow k="Platform" v={f.platform} onSave={(v) => update({ platform: v })} placeholder="1688 / Taobao / Local" />
      <EditRow k="Source link" v={f.sourceUrl} onSave={(v) => update({ sourceUrl: v })} placeholder="https://…" />
      <EditRow k="Supplier / shop" v={f.supplier} onSave={(v) => update({ supplier: v })} />
      <EditRow k="Frame SKU" v={f.sku} onSave={(v) => update({ sku: v })} />
      <EditRow k="Color" v={f.color} onSave={(v) => update({ color: v })} />
      <EditRow k="Size" v={f.size} onSave={(v) => update({ size: v })} placeholder="e.g. 52-18-145" />
      <EditRow k="Frame cost (RMB)" v={f.costRMB?.toString()} onSave={(v) => update({ costRMB: v ? Number(v) : undefined })} type="number" />
      <EditRow k="Frame cost (USD)" v={f.costUSD?.toString()} onSave={(v) => update({ costUSD: v ? Number(v) : undefined })} type="number" placeholder="auto from RMB" />
      <EditRow k="Domestic tracking" v={f.domesticTracking} onSave={(v) => update({ domesticTracking: v })} placeholder="SF / YTO / JD…" />
      <EditRow k="Notes" v={f.notes} onSave={(v) => update({ notes: v })} textarea />
    </Card>
  );
}

function LensSourcingSection({ order }: { order: Order }) {
  const l = order.sourcing?.lens ?? {};
  const update = (patch: Partial<typeof l>) => cart.updateOrder(order.id, { sourcing: { ...(order.sourcing ?? {}), lens: { ...l, ...patch } } });
  return (
    <Card title="Lens sourcing" action={<StatusPill value={l.status ?? "not-ordered"} onChange={(v) => update({ status: v })} />}>
      <EditRow k="Supplier" v={l.supplier} onSave={(v) => update({ supplier: v })} placeholder="Wenzhou Optical Co." />
      <EditRow k="Lens function" v={l.fn} onSave={(v) => update({ fn: v })} placeholder="Blue-light / Photochromic…" />
      <EditRow k="Lens index" v={l.index} onSave={(v) => update({ index: v })} placeholder="1.56 / 1.61 / 1.67 / 1.74" />
      <EditRow k="Lens cost (RMB)" v={l.costRMB?.toString()} onSave={(v) => update({ costRMB: v ? Number(v) : undefined })} type="number" />
      <EditRow k="Lens cost (USD)" v={l.costUSD?.toString()} onSave={(v) => update({ costUSD: v ? Number(v) : undefined })} type="number" placeholder="auto from RMB" />
      <EditRow k="Domestic tracking" v={l.domesticTracking} onSave={(v) => update({ domesticTracking: v })} />
      <EditRow k="Notes" v={l.notes} onSave={(v) => update({ notes: v })} textarea />
    </Card>
  );
}

function StatusPill({ value, onChange }: { value: "not-ordered" | "ordered" | "received" | string; onChange: (v: "not-ordered" | "ordered" | "received") => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as "not-ordered" | "ordered" | "received")} className="text-xs rounded-md border border-border bg-background px-2 py-1">
      <option value="not-ordered">Not ordered</option>
      <option value="ordered">Ordered</option>
      <option value="received">Received</option>
    </select>
  );
}

function LabSection({ order }: { order: Order }) {
  const l = order.lab ?? {};
  const update = (patch: Partial<typeof l>) => cart.updateOrder(order.id, { lab: { ...l, ...patch } });
  const checklist = l.qcChecklist ?? {};
  const updateCheck = (patch: Partial<typeof checklist>) => update({ qcChecklist: { ...checklist, ...patch } });

  const checks: { key: keyof typeof checklist; label: string }[] = [
    { key: "frameMatches", label: "Frame color matches order" },
    { key: "lensMatches",  label: "Lens function matches order" },
    { key: "rxChecked",    label: "Prescription values checked" },
    { key: "noScratches",  label: "No visible scratches" },
    { key: "packingPhoto", label: "Packing photo uploaded" },
    { key: "readyToShip",  label: "Ready to ship" },
  ];

  return (
    <Card title="Local lab / production">
      <DateRow k="Sent to mom" v={l.sentToMomAt} onSave={(t) => update({ sentToMomAt: t })} />
      <DateRow k="Mom received" v={l.momReceivedAt} onSave={(t) => update({ momReceivedAt: t })} />
      <EditRow k="Local optical shop" v={l.localShop} onSave={(v) => update({ localShop: v })} placeholder="e.g. Hangzhou Bright Optical" />
      <DateRow k="Sent to shop" v={l.sentToShopAt} onSave={(t) => update({ sentToShopAt: t })} />
      <DateRow k="Expected completion" v={l.expectedCompletionAt} onSave={(t) => update({ expectedCompletionAt: t })} />
      <EditRow k="Processing fee (RMB)" v={l.processingFeeRMB?.toString()} onSave={(v) => update({ processingFeeRMB: v ? Number(v) : undefined })} type="number" />
      <EditRow k="Processing fee (USD)" v={l.processingFeeUSD?.toString()} onSave={(v) => update({ processingFeeUSD: v ? Number(v) : undefined })} type="number" placeholder="auto from RMB" />
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 items-start">
        <div className="text-muted-foreground">Production status</div>
        <select value={l.productionStatus ?? "not-started"} onChange={(e) => update({ productionStatus: e.target.value as "not-started" | "in-progress" | "completed" })} className="text-sm rounded-md border border-border bg-background px-2.5 py-1.5">
          <option value="not-started">Not started</option>
          <option value="in-progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3">
        <div className="text-muted-foreground">QC photo</div>
        <label className="cursor-pointer text-xs px-3 py-1.5 rounded-md border border-dashed border-border w-fit hover:bg-secondary">
          {l.qcPhotoName ?? "Upload QC photo (placeholder)"}
          <input type="file" className="hidden" onChange={(e) => update({ qcPhotoName: e.target.files?.[0]?.name })} />
        </label>
      </div>
      <EditRow k="QC notes" v={l.qcNotes} onSave={(v) => update({ qcNotes: v })} textarea />
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 items-start">
        <div className="text-muted-foreground pt-1">QC checklist</div>
        <div className="space-y-1.5">
          {checks.map((c) => (
            <label key={c.key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!checklist[c.key]} onChange={(e) => updateCheck({ [c.key]: e.target.checked })} />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
      </div>
    </Card>
  );
}

function DateRow({ k, v, onSave }: { k: string; v?: number; onSave: (t: number | undefined) => void }) {
  const value = v ? new Date(v).toISOString().slice(0, 10) : "";
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 items-start">
      <div className="text-muted-foreground pt-1.5">{k}</div>
      <input type="date" defaultValue={value} onBlur={(e) => onSave(e.target.value ? new Date(e.target.value).getTime() : undefined)} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" />
    </div>
  );
}

function ShippingSection({ order }: { order: Order }) {
  const s = order.shippingInfo ?? {};
  const update = (patch: Partial<typeof s>) => cart.updateOrder(order.id, { shippingInfo: { ...s, ...patch } });
  return (
    <Card title="International shipping">
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 items-start">
        <div className="text-muted-foreground pt-1.5">Carrier</div>
        <select value={s.carrier ?? "Yanwen"} onChange={(e) => update({ carrier: e.target.value })} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm">
          <option>Yanwen</option><option>4PX</option><option>China Post</option><option>Other</option>
        </select>
      </div>
      <EditRow k="Tracking number" v={s.tracking} onSave={(v) => update({ tracking: v })} placeholder="YW…" />
      <EditRow k="Tracking URL" v={s.trackingUrl} onSave={(v) => update({ trackingUrl: v })} placeholder="https://track.yw56.com.cn/…" />
      <EditRow k="Package weight (g)" v={s.weightG?.toString()} onSave={(v) => update({ weightG: v ? Number(v) : undefined })} type="number" />
      <EditRow k="Shipping cost (RMB)" v={s.costRMB?.toString()} onSave={(v) => update({ costRMB: v ? Number(v) : undefined })} type="number" />
      <EditRow k="Shipping cost (USD)" v={s.costUSD?.toString()} onSave={(v) => update({ costUSD: v ? Number(v) : undefined })} type="number" placeholder="auto from RMB" />
      <DateRow k="Label created" v={s.labelCreatedAt} onSave={(t) => update({ labelCreatedAt: t })} />
      <DateRow k="Shipped date" v={s.shippedAt} onSave={(t) => update({ shippedAt: t })} />
      <DateRow k="ETA start" v={s.etaStart} onSave={(t) => update({ etaStart: t })} />
      <DateRow k="ETA end" v={s.etaEnd} onSave={(t) => update({ etaEnd: t })} />
      <DateRow k="Delivered" v={s.deliveredAt} onSave={(t) => update({ deliveredAt: t })} />
      <EditRow k="Delivery status" v={s.deliveryStatus} onSave={(v) => update({ deliveryStatus: v })} />
      <EditRow k="Tracking notes" v={s.trackingNotes} onSave={(v) => update({ trackingNotes: v })} textarea />
    </Card>
  );
}

function NotesSection({ order }: { order: Order }) {
  const [internal, setInternal] = useState(order.internalNotes ?? "");
  const [customer, setCustomer] = useState(order.customerNotes ?? "");
  const [msg, setMsg] = useState("");
  return (
    <Card title="Notes & communication">
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3">
        <div className="text-muted-foreground pt-1.5">Internal notes</div>
        <textarea value={internal} onChange={(e) => setInternal(e.target.value)} onBlur={() => cart.updateOrder(order.id, { internalNotes: internal })} rows={2} className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3">
        <div className="text-muted-foreground pt-1.5">Customer notes</div>
        <textarea value={customer} onChange={(e) => setCustomer(e.target.value)} onBlur={() => cart.updateOrder(order.id, { customerNotes: customer })} rows={2} className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 items-start">
        <div className="text-muted-foreground pt-1.5">Add timeline note</div>
        <div className="flex gap-2">
          <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="e.g. Called customer about Rx" className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" />
          <button disabled={!msg} onClick={() => { cart.addEvent(order.id, msg); setMsg(""); }} className="px-3 py-1.5 rounded-md bg-foreground text-background text-xs disabled:opacity-40">
            <MessageSquare className="size-3.5 inline -mt-0.5 mr-1" /> Log
          </button>
        </div>
      </div>
    </Card>
  );
}

function EditRow({ k, v, onSave, type = "text", placeholder, textarea }: { k: string; v?: string; onSave: (v: string) => void; type?: string; placeholder?: string; textarea?: boolean }) {
  const [val, setVal] = useState(v ?? "");
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 items-start">
      <div className="text-muted-foreground pt-1.5">{k}</div>
      {textarea ? (
        <textarea value={val} onChange={(e) => setVal(e.target.value)} onBlur={() => onSave(val)} placeholder={placeholder} rows={2} className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" />
      ) : (
        <input value={val} onChange={(e) => setVal(e.target.value)} onBlur={() => onSave(val)} placeholder={placeholder} type={type} className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" />
      )}
    </div>
  );
}

function MarginCard({ order, m }: { order: Order; m: ReturnType<typeof estimateMargin> }) {
  const [rate, setRate] = useState((order.exchangeRate ?? 7.2).toString());
  const ft = orderFulfillmentType(order);
  const row = (k: string, usd: number, rmbV?: number) => (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right">
        <span className="text-red-600">−{money(usd)}</span>
        {rmbV !== undefined && <span className="block text-[11px] text-muted-foreground">{rmb(rmbV)}</span>}
      </span>
    </div>
  );
  return (
    <Card title="Margin estimate" action={
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-muted-foreground">¥/$</span>
        <input value={rate} onChange={(e) => setRate(e.target.value)} onBlur={() => cart.updateOrder(order.id, { exchangeRate: Number(rate) || 7.2 })} className="w-14 rounded-md border border-border bg-background px-1.5 py-0.5 text-xs" />
      </div>
    }>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Customer paid</span>
        <span className="font-medium">{money(order.total)}</span>
      </div>
      <div className="border-t border-border my-2" />
      {row("Frame cost", m.frameCost, m.frameCostRMB)}
      {ft !== "frame-only" && row("Lens cost", m.lensCost, m.lensCostRMB)}
      {ft !== "frame-only" && row("Processing fee", m.processingFee, m.processingFeeRMB)}
      {row("Packaging", m.packagingCost, m.packagingRMB)}
      {row("Int'l shipping", m.intlShipping, m.intlShippingRMB)}
      {row("Payment fee", m.paymentFee)}
      {row("Defect / remake reserve", m.defectReserve)}
      <div className="border-t border-border my-2" />
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Total cost</span>
        <span>{money(m.totalCost)}</span>
      </div>
      <div className="flex justify-between items-baseline mt-3 bg-emerald-500/10 rounded-md px-3 py-2">
        <div>
          <div className="text-xs text-emerald-800 dark:text-emerald-200">Estimated gross profit</div>
          <div className="text-xs text-muted-foreground">{m.marginPct}% margin · rate ¥{m.rate}</div>
        </div>
        <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{money(m.gross)}</div>
      </div>
    </Card>
  );
}

function TimelineCard({ order }: { order: Order }) {
  const events = [...(order.timeline ?? [])].reverse();
  return (
    <Card title="Status timeline">
      {events.length === 0 ? (
        <div className="text-xs text-muted-foreground">No events yet.</div>
      ) : (
        <ol className="space-y-3">
          {events.map((e, i) => (
            <li key={i} className="grid grid-cols-[10px_1fr] gap-3">
              <div className="relative">
                <span className="absolute left-1/2 -translate-x-1/2 top-1.5 size-2 rounded-full bg-foreground" />
                {i < events.length - 1 && <span className="absolute left-1/2 -translate-x-1/2 top-3 bottom-[-12px] w-px bg-border" />}
              </div>
              <div>
                <div className="text-sm">{e.message}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {fmtDate(e.at)}{e.author ? ` · ${e.author}` : ""}
                  {e.status ? <> · <StatusBadge status={e.status} /></> : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="border-t border-border my-3" />
      <div className="text-[11px] text-muted-foreground">Lifecycle: {STATUS_ORDER.map((s) => STATUS_META[s].label).join(" → ")}</div>
    </Card>
  );
}
