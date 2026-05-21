import { createFileRoute, useNavigate, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";

import { getProduct, productImage } from "@/lib/products";
import { cart, type LensChoice } from "@/lib/cart-store";
import { ArrowLeft, X, Upload, Camera, HelpCircle, Check, Pencil, ChevronDown } from "lucide-react";
import { useI18n, type TKey } from "@/lib/i18n";

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
const LENS_TYPES: { key: LensTypeKey; labelKey: TKey; descKey: TKey; priceAdd: number; promo?: boolean; icon: string }[] = [
  { key: "standard", labelKey: "lt.standard", descKey: "lt.standardD", priceAdd: 0, icon: "◐" },
  { key: "blue-light", labelKey: "lt.blue", descKey: "lt.blueD", priceAdd: 35, icon: "◑" },
  { key: "photochromic", labelKey: "lt.photo", descKey: "lt.photoD", priceAdd: 75, promo: true, icon: "◐" },
  { key: "photo-blue", labelKey: "lt.photoBlue", descKey: "lt.photoBlueD", priceAdd: 95, promo: true, icon: "◓" },
  { key: "sun-tint", labelKey: "lt.sunTint", descKey: "lt.sunTintD", priceAdd: 45, icon: "●" },
];

type TechKey = "standard" | "advanced" | "premium";
const TECHS: { key: TechKey; labelKey: TKey; oldPrice: number; price: number; features: TKey[]; recommended?: boolean }[] = [
  { key: "standard", labelKey: "tech.standard", oldPrice: 55, price: 46.75, features: ["tech.f.mid", "tech.f.uv"] },
  { key: "advanced", labelKey: "tech.advanced", oldPrice: 75, price: 63.75, features: ["tech.f.high", "tech.f.uv", "tech.f.water", "tech.f.dust"], recommended: true },
  { key: "premium", labelKey: "tech.premium", oldPrice: 100, price: 85, features: ["tech.f.highest", "tech.f.uv", "tech.f.water", "tech.f.dust"] },
];

const MATERIALS: { key: string; labelKey: TKey; descKey: TKey; priceAdd: number; recommended?: boolean }[] = [
  { key: "mr-pro", labelKey: "mat.pro", descKey: "mat.proD", priceAdd: 17, recommended: true },
  { key: "standard", labelKey: "mat.std", descKey: "mat.stdD", priceAdd: 0 },
];

const SPH = ["+6.00","+5.00","+4.00","+3.00","+2.00","+1.50","+1.00","+0.75","+0.50","+0.25","0.00","-0.25","-0.50","-0.75","-1.00","-1.25","-1.50","-1.75","-2.00","-2.25","-2.50","-3.00","-4.00","-5.00","-6.00"];
const CYL = ["None","-0.25","-0.50","-0.75","-1.00","-1.25","-1.50","-1.75","-2.00","-2.50","-3.00"];

function LensFlow() {
  const p = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { t } = useI18n();
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
  const techObj = TECHS.find((tt) => tt.key === tech)!;
  const materialObj = MATERIALS.find((m) => m.key === material)!;

  const steps: Step[] = rxType === "frame-only"
    ? ["rx-type"]
    : rxType === "single-vision" || rxType === "reading"
    ? ["rx-type", "rx-entry", "lens-type", "lens-tech", "material"]
    : ["rx-type", "lens-type", "lens-tech", "material"];

  const idx = steps.indexOf(step);
  const progress = ((idx + 1) / steps.length) * 100;

  const lensTotal = useMemo(() => {
    if (rxType === "frame-only") return 0;
    const passedOrCurrent = (s: Step) => steps.indexOf(s) <= idx;
    let tt = 0;
    if (passedOrCurrent("lens-type")) tt += lensTypeObj.priceAdd;
    if (passedOrCurrent("lens-tech")) tt += techObj.price - 46.75;
    if (passedOrCurrent("material")) tt += materialObj.priceAdd;
    return tt;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rxType, lensTypeObj, techObj, materialObj, idx]);

  const total = p.price + lensTotal;

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
      label: rxType === "frame-only" ? t("lens.rx.frame") : `${t(lensTypeObj.labelKey)} · ${t(techObj.labelKey)}${materialObj.priceAdd ? ` · ${t(materialObj.labelKey)}` : ""}`,
      priceAdd: lensTotal,
      ...(rxType === "single-vision" || rxType === "reading"
        ? { rx: { method: rxMethod === "scan" ? "upload" : rxMethod, od, os, pd } }
        : {}),
    };
    cart.add({ productId: p.id, name: p.name, color, unitPrice: p.price, lens });
    navigate({ to: "/cart" });
  }

  const stepTitle = (s: Step) => ({
    "rx-type": t("lens.step.rxType"),
    "rx-entry": t("lens.step.rxEntry"),
    "lens-type": t("lens.step.lensType"),
    "lens-tech": t("lens.step.lensTech"),
    "material": t("lens.step.material"),
  }[s]);

  const rxTypeLabel = (rt: RxType) => ({
    "single-vision": t("lens.rxLabel.single"),
    "reading": t("lens.rxLabel.reading"),
    "non-rx": t("lens.rxLabel.non"),
    "frame-only": t("lens.rxLabel.frame"),
  }[rt]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="h-1 bg-secondary shrink-0">
        <div className="h-full bg-sale transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 grid lg:grid-cols-2 min-h-0">
        <aside className="bg-background border-r border-border/60 px-8 lg:px-16 py-8 flex flex-col overflow-y-auto">
          <Link to="/product/$id" params={{ id: p.id }} className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground inline-flex items-center gap-2 mb-6">
            <ArrowLeft className="size-3.5" /> {t("lens.back")}
          </Link>

          <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-6">
            <div className="aspect-[4/3] w-full max-w-md bg-surface flex items-center justify-center">
              <img src={productImage(p, Math.max(0, p.colors.findIndex((cc: { name: string }) => cc.name === color)))} alt={p.name} className="w-full h-full object-contain" />
            </div>
            <h2 className="font-display text-2xl mt-6 text-center">{p.name} <span className="text-muted-foreground">({color})</span></h2>
          </div>

          <div className="space-y-3 text-sm mt-6 shrink-0">
            <Row label={t("lens.frame")} value={`$${p.price.toFixed(2)}`} />
            {rxType !== "frame-only" && (
              <Row label={t("lens.prescription")} subValue={rxTypeLabel(rxType)} onEdit={() => setStep("rx-type")} />
            )}
            {idx >= steps.indexOf("lens-type") && lensType && (
              <Row label={t("lens.lenses")} value={lensTotal > 0 ? `$${lensTotal.toFixed(2)}` : t("common.included")} subValue={t(lensTypeObj.labelKey)} onEdit={() => setStep("lens-type")} />
            )}
            <div className="border-t border-border/60 pt-4 flex justify-between items-baseline">
              <span className="text-[11px] uppercase tracking-[0.18em] font-semibold">{t("lens.total")}</span>
              <span className="font-display text-3xl">${total.toFixed(2)}</span>
            </div>
          </div>
        </aside>

        <section className="bg-surface flex flex-col min-h-0">
          <div className="flex items-center justify-between px-8 lg:px-12 py-5 shrink-0 border-b border-border/40">
            {idx > 0 ? (
              <button onClick={back} aria-label={t("common.back")} className="size-9 flex items-center justify-center hover:bg-background"><ArrowLeft className="size-5" /></button>
            ) : <div className="size-9" />}
            <h3 className="font-display text-lg">{stepTitle(step)}</h3>
            <Link to="/product/$id" params={{ id: p.id }} aria-label={t("common.close")} className="size-9 flex items-center justify-center hover:bg-background"><X className="size-5" /></Link>
          </div>

          <div className="flex-1 overflow-y-auto px-8 lg:px-12 py-8">
            <div className="max-w-xl mx-auto space-y-4">
            {step === "rx-type" && (
              <>
                {([
                  { k: "single-vision", tt: t("lens.rx.single"), d: t("lens.rx.singleD") },
                  { k: "reading", tt: t("lens.rx.reading"), d: t("lens.rx.readingD") },
                  { k: "non-rx", tt: t("lens.rx.non"), d: t("lens.rx.nonD") },
                  { k: "frame-only", tt: t("lens.rx.frame"), d: t("lens.rx.frameD") },
                ] as const).map((o) => (
                  <button key={o.k} onClick={() => setRxType(o.k as RxType)} className={`w-full text-left bg-background p-5 border-2 transition ${rxType === o.k ? "border-sale" : "border-transparent hover:border-border"}`}>
                    <div className="font-medium">{o.tt}</div>
                    <div className="text-sm text-muted-foreground mt-1">{o.d}</div>
                  </button>
                ))}
              </>
            )}

            {step === "rx-entry" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setRxMethod("manual")} className={`bg-background p-4 flex justify-between items-center border ${rxMethod === "manual" ? "border-sale" : "border-transparent"}`}>
                    <span className="text-sm font-medium">{t("lens.enterManual")}</span>
                  </button>
                  <button onClick={() => setRxMethod("scan")} className={`bg-background p-4 flex justify-between items-center border ${rxMethod === "scan" ? "border-sale" : "border-transparent"}`}>
                    <span className="text-sm font-medium">{t("lens.uploadRx")}</span>
                  </button>
                </div>

                {rxMethod === "manual" && (
                  <div className="bg-background p-5">
                    <div className="flex items-center gap-1 text-sm font-semibold mb-4">
                      {t("lens.prescription")}
                      <button onClick={() => setShowPrism(true)} aria-label={t("lens.prismTitle")}><HelpCircle className="size-3.5 text-muted-foreground" /></button>
                    </div>
                    <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-2 items-center text-xs">
                      <div></div>
                      <div className="font-semibold text-center">SPH</div>
                      <div className="font-semibold text-center">CYL</div>
                      <div className="font-semibold text-center">Axis</div>
                      {([[t("lens.odRight"), od, setOd], [t("lens.osLeft"), os, setOs]] as const).map(([label, val, setVal]) => (
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
                      {t("lens.twoPd")}
                      <button onClick={() => setShowPd(true)} className="text-xs underline ml-auto">{t("lens.dontKnowPd")}</button>
                    </label>
                    <label className="flex items-center gap-2 text-sm mt-2">
                      <input type="checkbox" className="size-4" />
                      {t("lens.hasPrism")}
                      <button onClick={() => setShowPrism(true)}><HelpCircle className="size-3.5 text-muted-foreground" /></button>
                    </label>
                    <label className="flex items-center gap-2 text-sm mt-2">
                      <input type="checkbox" checked={savedRx} onChange={(e) => setSavedRx(e.target.checked)} className="size-4" />
                      {t("lens.saveRx")}
                    </label>
                  </div>
                )}

                {rxMethod === "scan" && (
                  <div className="bg-background p-8 text-center">
                    <label className="border-2 border-dashed border-border block p-10 cursor-pointer hover:border-foreground transition">
                      <Upload className="size-6 mx-auto mb-3" />
                      <div className="text-sm">{t("lens.dropRx")} <span className="text-sale underline">{t("lens.clickUpload")}</span></div>
                      <div className="text-xs text-muted-foreground mt-1">{t("lens.maxSize")}</div>
                      <input type="file" className="sr-only" accept="image/*,.pdf" />
                    </label>
                    <div className="my-4 text-xs text-muted-foreground">{t("lens.or")}</div>
                    <button className="w-full bg-sale text-white py-3 text-[11px] uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-2"><Camera className="size-4" /> {t("lens.takePhoto")}</button>
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
                      {l.promo && <span className="absolute top-0 right-4 bg-foreground text-background text-[10px] px-2 py-0.5 uppercase tracking-wider">15% {t("common.off")}</span>}
                      <div className="flex items-start gap-4">
                        <div className="size-12 rounded-full bg-surface flex items-center justify-center text-2xl text-muted-foreground">{l.icon}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline">
                            <span className="font-medium">{t(l.labelKey)}</span>
                            <span className="text-sm">{l.priceAdd === 0 ? t("common.included") : `+$${l.priceAdd}`}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">{t(l.descKey)}</div>
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
                  <Check className="size-3.5 text-sale" /> {t("lens.coatingNote")}
                </div>
                {TECHS.map((tt) => {
                  const active = tech === tt.key;
                  return (
                    <button key={tt.key} onClick={() => setTech(tt.key)} className={`relative w-full text-left bg-background p-5 border-2 transition ${active ? "border-sale" : "border-transparent hover:border-border"}`}>
                      {tt.recommended && <span className="absolute -top-2 right-4 bg-sale text-white text-[10px] px-2 py-0.5 uppercase tracking-wider">{t("common.recommended")}</span>}
                      <div className="flex justify-between items-baseline mb-3">
                        <span className="font-medium">{t(tt.labelKey)}</span>
                        <div className="text-sm">
                          <span className="text-muted-foreground line-through mr-2">${tt.oldPrice.toFixed(2)}</span>
                          <span className="text-sale font-semibold">${tt.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <ul className="grid grid-cols-2 gap-y-1 text-xs text-muted-foreground">
                        {tt.features.map((f) => <li key={f} className="flex items-center gap-1.5"><Check className="size-3 text-sale" /> {t(f)}</li>)}
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
                      {m.recommended && <span className="absolute -top-2 right-4 bg-sale text-white text-[10px] px-2 py-0.5 uppercase tracking-wider">{t("common.recommended")}</span>}
                      <div className="flex justify-between items-baseline">
                        <span className="font-medium">{t(m.labelKey)}</span>
                        <span className="text-sm">{m.priceAdd === 0 ? t("common.free") : `+$${m.priceAdd.toFixed(2)}`}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{t(m.descKey)}</div>
                    </button>
                  );
                })}
              </>
            )}
            </div>
          </div>

          <div className="shrink-0 bg-surface border-t border-border/60 px-8 lg:px-12 py-5">
            <button
              onClick={step === "rx-entry" ? () => setShowConfirm(true) : next}
              className="w-full bg-sale text-white py-4 text-[11px] uppercase tracking-[0.2em] font-semibold hover:opacity-90 transition-opacity"
            >
              {step === "material" ? t("lens.addCart") : step === "rx-entry" ? t("lens.submitRx") : t("common.next")}
            </button>
          </div>
        </section>
      </div>

      {showPd && (
        <Modal onClose={() => setShowPd(false)} title={t("lens.pdTitle")}>
          <p className="text-sm text-muted-foreground">{t("lens.pdDesc")}</p>
          <div className="aspect-video bg-surface mt-4 flex items-center justify-center text-xs text-muted-foreground">{t("lens.pdVideo")}</div>
        </Modal>
      )}
      {showPrism && (
        <Modal onClose={() => setShowPrism(false)} title={t("lens.prismTitle")}>
          <p className="text-sm text-muted-foreground">{t("lens.prismDesc")}</p>
        </Modal>
      )}
      {showConfirm && (
        <Modal onClose={() => setShowConfirm(false)} title={t("lens.confirmTitle")}>
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
            <button onClick={() => setShowConfirm(false)} className="flex-1 border border-border py-3 text-sm">{t("common.edit")}</button>
            <button onClick={() => { setShowConfirm(false); next(); }} className="flex-1 bg-sale text-white py-3 text-sm font-medium">{t("common.confirm")}</button>
          </div>
        </Modal>
      )}
    </div>
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
