import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useCart, cart, estimateMargin,
  STATUS_META, STATUS_ORDER,
  type Order, type OrderStatus,
} from "@/lib/cart-store";
import {
  LayoutDashboard, Package, Eye, ArrowLeft, RotateCcw, Search,
  CircleDollarSign, Truck, Factory, ClipboardCheck, AlertCircle, Clock,
  TrendingUp, CheckCircle2, MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Operations — MIRAVUE Admin" }] }),
  component: AdminApp,
});

// ── Helpers ─────────────────────────────────────────────────────────────────
const FILTERS: { key: string; label: string; match: (o: Order) => boolean }[] = [
  { key: "all",            label: "All orders",          match: () => true },
  { key: "rx-pending",     label: "Pending Rx review",   match: (o) => o.status === "rx-pending" },
  { key: "rx-clarification", label: "Needs clarification", match: (o) => o.status === "rx-clarification" },
  { key: "sourcing",       label: "Sourcing",            match: (o) => o.status === "rx-approved" || o.status === "sourcing" },
  { key: "production",     label: "In production",       match: (o) => ["sent-to-lab","in-production","qc"].includes(o.status) },
  { key: "ready",          label: "Ready to ship",       match: (o) => o.status === "ready-to-ship" },
  { key: "shipped",        label: "Shipped",             match: (o) => o.status === "shipped" || o.status === "delivered" },
  { key: "after-sale",     label: "After-sale",          match: (o) => o.status === "after-sale" },
];

function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${m.tone}`}>{m.label}</span>;
}

function money(n: number) { return "$" + n.toFixed(2); }
function fmtDate(t?: number) { return t ? new Date(t).toLocaleString() : "—"; }
function fmtShort(t?: number) { return t ? new Date(t).toLocaleDateString() : "—"; }

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
      <div className="text-sm text-muted-foreground">Operations dashboard</div>
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
    const clarif = orders.filter((o) => o.status === "rx-clarification").length;
    const prod = orders.filter((o) => ["sent-to-lab","in-production","qc"].includes(o.status)).length;
    const ready = orders.filter((o) => o.status === "ready-to-ship").length;
    const shippedWeek = orders.filter((o) => o.status === "shipped" && (o.shippingInfo?.shippedAt ?? 0) >= weekAgo).length;
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const profit = orders.reduce((s, o) => s + estimateMargin(o).gross, 0);
    const aov = orders.length ? revenue / orders.length : 0;
    return { todayCount, pendingRx, clarif, prod, ready, shippedWeek, revenue, profit, aov };
  }, [orders]);

  const cards = [
    { label: "Orders today",            value: stats.todayCount,         icon: Package,        tone: "text-blue-600" },
    { label: "Pending Rx review",       value: stats.pendingRx,          icon: Clock,          tone: "text-amber-600" },
    { label: "Need clarification",      value: stats.clarif,             icon: AlertCircle,    tone: "text-red-600" },
    { label: "In production",           value: stats.prod,               icon: Factory,        tone: "text-purple-600" },
    { label: "Ready to ship",           value: stats.ready,              icon: ClipboardCheck, tone: "text-teal-600" },
    { label: "Shipped this week",       value: stats.shippedWeek,        icon: Truck,          tone: "text-cyan-600" },
    { label: "Estimated revenue",       value: money(stats.revenue),     icon: CircleDollarSign, tone: "text-emerald-600" },
    { label: "Estimated gross profit",  value: money(stats.profit),      icon: TrendingUp,     tone: "text-emerald-700" },
    { label: "Average order value",     value: money(stats.aov),         icon: CheckCircle2,   tone: "text-slate-600" },
  ];

  const needsAttention = orders.filter((o) => o.status === "rx-pending" || o.status === "rx-clarification").slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, Mira 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Here&apos;s what&apos;s happening across the workshop today.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
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

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <div className="font-medium">Needs your attention</div>
            <div className="text-xs text-muted-foreground">Prescriptions awaiting review or clarification</div>
          </div>
          <button onClick={onJump} className="text-xs text-muted-foreground hover:text-foreground">View all orders →</button>
        </div>
        {needsAttention.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">All caught up. 🎉</div>
        ) : (
          <div className="divide-y divide-border">
            {needsAttention.map((o) => (
              <button key={o.id} onClick={() => onOpen(o.id)} className="w-full grid grid-cols-[1fr_auto_auto] gap-4 items-center p-4 hover:bg-secondary/40 text-left">
                <div>
                  <div className="text-sm font-medium">{o.name} <span className="text-muted-foreground font-normal">· {o.country}</span></div>
                  <div className="text-xs text-muted-foreground mt-0.5">{o.id} · {o.lines[0]?.name} · {o.lines[0]?.lens.label}</div>
                </div>
                <StatusBadge status={o.status} />
                <div className="text-xs text-muted-foreground">{fmtShort(o.createdAt)}</div>
              </button>
            ))}
          </div>
        )}
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
    .filter((o) => !q || (o.name + o.id + o.email + o.country).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">{filtered.length} of {orders.length}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const count = orders.filter(f.match).length;
          const active = filter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${active ? "bg-foreground text-background border-foreground" : "bg-background border-border hover:bg-secondary"}`}>
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
                <Th>Order</Th><Th>Customer</Th><Th>Country</Th><Th>Frame</Th><Th>Lens</Th>
                <Th className="text-right">Paid</Th><Th>Rx</Th><Th>Production</Th><Th>Shipping</Th>
                <Th className="text-right">Margin</Th><Th>Created</Th><Th></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o) => {
                const m = estimateMargin(o);
                const l = o.lines[0];
                return (
                  <tr key={o.id} className="hover:bg-secondary/30 transition-colors">
                    <Td className="font-mono text-xs">{o.id}</Td>
                    <Td>
                      <div className="font-medium">{o.name}</div>
                      <div className="text-xs text-muted-foreground">{o.email}</div>
                    </Td>
                    <Td className="text-xs">{o.country ?? "—"}</Td>
                    <Td>{l?.name} <span className="text-xs text-muted-foreground">/ {l?.color}</span></Td>
                    <Td className="text-xs">{l?.lens.rxTypeLabel ?? l?.lens.label.split("·")[0]}</Td>
                    <Td className="text-right font-medium">{money(o.total)}</Td>
                    <Td><RxBadge order={o} /></Td>
                    <Td><StatusBadge status={o.status} /></Td>
                    <Td className="text-xs">{o.shippingInfo?.tracking ?? o.shipping}</Td>
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
                <tr><td colSpan={12} className="text-center text-sm text-muted-foreground p-10">No orders match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`text-left font-medium px-3 py-2.5 ${className}`}>{children}</th>;
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
const NEXT_ACTIONS: { from: OrderStatus[]; to: OrderStatus; label: string; tone?: string }[] = [
  { from: ["rx-pending"], to: "rx-approved", label: "Approve prescription", tone: "bg-emerald-600 text-white" },
  { from: ["rx-pending", "rx-approved"], to: "rx-clarification", label: "Request clarification", tone: "bg-red-600 text-white" },
  { from: ["rx-clarification"], to: "rx-approved", label: "Mark clarified & approve", tone: "bg-emerald-600 text-white" },
  { from: ["rx-approved"], to: "sourcing", label: "Start sourcing" },
  { from: ["sourcing"], to: "sent-to-lab", label: "Mark sent to local lab" },
  { from: ["sent-to-lab"], to: "in-production", label: "Mark in production" },
  { from: ["in-production"], to: "qc", label: "Mark quality check" },
  { from: ["qc"], to: "ready-to-ship", label: "Mark ready to ship" },
  { from: ["ready-to-ship"], to: "shipped", label: "Mark shipped" },
  { from: ["shipped"], to: "delivered", label: "Mark delivered" },
  { from: ["delivered"], to: "after-sale", label: "Open after-sale" },
];

function OrderDetail({ order, onBack }: { order: Order; onBack: () => void }) {
  const m = estimateMargin(order);
  const l = order.lines[0];
  const actions = NEXT_ACTIONS.filter((a) => a.from.includes(order.status));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to orders
        </button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">{order.id}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">{order.name} · {order.country} · Created {fmtDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <button key={a.to + a.label} onClick={() => cart.setStatus(order.id, a.to, a.label)} className={`px-3 py-1.5 rounded-md text-xs font-medium border transition ${a.tone ?? "bg-background border-border hover:bg-secondary"}`}>
              {a.label}
            </button>
          ))}
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
                <KV k="Frame model" v={`${line.name} × ${line.qty}`} />
                <KV k="Frame color" v={line.color} />
                <KV k="Frame size" v={line.size ?? "—"} />
                <KV k="Frame price" v={money(line.unitPrice)} />
                <KV k="Prescription type" v={line.lens.rxTypeLabel ?? "—"} />
                <KV k="Lens function" v={line.lens.fn?.label ?? "—"} />
                <KV k="Lens thickness" v={line.lens.thickness?.label ?? "—"} />
                <KV k="Add-ons" v={line.lens.addon?.label ?? "—"} />
              </div>
            ))}
            <div className="border-t border-border mt-3 pt-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Total paid</span>
              <span className="font-semibold">{money(order.total)}</span>
            </div>
          </Card>

          <RxReviewSection order={order} />
          <SourcingSection order={order} />
          <LabSection order={order} />
          <ShippingSection order={order} />
          <NotesSection order={order} />
        </div>

        <div className="space-y-5">
          <MarginCard order={order} m={m} />
          <TimelineCard order={order} />
        </div>
      </div>

      {l && null /* keep linter happy */}
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
    <div className="grid grid-cols-[160px_1fr] gap-3 text-sm">
      <div className="text-muted-foreground">{k}</div>
      <div>{v}</div>
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
        <div className="grid grid-cols-[160px_1fr] gap-3">
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
      <div className="grid grid-cols-[160px_1fr] gap-3">
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

function SourcingSection({ order }: { order: Order }) {
  const s = order.sourcing ?? {};
  const update = (patch: Partial<typeof s>) => cart.updateOrder(order.id, { sourcing: { ...s, ...patch } });
  return (
    <Card title="Sourcing">
      <EditRow k="Frame source link" v={s.frameSourceUrl} onSave={(v) => update({ frameSourceUrl: v })} placeholder="https://…" />
      <EditRow k="Frame cost (USD)" v={s.frameCost?.toString()} onSave={(v) => update({ frameCost: v ? Number(v) : undefined })} type="number" />
      <EditRow k="Lens supplier" v={s.lensSupplier} onSave={(v) => update({ lensSupplier: v })} />
      <EditRow k="Lens cost (USD)" v={s.lensCost?.toString()} onSave={(v) => update({ lensCost: v ? Number(v) : undefined })} type="number" />
      <EditRow k="Purchase notes" v={s.notes} onSave={(v) => update({ notes: v })} textarea />
    </Card>
  );
}

function LabSection({ order }: { order: Order }) {
  const l = order.lab ?? {};
  const update = (patch: Partial<typeof l>) => cart.updateOrder(order.id, { lab: { ...l, ...patch } });
  return (
    <Card title="Local lab / production">
      <KV k="Sent to mom" v={fmtDate(l.sentToMomAt)} />
      <EditRow k="Local optical shop" v={l.localShop} onSave={(v) => update({ localShop: v })} placeholder="Mira's Optical Workshop" />
      <EditRow k="Processing fee (USD)" v={l.processingFee?.toString()} onSave={(v) => update({ processingFee: v ? Number(v) : undefined })} type="number" />
      <div className="grid grid-cols-[160px_1fr] gap-3">
        <div className="text-muted-foreground">QC photo</div>
        <label className="cursor-pointer text-xs px-3 py-1.5 rounded-md border border-dashed border-border w-fit hover:bg-secondary">
          {l.qcPhotoName ?? "Upload QC photo (placeholder)"}
          <input type="file" className="hidden" onChange={(e) => update({ qcPhotoName: e.target.files?.[0]?.name })} />
        </label>
      </div>
      <EditRow k="QC notes" v={l.qcNotes} onSave={(v) => update({ qcNotes: v })} textarea />
    </Card>
  );
}

function ShippingSection({ order }: { order: Order }) {
  const s = order.shippingInfo ?? {};
  const update = (patch: Partial<typeof s>) => cart.updateOrder(order.id, { shippingInfo: { ...s, ...patch } });
  return (
    <Card title="Shipping & tracking">
      <EditRow k="Carrier" v={s.carrier} onSave={(v) => update({ carrier: v })} placeholder="Yanwen" />
      <EditRow k="Tracking number" v={s.tracking} onSave={(v) => update({ tracking: v })} placeholder="YW…" />
      <EditRow k="Shipping cost (USD)" v={order.intlShippingCost?.toString()} onSave={(v) => cart.updateOrder(order.id, { intlShippingCost: v ? Number(v) : undefined })} type="number" />
      <KV k="Shipped date" v={fmtDate(s.shippedAt)} />
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
      <div className="grid grid-cols-[160px_1fr] gap-3">
        <div className="text-muted-foreground pt-1.5">Internal notes</div>
        <textarea value={internal} onChange={(e) => setInternal(e.target.value)} onBlur={() => cart.updateOrder(order.id, { internalNotes: internal })} rows={2} className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" />
      </div>
      <div className="grid grid-cols-[160px_1fr] gap-3">
        <div className="text-muted-foreground pt-1.5">Customer notes</div>
        <textarea value={customer} onChange={(e) => setCustomer(e.target.value)} onBlur={() => cart.updateOrder(order.id, { customerNotes: customer })} rows={2} className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" />
      </div>
      <div className="grid grid-cols-[160px_1fr] gap-3 items-start">
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
    <div className="grid grid-cols-[160px_1fr] gap-3 items-start">
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
  const row = (k: string, v: number, sign: "-" | "+" = "-") => (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className={sign === "-" ? "text-red-600" : ""}>{sign === "-" ? "−" : "+"}{money(Math.abs(v))}</span>
    </div>
  );
  return (
    <Card title="Margin estimate">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Customer paid</span>
        <span className="font-medium">{money(order.total)}</span>
      </div>
      <div className="border-t border-border my-2" />
      {row("Frame cost", m.frameCost)}
      {row("Lens cost", m.lensCost)}
      {row("Processing fee", m.processingFee)}
      {row("Packaging", m.packagingCost)}
      {row("Int'l shipping", m.intlShipping)}
      {row("Payment fee", m.paymentFee)}
      <div className="border-t border-border my-2" />
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Total cost</span>
        <span>{money(m.totalCost)}</span>
      </div>
      <div className="flex justify-between items-baseline mt-3 bg-emerald-500/10 rounded-md px-3 py-2">
        <div>
          <div className="text-xs text-emerald-800 dark:text-emerald-200">Estimated gross profit</div>
          <div className="text-xs text-muted-foreground">{m.marginPct}% margin</div>
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
