import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import {
  useCart,
  cart,
  lineTotal,
  cartSubtotal,
  FREE_SHIPPING_THRESHOLD,
  getFulfillmentType,
  getPrescriptionStatus,
  FULFILLMENT_LABEL,
  RX_STATUS_LABEL,
} from "@/lib/cart-store";
import { getProduct, productImage } from "@/lib/products";
import { Trash2, Pencil, BadgePercent } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { usePriceFormatter } from "@/lib/currency-store";
import { computeAutoDiscount, hasOrderedBefore, useActivePromotion } from "@/lib/promotions";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — MIRAVUE" }] }),
  component: CartPage,
});

function CartPage() {
  const { lines } = useCart();
  const { t } = useI18n();
  const fmt = usePriceFormatter();
  const navigate = useNavigate();
  const promo = useActivePromotion();
  const subtotal = cartSubtotal(lines);
  const discount = computeAutoDiscount({ subtotal, hasOrdered: hasOrderedBefore(), promo });
  const applied = discount?.amount ?? 0;
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
                {t("cart.addMore")} <strong>{fmt(remaining)}</strong> {t("cart.forFreeShip")}
              </div>
            ) : (
              <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm">{t("cart.unlockedFree")}</div>
            )}

            <div className="space-y-4">
              {lines.map((l) => {
                const p = getProduct(l.productId);
                const ft = getFulfillmentType(l.lens);
                const rxStatus = getPrescriptionStatus(l.lens);
                const isPrescription = ft === "prescription";
                const isFrameOnly = ft === "frame-only";
                const isNonRx = ft === "non-rx";
                const rxMethodLabel = l.lens.rx
                  ? l.lens.rx.method === "upload" ? t("cart.uploaded")
                  : l.lens.rx.method === "manual" ? t("cart.manual")
                  : t("cart.later")
                  : t("cart.none");

                const pdDisplay = !l.lens.rx ? null
                  : l.lens.rx.dontKnowPd ? t("cart.unknown")
                  : l.lens.rx.pdRight || l.lens.rx.pdLeft ? `R ${l.lens.rx.pdRight || "—"} / L ${l.lens.rx.pdLeft || "—"}`
                  : l.lens.rx.pd || "—";

                return (
                  <div key={l.lineId} className="flex gap-4 border rounded-xl p-4 bg-card">
                    <img src={p ? productImage(p) : ""} alt="" className="size-28 rounded-lg bg-secondary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <div className="min-w-0">
                          <span className={`inline-block text-[10px] uppercase tracking-[0.12em] font-semibold px-2 py-0.5 mb-1.5 ${
                            isFrameOnly ? "bg-slate-200 text-slate-700" :
                            isNonRx ? "bg-blue-100 text-blue-800" :
                            "bg-amber-100 text-amber-800"
                          }`}>{FULFILLMENT_LABEL[ft]}</span>
                          <div className="font-medium text-base">{l.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{l.color}{l.size ? ` · ${l.size}` : ""}</div>
                        </div>
                        <button onClick={() => cart.remove(l.lineId)} className="text-muted-foreground hover:text-foreground shrink-0" aria-label={t("cart.remove")}><Trash2 className="size-4" /></button>
                      </div>

                      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                        <dt className="text-muted-foreground">{t("cart.framePrice")}</dt>
                        <dd className="text-right">{fmt(l.unitPrice)}</dd>

                        {!isFrameOnly && l.lens.rxTypeLabel && <>
                          <dt className="text-muted-foreground">{t("cart.rxType")}</dt>
                          <dd className="text-right">{l.lens.rxTypeLabel}</dd>
                        </>}

                        {!isFrameOnly && l.lens.fn && <>
                          <dt className="text-muted-foreground">{t("cart.fn")}</dt>
                          <dd className="text-right">{l.lens.fn.label} <span className="text-muted-foreground">{l.lens.fn.price > 0 ? `+${fmt(l.lens.fn.price)}` : t("cart.included")}</span></dd>
                        </>}
                        {!isFrameOnly && l.lens.thickness && <>
                          <dt className="text-muted-foreground">{t("cart.thick")}</dt>
                          <dd className="text-right">{l.lens.thickness.label} <span className="text-muted-foreground">{l.lens.thickness.price > 0 ? `+${fmt(l.lens.thickness.price)}` : t("cart.included")}</span></dd>
                        </>}
                        {l.lens.addon && l.lens.addon.key !== "none" && <>
                          <dt className="text-muted-foreground">{t("cart.addon")}</dt>
                          <dd className="text-right">{l.lens.addon.label} <span className="text-muted-foreground">{l.lens.addon.price > 0 ? `+${fmt(l.lens.addon.price)}` : ""}</span></dd>
                        </>}

                        {isPrescription && <>
                          <dt className="text-muted-foreground">{t("cart.rxMethod")}</dt>
                          <dd className="text-right">{rxMethodLabel}</dd>
                          <dt className="text-muted-foreground">{t("cart.pd")}</dt>
                          <dd className="text-right">{pdDisplay}</dd>
                          <dt className="text-muted-foreground">{t("cart.rxStatus")}</dt>
                          <dd className="text-right text-sale font-medium">{RX_STATUS_LABEL[rxStatus]}</dd>
                        </>}

                        {isNonRx && <>
                          <dt className="text-muted-foreground">{t("cart.rxStatus")}</dt>
                          <dd className="text-right">{t("cart.noRxRequired")}</dd>
                        </>}
                      </dl>

                      <p className={`mt-3 text-[11px] p-2 border-l-2 ${
                        isFrameOnly ? "border-slate-400 bg-slate-50 text-slate-700" :
                        isNonRx ? "border-blue-400 bg-blue-50 text-blue-800" :
                        "border-sale bg-sale/5 text-foreground"
                      }`}>
                        {isFrameOnly && t("cart.shipsDemo")}
                        {isNonRx && t("cart.noRxRequired")}
                        {isPrescription && t("cart.trustNote")}
                      </p>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60 gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border rounded-full">
                            <button onClick={() => cart.setQty(l.lineId, l.qty - 1)} className="size-8">−</button>
                            <span className="w-8 text-center text-sm">{l.qty}</span>
                            <button onClick={() => cart.setQty(l.lineId, l.qty + 1)} className="size-8">+</button>
                          </div>
                          {!isFrameOnly && (
                            <button onClick={() => { cart.remove(l.lineId); navigate({ to: "/lens/$id", params: { id: l.productId }, search: { color: l.color } }); }} className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                              <Pencil className="size-3" /> {t("cart.editLenses")}
                            </button>
                          )}
                          {isPrescription && (
                            <button onClick={() => { cart.remove(l.lineId); navigate({ to: "/lens/$id", params: { id: l.productId }, search: { color: l.color } }); }} className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                              <Pencil className="size-3" /> {t("cart.editRx")}
                            </button>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{t("cart.itemTotal")}</div>
                          <div className="font-medium text-base">{fmt(lineTotal(l))}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="border rounded-xl p-6 h-fit bg-card space-y-4">
            <h2 className="font-semibold">{t("cart.summary")}</h2>
            {discount && (
              <div className="flex items-start gap-2 rounded-lg bg-sale/10 border border-sale/30 p-3 text-xs">
                <BadgePercent className="size-4 text-sale shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sale">{discount.label}</div>
                  <div className="text-muted-foreground mt-0.5">{discount.promo.frontCopy}</div>
                </div>
              </div>
            )}
            <div className="space-y-1 text-sm border-t pt-4">
              <div className="flex justify-between"><span>{t("cart.subtotal")}</span><span>{fmt(subtotal)}</span></div>
              {applied > 0 && <div className="flex justify-between text-sale"><span>{discount?.label ?? t("cart.discount")}</span><span>−{fmt(applied)}</span></div>}
              <div className="flex justify-between"><span>{t("cart.shipping")}</span><span>{shipping === 0 ? t("cart.free") : fmt(shipping)}</span></div>
              <div className="flex justify-between font-semibold text-base border-t pt-2 mt-2"><span>{t("cart.total")}</span><span>{fmt(total)}</span></div>
            </div>
            <Link to="/checkout" className="block bg-primary text-primary-foreground py-3 rounded-full text-center font-medium hover:opacity-90">{t("cart.checkout")}</Link>
            <p className="text-xs text-muted-foreground text-center">{t("cart.eligible")}</p>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
