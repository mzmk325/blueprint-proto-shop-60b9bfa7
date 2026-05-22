import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Layout } from "@/components/site/Layout";
import {
  useCart,
  cart,
  cartSubtotal,
  lineTotal,
  FREE_SHIPPING_THRESHOLD,
  getFulfillmentType,
  getPrescriptionStatus,
  FULFILLMENT_LABEL,
  RX_STATUS_LABEL,
} from "@/lib/cart-store";
import { useI18n } from "@/lib/i18n";
import { usePriceFormatter } from "@/lib/currency-store";
import { computeAutoDiscount, hasOrderedBefore, markOrderedNow, useActivePromotion } from "@/lib/promotions";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — MIRAVUE" }] }),
  component: Checkout,
});

function Checkout() {
  const { lines } = useCart();
  const { t } = useI18n();
  const fmt = usePriceFormatter();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [contact, setContact] = useState({ email: "", name: "", phone: "" });
  const [addr, setAddr] = useState({ country: "United States", line1: "", line2: "", city: "", state: "", zip: "" });
  const [shipping, setShipping] = useState<"standard" | "express">("standard");
  const [ackFrameOnly, setAckFrameOnly] = useState(false);
  const [ackNonRx, setAckNonRx] = useState(false);
  const [ackRx, setAckRx] = useState(false);
  const [ackPdUnknown, setAckPdUnknown] = useState(false);

  const subtotal = cartSubtotal(lines);
  const shipCost = shipping === "express" ? 14.95 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 6.95;
  const promo = useActivePromotion();
  const discount = computeAutoDiscount({ subtotal, hasOrdered: hasOrderedBefore(), promo });
  const discountAmt = discount?.amount ?? 0;
  const total = subtotal - discountAmt + shipCost;

  const flags = useMemo(() => {
    let frameOnly = false, nonRx = false, prescription = false, pdUnknown = false;
    for (const l of lines) {
      const ft = getFulfillmentType(l.lens);
      if (ft === "frame-only") frameOnly = true;
      if (ft === "non-rx") nonRx = true;
      if (ft === "prescription") prescription = true;
      if (getPrescriptionStatus(l.lens) === "pd-unknown") pdUnknown = true;
    }
    return { frameOnly, nonRx, prescription, pdUnknown };
  }, [lines]);

  const canPlace =
    (!flags.frameOnly || ackFrameOnly) &&
    (!flags.nonRx || ackNonRx) &&
    (!flags.prescription || ackRx) &&
    (!flags.pdUnknown || ackPdUnknown);

  function placeOrder() {
    const order = cart.placeOrder({
      email: contact.email, name: contact.name, phone: contact.phone, country: addr.country,
      address: `${addr.line1}${addr.line2 ? ", " + addr.line2 : ""}, ${addr.city}, ${addr.state} ${addr.zip}, ${addr.country}`,
      shipping, shippingCost: shipCost, subtotal, total,
    });
    markOrderedNow();
    navigate({ to: "/order/$id", params: { id: order.id } });
  }

  if (lines.length === 0) {
    return <Layout><div className="p-20 text-center"><p>{t("co.cartEmpty")}</p><Link to="/" className="underline mt-4 inline-block">{t("co.continueShop")}</Link></div></Layout>;
  }

  const steps = [t("co.step.contact"), t("co.step.shipping"), t("co.step.payment"), t("co.step.review")];

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl mb-6">{t("co.title")}</h1>
        <div className="flex flex-wrap gap-x-3 gap-y-2 mb-8 text-xs sm:text-sm">
          {steps.map((s, i) => (
            <div key={s} className={`flex items-center gap-1.5 sm:gap-2 ${step === i + 1 ? "font-medium" : "text-muted-foreground"}`}>
              <span className={`shrink-0 inline-flex min-w-5 h-5 sm:min-w-6 sm:h-6 px-1 rounded-full items-center justify-center text-[10px] sm:text-xs leading-none ${step >= i + 1 ? "bg-foreground text-background" : "bg-secondary"}`}>{i + 1}</span>
              {s}
              {i < 3 && <span className="text-muted-foreground hidden sm:inline">·</span>}
            </div>
          ))}
        </div>


        <div className="grid md:grid-cols-[1fr_360px] gap-10">
          <div className="space-y-6">
            {step === 1 && (
              <Section title={t("co.contact.title")}>
                <Field label={t("co.email")}><input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className={input} type="email" /></Field>
                <Field label={t("co.fullName")}><input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className={input} /></Field>
                <Field label={t("co.phoneLong")}>
                  <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={input} type="tel" placeholder="+1 555 123 4567" />
                  <p className="text-[11px] text-muted-foreground mt-1">{t("co.phoneHelp")}</p>
                </Field>
                <button onClick={() => setStep(2)} disabled={!contact.email || !contact.name} className={btn}>{t("co.continueShip")}</button>
              </Section>
            )}
            {step === 2 && (
              <Section title={t("co.ship.title")}>
                <Field label={t("co.country")}>
                  <select value={addr.country} onChange={(e) => setAddr({ ...addr, country: e.target.value })} className={input}>
                    {["United States","Canada","United Kingdom","Australia","Germany","France","Italy","Spain","Norway","Brazil","Japan","South Korea","UAE","China","Other"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label={t("co.address1")}><input value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} className={input} /></Field>
                <Field label={t("co.address2")}><input value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} className={input} /></Field>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label={t("co.city")}><input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className={input} /></Field>
                  <Field label={t("co.stateLong")}><input value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} className={input} /></Field>
                  <Field label={t("co.zipLong")}><input value={addr.zip} onChange={(e) => setAddr({ ...addr, zip: e.target.value })} className={input} /></Field>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-sm font-medium">{t("co.shippingMethod")}</p>
                  {([["standard", t("co.standard"), subtotal >= FREE_SHIPPING_THRESHOLD ? t("cart.free") : fmt(6.95)], ["express", t("co.express"), fmt(14.95)]] as const).map(([k, label, price]) => (
                    <label key={k} className={`flex justify-between border rounded-lg p-3 cursor-pointer ${shipping === k ? "border-foreground bg-secondary" : ""}`}>
                      <span className="text-sm"><input type="radio" checked={shipping === k} onChange={() => setShipping(k as "standard" | "express")} className="mr-2" />{label}</span>
                      <span className="text-sm font-medium">{price}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className={btnGhost}>{t("common.back")}</button>
                  <button onClick={() => setStep(3)} disabled={!addr.line1 || !addr.zip || !addr.city} className={btn}>{t("co.continuePay")}</button>
                </div>
              </Section>
            )}
            {step === 3 && (
              <Section title={t("co.pay.title")}>
                <div className="bg-secondary/50 border border-dashed rounded-lg p-6 text-sm text-muted-foreground">
                  {t("co.payMock")}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className={btnGhost}>{t("common.back")}</button>
                  <button onClick={() => setStep(4)} className={btn}>{t("co.continueReview")}</button>
                </div>
              </Section>
            )}
            {step === 4 && (
              <Section title={t("co.review.title")}>
                <div className="text-sm space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">{t("co.shipTitle")}</p>
                    <p>{contact.name} · {contact.email}{contact.phone ? ` · ${contact.phone}` : ""}</p>
                    <p>{addr.line1}{addr.line2 ? ", " + addr.line2 : ""}, {addr.city} {addr.state} {addr.zip}, {addr.country}</p>
                    <p className="text-muted-foreground">{shipping === "express" ? t("co.express") : t("co.standard")} · {t("co.estimatedDelivery")}</p>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{t("co.items")}</p>
                    {lines.map((l) => {
                      const ft = getFulfillmentType(l.lens);
                      const rxStatus = getPrescriptionStatus(l.lens);
                      const isFrameOnly = ft === "frame-only";
                      return (
                        <div key={l.lineId} className="border rounded-lg p-3 bg-card">
                          <div className="flex justify-between gap-2">
                            <div>
                              <span className="text-[10px] uppercase tracking-[0.12em] font-semibold bg-secondary px-2 py-0.5">{FULFILLMENT_LABEL[ft]}</span>
                              <div className="font-medium mt-1">{l.name} <span className="text-xs text-muted-foreground">· {l.color} · {l.size ?? "M"}</span></div>
                            </div>
                            <div className="text-right text-sm">{fmt(lineTotal(l))}</div>
                          </div>
                          {isFrameOnly ? (
                            <p className="text-xs text-muted-foreground mt-2">{t("co.frameOnlyNote")}</p>
                          ) : (
                            <dl className="grid grid-cols-2 gap-y-1 text-xs mt-2">
                              {l.lens.fn && <><dt className="text-muted-foreground">{t("cart.fn")}</dt><dd>{l.lens.fn.label}</dd></>}
                              {l.lens.thickness && <><dt className="text-muted-foreground">{t("cart.thick")}</dt><dd>{l.lens.thickness.label}</dd></>}
                              {l.lens.addon && l.lens.addon.key !== "none" && <><dt className="text-muted-foreground">{t("cart.addon")}</dt><dd>{l.lens.addon.label}</dd></>}
                              <dt className="text-muted-foreground">{t("cart.rxStatus")}</dt><dd className="text-sale">{RX_STATUS_LABEL[rxStatus]}</dd>
                              {l.lens.rx?.dontKnowPd && <><dt className="text-muted-foreground">{t("cart.pd")}</dt><dd>{t("co.pdUnknownNote")}</dd></>}
                            </dl>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    {flags.frameOnly && (
                      <label className="flex gap-2 text-sm items-start"><input type="checkbox" checked={ackFrameOnly} onChange={(e) => setAckFrameOnly(e.target.checked)} className="mt-1 size-4" /> {t("co.ackFrameOnly")}</label>
                    )}
                    {flags.nonRx && (
                      <label className="flex gap-2 text-sm items-start"><input type="checkbox" checked={ackNonRx} onChange={(e) => setAckNonRx(e.target.checked)} className="mt-1 size-4" /> {t("co.ackNonRx")}</label>
                    )}
                    {flags.prescription && (
                      <label className="flex gap-2 text-sm items-start"><input type="checkbox" checked={ackRx} onChange={(e) => setAckRx(e.target.checked)} className="mt-1 size-4" /> {t("co.ackRx")}</label>
                    )}
                    {flags.pdUnknown && (
                      <label className="flex gap-2 text-sm items-start"><input type="checkbox" checked={ackPdUnknown} onChange={(e) => setAckPdUnknown(e.target.checked)} className="mt-1 size-4" /> {t("co.ackPdUnknown")}</label>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(3)} className={btnGhost}>{t("common.back")}</button>
                  <button onClick={placeOrder} disabled={!canPlace} className={btn}>{t("co.place")}</button>
                </div>
              </Section>
            )}
          </div>

          <aside className="border rounded-xl p-5 h-fit space-y-3 bg-card">
            <h3 className="font-semibold text-sm">{t("co.order")} ({lines.length})</h3>
            {lines.map((l) => {
              const ft = getFulfillmentType(l.lens);
              return (
                <div key={l.lineId} className="text-sm border-b pb-2 last:border-b-0">
                  <div className="flex justify-between gap-2">
                    <span className="truncate font-medium">{l.name} <span className="text-xs text-muted-foreground">× {l.qty}</span></span>
                    <span>{fmt(lineTotal(l))}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{FULFILLMENT_LABEL[ft]} · {l.color}</div>
                </div>
              );
            })}
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>{t("cart.subtotal")}</span><span>{fmt(subtotal)}</span></div>
              {discount && <div className="flex justify-between text-sale"><span>{discount.label}</span><span>−{fmt(discountAmt)}</span></div>}
              <div className="flex justify-between"><span>{t("cart.shipping")}</span><span>{shipCost === 0 ? t("cart.free") : fmt(shipCost)}</span></div>
              <div className="flex justify-between font-semibold pt-2 border-t mt-2"><span>{t("cart.total")}</span><span>{fmt(total)}</span></div>
            </div>
            <p className="text-[11px] text-muted-foreground">{t("co.estimatedDelivery")}</p>
          </aside>
        </div>
      </div>
    </Layout>
  );
}

const input = "w-full border rounded-lg px-3 py-2 bg-background text-sm";
const btn = "w-full bg-primary text-primary-foreground py-3 rounded-full font-medium hover:opacity-90 disabled:opacity-40";
const btnGhost = "w-full border-2 py-3 rounded-full font-medium hover:bg-secondary";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="border rounded-xl p-6 space-y-4 bg-card"><h2 className="font-semibold">{title}</h2>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-muted-foreground">{label}</label><div className="mt-1">{children}</div></div>;
}
