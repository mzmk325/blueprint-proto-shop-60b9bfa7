import { createFileRoute, useNavigate, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Layout } from "@/components/site/Layout";
import { getProduct, productImage } from "@/lib/products";
import { cart, type LensChoice } from "@/lib/cart-store";
import { ArrowLeft, X, Upload, Camera, HelpCircle, Check, Pencil, ChevronDown } from "lucide-react";

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

type RxType = "single-vision" | "reading" | "non-rx" | "frame-only";
type Step = "rx-type" | "rx-entry" | "lens-type" | "lens-tech" | "material";

type LensTypeKey = "standard" | "blue-light" | "photochromic" | "photo-blue" | "sun-tint";
const LENS_TYPES: { key: LensTypeKey; label: string; desc: string; priceAdd: number; promo?: string; icon: string }[] = [
  { key: "standard", label: "Standard Lenses", desc: "Crystal clarity for everyday vision.", priceAdd: 0, icon: "◐" },
  { key: "blue-light", label: "Blue Light Blocking", desc: "Filters screen glare. Comfort all day.", priceAdd: 35, icon: "◑" },
  { key: "photochromic", label: "Photochromic", desc: "Clear indoors. Darkens in sunlight.", priceAdd: 75, promo: "15% Off", icon: "◐" },
  { key: "photo-blue", label: "Photochromic + Blue Light", desc: "2-in-1: sun adaptive and screen comfort.", priceAdd: 95, promo: "15% Off", icon: "◓" },
  { key: "sun-tint", label: "Sun Tint", desc: "Fixed tint for a sunglass look.", priceAdd: 45, icon: "●" },
];

type TechKey = "standard" | "advanced" | "premium";
const TECHS: { key: TechKey; label: string; oldPrice: number; price: number; features: string[]; recommended?: boolean }[] = [
  { key: "standard", label: "Standard Lenses", oldPrice: 55, price: 46.75, features: ["1.57 Mid-Index", "UV protective"] },
  { key: "advanced", label: "Advanced Lenses", oldPrice: 75, price: 63.75, features: ["1.61 High-Index · Thinner", "UV protective", "Water-resistant", "Dust-repellent"], recommended: true },
  { key: "premium", label: "Premium Lenses", oldPrice: 100, price: 85, features: ["1.67 High-Index · Thinnest", "UV protective", "Water-resistant", "Dust-repellent"] },
];

const MATERIALS = [
  { key: "mr-pro", label: "MR™ Pro", desc: "Impact and chip resistant. Lighter for all-day wear.", priceAdd: 17, recommended: true },
  { key: "standard", label: "Standard Material", desc: "Quality lenses for everyday wear.", priceAdd: 0 },
];

const SPH = ["+6.00","+5.00","+4.00","+3.00","+2.00","+1.50","+1.00","+0.75","+0.50","+0.25","0.00","-0.25","-0.50","-0.75","-1.00","-1.25","-1.50","-1.75","-2.00","-2.25","-2.50","-3.00","-4.00","-5.00","-6.00"];
const CYL = ["None","-0.25","-0.50","-0.75","-1.00","-1.25","-1.50","-1.75","-2.00","-2.50","-3.00"];

export default function LensFlow() {
  const p = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const color = search.color ?? p.colors[0].name;

  const [step, setStep] = useState<Step>("rx-type");
  const [rxType, setRxType] = useState<RxType>(search.frameOnly ? "frame-only" : "single-vision");
  const [rxMethod, setRxMethod] = useState<"manual" | "upload" | "scan" | "later">("manual");
  const [od, setOd] = useState({ sph: "0.00", cyl: "None", axis: "" });
  const [os, setOs] = useState({ sph: "0.00", cyl: "None", axis: "" });
  const [pd, setPd] = useState("");
  const [twoPd, setTwoPd] = useState(false);
  const [savedRx, setSavedRx] = useState(false);
  const [showPd, setShowPd] = useState(false);
  const [showPrism, setShowPrism] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lensType, setLensType] = useState<LensTypeKey>("photochromic");
  const [tech, setTech] = useState<TechKey>("advanced");
  const [material, setMaterial] = useState<string>("mr-pro");

  const lensTypeObj = LENS_TYPES.find((l) => l.key === lensType)!;
  const techObj = TECHS.find((t) => t.key === tech)!;
  const materialObj = MATERIALS.find((m) => m.key === material)!;

  const lensTotal = useMemo(() => {
    if (rxType === "frame-only") return 0;
    const passed = (s: Step) => steps.indexOf(s) >= 0 && steps.indexOf(s) < steps.indexOf(step) || step === s;
    let t = 0;
    if (passed("lens-type")) t += lensTypeObj.priceAdd;
    if (passed("lens-tech")) t += techObj.price - 46.75;
    if (passed("material")) t += materialObj.priceAdd;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rxType, lensTypeObj, techObj, materialObj, step]);

  const total = p.price + lensTotal;

  const steps: Step[] = rxType === "frame-only"
    ? ["rx-type"]
    : rxType === "single-vision" || rxType === "reading"
    ? ["rx-type", "rx-entry", "lens-type", "lens-tech", "material"]
    : ["rx-type", "lens-type", "lens-tech", "material"];

  const idx = steps.indexOf(step);
  const progress = ((idx + 1) / steps.length) * 100;

  function next() {
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
    else addToCart();
  }
  function back() {
    if (idx > 0) setStep(steps[idx - 1]);
  }

  function addToCart() {
    const lens: LensChoice = {
      type: rxType === "frame-only" ? "frame-only" : rxType === "non-rx" ? "non-rx" : lensType === "blue-light" ? "blue-light" : "single-vision",
      label: rxType === "frame-only" ? "Frame Only" : `${lensTypeObj.label} · ${techObj.label}${materialObj.priceAdd ? ` · ${materialObj.label}` : ""}`,
      priceAdd: lensTotal,
      ...(rxType === "single-vision" || rxType === "reading"
        ? { rx: { method: rxMethod === "scan" ? "upload" : rxMethod, od, os, pd } }
        : {}),
    };
    cart.add({ productId: p.id, name: p.name, color, unitPrice: p.price, lens });
    navigate({ to: "/cart" });
  }

  return (
    <Layout>
      {/* Progress bar */}
      <div className="h-1 bg-secondary">
        <div className="h-full bg-sale transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="grid lg:grid-cols-2 min-h-[calc(100vh-4rem)]">
        {/* Left panel: product summary */}
        <aside className="bg-background border-r border-border/60 px-8 lg:px-16 py-10 flex flex-col">
          <Link to="/product/$id" params={{ id: p.id }} className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground inline-flex items-center gap-2 mb-8">
            <ArrowLeft className="size-3.5" /> Back to product
          </Link>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="aspect-[4/3] w-full max-w-md bg-surface flex items-center justify-center">
              <img src={productImage(p, Math.max(0, p.colors.findIndex((cc: { name: string }) => cc.name === color)))} alt={p.name} className="w-full h-full object-contain" />
            </div>
            <h2 className="font-display text-2xl mt-6">{p.name} <span className="text-muted-foreground">({color})</span></h2>
          </div>

          <div className="space-y-3 text-sm mt-6">
            <Row label="Frame" value={`$${p.price.toFixed(2)}`} />
            {rxType !== "frame-only" && (
              <Row label="Prescription" subValue={rxTypeLabel(rxType)} onEdit={() => setStep("rx-type")} />
            )}
            {idx >= steps.indexOf("lens-type") && lensType && (
              <Row label="Lenses" value={lensTotal > 0 ? `$${lensTotal.toFixed(2)}` : "Included"} subValue={lensTypeObj.label} onEdit={() => setStep("lens-type")} />
            )}
            <div className="border-t border-border/60 pt-4 flex justify-between items-baseline">
              <span className="text-[11px] uppercase tracking-[0.18em] font-semibold">Total</span>
              <span className="font-display text-3xl">${total.toFixed(2)}</span>
            </div>
          </div>
        </aside>

        {/* Right panel: steps */}
        <section className="bg-surface px-8 lg:px-16 py-10 relative">
          <div className="flex items-center justify-between mb-8">
            {idx > 0 ? (
              <button onClick={back} aria-label="Back" className="size-9 flex items-center justify-center hover:bg-background"><ArrowLeft className="size-5" /></button>
            ) : <div className="size-9" />}
            <h3 className="font-display text-lg">{stepTitle(step)}</h3>
            <Link to="/product/$id" params={{ id: p.id }} aria-label="Close" className="size-9 flex items-center justify-center hover:bg-background"><X className="size-5" /></Link>
          </div>

          <div className="max-w-xl mx-auto pb-32 space-y-4">
            {step === "rx-type" && (
              <>
                {([
                  { k: "single-vision", t: "Single Vision", d: "Correct nearsightedness, intermediate, or farsightedness." },
                  { k: "reading", t: "Reading Glasses", d: "Magnify close-up vision for comfortable reading." },
                  { k: "non-rx", t: "Non-Prescription", d: "Stylish protection without vision correction." },
                  { k: "frame-only", t: "Frame Only", d: "Ship with demo lenses for your local optician." },
                ] as const).map((o) => (
                  <button key={o.k} onClick={() => setRxType(o.k as RxType)} className={`w-full text-left bg-background p-5 border-2 transition ${rxType === o.k ? "border-sale" : "border-transparent hover:border-border"}`}>
                    <div className="font-medium">{o.t}</div>
                    <div className="text-sm text-muted-foreground mt-1">{o.d}</div>
                  </button>
                ))}
              </>
            )}

            {step === "rx-entry" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setRxMethod("manual")} className={`bg-background p-4 flex justify-between items-center border ${rxMethod === "manual" ? "border-sale" : "border-transparent"}`}>
                    <span className="text-sm font-medium">Enter manually</span>
                  </button>
                  <button onClick={() => setRxMethod("scan")} className={`bg-background p-4 flex justify-between items-center border ${rxMethod === "scan" ? "border-sale" : "border-transparent"}`}>
                    <span className="text-sm font-medium">Upload prescription</span>
                  </button>
                </div>

                {rxMethod === "manual" && (
                  <div className="bg-background p-5">
                    <div className="flex items-center gap-1 text-sm font-semibold mb-4">
                      Prescription
                      <button onClick={() => setShowPrism(true)} aria-label="What is prism?"><HelpCircle className="size-3.5 text-muted-foreground" /></button>
                    </div>
                    <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-2 items-center text-xs">
                      <div></div>
                      <div className="font-semibold text-center">SPH</div>
                      <div className="font-semibold text-center">CYL</div>
                      <div className="font-semibold text-center">Axis</div>
                      {([["OD (Right)", od, setOd], ["OS (Left)", os, setOs]] as const).map(([label, val, setVal]) => (
                        <RxRow key={label} label={label} val={val} setVal={setVal} />
                      ))}
                    </div>

                    <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-2 items-center text-xs mt-3">
                      <div className="font-semibold">PD</div>
                      <Select value={pd} onChange={setPd} options={["54","56","57","58","60","62","64","66","68"]} placeholder="PD" />
                      <div></div>
                      <div></div>
                    </div>

                    <label className="flex items-center gap-2 text-sm mt-4">
                      <input type="checkbox" checked={twoPd} onChange={(e) => setTwoPd(e.target.checked)} className="size-4" />
                      Two PDs?
                      <button onClick={() => setShowPd(true)} className="text-xs underline ml-auto">I don't know my PD</button>
                    </label>
                    <label className="flex items-center gap-2 text-sm mt-2">
                      <input type="checkbox" className="size-4" />
                      Has prism
                      <button onClick={() => setShowPrism(true)}><HelpCircle className="size-3.5 text-muted-foreground" /></button>
                    </label>
                    <label className="flex items-center gap-2 text-sm mt-2">
                      <input type="checkbox" checked={savedRx} onChange={(e) => setSavedRx(e.target.checked)} className="size-4" />
                      Save my prescription
                    </label>
                  </div>
                )}

                {rxMethod === "scan" && (
                  <div className="bg-background p-8 text-center">
                    <label className="border-2 border-dashed border-border block p-10 cursor-pointer hover:border-foreground transition">
                      <Upload className="size-6 mx-auto mb-3" />
                      <div className="text-sm">Drop your prescription here or <span className="text-sale underline">click to upload</span></div>
                      <div className="text-xs text-muted-foreground mt-1">(Max 20 MB)</div>
                      <input type="file" className="sr-only" accept="image/*,.pdf" />
                    </label>
                    <div className="my-4 text-xs text-muted-foreground">— or —</div>
                    <button className="w-full bg-sale text-white py-3 text-[11px] uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-2"><Camera className="size-4" /> Take a photo</button>
                  </div>
                )}
              </>
            )}

            {step === "lens-type" && (
              <>
                {LENS_TYPES.map((l) => {
                  const active = lensType === l.key;
                  return (
                    <button key={l.key} onClick={() => setLensType(l.key)} className={`relative w-full text-left bg-background p-5 border-2 transition ${active ? "border-sale" : "border-transparent hover:border-border"}`}>
                      {l.promo && <span className="absolute top-0 right-4 bg-foreground text-background text-[10px] px-2 py-0.5 uppercase tracking-wider">{l.promo}</span>}
                      <div className="flex items-start gap-4">
                        <div className="size-12 rounded-full bg-surface flex items-center justify-center text-2xl text-muted-foreground">{l.icon}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline">
                            <span className="font-medium">{l.label}</span>
                            <span className="text-sm">{l.priceAdd === 0 ? "Included" : `+$${l.priceAdd}`}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">{l.desc}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </>
            )}

            {step === "lens-tech" && (
              <>
                <div className="bg-background/60 border border-border p-3 text-xs flex items-center gap-2 mb-2">
                  <Check className="size-3.5 text-sale" /> All lenses include anti-reflective and scratch-resistant coatings.
                </div>
                {TECHS.map((t) => {
                  const active = tech === t.key;
                  return (
                    <button key={t.key} onClick={() => setTech(t.key)} className={`relative w-full text-left bg-background p-5 border-2 transition ${active ? "border-sale" : "border-transparent hover:border-border"}`}>
                      {t.recommended && <span className="absolute -top-2 right-4 bg-sale text-white text-[10px] px-2 py-0.5 uppercase tracking-wider">Recommended</span>}
                      <div className="flex justify-between items-baseline mb-3">
                        <span className="font-medium">{t.label}</span>
                        <div className="text-sm">
                          <span className="text-muted-foreground line-through mr-2">${t.oldPrice.toFixed(2)}</span>
                          <span className="text-sale font-semibold">${t.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <ul className="grid grid-cols-2 gap-y-1 text-xs text-muted-foreground">
                        {t.features.map((f) => <li key={f} className="flex items-center gap-1.5"><Check className="size-3 text-sale" /> {f}</li>)}
                      </ul>
                    </button>
                  );
                })}
              </>
            )}

            {step === "material" && (
              <>
                {MATERIALS.map((m) => {
                  const active = material === m.key;
                  return (
                    <button key={m.key} onClick={() => setMaterial(m.key)} className={`relative w-full text-left bg-background p-5 border-2 transition ${active ? "border-sale" : "border-transparent hover:border-border"}`}>
                      {m.recommended && <span className="absolute -top-2 right-4 bg-sale text-white text-[10px] px-2 py-0.5 uppercase tracking-wider">Recommended</span>}
                      <div className="flex justify-between items-baseline">
                        <span className="font-medium">{m.label}</span>
                        <span className="text-sm">{m.priceAdd === 0 ? "Free" : `+$${m.priceAdd.toFixed(2)}`}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{m.desc}</div>
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Sticky CTA */}
          <div className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border/60 px-8 lg:px-16 py-5">
            <button
              onClick={step === "rx-entry" ? () => setShowConfirm(true) : next}
              className="w-full bg-sale text-white py-4 text-[11px] uppercase tracking-[0.2em] font-semibold hover:opacity-90 transition-opacity"
            >
              {step === "material" ? "Add to cart" : step === "rx-entry" ? "Submit prescription" : "Next"}
            </button>
          </div>
        </section>
      </div>

      {/* PD help modal */}
      {showPd && (
        <Modal onClose={() => setShowPd(false)} title="How to measure your PD">
          <p className="text-sm text-muted-foreground">PD (Pupillary Distance) is the distance between the centres of your pupils. Adult PD is typically 54–74 mm. Your optician usually measures it during an eye exam — but you can also measure it yourself with a mirror and a ruler.</p>
          <div className="aspect-video bg-surface mt-4 flex items-center justify-center text-xs text-muted-foreground">Video tutorial</div>
        </Modal>
      )}
      {showPrism && (
        <Modal onClose={() => setShowPrism(false)} title="Prism">
          <p className="text-sm text-muted-foreground">Prism is a measure in prism diopters. We process prism prescriptions for strabismus, double vision, positional or convergence correction. By displacing the image, prisms help avoid double vision and achieve comfortable binocular vision.</p>
        </Modal>
      )}
      {showConfirm && (
        <Modal onClose={() => setShowConfirm(false)} title="Does this match your prescription?">
          <table className="w-full text-sm border-collapse mt-2">
            <thead>
              <tr className="bg-surface text-xs">
                <th className="p-3 text-left"></th><th className="p-3">SPH</th><th className="p-3">CYL</th><th className="p-3">Axis</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/60"><td className="p-3 font-medium">OD</td><td className="p-3 text-center">{od.sph}</td><td className="p-3 text-center">{od.cyl}</td><td className="p-3 text-center">{od.axis || "—"}</td></tr>
              <tr className="border-t border-border/60"><td className="p-3 font-medium">OS</td><td className="p-3 text-center">{os.sph}</td><td className="p-3 text-center">{os.cyl}</td><td className="p-3 text-center">{os.axis || "—"}</td></tr>
              <tr className="border-t border-border/60"><td className="p-3 font-medium">PD</td><td colSpan={3} className="p-3 text-center">{pd || "—"}</td></tr>
            </tbody>
          </table>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowConfirm(false)} className="flex-1 border border-border py-3 text-sm">Edit</button>
            <button onClick={() => { setShowConfirm(false); next(); }} className="flex-1 bg-sale text-white py-3 text-sm font-medium">Confirm</button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}

function Row({ label, value, subValue, onEdit }: { label: string; value?: string; subValue?: string; onEdit?: () => void }) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <div className="font-medium">{label}</div>
        {subValue && (
          <button onClick={onEdit} className="text-xs text-muted-foreground underline underline-offset-2 inline-flex items-center gap-1 mt-0.5">
            {subValue} {onEdit && <Pencil className="size-3" />}
          </button>
        )}
      </div>
      {value && <span>{value}</span>}
    </div>
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full appearance-none bg-surface border border-border px-3 py-2 text-sm pr-7">
        {placeholder && !value && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="size-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
    </div>
  );
}

function RxRow({ label, val, setVal }: { label: string; val: { sph: string; cyl: string; axis: string }; setVal: (v: { sph: string; cyl: string; axis: string }) => void }) {
  return (
    <>
      <div className="font-medium">{label}</div>
      <Select value={val.sph} onChange={(v) => setVal({ ...val, sph: v })} options={SPH} />
      <Select value={val.cyl} onChange={(v) => setVal({ ...val, cyl: v })} options={CYL} />
      <input value={val.axis} onChange={(e) => setVal({ ...val, axis: e.target.value })} placeholder="None" className="bg-surface border border-border px-3 py-2 text-sm text-center" />
    </>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-background max-w-lg w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4" aria-label="Close"><X className="size-5" /></button>
        <h3 className="font-display text-xl mb-3 uppercase tracking-wide">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function stepTitle(s: Step) {
  return {
    "rx-type": "Select prescription type",
    "rx-entry": "Enter your prescription",
    "lens-type": "Choose your lenses",
    "lens-tech": "Lens technology",
    "material": "Select material",
  }[s];
}

function rxTypeLabel(t: RxType) {
  return { "single-vision": "Single Vision", "reading": "Reading", "non-rx": "Non-Prescription", "frame-only": "Frame Only" }[t];
}
