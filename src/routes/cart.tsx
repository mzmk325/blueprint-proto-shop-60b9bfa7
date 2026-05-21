import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { useCart, cart, lineTotal, cartSubtotal, FREE_SHIPPING_THRESHOLD } from "@/lib/cart-store";
import { getProduct, productImage } from "@/lib/products";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — MIRAVUE" }] }),
  component: CartPage,
});

function CartPage() {
  const { lines } = useCart();
  const { t } = useI18n();
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(0);
  const subtotal = cartSubtotal(lines);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 6.95;
  const total = subtotal - applied + shipping;

  if (lines.length === 0) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-3xl">{t("cart.empty")}</h1>
          <p className="text-sm text-muted-foreground mt-2">{t("cart.emptyDesc")}</p>
          <Link to="/category/$slug" params={{ slug: "all" }} className="inline-block mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm">{t("cart.shopFrames")}</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-4xl mb-8">{t("cart.title")}</h1>
        <div className="grid md:grid-cols-[1fr_360px] gap-10">
          <div>
            {remaining > 0 ? (
              <div className="mb-6 bg-accent/10 border border-accent/30 rounded-lg p-3 text-sm">
                {t("cart.addMore")} <strong>${remaining.toFixed(2)}</strong> {t("cart.forFreeShip")}
              </div>
            ) : (
              <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm">{t("cart.unlockedFree")}</div>
            )}

            <div className="space-y-4">
              {lines.map((l) => {
                const p = getProduct(l.productId);
                return (
                  <div key={l.lineId} className="flex gap-4 border rounded-xl p-4 bg-card">
                    <img src={p ? productImage(p) : ""} alt="" className="size-24 rounded-lg bg-secondary" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <div>
                          <div className="font-medium">{l.name}</div>
                          <div className="text-xs text-muted-foreground">{l.color} · {l.lens.label}</div>
                          {l.lens.rx && <div className="text-xs text-muted-foreground mt-1">Rx: {l.lens.rx.method === "upload" ? `${t("cart.rxUploaded")} (${l.lens.rx.fileName ?? "file"})` : l.lens.rx.method === "manual" ? t("cart.rxManual") : t("cart.rxLater")} · {t("cart.rxPending")}</div>}
                        </div>
                        <button onClick={() => cart.remove(l.lineId)} className="text-muted-foreground hover:text-foreground"><Trash2 className="size-4" /></button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border rounded-full">
                          <button onClick={() => cart.setQty(l.lineId, l.qty - 1)} className="size-8">−</button>
                          <span className="w-8 text-center text-sm">{l.qty}</span>
                          <button onClick={() => cart.setQty(l.lineId, l.qty + 1)} className="size-8">+</button>
                        </div>
                        <div className="font-medium">${lineTotal(l).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="border rounded-xl p-6 h-fit bg-card space-y-4">
            <h2 className="font-semibold">{t("cart.summary")}</h2>
            <div className="flex gap-2">
              <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder={t("cart.coupon")} className="flex-1 border rounded px-3 py-2 text-sm bg-background" />
              <button onClick={() => { if (coupon.toUpperCase() === "HELLO15") setApplied(subtotal * 0.15); }} className="px-4 py-2 border rounded text-sm">{t("cart.apply")}</button>
            </div>
            <div className="space-y-1 text-sm border-t pt-4">
              <div className="flex justify-between"><span>{t("cart.subtotal")}</span><span>${subtotal.toFixed(2)}</span></div>
              {applied > 0 && <div className="flex justify-between text-sale"><span>{t("cart.discount")}</span><span>−${applied.toFixed(2)}</span></div>}
              <div className="flex justify-between"><span>{t("cart.shipping")}</span><span>{shipping === 0 ? t("cart.free") : `$${shipping.toFixed(2)}`}</span></div>
              <div className="flex justify-between font-semibold text-base border-t pt-2 mt-2"><span>{t("cart.total")}</span><span>${total.toFixed(2)}</span></div>
            </div>
            <Link to="/checkout" className="block bg-primary text-primary-foreground py-3 rounded-full text-center font-medium hover:opacity-90">{t("cart.checkout")}</Link>
            <p className="text-xs text-muted-foreground text-center">{t("cart.eligible")}</p>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
