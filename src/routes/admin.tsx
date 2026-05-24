import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useCart, cart, estimateMargin,
  STATUS_META, STATUS_ORDER, PIPELINE,
  orderFulfillmentType, computeRisks, nextAction,
  type Order, type OrderStatus, type FulfillmentType,
} from "@/lib/cart-store";
import {
  LayoutDashboard, Package, Eye, ArrowLeft, RotateCcw, Search,
  CircleDollarSign, Truck, Factory, ClipboardCheck, AlertCircle,
  TrendingUp, CheckCircle2, MessageSquare, Copy, ShieldAlert, ChevronRight,
  Boxes, Tag, Image as ImageIcon, Star, Percent, Globe, Sparkles, Headphones,
} from "lucide-react";
import { toast } from "sonner";
import { STATUS_LABEL_ZH, STATUS_TONE, FULFILLMENT_LABEL_ZH, FT_BADGE_TONE, translateRisk, translateNextAction, L } from "@/lib/admin-i18n";
import { activePromotion, useCMS } from "@/lib/cms-store";
import {
  ProductsModule, CategoriesModule, ReviewsModule, PromotionsModule,
  HomeCmsModule, AssetsModule, LangCurrencyModule, AIConsoleModule,
} from "@/components/admin/CmsModules";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "运营后台 — MIRAVUE Admin" }] }),
  component: AdminApp,
});

// ── helpers ─────────────────────────────────────────────────────────────────
function FtBadge({ ft }: { ft: FulfillmentType }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${FT_BADGE_TONE[ft]}`}>{FULFILLMENT_LABEL_ZH[ft]}</span>;
}
function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${STATUS_TONE[status]}`}>{STATUS_LABEL_ZH[status]}</span>;
}
function money(n: number) { return "$" + n.toFixed(2); }
function rmb(n: number) { return "¥" + n.toFixed(2); }
function fmtDate(t?: number) { return t ? new Date(t).toLocaleString() : "—"; }
function fmtShort(t?: number) { return t ? new Date(t).toLocaleDateString() : "—"; }

async function copyText(text: string, label = "已复制", onFail?: (text: string) => void) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text); toast.success(label); return;
    }
    throw new Error("clipboard unavailable");
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) { toast.success(label); return; }
    } catch { /* noop */ }
    if (onFail) onFail(text); else toast.error("复制失败");
  }
}

// ── nav ─────────────────────────────────────────────────────────────────────
type ViewKey =
  | "dashboard" | "orders" | "rxReview" | "qcWorkbench" | "shipping" | "afterSales"
  | "products" | "categories" | "homeCms" | "assets" | "reviews" | "promotions"
  | "langCurrency" | "aiConsole";

const NAV: { group: string; items: { key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> }[] }[] = [
  { group: "概览", items: [
    { key: "dashboard", label: L.dashboard, icon: LayoutDashboard },
  ]},
  { group: "运营工作台", items: [
    { key: "orders",       label: L.orders,       icon: Package },
    { key: "rxReview",     label: L.rxReview,     icon: ClipboardCheck },
    { key: "qcWorkbench",  label: L.qcWorkbench,  icon: ShieldAlert },
    { key: "shipping",     label: L.shipping,     icon: Truck },
    { key: "afterSales",   label: L.afterSales,   icon: Headphones },
  ]},
  { group: "内容管理", items: [
    { key: "products",   label: L.products,   icon: Boxes },
    { key: "categories", label: L.categories, icon: Tag },
    { key: "homeCms",    label: L.homeCms,    icon: LayoutDashboard },
    { key: "assets",     label: L.assets,     icon: ImageIcon },
    { key: "reviews",    label: L.reviews,    icon: Star },
  ]},
  { group: "营销与设置", items: [
    { key: "promotions",   label: L.promotions,   icon: Percent },
    { key: "langCurrency", label: L.langCurrency, icon: Globe },
  ]},
  { group: "智能化", items: [
    { key: "aiConsole", label: L.aiConsole, icon: Sparkles },
  ]},
];

// ── Root ────────────────────────────────────────────────────────────────────
function AdminApp() {
  const { orders } = useCart();
  const [view, setView] = useState<ViewKey>("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = orders.find((o) => o.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <Sidebar view={view} onView={(v) => { setView(v); setSelectedId(null); }} />
      <main className="md:pl-64">
        <Topbar />
        <div className="px-6 py-6 max-w-[1400px] mx-auto">
          {selected ? (
            <OrderDetail order={selected} onBack={() => setSelectedId(null)} />
          ) : view === "dashboard"  ? <Dashboard orders={orders} onOpen={(id) => setSelectedId(id)} onJump={(v) => setView(v)} />
            : view === "orders"     ? <OrdersList orders={orders} onOpen={(id) => setSelectedId(id)} title={L.orders} />
            : view === "rxReview"   ? <OrdersList orders={orders.filter((o) => o.status === "rx-pending" || o.status === "rx-clarification" || o.status === "rx-approved")} onOpen={(id) => setSelectedId(id)} title={L.rxReview} />
            : view === "qcWorkbench"? <OrdersList orders={orders.filter((o) => o.status === "qc" || o.status === "in-production")} onOpen={(id) => setSelectedId(id)} title={L.qcWorkbench} />
            : view === "shipping"   ? <OrdersList orders={orders.filter((o) => o.status === "ready-to-ship" || o.status === "shipped" || o.status === "delivered")} onOpen={(id) => setSelectedId(id)} title={L.shipping} />
            : view === "afterSales" ? <OrdersList orders={orders.filter((o) => o.status === "after-sale")} onOpen={(id) => setSelectedId(id)} title={L.afterSales} />
            : view === "products"     ? <ProductsModule />
            : view === "categories"   ? <CategoriesModule />
            : view === "homeCms"      ? <HomeCmsModule />
            : view === "assets"       ? <AssetsModule />
            : view === "reviews"      ? <ReviewsModule />
            : view === "promotions"   ? <PromotionsModule />
            : view === "langCurrency" ? <LangCurrencyModule />
            : view === "aiConsole"    ? <AIConsoleModule />
            : null}
        </div>
      </main>
    </div>
  );
}

// ── Chrome ──────────────────────────────────────────────────────────────────
function Sidebar({ view, onView }: { view: ViewKey; onView: (v: ViewKey) => void }) {
  const item = "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors";
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-background border-r border-border flex-col">
      <div className="px-5 h-16 flex items-center border-b border-border">
        <span className="font-semibold tracking-tight">MIRAVUE <span className="text-muted-foreground font-normal">运营后台</span></span>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 px-3 mb-1.5">{g.group}</div>
            <div className="space-y-0.5">
              {g.items.map((it) => (
                <button key={it.key} onClick={() => onView(it.key)} className={`${item} w-full ${view === it.key ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"}`}>
                  <it.icon className="size-4 shrink-0" /> {it.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <button onClick={() => { if (confirm("重置全部演示订单数据？此操作仅清除本地订单记录。")) cart.resetMock(); }} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <RotateCcw className="size-3.5" /> 重置演示订单

        </button>
      </div>
    </aside>
  );
}

function Topbar() {
  const promo = activePromotion();
  return (
    <div className="h-16 bg-background border-b border-border flex items-center justify-between px-6">
      <div className="text-sm text-muted-foreground">眼镜电商运营后台</div>
      <div className="flex items-center gap-3">
        {promo && <span className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"><Sparkles className="size-3" /> 当前活动：{promo.title}</span>}
        <a href="/?preview_lang=zh" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1">中文预览</a>
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">↗ 查看前台</Link>
        <div className="size-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">M</div>
      </div>
    </div>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ orders, onOpen, onJump }: { orders: Order[]; onOpen: (id: string) => void; onJump: (v: ViewKey) => void }) {
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
  }, [orders, today, weekAgo]);

  const cards = [
    { label: "今日订单",        value: stats.todayCount,     icon: Package,         tone: "text-blue-600" },
    { label: "待审处方",        value: stats.pendingRx,      icon: ClipboardCheck,  tone: "text-amber-700" },
    { label: "待发货",          value: stats.ready,          icon: Truck,           tone: "text-teal-700" },
    { label: "本周已发货",      value: stats.shippedWeek,    icon: CheckCircle2,    tone: "text-emerald-700" },
    { label: "预估营收",        value: money(stats.revenue), icon: CircleDollarSign,tone: "text-emerald-600" },
    { label: "预估毛利",        value: money(stats.profit),  icon: TrendingUp,      tone: "text-emerald-700" },
    { label: "客单价",          value: money(stats.aov),     icon: CheckCircle2,    tone: "text-slate-600" },
    { label: "在售商品",        value: useCmsCount("products"),  icon: Boxes,       tone: "text-violet-600" },
  ];

  const queues = [
    { key: "rx-review",   title: "处方复核",       icon: ClipboardCheck, tone: "text-amber-700",   v: "rxReview" as ViewKey,    match: (o: Order) => o.status === "rx-pending" },
    { key: "follow-up",   title: "需客户回复",     icon: AlertCircle,    tone: "text-red-700",     v: "rxReview" as ViewKey,    match: (o: Order) => o.status === "rx-clarification" },
    { key: "sourcing",    title: "采购中",         icon: Package,        tone: "text-blue-700",    v: "orders" as ViewKey,      match: (o: Order) => o.status === "rx-approved" || o.status === "sourcing" },
    { key: "production",  title: "镜片加工",       icon: Factory,        tone: "text-purple-700",  v: "qcWorkbench" as ViewKey, match: (o: Order) => o.status === "sent-to-lab" || o.status === "in-production" },
    { key: "qc",          title: "质检中",         icon: ShieldAlert,    tone: "text-fuchsia-700", v: "qcWorkbench" as ViewKey, match: (o: Order) => o.status === "qc" },
    { key: "ship",        title: "待发货",         icon: Truck,          tone: "text-teal-700",    v: "shipping" as ViewKey,    match: (o: Order) => o.status === "ready-to-ship" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">早上好 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">这是今天的工作概览与待办队列。</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <span className="text-xs text-muted-foreground">{c.label}</span>
              <c.icon className={`size-4 ${c.tone}`} />
            </div>
            <div className="text-2xl font-semibold mt-2">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">今日工作队列</h2>
        <button onClick={() => onJump("orders")} className="text-xs text-muted-foreground hover:text-foreground">查看全部订单 →</button>
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
                <div className="p-6 text-center text-xs text-muted-foreground">暂无待办。</div>
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
                          → {translateNextAction(na.label)}
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

function useCmsCount(_kind: "products") {
  return useCMS((s) => s.products.filter((p) => p.status === "published").length);
}

// ── Orders list ─────────────────────────────────────────────────────────────
const FILTERS: { key: string; label: string; match: (o: Order) => boolean }[] = [
  { key: "all",              label: "全部",            match: () => true },
  { key: "ft-frame-only",    label: "仅镜框",          match: (o) => orderFulfillmentType(o) === "frame-only" },
  { key: "ft-non-rx",        label: "平光镜片",        match: (o) => orderFulfillmentType(o) === "non-rx" },
  { key: "ft-prescription",  label: "处方镜片",        match: (o) => orderFulfillmentType(o) === "prescription" },
  { key: "rx-pending",       label: "处方待审",        match: (o) => o.status === "rx-pending" },
  { key: "rx-clarification", label: "需客户回复",      match: (o) => o.status === "rx-clarification" },
  { key: "sourcing",         label: "采购中",          match: (o) => o.status === "rx-approved" || o.status === "sourcing" },
  { key: "production",       label: "加工中",          match: (o) => ["sent-to-lab","in-production"].includes(o.status) },
  { key: "qc",               label: "质检中",          match: (o) => o.status === "qc" },
  { key: "ready",            label: "待发货",          match: (o) => o.status === "ready-to-ship" },
  { key: "shipped",          label: "已发货/已送达",   match: (o) => o.status === "shipped" || o.status === "delivered" },
  { key: "after-sale",       label: "售后",            match: (o) => o.status === "after-sale" },
];

function OrdersList({ orders, onOpen, title }: { orders: Order[]; onOpen: (id: string) => void; title: string }) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const active = FILTERS.find((f) => f.key === filter)!;
  const filtered = orders.filter(active.match).filter((o) => !q || (o.name + o.id + o.email + (o.country ?? "")).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{filtered.length} / {orders.length}</p>
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
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="按订单号、客户、邮箱、国家搜索…" className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <Th>订单号</Th><Th>客户</Th><Th>国家</Th><Th>类型</Th>
                <Th>镜框</Th><Th>镜片</Th>
                <Th className="text-right">实付</Th><Th>处方</Th><Th>状态</Th><Th>物流</Th>
                <Th>下一步</Th>
                <Th className="text-right">毛利</Th><Th>创建时间</Th><Th></Th>
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
                    <Td className="text-xs">{translateNextAction(na.label)}</Td>
                    <Td className="text-right">
                      <div className="text-sm font-medium">{money(m.gross)}</div>
                      <div className="text-[11px] text-muted-foreground">{m.marginPct}%</div>
                    </Td>
                    <Td className="text-xs text-muted-foreground">{fmtShort(o.createdAt)}</Td>
                    <Td className="text-right">
                      <button onClick={() => onOpen(o.id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-xs hover:bg-secondary/70">
                        <Eye className="size-3" /> 详情
                      </button>
                    </Td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={14} className="text-center text-sm text-muted-foreground p-10">没有符合条件的订单。</td></tr>
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
  const label = { pending: "待审", approved: "已通过", clarification: "需澄清" } as const;
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
          <ArrowLeft className="size-4" /> 返回订单列表
        </button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">{order.id}</h1>
            <FtBadge ft={ft} />
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">{order.name} · {order.country} · 创建于 {fmtDate(order.createdAt)}</p>
        </div>
        <CopyButtons order={order} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">当前状态</div>
          <div className="mt-2"><StatusBadge status={order.status} /></div>
          <PipelineMini status={order.status} ft={ft} />
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">下一步操作</div>
          <div className="mt-2 text-sm font-medium">{translateNextAction(na.label)}</div>
          {na.nextStatus && (
            <button onClick={() => cart.setStatus(order.id, na.nextStatus!, translateNextAction(na.label))} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-medium">
              {translateNextAction(na.label)} <ChevronRight className="size-3.5" />
            </button>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">风险与提醒</div>
          {risks.length === 0 ? (
            <div className="mt-2 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5"><CheckCircle2 className="size-4" /> 无异常</div>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {risks.map((r, i) => (
                <li key={i} className={`text-xs flex items-start gap-1.5 ${r.level === "danger" ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}`}>
                  <AlertCircle className="size-3.5 mt-0.5 shrink-0" /> <span>{translateRisk(r.message)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <StatusActions order={order} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card title="客户信息">
            <KV k="姓名" v={order.name} />
            <KV k="邮箱" v={order.email} />
            <KV k="电话 / WhatsApp" v={order.phone ?? "—"} />
            <KV k="国家" v={order.country ?? "—"} />
            <KV k="收货地址" v={order.address} />
          </Card>

          <Card title="商品配置">
            {order.lines.map((line) => (
              <div key={line.lineId} className="space-y-1.5">
                <KV k="履约类型" v={<FtBadge ft={ft} />} />
                <KV k="镜框型号" v={`${line.name} × ${line.qty}`} />
                <KV k="镜框颜色" v={line.color} />
                <KV k="镜框尺寸" v={line.size ?? "—"} />
                <KV k="镜框单价" v={money(line.unitPrice)} />
                {ft !== "frame-only" && <>
                  <KV k="处方类型" v={line.lens.rxTypeLabel ?? "—"} />
                  <KV k="镜片功能" v={line.lens.fn?.label ?? "—"} />
                  <KV k="镜片厚度" v={line.lens.thickness?.label ?? "—"} />
                  <KV k="附加镀膜" v={line.lens.addon?.label ?? "—"} />
                </>}
              </div>
            ))}
            <div className="border-t border-border mt-3 pt-3 flex justify-between text-sm">
              <span className="text-muted-foreground">实付合计</span>
              <span className="font-semibold">{money(order.total)}</span>
            </div>
          </Card>

          {ft === "prescription" && <RxReviewSection order={order} />}

          <FrameSourcingSection order={order} />
          {ft !== "frame-only" && <LensSourcingSection order={order} />}

          {ft === "frame-only" ? (
            <Card title="本地工坊 / 加工">
              <div className="text-sm text-muted-foreground">仅镜框订单不需要镜片加工。</div>
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
        <div key={s} className={`h-1.5 flex-1 min-w-[16px] rounded-full ${i <= idx ? "bg-foreground" : "bg-secondary"}`} title={STATUS_LABEL_ZH[s]} />
      ))}
    </div>
  );
}

// ── Status-specific Actions ─────────────────────────────────────────────────
function StatusActions({ order }: { order: Order }) {
  const ft = orderFulfillmentType(order);
  const review = order.rxReview ?? { status: "pending" as const };
  const f = order.sourcing?.frame ?? {};
  const l = order.sourcing?.lens ?? {};
  const lab = order.lab ?? {};
  const updateFrame = (patch: Partial<typeof f>) => cart.updateOrder(order.id, { sourcing: { ...(order.sourcing ?? {}), frame: { ...f, ...patch } } });
  const updateLens  = (patch: Partial<typeof l>) => cart.updateOrder(order.id, { sourcing: { ...(order.sourcing ?? {}), lens:  { ...l, ...patch } } });
  const updateLab   = (patch: Partial<typeof lab>) => cart.updateOrder(order.id, { lab: { ...lab, ...patch } });

  type Btn = { label: string; tone?: "primary" | "danger" | "neutral"; onClick: () => void };
  const buttons: Btn[] = [];

  switch (order.status) {
    case "paid":
      if (ft === "prescription") buttons.push({ label: "送入处方复核", tone: "primary", onClick: () => cart.setStatus(order.id, "rx-pending", "处方已加入复核队列") });
      else buttons.push({ label: "开始采购", tone: "primary", onClick: () => cart.setStatus(order.id, "sourcing", "订单进入采购流程") });
      break;
    case "rx-pending":
      buttons.push(
        { label: "通过处方", tone: "primary", onClick: () => { cart.updateOrder(order.id, { rxReview: { ...review, status: "approved", reviewedAt: Date.now(), reviewer: "Mira" } }); cart.setStatus(order.id, "rx-approved", "处方已通过"); } },
        { label: "请求客户澄清", tone: "danger", onClick: () => { cart.updateOrder(order.id, { rxReview: { ...review, status: "clarification", reviewedAt: Date.now(), reviewer: "Mira" } }); cart.setStatus(order.id, "rx-clarification", "已向客户发送澄清请求"); } },
      );
      break;
    case "rx-clarification":
      buttons.push(
        { label: "标记客户已回复", onClick: () => cart.addEvent(order.id, "客户已回复 — 重新复核处方") },
        { label: "澄清后通过", tone: "primary", onClick: () => { cart.updateOrder(order.id, { rxReview: { ...review, status: "approved", reviewedAt: Date.now(), reviewer: "Mira" } }); cart.setStatus(order.id, "rx-approved", "澄清后通过"); } },
      );
      break;
    case "rx-approved":
      buttons.push({ label: "开始采购", tone: "primary", onClick: () => cart.setStatus(order.id, "sourcing", "开始镜框 & 镜片采购") });
      break;
    case "sourcing":
      buttons.push({ label: "标记镜框已下单", onClick: () => updateFrame({ status: "ordered" }) });
      if (ft !== "frame-only") buttons.push({ label: "标记镜片已下单", onClick: () => updateLens({ status: "ordered" }) });
      buttons.push({ label: "标记镜框已收货", onClick: () => updateFrame({ status: "received" }) });
      if (ft !== "frame-only") buttons.push({ label: "标记镜片已收货", onClick: () => updateLens({ status: "received" }) });
      if (ft === "frame-only") buttons.push({ label: "转入待发货", tone: "primary", onClick: () => cart.setStatus(order.id, "ready-to-ship", "镜框已收货 — 准备发货") });
      else buttons.push({ label: "寄送本地工坊", tone: "primary", onClick: () => { updateLab({ sentToMomAt: Date.now() }); cart.setStatus(order.id, "sent-to-lab", "包裹已寄出至本地工坊"); } });
      break;
    case "sent-to-lab":
      buttons.push(
        { label: "标记工坊已收货", onClick: () => updateLab({ momReceivedAt: Date.now() }) },
        { label: "标记送至眼镜店", onClick: () => updateLab({ sentToShopAt: Date.now() }) },
        { label: "转入加工中", tone: "primary", onClick: () => { updateLab({ productionStatus: "in-progress" }); cart.setStatus(order.id, "in-production", "本地工坊开始加工"); } },
      );
      break;
    case "in-production":
      buttons.push(
        { label: "标记加工完成", onClick: () => updateLab({ productionStatus: "completed" }) },
        { label: "转入质检", tone: "primary", onClick: () => cart.setStatus(order.id, "qc", "加工完成 — 进入质检") },
      );
      break;
    case "qc":
      buttons.push(
        { label: "质检通过", tone: "primary", onClick: () => { updateLab({ qcResult: "pass", qcChecklist: { ...(lab.qcChecklist ?? {}), readyToShip: true } }); cart.addEvent(order.id, "质检通过"); } },
        { label: "请求返工", tone: "danger", onClick: () => { updateLab({ qcResult: "remake" }); cart.setStatus(order.id, "in-production", "质检未通过，请求返工"); } },
        { label: "转入待发货", onClick: () => cart.setStatus(order.id, "ready-to-ship", "质检完成 — 准备发货") },
      );
      break;
    case "ready-to-ship":
      buttons.push({ label: "标记已发货", tone: "primary", onClick: () => { cart.updateOrder(order.id, { shippingInfo: { ...(order.shippingInfo ?? {}), shippedAt: Date.now() } }); cart.setStatus(order.id, "shipped", `已通过 ${order.shippingInfo?.carrier ?? "燕文"} 发货`); } });
      break;
    case "shipped":
      buttons.push(
        { label: "标记已送达", tone: "primary", onClick: () => { cart.updateOrder(order.id, { shippingInfo: { ...(order.shippingInfo ?? {}), deliveredAt: Date.now() } }); cart.setStatus(order.id, "delivered", "已标记送达"); } },
        { label: "开启售后", tone: "danger", onClick: () => cart.setStatus(order.id, "after-sale", "已开启售后") },
      );
      break;
    case "delivered":
      buttons.push({ label: "开启售后", tone: "danger", onClick: () => cart.setStatus(order.id, "after-sale", "已开启售后") });
      break;
    case "after-sale":
      buttons.push({ label: "处理完成 · 标记送达", tone: "primary", onClick: () => cart.setStatus(order.id, "delivered", "售后已处理完成") });
      break;
  }

  if (buttons.length === 0) return null;
  const tones: Record<NonNullable<Btn["tone"]>, string> = {
    primary: "bg-foreground text-background hover:opacity-90",
    danger:  "bg-red-600 text-white hover:bg-red-700",
    neutral: "bg-background border border-border hover:bg-secondary",
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">{STATUS_LABEL_ZH[order.status]} · 可执行操作</div>
      <div className="flex flex-wrap gap-2">
        {buttons.map((b, i) => (
          <button key={i} onClick={b.onClick} className={`px-3 py-1.5 rounded-md text-xs font-medium ${tones[b.tone ?? "neutral"]}`}>
            {b.label}
          </button>
        ))}
      </div>
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
    if (risks.some((r) => /PD/.test(r.message))) { lines.push(`We need your pupillary distance (PD) to cut your lenses. You can measure it from a clear selfie or send a photo of your prescription.`); added = true; }
    if (risks.some((r) => /Axis/.test(r.message))) { lines.push(`Your prescription shows CYL but the AXIS value is missing. Could you double-check your Rx?`); added = true; }
    if (risks.some((r) => /Prism/.test(r.message))) { lines.push(`Your prescription includes prism — our optician will manually verify it before production.`); added = true; }
    if (risks.some((r) => /address/i.test(r.message))) { lines.push(`Could you confirm your full shipping address (street, city, postal code, country)?`); added = true; }
    if (!added) {
      switch (order.status) {
        case "rx-pending": lines.push(`Just a quick note — your prescription is in our review queue and we'll confirm everything within 24 hours.`); break;
        case "rx-approved": case "sourcing": lines.push(`Your prescription is approved! We're now sourcing your ${line?.name} frame${ft !== "frame-only" ? " and lenses" : ""} and will keep you posted.`); break;
        case "sent-to-lab": case "in-production": lines.push(`Quick update — your glasses are being assembled at our partner lab. Expected completion ${fmtShort(order.lab?.expectedCompletionAt) === "—" ? "soon" : fmtShort(order.lab?.expectedCompletionAt)}.`); break;
        case "qc": lines.push(`Your glasses are in final quality check. We'll ship as soon as they pass.`); break;
        case "ready-to-ship": lines.push(`Good news — your order is packed and ready to hand off to Yanwen today.`); break;
        case "shipped": lines.push(`Your order has shipped via ${order.shippingInfo?.carrier ?? "Yanwen"}. Tracking: ${order.shippingInfo?.tracking ?? "—"}. Estimated arrival 13–20 days.`); break;
        case "delivered": lines.push(`Hope your new ${line?.name} arrived safely. Let us know if anything isn't perfect — we're here for adjustments.`); break;
        default: lines.push(`Just a quick update on your order. Let us know if you have any questions!`);
      }
    }
    lines.push(``, `Thanks!`, `Mira · MIRAVUE Team`);
    return lines.join("\n");
  }

  function momNote() {
    const f = order.sourcing?.frame ?? {};
    const l = order.sourcing?.lens ?? {};
    const out = [
      `订单 Order: ${order.id}`,
      `客户 Customer: ${order.name} (${order.country ?? "—"})`,
      `履约类型: ${FULFILLMENT_LABEL_ZH[ft]}`,
      ``,
      `镜框: ${line?.name} · ${line?.color} · ${line?.size ?? "M"}`,
      `  采购平台: ${f.platform ?? "—"}  |  SKU: ${f.sku ?? "—"}`,
      `  到货状态: ${f.status ?? "未下单"}  |  国内单号: ${f.domesticTracking ?? "—"}`,
    ];
    if (ft !== "frame-only") {
      out.push(``, `镜片: ${line?.lens.fn?.label ?? "—"} · ${line?.lens.thickness?.label ?? "—"}`,
        `  供应商: ${l.supplier ?? "—"}  |  到货状态: ${l.status ?? "未下单"}`,
        `  本地加工店: ${order.lab?.localShop ?? "—"}`);
    } else {
      out.push(``, `⚠️ 仅镜框 — 不需要加工，直接装 demo 片寄出`);
    }
    if (ft === "prescription" && rx) {
      out.push(``, `处方: OD ${rx.od?.sph}/${rx.od?.cyl || "—"}/${rx.od?.axis || "—"}  ·  OS ${rx.os?.sph}/${rx.os?.cyl || "—"}/${rx.os?.axis || "—"}  ·  PD ${rx.pd ?? (rx.dontKnowPd ? "未知" : "—")}`,
        rx.hasPrism ? `⚠️ 含棱镜 — 需手工核对` : ``);
    }
    out.push(``, `寄出国家: ${order.country ?? "—"}`, `备注: ${order.internalNotes || "—"}`);
    return out.filter(Boolean).join("\n");
  }

  function labNote() {
    const out = [`订单 Order: ${order.id}`, `镜框: ${line?.name} · ${line?.color} · ${line?.size ?? "M"}`];
    if (ft === "frame-only") out.push(``, `⚠️ 仅镜框 — 仅装 demo 镜片`);
    else {
      out.push(`镜片功能: ${line?.lens.fn?.label ?? "—"}`, `镜片厚度: ${line?.lens.thickness?.label ?? "—"}`, `镀膜: ${line?.lens.addon?.label ?? "标准 AR"}`);
    }
    if (ft === "prescription" && rx) {
      out.push(``, `OD (右眼): SPH ${rx.od?.sph} / CYL ${rx.od?.cyl || "—"} / AXIS ${rx.od?.axis || "—"}`,
        `OS (左眼): SPH ${rx.os?.sph} / CYL ${rx.os?.cyl || "—"} / AXIS ${rx.os?.axis || "—"}`,
        `PD: ${rx.pd ?? (rx.dontKnowPd ? "未知 — 请手工测量" : "—")}`,
        rx.hasPrism ? `⚠️ 含棱镜 — 请人工核对` : ``);
    }
    out.push(``, `预计完工: ${fmtShort(order.lab?.expectedCompletionAt)}`, `特别备注: ${order.internalNotes || "—"}`);
    return out.filter(Boolean).join("\n");
  }

  const btn = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-background hover:bg-secondary";
  const [fallback, setFallback] = useState<string | null>(null);
  const doCopy = (text: string, label: string) => copyText(text, label, (t) => setFallback(t));
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button className={btn} onClick={() => doCopy(customerMsg(), "客户消息已复制")}><Copy className="size-3.5" /> 复制客户消息</button>
        <button className={btn} onClick={() => doCopy(momNote(), "工坊备注已复制")}><Copy className="size-3.5" /> 复制工坊备注</button>
        <button className={btn} onClick={() => doCopy(labNote(), "镜片厂备注已复制")}><Copy className="size-3.5" /> 复制镜片厂备注</button>
      </div>
      {fallback !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setFallback(null)}>
          <div className="bg-card border border-border rounded-xl p-4 max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">手动复制</div>
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setFallback(null)}>关闭</button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">剪贴板权限不可用。请全选后复制。</p>
            <textarea readOnly autoFocus onFocus={(e) => e.currentTarget.select()} className="w-full h-64 text-xs font-mono border border-border rounded-md p-2 bg-background" value={fallback} />
          </div>
        </div>
      )}
    </>
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
  const review = order.rxReview ?? { status: "pending" as const };
  const [notes, setNotes] = useState(review.notes ?? "");
  return (
    <Card title="处方复核">
      <KV k="提交方式" v={rx?.method ?? "—"} />
      {rx?.method === "upload" && <KV k="上传文件" v={rx.fileName ?? "—"} />}
      {rx?.method === "upload" && (
        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3">
          <div className="text-muted-foreground">图片预览</div>
          <div className="h-32 rounded-md border border-dashed border-border bg-muted/30 grid place-items-center text-xs text-muted-foreground">{rx.fileName ? `已上传：${rx.fileName}（点击查看大图）` : "客户尚未上传处方图片"}</div>
        </div>
      )}
      {rx?.od && (
        <>
          <KV k="OD（右眼）" v={`SPH ${rx.od.sph} · CYL ${rx.od.cyl || "—"} · Axis ${rx.od.axis || "—"}`} />
          <KV k="OS（左眼）" v={`SPH ${rx.os?.sph} · CYL ${rx.os?.cyl || "—"} · Axis ${rx.os?.axis || "—"}`} />
          <KV k="PD" v={rx.pd ?? (rx.dontKnowPd ? "客户不知道" : "—")} />
          <KV k="棱镜" v={rx.hasPrism ? "是" : "否"} />
        </>
      )}
      <KV k="审核状态" v={<RxBadge order={order} />} />
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3">
        <div className="text-muted-foreground pt-1.5">审核备注</div>
        <textarea
          value={notes} onChange={(e) => setNotes(e.target.value)}
          onBlur={() => cart.updateOrder(order.id, { rxReview: { ...review, notes } })}
          rows={2} placeholder="对本张处方的内部备注…"
          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={() => { cart.updateOrder(order.id, { rxReview: { status: "approved", notes, reviewedAt: Date.now(), reviewer: "Mira" } }); cart.setStatus(order.id, "rx-approved", "处方已通过"); }} className="px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 text-white">通过处方</button>
        <button onClick={() => { cart.updateOrder(order.id, { rxReview: { status: "clarification", notes, reviewedAt: Date.now(), reviewer: "Mira" } }); cart.setStatus(order.id, "rx-clarification", "已向客户发送澄清请求"); }} className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 text-white">请求客户澄清</button>
      </div>
    </Card>
  );
}

function FrameSourcingSection({ order }: { order: Order }) {
  const f = order.sourcing?.frame ?? {};
  const update = (patch: Partial<typeof f>) => cart.updateOrder(order.id, { sourcing: { ...(order.sourcing ?? {}), frame: { ...f, ...patch } } });
  return (
    <Card title="镜框采购" action={<StatusPill value={f.status ?? "not-ordered"} onChange={(v) => update({ status: v })} />}>
      <EditRow k="采购平台" v={f.platform} onSave={(v) => update({ platform: v })} placeholder="1688 / 淘宝 / 本地" />
      <EditRow k="商品链接" v={f.sourceUrl} onSave={(v) => update({ sourceUrl: v })} placeholder="https://…" />
      <EditRow k="供应商 / 店铺" v={f.supplier} onSave={(v) => update({ supplier: v })} />
      <EditRow k="镜框 SKU" v={f.sku} onSave={(v) => update({ sku: v })} />
      <EditRow k="颜色" v={f.color} onSave={(v) => update({ color: v })} />
      <EditRow k="尺寸" v={f.size} onSave={(v) => update({ size: v })} placeholder="如 52-18-145" />
      <EditRow k="镜框成本 (RMB)" v={f.costRMB?.toString()} onSave={(v) => update({ costRMB: v ? Number(v) : undefined })} type="number" />
      <EditRow k="镜框成本 (USD)" v={f.costUSD?.toString()} onSave={(v) => update({ costUSD: v ? Number(v) : undefined })} type="number" placeholder="自动按汇率换算" />
      <EditRow k="国内运单号" v={f.domesticTracking} onSave={(v) => update({ domesticTracking: v })} placeholder="顺丰 / 圆通 / 京东…" />
      <EditRow k="备注" v={f.notes} onSave={(v) => update({ notes: v })} textarea />
    </Card>
  );
}
function LensSourcingSection({ order }: { order: Order }) {
  const l = order.sourcing?.lens ?? {};
  const update = (patch: Partial<typeof l>) => cart.updateOrder(order.id, { sourcing: { ...(order.sourcing ?? {}), lens: { ...l, ...patch } } });
  return (
    <Card title="镜片采购" action={<StatusPill value={l.status ?? "not-ordered"} onChange={(v) => update({ status: v })} />}>
      <EditRow k="供应商" v={l.supplier} onSave={(v) => update({ supplier: v })} placeholder="温州光学公司" />
      <EditRow k="镜片功能" v={l.fn} onSave={(v) => update({ fn: v })} placeholder="防蓝光 / 变色 / 偏光…" />
      <EditRow k="镜片折射率" v={l.index} onSave={(v) => update({ index: v })} placeholder="1.56 / 1.61 / 1.67 / 1.74" />
      <EditRow k="镜片成本 (RMB)" v={l.costRMB?.toString()} onSave={(v) => update({ costRMB: v ? Number(v) : undefined })} type="number" />
      <EditRow k="镜片成本 (USD)" v={l.costUSD?.toString()} onSave={(v) => update({ costUSD: v ? Number(v) : undefined })} type="number" placeholder="自动按汇率换算" />
      <EditRow k="国内运单号" v={l.domesticTracking} onSave={(v) => update({ domesticTracking: v })} />
      <EditRow k="备注" v={l.notes} onSave={(v) => update({ notes: v })} textarea />
    </Card>
  );
}
function StatusPill({ value, onChange }: { value: "not-ordered" | "ordered" | "received" | string; onChange: (v: "not-ordered" | "ordered" | "received") => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as "not-ordered" | "ordered" | "received")} className="text-xs rounded-md border border-border bg-background px-2 py-1">
      <option value="not-ordered">未下单</option>
      <option value="ordered">已下单</option>
      <option value="received">已收货</option>
    </select>
  );
}

function LabSection({ order }: { order: Order }) {
  const l = order.lab ?? {};
  const update = (patch: Partial<typeof l>) => cart.updateOrder(order.id, { lab: { ...l, ...patch } });
  const checklist = l.qcChecklist ?? {};
  const updateCheck = (patch: Partial<typeof checklist>) => update({ qcChecklist: { ...checklist, ...patch } });
  const ft = orderFulfillmentType(order);
  const allChecks: { key: keyof typeof checklist; label: string; show: boolean }[] = [
    { key: "frameModel",      label: "镜框型号与订单一致",      show: true },
    { key: "frameColor",      label: "镜框颜色与订单一致",      show: true },
    { key: "lensFunction",    label: "镜片功能与订单一致",      show: ft !== "frame-only" },
    { key: "lensThickness",   label: "镜片厚度/折射率一致",     show: ft !== "frame-only" },
    { key: "rxChecked",       label: "处方度数已核对",          show: ft === "prescription" },
    { key: "pdChecked",       label: "PD 已核对",               show: ft === "prescription" },
    { key: "noScratches",     label: "无可见划痕",              show: true },
    { key: "hingesAlignment", label: "铰链与镜架对齐检查",      show: true },
    { key: "packingPhoto",    label: "已上传打包照片",          show: true },
    { key: "readyToShip",     label: "已可发货",                show: true },
  ];
  const checks = allChecks.filter((c) => c.show);
  return (
    <Card title="本地工坊 / 加工">
      <DateRow k="寄给工坊" v={l.sentToMomAt} onSave={(t) => update({ sentToMomAt: t })} />
      <DateRow k="工坊收货" v={l.momReceivedAt} onSave={(t) => update({ momReceivedAt: t })} />
      <EditRow k="本地眼镜店" v={l.localShop} onSave={(v) => update({ localShop: v })} placeholder="例：杭州 Bright Optical" />
      <DateRow k="送至眼镜店" v={l.sentToShopAt} onSave={(t) => update({ sentToShopAt: t })} />
      <DateRow k="预计完工时间" v={l.expectedCompletionAt} onSave={(t) => update({ expectedCompletionAt: t })} />
      <EditRow k="加工费 (RMB)" v={l.processingFeeRMB?.toString()} onSave={(v) => update({ processingFeeRMB: v ? Number(v) : undefined })} type="number" />
      <EditRow k="加工费 (USD)" v={l.processingFeeUSD?.toString()} onSave={(v) => update({ processingFeeUSD: v ? Number(v) : undefined })} type="number" placeholder="自动按汇率换算" />
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 items-start">
        <div className="text-muted-foreground">加工状态</div>
        <select value={l.productionStatus ?? "not-started"} onChange={(e) => update({ productionStatus: e.target.value as "not-started" | "in-progress" | "completed" })} className="text-sm rounded-md border border-border bg-background px-2.5 py-1.5">
          <option value="not-started">未开始</option>
          <option value="in-progress">进行中</option>
          <option value="completed">已完成</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3">
        <div className="text-muted-foreground">质检照片</div>
        <label className="cursor-pointer text-xs px-3 py-1.5 rounded-md border border-dashed border-border w-fit hover:bg-secondary">
          {l.qcPhotoName ?? "上传质检照片（占位）"}
          <input type="file" className="hidden" onChange={(e) => update({ qcPhotoName: e.target.files?.[0]?.name })} />
        </label>
      </div>
      <EditRow k="质检备注" v={l.qcNotes} onSave={(v) => update({ qcNotes: v })} textarea />
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 items-start">
        <div className="text-muted-foreground pt-1">质检清单</div>
        <div className="space-y-1.5">
          {checks.map((c) => (
            <label key={c.key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!checklist[c.key]} onChange={(e) => updateCheck({ [c.key]: e.target.checked })} />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 items-start">
        <div className="text-muted-foreground pt-1.5">质检结果</div>
        <select value={l.qcResult ?? ""} onChange={(e) => update({ qcResult: (e.target.value || undefined) as typeof l.qcResult })} className="text-sm rounded-md border border-border bg-background px-2.5 py-1.5">
          <option value="">— 未决定 —</option>
          <option value="pass">通过</option>
          <option value="remake">需要返工</option>
          <option value="needs-customer-confirm">需客户确认</option>
        </select>
      </div>
      {order.status === "qc" && (
        <p className="text-[11px] text-muted-foreground pt-1">质检操作（通过/返工/转待发货）请在上方<span className="font-medium text-foreground">「下一步操作」</span>面板中执行。</p>
      )}
    </Card>
  );
}
function DateRow({ k, v, onSave }: { k: string; v?: number; onSave: (t: number | undefined) => void }) {
  const value = v ? new Date(v).toISOString().slice(0, 10) : "";
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 items-start">
      <div className="text-muted-foreground sm:pt-1.5 text-xs sm:text-sm">{k}</div>
      <input type="date" defaultValue={value} onBlur={(e) => onSave(e.target.value ? new Date(e.target.value).getTime() : undefined)} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" />
    </div>
  );
}

function ShippingSection({ order }: { order: Order }) {
  const s = order.shippingInfo ?? {};
  const update = (patch: Partial<typeof s>) => cart.updateOrder(order.id, { shippingInfo: { ...s, ...patch } });
  return (
    <Card title="国际物流">
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 items-start">
        <div className="text-muted-foreground pt-1.5">承运商</div>
        <select value={s.carrier ?? "燕文"} onChange={(e) => update({ carrier: e.target.value })} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm">
          <option>燕文</option><option>4PX</option><option>中国邮政</option><option>其他</option>
        </select>
      </div>
      <EditRow k="国际运单号" v={s.tracking} onSave={(v) => update({ tracking: v })} placeholder="YW…" />
      <EditRow k="物流跟踪链接" v={s.trackingUrl} onSave={(v) => update({ trackingUrl: v })} placeholder="https://track.yw56.com.cn/…" />
      <EditRow k="包裹重量 (g)" v={s.weightG?.toString()} onSave={(v) => update({ weightG: v ? Number(v) : undefined })} type="number" />
      <EditRow k="物流费用 (RMB)" v={s.costRMB?.toString()} onSave={(v) => update({ costRMB: v ? Number(v) : undefined })} type="number" />
      <EditRow k="物流费用 (USD)" v={s.costUSD?.toString()} onSave={(v) => update({ costUSD: v ? Number(v) : undefined })} type="number" placeholder="自动按汇率换算" />
      <DateRow k="物流单生成" v={s.labelCreatedAt} onSave={(t) => update({ labelCreatedAt: t })} />
      <DateRow k="发货日期" v={s.shippedAt} onSave={(t) => update({ shippedAt: t })} />
      <DateRow k="预计送达起" v={s.etaStart} onSave={(t) => update({ etaStart: t })} />
      <DateRow k="预计送达止" v={s.etaEnd} onSave={(t) => update({ etaEnd: t })} />
      <DateRow k="实际送达" v={s.deliveredAt} onSave={(t) => update({ deliveredAt: t })} />
      <EditRow k="物流状态" v={s.deliveryStatus} onSave={(v) => update({ deliveryStatus: v })} />
      <EditRow k="物流备注" v={s.trackingNotes} onSave={(v) => update({ trackingNotes: v })} textarea />
    </Card>
  );
}

function NotesSection({ order }: { order: Order }) {
  const [internal, setInternal] = useState(order.internalNotes ?? "");
  const [customer, setCustomer] = useState(order.customerNotes ?? "");
  const [msg, setMsg] = useState("");
  return (
    <Card title="备注与沟通">
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3">
        <div className="text-muted-foreground pt-1.5">内部备注</div>
        <textarea value={internal} onChange={(e) => setInternal(e.target.value)} onBlur={() => cart.updateOrder(order.id, { internalNotes: internal })} rows={2} className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3">
        <div className="text-muted-foreground pt-1.5">客户备注</div>
        <textarea value={customer} onChange={(e) => setCustomer(e.target.value)} onBlur={() => cart.updateOrder(order.id, { customerNotes: customer })} rows={2} className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-3 items-start">
        <div className="text-muted-foreground pt-1.5">添加时间线记录</div>
        <div className="flex gap-2">
          <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="如：已电话联系客户确认处方" className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" />
          <button disabled={!msg} onClick={() => { cart.addEvent(order.id, msg); setMsg(""); }} className="px-3 py-1.5 rounded-md bg-foreground text-background text-xs disabled:opacity-40">
            <MessageSquare className="size-3.5 inline -mt-0.5 mr-1" /> 记录
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
      <div className="text-muted-foreground sm:pt-1.5 text-xs sm:text-sm">{k}</div>
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
    <Card title="毛利估算" action={
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-muted-foreground">¥/$</span>
        <input value={rate} onChange={(e) => setRate(e.target.value)} onBlur={() => cart.updateOrder(order.id, { exchangeRate: Number(rate) || 7.2 })} className="w-14 rounded-md border border-border bg-background px-1.5 py-0.5 text-xs" />
      </div>
    }>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">客户支付</span>
        <span className="font-medium">{money(order.total)}</span>
      </div>
      <div className="border-t border-border my-2" />
      {row("镜框成本", m.frameCost, m.frameCostRMB)}
      {ft !== "frame-only" && row("镜片成本", m.lensCost, m.lensCostRMB)}
      {ft !== "frame-only" && row("加工费用", m.processingFee, m.processingFeeRMB)}
      {row("包装成本", m.packagingCost, m.packagingRMB)}
      {row("国际运费", m.intlShipping, m.intlShippingRMB)}
      {row("支付手续费", m.paymentFee)}
      {row("瑕疵/返工准备金", m.defectReserve)}
      <div className="border-t border-border my-2" />
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">总成本</span>
        <span>{money(m.totalCost)}</span>
      </div>
      <div className="flex justify-between items-baseline mt-3 bg-emerald-500/10 rounded-md px-3 py-2">
        <div>
          <div className="text-xs text-emerald-800 dark:text-emerald-200">预估毛利</div>
          <div className="text-xs text-muted-foreground">{m.marginPct}% 毛利率 · 汇率 ¥{m.rate}</div>
        </div>
        <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{money(m.gross)}</div>
      </div>
    </Card>
  );
}

function TimelineCard({ order }: { order: Order }) {
  const events = [...(order.timeline ?? [])].reverse();
  return (
    <Card title="状态时间线">
      {events.length === 0 ? (
        <div className="text-xs text-muted-foreground">还没有事件。</div>
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
      <div className="text-[11px] text-muted-foreground">完整生命周期：{STATUS_ORDER.map((s) => STATUS_LABEL_ZH[s]).join(" → ")}</div>
    </Card>
  );
}

// suppress unused
void STATUS_META;
