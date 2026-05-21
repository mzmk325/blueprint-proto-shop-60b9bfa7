import { createFileRoute, useNavigate, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";

import { getProduct, productImage } from "@/lib/products";
import { cart, type LensChoice, FREE_SHIPPING_THRESHOLD } from "@/lib/cart-store";
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
type Step = "rx-type" | "rx-entry" | "fn" | "thick" | "addon";

type FnKey = "clear" | "blue" | "photo" | "photo-blue" | "tint";
const FNS: { key: FnKey; labelKey: TKey; descKey: TKey; price: number }[] = [
  { key: "clear", labelKey: "lens.fn.clear", descKey: "lens.fn.clearD", price: 29 },
  { key: "blue", labelKey: "lens.fn.blue", descKey: "lens.fn.blueD", price: 39 },
  { key: "photo", labelKey: "lens.fn.photo", descKey: "lens.fn.photoD", price: 79 },
  { key: "photo-blue", labelKey: "lens.fn.photoBlue", descKey: "lens.fn.photoBlueD", price: 99 },
  { key: "tint", labelKey: "lens.fn.tint", descKey: "lens.fn.tintD", price: 49 },
];

type ThickKey = "std" | "thin" | "ultra";
const THICKS: { key: ThickKey; labelKey: TKey; descKey: TKey; price: number }[] = [
  { key: "std", labelKey: "lens.thick.std", descKey: "lens.thick.stdD", price: 0 },
  { key: "thin", labelKey: "lens.thick.thin", descKey: "lens.thick.thinD", price: 20 },
  { key: "ultra", labelKey: "lens.thick.ultra", descKey: "lens.thick.ultraD", price: 50 },
];

type AddonKey = "none" | "mrpro" | "premium";
const ADDONS: { key: AddonKey; labelKey: TKey; descKey: TKey; price: number }[] = [
  { key: "none", labelKey: "lens.addon.none", descKey: "lens.addon.noneD", price: 0 },
  { key: "mrpro", labelKey: "lens.addon.mrPro", descKey: "lens.addon.mrProD", price: 17 },
  { key: "premium", labelKey: "lens.addon.premium", descKey: "lens.addon.premiumD", price: 15 },
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
  const [rxMethod, setRxMethod] = useState<"manual" | "upload" | "later">("manual");
  const [od, setOd] = useState({ sph: "0.00", cyl: "None", axis: "" });
  const [os, setOs] = useState({ sph: "0.00", cyl: "None", axis: "" });
  const [pd, setPd] = useState("");
  const [twoPd, setTwoPd] = useState(false);
  const [dontKnowPd, setDontKnowPd] = useState(false);
  const [hasPrism, setHasPrism] = useState(false);
  const [showPd, setShowPd] = useState(false);
  const [showPrism, setShowPrism] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [fnKey, setFnKey] = useState<FnKey>("clear");
  const [thickKey, setThickKey] = useState<ThickKey>("std");
  const [addonKey, setAddonKey] = useState<AddonKey>("none");

  const fnObj = FNS.find((f) => f.key === fnKey)!;
  const thickObj = THICKS.find((tt) => tt.key === thickKey)!;
  const addonObj = ADDONS.find((a) => a.key === addonKey)!;

  // Step order
  const steps: Step[] = rxType === "frame-only"
    ? ["rx-type", "addon"]
    : rxType === "non-rx"
    ? ["rx-type", "fn", "thick", "addon"]
    : ["rx-type", "rx-entry", "fn", "thick", "addon"];

  const idx = steps.indexOf(step);
  const progress = ((idx + 1) / steps.length) * 100;

  // Pricing summary always shows committed selections
  const fnPrice = rxType === "frame-only" ? 0 : fnObj.price;
  const thickPrice = rxType === "frame-only" ? 0 : thickObj.price;
  const addonPrice = addonObj.price;
  const subtotal = p.price + fnPrice + thickPrice + addonPrice;
  const shipFree = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = shipFree ? 0 : 6.95;
  const total = subtotal + shipping;
  const lensTotal = fnPrice + thickPrice + addonPrice;

  function validateRxEntry(): string[] {
    const errs: string[] = [];
    if (rxMethod === "manual") {
      // Axis required if CYL != None
      const check = (eye: typeof od, label: string) => {
        if (eye.cyl !== "None") {
          const a = parseInt(eye.axis, 10);
          if (!a || a < 1 || a > 180) errs.push(`${label}: ${t("lens.err.axis")}`);
        }
      };
      check(od, "OD");
      check(os, "OS");
      if (!pd && !dontKnowPd) errs.push(t("lens.err.pd"));
    }
    return errs;
  }

  function next() {
    if (step === "rx-entry") {
      const errs = validateRxEntry();
      if (errs.length) { setErrors(errs); return; }
      setErrors([]);
    }
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
    else addToCart();
  }
  function back() { if (idx > 0) setStep(steps[idx - 1]); }

  function goto(s: Step) { if (steps.includes(s)) setStep(s); }

  function addToCart() {
    const rxTypeLabel = rxTypeLabelOf(rxType);
    const parts: string[] = [];
    if (rxType !== "frame-only") {
      parts.push(t(fnObj.labelKey));
      parts.push(t(thickObj.labelKey));
    }
    if (addonObj.price > 0) parts.push(t(addonObj.labelKey));

    const lens: LensChoice = {
      type: rxType === "frame-only" ? "frame-only"
        : rxType === "non-rx" ? "non-rx"
        : rxType === "reading" ? "reading"
        : "single-vision",
      label: rxType === "frame-only" ? t("lens.rx.frame") : parts.join(" · "),
      priceAdd: lensTotal,
      rxType,
      rxTypeLabel,
      ...(rxType !== "frame-only" ? {
        fn: { key: fnObj.key, label: t(fnObj.labelKey), price: fnObj.price },
        thickness: { key: thickObj.key, label: t(thickObj.labelKey), price: thickObj.price },
      } : {}),
      addon: { key: addonObj.key, label: t(addonObj.labelKey), price: addonObj.price },
      ...(rxType === "single-vision" || rxType === "reading"
        ? { rx: { method: rxMethod, od, os, pd, dontKnowPd, hasPrism } }
        : {}),
    };
    cart.add({ productId: p.id, name: p.name, color, size: "M", unitPrice: p.price, lens });
    navigate({ to: "/cart" });
  }

  const stepTitle = (s: Step) => ({
    "rx-type": t("lens.step.rxType"),
    "rx-entry": t("lens.step.rxEntry"),
    "fn": t("lens.step.fn"),
    "thick": t("lens.step.thick"),
    "addon": t("lens.step.addon"),
  }[s]);

  function rxTypeLabelOf(rt: RxType): string {
    return ({
      "single-vision": t("lens.rxLabel.single"),
      "reading": t("lens.rxLabel.reading"),
      "non-rx": t("lens.rxLabel.non"),
      "frame-only": t("lens.rxLabel.frame"),
    } as const)[rt];
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="h-1 bg-secondary shrink-0">
        <div className="h-full bg-sale transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 grid lg:grid-cols-[1fr_400px] min-h-0">
        {/* Main panel — step content */}
        <section className="bg-surface flex flex-col min-h-0 order-2 lg:order-1">
          <div className="flex items-center justify-between px-6 lg:px-12 py-5 shrink-0 border-b border-border/40">
            {idx > 0 ? (
              <button onClick={back} aria-label={t("common.back")} className="size-9 flex items-center justify-center hover:bg-background"><ArrowLeft className="size-5" /></button>
            ) : <Link to="/product/$id" params={{ id: p.id }} aria-label={t("lens.back")} className="size-9 flex items-center justify-center hover:bg-background"><ArrowLeft className="size-5" /></Link>}
            <div className="flex-1 text-center">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Step {idx + 1} / {steps.length}</div>
              <h3 className="font-display text-lg">{stepTitle(step)}</h3>
            </div>
            <Link to="/product/$id" params={{ id: p.id }} aria-label={t("common.close")} className="size-9 flex items-center justify-center hover:bg-background"><X className="size-5" /></Link>
          </div>

          <div className="flex-1 overflow-y-auto px-6 lg:px-12 py-8">
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Step 1: Rx Type */}
              {step === "rx-type" && (
                <>
                  {([
                    { k: "single-vision", tt: t("lens.rx.single"), d: t("lens.rx.singleD2") },
                    { k: "reading", tt: t("lens.rx.reading"), d: t("lens.rx.readingD2") },
                    { k: "non-rx", tt: t("lens.rx.non"), d: t("lens.rx.nonD2") },
                    { k: "frame-only", tt: t("lens.rx.frame"), d: t("lens.rx.frameD2") },
                  ] as const).map((o) => (
                    <button key={o.k} onClick={() => setRxType(o.k as RxType)} className={`w-full text-left bg-background p-5 border-2 transition ${rxType === o.k ? "border-sale" : "border-transparent hover:border-border"}`}>
                      <div className="font-medium">{o.tt}</div>
                      <div className="text-sm text-muted-foreground mt-1">{o.d}</div>
                    </button>
                  ))}
                </>
              )}

              {/* Step 2: Rx Entry */}
              {step === "rx-entry" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setRxMethod("manual")} className={`bg-background p-4 text-sm font-medium border ${rxMethod === "manual" ? "border-sale" : "border-transparent"}`}>{t("lens.enterManual")}</button>
                    <button onClick={() => setRxMethod("upload")} className={`bg-background p-4 text-sm font-medium border ${rxMethod === "upload" ? "border-sale" : "border-transparent"}`}>{t("lens.uploadRx")}</button>
                  </div>

                  {rxMethod === "manual" && (
                    <div className="bg-background p-5 space-y-4">
                      <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-2 items-center text-xs">
                        <div></div>
                        <div className="font-semibold text-center">SPH</div>
                        <div className="font-semibold text-center">CYL</div>
                        <div className="font-semibold text-center">Axis</div>
                        <RxRow label={t("lens.odRight")} val={od} setVal={setOd} />
                        <RxRow label={t("lens.osLeft")} val={os} setVal={setOs} />
                      </div>

                      <div className="grid grid-cols-[60px_1fr] gap-2 items-center text-xs">
                        <div className="font-semibold">PD</div>
                        <Select value={pd} onChange={setPd} options={["54","56","57","58","60","62","64","66","68"]} placeholder="Select PD (mm)" disabled={dontKnowPd} />
                      </div>

                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={twoPd} onChange={(e) => setTwoPd(e.target.checked)} className="size-4" /> Dual PD
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={dontKnowPd} onChange={(e) => setDontKnowPd(e.target.checked)} className="size-4" />
                        {t("lens.dontKnowPd")}
                        <button onClick={() => setShowPd(true)} aria-label="help"><HelpCircle className="size-3.5 text-muted-foreground" /></button>
                      </label>
                      {dontKnowPd && (
                        <div className="text-xs text-muted-foreground bg-surface p-3">{t("lens.dontKnowPd.note")}</div>
                      )}
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={hasPrism} onChange={(e) => setHasPrism(e.target.checked)} className="size-4" />
                        {t("lens.hasPrism")}
                        <button onClick={() => setShowPrism(true)} aria-label="help"><HelpCircle className="size-3.5 text-muted-foreground" /></button>
                      </label>
                      {hasPrism && (
                        <div className="text-xs text-muted-foreground bg-surface p-3 border-l-2 border-sale">{t("lens.prism.note")}</div>
                      )}

                      {errors.length > 0 && (
                        <ul className="text-xs text-sale space-y-1 bg-sale/10 p-3">
                          {errors.map((e) => <li key={e}>• {e}</li>)}
                        </ul>
                      )}
                    </div>
                  )}

                  {rxMethod === "upload" && (
                    <div className="bg-background p-8 space-y-4">
                      <p className="text-sm text-muted-foreground">{t("lens.upload.note")}</p>
                      <label className="border-2 border-dashed border-border block p-10 cursor-pointer hover:border-foreground transition text-center">
                        <Upload className="size-6 mx-auto mb-3" />
                        <div className="text-sm">{t("lens.dropRx")} <span className="text-sale underline">{t("lens.clickUpload")}</span></div>
                        <div className="text-xs text-muted-foreground mt-1">{t("lens.maxSize")}</div>
                        <input type="file" className="sr-only" accept="image/*,.pdf" />
                      </label>
                      <div className="text-center text-xs text-muted-foreground">{t("lens.or")}</div>
                      <button className="w-full bg-sale text-white py-3 text-[11px] uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-2"><Camera className="size-4" /> {t("lens.takePhoto")}</button>
                    </div>
                  )}
                </>
              )}

              {/* Step 3: Lens Function */}
              {step === "fn" && (
                <>
                  <p className="text-sm text-muted-foreground mb-2">{t("lens.fn.desc")}</p>
                  {FNS.map((f) => {
                    const active = fnKey === f.key;
                    return (
                      <button key={f.key} onClick={() => setFnKey(f.key)} className={`relative w-full text-left bg-background p-5 border-2 transition ${active ? "border-sale" : "border-transparent hover:border-border"}`}>
                        <div className="flex justify-between items-baseline">
                          <span className="font-medium">{t(f.labelKey)}</span>
                          <span className="text-sm">+${f.price}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{t(f.descKey)}</div>
                      </button>
                    );
                  })}
                </>
              )}

              {/* Step 4: Thickness */}
              {step === "thick" && (
                <>
                  <p className="text-sm text-muted-foreground mb-1">{t("lens.thick.desc")}</p>
                  <p className="text-xs text-muted-foreground bg-background border-l-2 border-sale p-3 mb-2">{t("lens.thick.rec")}</p>
                  {THICKS.map((th) => {
                    const active = thickKey === th.key;
                    return (
                      <button key={th.key} onClick={() => setThickKey(th.key)} className={`relative w-full text-left bg-background p-5 border-2 transition ${active ? "border-sale" : "border-transparent hover:border-border"}`}>
                        <div className="flex justify-between items-baseline">
                          <span className="font-medium">{t(th.labelKey)}</span>
                          <span className="text-sm">{th.price === 0 ? t("common.included") : `+$${th.price}`}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{t(th.descKey)}</div>
                      </button>
                    );
                  })}
                </>
              )}

              {/* Step 5: Add-ons */}
              {step === "addon" && (
                <>
                  <div className="bg-background/60 border border-border p-3 text-xs flex items-center gap-2 mb-2">
                    <Check className="size-3.5 text-sale" /> {t("lens.addon.coatings")} — {t("common.included")}
                  </div>
                  {ADDONS.map((a) => {
                    const active = addonKey === a.key;
                    return (
                      <button key={a.key} onClick={() => setAddonKey(a.key)} className={`relative w-full text-left bg-background p-5 border-2 transition ${active ? "border-sale" : "border-transparent hover:border-border"}`}>
                        <div className="flex justify-between items-baseline">
                          <span className="font-medium">{t(a.labelKey)}</span>
                          <span className="text-sm">{a.price === 0 ? t("common.included") : `+$${a.price}`}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{t(a.descKey)}</div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          <div className="shrink-0 bg-surface border-t border-border/60 px-6 lg:px-12 py-5">
            <button
              onClick={next}
              className="w-full bg-sale text-white py-4 text-[11px] uppercase tracking-[0.2em] font-semibold hover:opacity-90 transition-opacity"
            >
              {idx === steps.length - 1 ? t("lens.addCart") : t("common.next")}
            </button>
          </div>
        </section>

        {/* Persistent Order Summary */}
        <aside className="bg-background border-b lg:border-b-0 lg:border-l border-border/60 px-6 lg:px-10 py-6 lg:py-8 flex flex-col gap-6 overflow-y-auto order-1 lg:order-2">
          <div className="flex items-center gap-4">
            <div className="size-20 bg-surface shrink-0">
              <img src={productImage(p, Math.max(0, p.colors.findIndex((cc: { name: string }) => cc.name === color)))} alt={p.name} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg leading-tight">{p.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{color} · M</p>
            </div>
          </div>

          <div className="border-t border-border/60 pt-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">{t("lens.summary")}</div>
            <div className="space-y-2.5 text-sm">
              <SumRow label={t("lens.frame")} value={`$${p.price.toFixed(2)}`} onEdit={() => goto("rx-type")} />
              {rxType !== "frame-only" && (
                <SumRow label={t("lens.prescription")} subValue={rxTypeLabelOf(rxType)} onEdit={() => goto("rx-type")} />
              )}
              {rxType !== "frame-only" && idx >= steps.indexOf("fn") && (
                <SumRow label={t("lens.fnLabel")} subValue={t(fnObj.labelKey)} value={`+$${fnPrice.toFixed(2)}`} onEdit={() => goto("fn")} />
              )}
              {rxType !== "frame-only" && idx >= steps.indexOf("thick") && (
                <SumRow label={t("lens.thickLabel")} subValue={t(thickObj.labelKey)} value={thickPrice === 0 ? t("common.included") : `+$${thickPrice.toFixed(2)}`} onEdit={() => goto("thick")} />
              )}
              {idx >= steps.indexOf("addon") && (
                <SumRow label={t("lens.addonLabel")} subValue={t(addonObj.labelKey)} value={addonPrice === 0 ? t("common.included") : `+$${addonPrice.toFixed(2)}`} onEdit={() => goto("addon")} />
              )}
              <SumRow label={t("lens.shipping")} value={shipFree ? t("cart.free") : `$${shipping.toFixed(2)}`} />
            </div>
            <div className="border-t border-border/60 pt-4 mt-4 flex justify-between items-baseline">
              <span className="text-[11px] uppercase tracking-[0.18em] font-semibold">{t("lens.total")}</span>
              <span className="font-display text-3xl">${total.toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </div>

      {showPd && (
        <Modal onClose={() => setShowPd(false)} title={t("lens.pdTitle")}>
          <p className="text-sm text-muted-foreground">{t("lens.pdDesc")}</p>
        </Modal>
      )}
      {showPrism && (
        <Modal onClose={() => setShowPrism(false)} title={t("lens.prismTitle")}>
          <p className="text-sm text-muted-foreground">{t("lens.prismDesc")}</p>
        </Modal>
      )}
    </div>
  );
}

function SumRow({ label, value, subValue, onEdit }: { label: string; value?: string; subValue?: string; onEdit?: () => void }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        {subValue && (
          <button onClick={onEdit} className="text-sm text-foreground inline-flex items-center gap-1 mt-0.5">
            {subValue} {onEdit && <Pencil className="size-3 text-muted-foreground" />}
          </button>
        )}
      </div>
      {value && <span className="text-sm shrink-0">{value}</span>}
    </div>
  );
}

function Select({ value, onChange, options, placeholder, disabled }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; disabled?: boolean }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="w-full appearance-none bg-surface border border-border px-3 py-2 text-sm pr-7 disabled:opacity-50">
        {placeholder && <option value="">{placeholder}</option>}
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
      <input value={val.axis} onChange={(e) => setVal({ ...val, axis: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) })} placeholder={val.cyl === "None" ? "—" : "1–180"} disabled={val.cyl === "None"} className="bg-surface border border-border px-3 py-2 text-sm text-center disabled:opacity-50" />
    </>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-background max-w-lg w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 p-1"><X className="size-4" /></button>
        <h3 className="text-lg font-medium mb-3 pr-8">{title}</h3>
        {children}
      </div>
    </div>
  );
}
