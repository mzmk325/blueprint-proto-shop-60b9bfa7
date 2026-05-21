import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { useCart, cart, type OrderStatus } from "@/lib/cart-store";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Orders" }] }),
  component: Admin,
});

const STATUSES: OrderStatus[] = ["pending-review", "approved", "needs-clarification", "fulfillment", "shipped"];
const statusLabel: Record<OrderStatus, string> = {
  "pending-review": "Pending Review", approved: "Approved", "needs-clarification": "Needs Clarification", fulfillment: "Fulfillment", shipped: "Shipped",
};
const statusColor: Record<OrderStatus, string> = {
  "pending-review": "bg-amber-500/15 text-amber-900 dark:text-amber-200",
  approved: "bg-blue-500/15 text-blue-900 dark:text-blue-200",
  "needs-clarification": "bg-red-500/15 text-red-900 dark:text-red-200",
  fulfillment: "bg-purple-500/15 text-purple-900 dark:text-purple-200",
  shipped: "bg-green-500/15 text-green-900 dark:text-green-200",
};

function Admin() {
  const { orders } = useCart();
  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <header className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl">Order review</h1>
            <p className="text-sm text-muted-foreground mt-1">MVP admin · {orders.length} order{orders.length !== 1 && "s"}</p>
          </div>
          <Link to="/" className="text-sm underline">← Back to store</Link>
        </header>

        {orders.length === 0 ? (
          <div className="border rounded-xl p-12 text-center text-sm text-muted-foreground">No orders yet. Place one from the store to see it here.</div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="border rounded-xl p-5 bg-card">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{o.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${statusColor[o.status]}`}>{statusLabel[o.status]}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{new Date(o.createdAt).toLocaleString()} · {o.name} · {o.email}</div>
                    <div className="text-xs text-muted-foreground">{o.address}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${o.total.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{o.shipping}</div>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-3">
                  {o.lines.map((l) => (
                    <div key={l.lineId} className="text-sm grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                      <div>
                        <strong>{l.name}</strong> × {l.qty} — {l.color}, {l.lens.label}
                        {l.lens.rx && (
                          <div className="text-xs text-muted-foreground mt-1 ml-2 border-l pl-2">
                            Rx method: <strong>{l.lens.rx.method}</strong>
                            {l.lens.rx.method === "upload" && l.lens.rx.fileName && <> · file: {l.lens.rx.fileName}</>}
                            {l.lens.rx.method === "manual" && l.lens.rx.od && (
                              <> · OD {l.lens.rx.od.sph}/{l.lens.rx.od.cyl}/{l.lens.rx.od.axis}
                                · OS {l.lens.rx.os?.sph}/{l.lens.rx.os?.cyl}/{l.lens.rx.os?.axis}
                                · PD {l.lens.rx.pd}</>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-muted-foreground">${((l.unitPrice + l.lens.priceAdd) * l.qty).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="border-t mt-4 pt-4 grid md:grid-cols-3 gap-3 items-end">
                  <label className="text-xs">Status
                    <select value={o.status} onChange={(e) => cart.updateOrder(o.id, { status: e.target.value as OrderStatus })} className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background">
                      {STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
                    </select>
                  </label>
                  <label className="text-xs">Tracking number
                    <input defaultValue={o.tracking ?? ""} onBlur={(e) => cart.updateOrder(o.id, { tracking: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background" placeholder="1Z..." />
                  </label>
                  <label className="text-xs">Internal notes
                    <input defaultValue={o.notes ?? ""} onBlur={(e) => cart.updateOrder(o.id, { notes: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background" placeholder="Customer note..." />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
