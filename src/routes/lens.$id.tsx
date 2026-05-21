import { createFileRoute, useNavigate, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Layout } from "@/components/site/Layout";
import { getProduct, productImage } from "@/lib/products";
import { cart, type LensChoice } from "@/lib/cart-store";
import { ShieldCheck, Upload } from "lucide-react";

const searchSchema = z.object({
  color: z.string().optional(),
  frameOnly: z.boolean().optional(),
});

export const Route = createFileRoute("/lens/$id")({
  validateSearch: searchSchema,
  loader: ({ params }) => {
    const p = getProduct(params.id);
    if (!p) throw notFound();
    return p;
  },
  head: () => ({ meta: [{ title: "Choose Your Lenses — MIRAVUE" }] }),
  component: LensFlow,
});

const OPTIONS: { key: LensChoice["type"]; label: string; desc: string; priceAdd: number }[] = [
  { key: "frame-only", label: "Frame Only", desc: "Ship with demo lenses for your optician.", priceAdd: 0 },
  { key: "non-rx", label: "Non-Prescription Clear", desc: "Anti-reflective coating, scratch resistant.", priceAdd: 15 },
  { key: "blue-light", label: "Blue Light Blocking", desc: "Reduce digital eye strain. No prescription needed.", priceAdd: 35 },
  { key: "single-vision", label: "Single Vision Prescription", desc: "Distance or reading. Upload or enter your Rx.", priceAdd: 50 },
];

export default function LensFlow() {
  const p = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(search.frameOnly ? 3 : 1);
  const [type, setType] = useState<LensChoice["type"]>(search.frameOnly ? "frame-only" : "non-rx");
  const [rxMethod, setRxMethod] = useState<"upload" | "manual" | "later">("manual");
  const [fileName, setFileName] = useState<string>();
  const [od, setOd] = useState({ sph: "", cyl: "", axis: "" });
  const [os, setOs] = useState({ sph: "", cyl: "", axis: "" });
  const [pd, setPd] = useState("");

  const opt = OPTIONS.find((o) => o.key === type)!;
  const color = search.color ?? p.colors[0].name;

  function addToCart() {
    const lens: LensChoice = {
      type,
      label: opt.label,
      priceAdd: opt.priceAdd,
      ...(type === "single-vision" ? { rx: { method: rxMethod, fileName, od, os, pd } } : {}),
    };
    cart.add({ productId: p.id, name: p.name, color, unitPrice: p.price, lens });
    navigate({ to: "/cart" });
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="text-xs text-muted-foreground mb-4">
          <Link to="/product/$id" params={{ id: p.id }}>← Back to {p.name}</Link>
        </div>

        <header className="text-center mb-8">
          <h1 className="text-4xl">Choose your prescription type</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Every lens is crafted with precision. Select the option that fits your vision needs.</p>
        </header>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10 text-xs">
          {["Lens Type", "Prescription", "Review"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`size-6 rounded-full flex items-center justify-center ${step > i + 1 ? "bg-foreground text-background" : step === i + 1 ? "bg-foreground text-background" : "bg-secondary"}`}>{i + 1}</span>
              <span className={step === i + 1 ? "font-medium" : "text-muted-foreground"}>{s}</span>
              {i < 2 && <span className="text-muted-foreground mx-2">·</span>}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-[1fr_300px] gap-8">
          <div className="space-y-4">
            {step === 1 && (
              <div className="space-y-3">
                {OPTIONS.map((o) => (
                  <button key={o.key} onClick={() => setType(o.key)} className={`w-full text-left border-2 rounded-xl p-5 transition ${type === o.key ? "border-foreground bg-secondary" : "hover:border-foreground/30"}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{o.label}</div>
                        <div className="text-sm text-muted-foreground mt-1">{o.desc}</div>
                      </div>
                      <div className="text-sm font-medium">{o.priceAdd === 0 ? "Included" : `+$${o.priceAdd}`}</div>
                    </div>
                  </button>
                ))}
                <button onClick={() => setStep(type === "single-vision" ? 2 : 3)} className="w-full bg-primary text-primary-foreground py-4 rounded-full font-medium hover:opacity-90 mt-4">Continue</button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex gap-2 text-sm">
                  {(["manual","upload","later"] as const).map((m) => (
                    <button key={m} onClick={() => setRxMethod(m)} className={`px-4 py-2 rounded-full border-2 ${rxMethod === m ? "border-foreground bg-secondary" : ""}`}>
                      {m === "manual" ? "Enter manually" : m === "upload" ? "Upload Rx" : "Send later"}
                    </button>
                  ))}
                </div>

                {rxMethod === "upload" && (
                  <label className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-2 cursor-pointer hover:bg-secondary/40">
                    <Upload className="size-6" />
                    <span className="text-sm font-medium">{fileName ?? "Click or drop your prescription image"}</span>
                    <span className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB</span>
                    <input type="file" className="sr-only" accept="image/*,.pdf" onChange={(e) => setFileName(e.target.files?.[0]?.name)} />
                  </label>
                )}

                {rxMethod === "manual" && (
                  <div className="border rounded-xl p-5 space-y-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground"><th></th><th>SPH</th><th>CYL</th><th>Axis</th></tr>
                      </thead>
                      <tbody>
                        {([["OD (Right)", od, setOd], ["OS (Left)", os, setOs]] as const).map(([label, val, set]) => (
                          <tr key={label}>
                            <td className="py-2 font-medium">{label}</td>
                            {(["sph","cyl","axis"] as const).map((k) => (
                              <td key={k} className="p-1"><input value={val[k]} onChange={(e) => set({ ...val, [k]: e.target.value })} className="w-full border rounded px-2 py-1.5 bg-background" placeholder="—" /></td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div>
                      <label className="text-xs text-muted-foreground">PD (Pupillary Distance)</label>
                      <input value={pd} onChange={(e) => setPd(e.target.value)} className="mt-1 w-32 border rounded px-2 py-1.5 bg-background" placeholder="e.g. 63" />
                    </div>
                  </div>
                )}

                {rxMethod === "later" && (
                  <div className="border rounded-xl p-5 text-sm text-muted-foreground">We'll email you a secure link to add your prescription after checkout.</div>
                )}

                <div className="flex items-start gap-3 bg-accent/10 border border-accent/30 rounded-lg p-4 text-sm">
                  <ShieldCheck className="size-5 mt-0.5 text-accent" />
                  <p>Every prescription is reviewed by a human optician before production. We'll reach out if anything looks off.</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 border-2 py-3 rounded-full">Back</button>
                  <button onClick={() => setStep(3)} className="flex-1 bg-primary text-primary-foreground py-3 rounded-full font-medium">Continue</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="border rounded-xl p-5 space-y-3">
                  <h3 className="font-medium">Order summary</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <img src={productImage(p)} alt="" className="size-16 rounded bg-secondary" />
                    <div className="flex-1">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{color} · {opt.label}</div>
                    </div>
                    <div className="font-medium">${(p.price + opt.priceAdd).toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(type === "single-vision" ? 2 : 1)} className="flex-1 border-2 py-3 rounded-full">Back</button>
                  <button onClick={addToCart} className="flex-1 bg-primary text-primary-foreground py-3 rounded-full font-medium">Add to Cart</button>
                </div>
              </div>
            )}
          </div>

          <aside className="border rounded-xl p-5 h-fit space-y-4 bg-card">
            <img src={productImage(p)} alt="" className="aspect-square w-full rounded-lg bg-secondary" />
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground">{color}</div>
            </div>
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Frame</span><span>${p.price.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>{opt.label}</span><span>{opt.priceAdd === 0 ? "Included" : `+$${opt.priceAdd}`}</span></div>
              <div className="flex justify-between font-medium border-t pt-2 mt-2"><span>Subtotal</span><span>${(p.price + opt.priceAdd).toFixed(2)}</span></div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
