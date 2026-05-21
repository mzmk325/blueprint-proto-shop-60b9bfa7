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

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — MIRAVUE" }] }),
  component: Checkout,
});

function Checkout() {
  const { lines } = useCart();
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
  const total = subtotal + shipCost;

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
    navigate({ to: "/order/$id", params: { id: order.id } });
  }

  if (lines.length === 0) {
    return <Layout><div className="p-20 text-center"><p>Your cart is empty.</p><Link to="/" className="underline mt-4 inline-block">Continue shopping</Link></div></Layout>;
  }

  const steps = ["Contact", "Shipping", "Payment", "Review"];

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl mb-6">Checkout</h1>
        <div className="flex flex-wrap gap-x-3 gap-y-2 mb-8 text-xs sm:text-sm">
          {steps.map((s, i) => (
            <div key={s} className={`flex items-center gap-1.5 sm:gap-2 ${step === i + 1 ? "font-medium" : "text-muted-foreground"}`}>
              <span className={`size-5 sm:size-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs ${step >= i + 1 ? "bg-foreground text-background" : "bg-secondary"}`}>{i + 1}</span>
              {s}
              {i < 3 && <span className="text-muted-foreground hidden sm:inline">·</span>}
            </div>
          ))}
        </div>


        <div className="grid md:grid-cols-[1fr_360px] gap-10">
          <div className="space-y-6">
            {step === 1 && (
              <Section title="Contact information">
                <Field label="Email"><input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className={input} type="email" /></Field>
                <Field label="Full name"><input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className={input} /></Field>
                <Field label="Phone / WhatsApp for order updates">
                  <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={input} type="tel" placeholder="+1 555 123 4567" />
                  <p className="text-[11px] text-muted-foreground mt-1">Used only if we need to confirm your prescription or shipping details.</p>
                </Field>
                <button onClick={() => setStep(2)} disabled={!contact.email || !contact.name} className={btn}>Continue to shipping</button>
              </Section>
            )}
            {step === 2 && (
              <Section title="Shipping address">
                <Field label="Country">
                  <select value={addr.country} onChange={(e) => setAddr({ ...addr, country: e.target.value })} className={input}>
                    {["United States","Canada","United Kingdom","Australia","Germany","France","Italy","Spain","Norway","Brazil","Japan","South Korea","UAE","China","Other"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Address line 1"><input value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} className={input} /></Field>
                <Field label="Address line 2 (optional)"><input value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} className={input} /></Field>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="City"><input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className={input} /></Field>
                  <Field label="State / Region"><input value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} className={input} /></Field>
                  <Field label="ZIP / Postal code"><input value={addr.zip} onChange={(e) => setAddr({ ...addr, zip: e.target.value })} className={input} /></Field>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-sm font-medium">Shipping method · Estimated delivery 13–20 days</p>
                  {([["standard", "Standard (13–20 days)", subtotal >= FREE_SHIPPING_THRESHOLD ? "FREE" : "$6.95"], ["express", "Express (5–8 days)", "$14.95"]] as const).map(([k, label, price]) => (
                    <label key={k} className={`flex justify-between border rounded-lg p-3 cursor-pointer ${shipping === k ? "border-foreground bg-secondary" : ""}`}>
                      <span className="text-sm"><input type="radio" checked={shipping === k} onChange={() => setShipping(k as "standard" | "express")} className="mr-2" />{label}</span>
                      <span className="text-sm font-medium">{price}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className={btnGhost}>Back</button>
                  <button onClick={() => setStep(3)} disabled={!addr.line1 || !addr.zip || !addr.city} className={btn}>Continue to payment</button>
                </div>
              </Section>
            )}
            {step === 3 && (
              <Section title="Payment">
                <div className="bg-secondary/50 border border-dashed rounded-lg p-6 text-sm text-muted-foreground">
                  💳 Mock payment — no real card is charged. Click continue to simulate payment.
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className={btnGhost}>Back</button>
                  <button onClick={() => setStep(4)} className={btn}>Continue to review</button>
                </div>
              </Section>
            )}
            {step === 4 && (
              <Section title="Review & place order">
                <div className="text-sm space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">Shipping</p>
                    <p>{contact.name} · {contact.email}{contact.phone ? ` · ${contact.phone}` : ""}</p>
                    <p>{addr.line1}{addr.line2 ? ", " + addr.line2 : ""}, {addr.city} {addr.state} {addr.zip}, {addr.country}</p>
                    <p className="text-muted-foreground">{shipping === "express" ? "Express (5–8 days)" : "Standard (13–20 days)"} · Estimated delivery 13–20 days</p>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Items</p>
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
                            <div className="text-right text-sm">${lineTotal(l).toFixed(2)}</div>
                          </div>
                          {isFrameOnly ? (
                            <p className="text-xs text-muted-foreground mt-2">Frame only order · No prescription or lens production required.</p>
                          ) : (
                            <dl className="grid grid-cols-2 gap-y-1 text-xs mt-2">
                              {l.lens.fn && <><dt className="text-muted-foreground">Lens function</dt><dd>{l.lens.fn.label}</dd></>}
                              {l.lens.thickness && <><dt className="text-muted-foreground">Lens thickness</dt><dd>{l.lens.thickness.label}</dd></>}
                              {l.lens.addon && l.lens.addon.key !== "none" && <><dt className="text-muted-foreground">Add-on</dt><dd>{l.lens.addon.label}</dd></>}
                              <dt className="text-muted-foreground">Rx status</dt><dd className="text-sale">{RX_STATUS_LABEL[rxStatus]}</dd>
                              {l.lens.rx?.dontKnowPd && <><dt className="text-muted-foreground">PD</dt><dd>Unknown — we'll contact you</dd></>}
                            </dl>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    {flags.frameOnly && (
                      <label className="flex gap-2 text-sm items-start"><input type="checkbox" checked={ackFrameOnly} onChange={(e) => setAckFrameOnly(e.target.checked)} className="mt-1 size-4" /> I understand this order ships with demo lenses only.</label>
                    )}
                    {flags.nonRx && (
                      <label className="flex gap-2 text-sm items-start"><input type="checkbox" checked={ackNonRx} onChange={(e) => setAckNonRx(e.target.checked)} className="mt-1 size-4" /> I understand this order does not include prescription correction.</label>
                    )}
                    {flags.prescription && (
                      <label className="flex gap-2 text-sm items-start"><input type="checkbox" checked={ackRx} onChange={(e) => setAckRx(e.target.checked)} className="mt-1 size-4" /> I confirm my prescription information is accurate.</label>
                    )}
                    {flags.pdUnknown && (
                      <label className="flex gap-2 text-sm items-start"><input type="checkbox" checked={ackPdUnknown} onChange={(e) => setAckPdUnknown(e.target.checked)} className="mt-1 size-4" /> I understand the team may contact me before production.</label>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(3)} className={btnGhost}>Back</button>
                  <button onClick={placeOrder} disabled={!canPlace} className={btn}>Place order</button>
                </div>
              </Section>
            )}
          </div>

          <aside className="border rounded-xl p-5 h-fit space-y-3 bg-card">
            <h3 className="font-semibold text-sm">Order ({lines.length})</h3>
            {lines.map((l) => {
              const ft = getFulfillmentType(l.lens);
              return (
                <div key={l.lineId} className="text-sm border-b pb-2 last:border-b-0">
                  <div className="flex justify-between gap-2">
                    <span className="truncate font-medium">{l.name} <span className="text-xs text-muted-foreground">× {l.qty}</span></span>
                    <span>${lineTotal(l).toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{FULFILLMENT_LABEL[ft]} · {l.color}</div>
                </div>
              );
            })}
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipCost === 0 ? "FREE" : `$${shipCost.toFixed(2)}`}</span></div>
              <div className="flex justify-between font-semibold pt-2 border-t mt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
            <p className="text-[11px] text-muted-foreground">Estimated delivery: 13–20 days</p>
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
