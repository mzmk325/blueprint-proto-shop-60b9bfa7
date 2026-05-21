import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/site/Layout";
import { useCart, cart, cartSubtotal, lineTotal, FREE_SHIPPING_THRESHOLD } from "@/lib/cart-store";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — MIRAVUE" }] }),
  component: Checkout,
});

function Checkout() {
  const { lines } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [contact, setContact] = useState({ email: "", name: "" });
  const [addr, setAddr] = useState({ line1: "", city: "", state: "", zip: "" });
  const [shipping, setShipping] = useState<"standard" | "express">("standard");

  const subtotal = cartSubtotal(lines);
  const shipCost = shipping === "express" ? 14.95 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 6.95;
  const total = subtotal + shipCost;

  function placeOrder() {
    const order = cart.placeOrder({
      email: contact.email, name: contact.name,
      address: `${addr.line1}, ${addr.city}, ${addr.state} ${addr.zip}`,
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
        <div className="flex gap-4 mb-8 text-sm">
          {steps.map((s, i) => (
            <div key={s} className={`flex items-center gap-2 ${step === i + 1 ? "font-medium" : "text-muted-foreground"}`}>
              <span className={`size-6 rounded-full flex items-center justify-center text-xs ${step >= i + 1 ? "bg-foreground text-background" : "bg-secondary"}`}>{i + 1}</span>
              {s}
              {i < 3 && <span className="text-muted-foreground">·</span>}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-[1fr_340px] gap-10">
          <div className="space-y-6">
            {step === 1 && (
              <Section title="Contact information">
                <Field label="Email"><input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className={input} type="email" /></Field>
                <Field label="Full name"><input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className={input} /></Field>
                <button onClick={() => setStep(2)} disabled={!contact.email || !contact.name} className={btn}>Continue to shipping</button>
              </Section>
            )}
            {step === 2 && (
              <Section title="Shipping address">
                <Field label="Address"><input value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} className={input} /></Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="City"><input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className={input} /></Field>
                  <Field label="State"><input value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} className={input} /></Field>
                  <Field label="ZIP"><input value={addr.zip} onChange={(e) => setAddr({ ...addr, zip: e.target.value })} className={input} /></Field>
                </div>
                <div className="space-y-2 pt-2">
                  <p className="text-sm font-medium">Method</p>
                  {([["standard","Standard (13–20 days)", subtotal >= FREE_SHIPPING_THRESHOLD ? "FREE" : "$6.95"], ["express","Express (5–8 days)", "$14.95"]] as const).map(([k, label, price]) => (
                    <label key={k} className={`flex justify-between border rounded-lg p-3 cursor-pointer ${shipping === k ? "border-foreground bg-secondary" : ""}`}>
                      <span className="text-sm"><input type="radio" checked={shipping === k} onChange={() => setShipping(k as "standard" | "express")} className="mr-2" />{label}</span>
                      <span className="text-sm font-medium">{price}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className={btnGhost}>Back</button>
                  <button onClick={() => setStep(3)} disabled={!addr.line1 || !addr.zip} className={btn}>Continue to payment</button>
                </div>
              </Section>
            )}
            {step === 3 && (
              <Section title="Payment">
                <div className="bg-secondary/50 border border-dashed rounded-lg p-6 text-sm text-muted-foreground">
                  💳 Payment integration placeholder. Wire Stripe / Paddle here. For MVP, click continue to simulate.
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className={btnGhost}>Back</button>
                  <button onClick={() => setStep(4)} className={btn}>Continue to review</button>
                </div>
              </Section>
            )}
            {step === 4 && (
              <Section title="Review & place order">
                <div className="text-sm space-y-2">
                  <p><strong>Ship to:</strong> {contact.name}, {addr.line1}, {addr.city} {addr.state} {addr.zip}</p>
                  <p><strong>Email:</strong> {contact.email}</p>
                  <p><strong>Method:</strong> {shipping === "express" ? "Express" : "Standard"}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(3)} className={btnGhost}>Back</button>
                  <button onClick={placeOrder} className={btn}>Place order</button>
                </div>
              </Section>
            )}
          </div>

          <aside className="border rounded-xl p-5 h-fit space-y-3 bg-card">
            <h3 className="font-semibold text-sm">Order ({lines.length})</h3>
            {lines.map((l) => (
              <div key={l.lineId} className="text-sm flex justify-between gap-2">
                <span className="truncate">{l.name} <span className="text-muted-foreground">× {l.qty}</span><br/><span className="text-xs text-muted-foreground">{l.color} · {l.lens.label}</span></span>
                <span>${lineTotal(l).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipCost === 0 ? "FREE" : `$${shipCost.toFixed(2)}`}</span></div>
              <div className="flex justify-between font-semibold pt-2 border-t mt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
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
