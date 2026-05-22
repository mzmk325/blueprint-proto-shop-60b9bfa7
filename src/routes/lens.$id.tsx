import { createFileRoute, useNavigate, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";

import { getProduct, productImage } from "@/lib/products";
import {
  cart,
  type LensChoice,
  type FulfillmentType,
  type PrescriptionStatus,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/cart-store";
import { ArrowLeft, X, Upload, Camera, HelpCircle, Check, Pencil, ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { usePriceFormatter } from "@/lib/currency-store";

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
type Step = "rx-type" | "rx-entry" | "rx-review" | "fn" | "thick" | "addon";

type FnKey = "clear" | "blue" | "photo" | "photo-blue" | "tint";
const FNS_RX: { key: FnKey; label: string; desc: string; price: number }[] = [
  { key: "clear", label: "Clear Prescription Lens", desc: "Standard transparent lenses for everyday wear.", price: 29 },
  { key: "blue", label: "Blue Light Blocking", desc: "Reduce digital eye strain from screens.", price: 39 },
  { key: "photo", label: "Photochromic", desc: "Darkens outdoors, clear indoors.", price: 79 },
  { key: "photo-blue", label: "Photochromic + Blue Light", desc: "Adaptive tint plus screen protection.", price: 99 },
  { key: "tint", label: "Sun Tint", desc: "Permanent tint for sunglasses.", price: 49 },
];
const FNS_NONRX: { key: FnKey; label: string; desc: string; price: number }[] = [
  { key: "clear", label: "Clear Non-prescription Lens", desc: "Demo-style clear lenses, no correction.", price: 0 },
  { key: "blue", label: "Blue Light Blocking", desc: "Reduce digital eye strain from screens.", price: 29 },
  { key: "photo", label: "Photochromic", desc: "Darkens outdoors, clear indoors.", price: 69 },
  { key: "photo-blue", label: "Photochromic + Blue Light", desc: "Adaptive tint plus screen protection.", price: 89 },
  { key: "tint", label: "Sun Tint", desc: "Permanent tint for sunglasses.", price: 39 },
];

type ThickKey = "std" | "thin" | "ultra";
const THICKS: { key: ThickKey; label: string; desc: string; price: number }[] = [
  { key: "std", label: "1.56 Standard", desc: "Standard plastic. Good for low prescriptions.", price: 0 },
  { key: "thin", label: "1.61 Thin", desc: "About 20% thinner. Recommended for moderate Rx.", price: 20 },
  { key: "ultra", label: "1.67 Ultra Thin", desc: "Up to 35% thinner. Best for stronger Rx.", price: 50 },
];

type AddonKey = "none" | "mrpro" | "premium";
const ADDONS: { key: AddonKey; label: string; desc: string; price: number }[] = [
  { key: "none", label: "Standard coatings only", desc: "AR + scratch-resistant included.", price: 0 },
  { key: "mrpro", label: "MR Pro coating", desc: "Enhanced anti-smudge and dust repellent.", price: 17 },
  { key: "premium", label: "Premium AR coating", desc: "Top-tier anti-reflective with hydrophobic layer.", price: 15 },
];

const SPH = ["+6.00","+5.00","+4.00","+3.00","+2.00","+1.50","+1.00","+0.75","+0.50","+0.25","0.00","-0.25","-0.50","-0.75","-1.00","-1.25","-1.50","-1.75","-2.00","-2.25","-2.50","-3.00","-4.00","-5.00","-6.00"];
const CYL = ["None","-0.25","-0.50","-0.75","-1.00","-1.25","-1.50","-1.75","-2.00","-2.50","-3.00"];

function LensFlow() {
  const p = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { t } = useI18n();
  const fmt = usePriceFormatter();
  const color = search.color ?? p.colors[0].name;

  const [step, setStep] = useState<Step>("rx-type");
  const [rxType, setRxType] = useState<RxType>(search.frameOnly ? "frame-only" : "single-vision");
  const [rxMethod, setRxMethod] = useState<"manual" | "upload">("manual");
  const [od, setOd] = useState({ sph: "0.00", cyl: "None", axis: "" });
  const [os, setOs] = useState({ sph: "0.00", cyl: "None", axis: "" });
  const [pd, setPd] = useState("");
  const [twoPd, setTwoPd] = useState(false);
  const [pdRight, setPdRight] = useState("");
  const [pdLeft, setPdLeft] = useState("");
  const [dontKnowPd, setDontKnowPd] = useState(false);
  const [hasPrism, setHasPrism] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string>("");
  const [showPd, setShowPd] = useState(false);
  const [showPrism, setShowPrism] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [fnKey, setFnKey] = useState<FnKey>("clear");
  const [thickKey, setThickKey] = useState<ThickKey>("std");
  const [addonKey, setAddonKey] = useState<AddonKey>("none");

  const FNS = rxType === "non-rx" ? FNS_NONRX : FNS_RX;
  const fnObj = FNS.find((f) => f.key === fnKey) ?? FNS[0];
  const thickObj = THICKS.find((tt) => tt.key === thickKey)!;
  const addonObj = ADDONS.find((a) => a.key === addonKey)!;

  // Step order — frame-only goes straight to cart from step 1
  const steps: Step[] = useMemo(() => {
    if (rxType === "frame-only") return ["rx-type"];
    if (rxType === "non-rx") return ["rx-type", "fn", "thick", "addon"];
    return ["rx-type", "rx-entry", "rx-review", "fn", "thick", "addon"];
  }, [rxType]);

  const idx = steps.indexOf(step);
  const progress = ((idx + 1) / steps.length) * 100;

  // Pricing — only include lens-related prices once user has reached that step
  const fnReached = idx >= steps.indexOf("fn") && steps.includes("fn");
  const thickReached = idx >= steps.indexOf("thick") && steps.includes("thick");
  const addonReached = idx >= steps.indexOf("addon") && steps.includes("addon");

  const fnPrice = fnReached ? fnObj.price : 0;
  const thickPrice = thickReached ? thickObj.price : 0;
  const addonPrice = addonReached ? addonObj.price : 0;
  const lensTotal = fnPrice + thickPrice + addonPrice;

  const subtotal = p.price + lensTotal;
  const shipFree = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = shipFree ? 0 : 6.95;
  const total = subtotal + shipping;

  function validateRxEntry(): string[] {
    const errs: string[] = [];
    if (rxMethod === "manual") {
      const check = (eye: typeof od, label: string) => {
        if (eye.cyl !== "None") {
          const a = parseInt(eye.axis, 10);
          if (!a || a < 1 || a > 180) errs.push(`${label}: Axis required (1–180) when CYL is set`);
        }
      };
      check(od, "OD");
      check(os, "OS");
      if (twoPd) {
        if (!dontKnowPd && (!pdRight || !pdLeft)) errs.push("Enter both Right PD and Left PD, or tick 'I don't know my PD'");
      } else {
        if (!pd && !dontKnowPd) errs.push("Enter PD or tick 'I don't know my PD'");
      }
    } else {
      if (!uploadedFile && !hasPrism) errs.push("Upload your prescription image or PDF");
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

  function computeStatus(): PrescriptionStatus {
    if (rxType === "frame-only") return "none";
    if (rxType === "non-rx") return "none";
    if (hasPrism) return "prism-review";
    if (dontKnowPd) return "pd-unknown";
    if (rxMethod === "upload") return "uploaded";
    return "pending";
  }

  function addToCart() {
    const fulfillmentType: FulfillmentType =
      rxType === "frame-only" ? "frame-only" : rxType === "non-rx" ? "non-rx" : "prescription";
    const prescriptionStatus = computeStatus();
    const rxTypeLabel = rxTypeLabelOf(rxType);
    const parts: string[] = [];
    if (rxType !== "frame-only") {
      parts.push(fnObj.label);
      parts.push(thickObj.label);
    }
    if (addonObj.price > 0) parts.push(addonObj.label);

    const lens: LensChoice = {
      type: rxType === "frame-only" ? "frame-only" : rxType === "non-rx" ? "non-rx" : rxType,
      label: rxType === "frame-only" ? "Frame only · demo lenses" : parts.join(" · "),
      priceAdd: lensTotal,
      fulfillmentType,
      prescriptionStatus,
      rxType,
      rxTypeLabel,
      ...(rxType !== "frame-only"
        ? {
            fn: { key: fnObj.key, label: fnObj.label, price: fnObj.price },
            thickness: { key: thickObj.key, label: thickObj.label, price: thickObj.price },
          }
        : {}),
      addon: { key: addonObj.key, label: addonObj.label, price: addonObj.price },
      ...(rxType === "single-vision" || rxType === "reading"
        ? {
            rx: {
              method: rxMethod,
              ...(rxMethod === "upload" ? { fileName: uploadedFile || "prescription.jpg" } : {}),
              od, os,
              pd: twoPd ? "" : pd,
              pdRight: twoPd ? pdRight : "",
              pdLeft: twoPd ? pdLeft : "",
              dontKnowPd, hasPrism,
            },
          }
        : {}),
    };
    cart.add({ productId: p.id, name: p.name, color, size: "M", unitPrice: p.price, lens });
    navigate({ to: "/cart" });
  }

  const stepTitle = (s: Step) => ({
    "rx-type": t("lens.step.rxType"),
    "rx-entry": t("lens.step.rxEntry"),
    "rx-review": t("lens.reviewTitle"),
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

  const status = computeStatus();
  const nextLabel = idx === steps.length - 1
    ? (rxType === "frame-only" ? t("lens.addFrameCart") : t("lens.addCart"))
    : t("common.continue");

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="h-1 bg-secondary shrink-0">
        <div className="h-full bg-sale transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 grid lg:grid-cols-[1fr_400px] grid-rows-[auto_1fr] lg:grid-rows-1 min-h-0">
        <section className="bg-surface flex flex-col min-h-0 order-2 lg:order-1 overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 lg:py-5 shrink-0 border-b border-border/40">
            {idx > 0 ? (
              <button onClick={back} aria-label={t("common.back")} className="size-9 flex items-center justify-center hover:bg-background"><ArrowLeft className="size-5" /></button>
            ) : <Link to="/product/$id" params={{ id: p.id }} aria-label={t("lens.back")} className="size-9 flex items-center justify-center hover:bg-background"><ArrowLeft className="size-5" /></Link>}
            <div className="flex-1 text-center">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{t("lens.step")} {idx + 1} / {steps.length}</div>
              <h3 className="font-display text-base sm:text-lg">{stepTitle(step)}</h3>
            </div>
            <Link to="/product/$id" params={{ id: p.id }} aria-label={t("common.close")} className="size-9 flex items-center justify-center hover:bg-background"><X className="size-5" /></Link>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-12 py-6 lg:py-8">

            <div className="max-w-2xl mx-auto space-y-4">
              {step === "rx-type" && (
                <>
                  {([
                    { k: "single-vision", tt: "Single Vision", d: "Correct nearsightedness, intermediate, or farsightedness." },
                    { k: "reading", tt: "Reading Glasses", d: "Magnify close-up vision for comfortable reading." },
                    { k: "non-rx", tt: "Non-Prescription", d: "Stylish protection without vision correction." },
                    { k: "frame-only", tt: "Frame Only", d: "Ships with demo lenses only — take to your local optician." },
                  ] as const).map((o) => (
                    <button key={o.k} onClick={() => setRxType(o.k as RxType)} className={`w-full text-left bg-background p-5 border-2 transition ${rxType === o.k ? "border-sale" : "border-transparent hover:border-border"}`}>
                      <div className="font-medium">{o.tt}</div>
                      <div className="text-sm text-muted-foreground mt-1">{o.d}</div>
                    </button>
                  ))}
                  {rxType === "frame-only" && (
                    <p className="text-xs text-muted-foreground bg-background border-l-2 border-sale p-3 mt-4">
                      Frame only orders ship with demo lenses. No prescription or lens production required.
                    </p>
                  )}
                </>
              )}

              {step === "rx-entry" && (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button onClick={() => setRxMethod("manual")} className={`bg-background p-3 sm:p-4 text-sm font-medium border ${rxMethod === "manual" ? "border-sale" : "border-transparent"}`}>Enter manually</button>
                    <button onClick={() => setRxMethod("upload")} className={`bg-background p-3 sm:p-4 text-sm font-medium border ${rxMethod === "upload" ? "border-sale" : "border-transparent"}`}>Upload prescription</button>
                  </div>

                  {rxMethod === "manual" && (
                    <div className="space-y-3">
                      {/* OD card */}
                      <EyeCard label="Right Eye" sub="OD" val={od} setVal={setOd} />
                      {/* OS card */}
                      <EyeCard label="Left Eye" sub="OS" val={os} setVal={setOs} />

                      {/* PD card */}
                      <div className="bg-background p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-sm font-semibold flex items-center gap-1.5">
                            PD <span className="text-xs text-muted-foreground font-normal">(Pupillary Distance)</span>
                            <button onClick={() => setShowPd(true)} aria-label="help"><HelpCircle className="size-3.5 text-muted-foreground" /></button>
                          </span>
                          <label className="text-xs flex items-center gap-1.5 shrink-0">
                            <input type="checkbox" checked={twoPd} onChange={(e) => setTwoPd(e.target.checked)} className="size-3.5" /> Dual PD
                          </label>
                        </div>

                        {!twoPd ? (
                          <Select value={pd} onChange={setPd} options={["54","56","57","58","59","60","61","62","63","64","65","66","68"]} placeholder="Select PD (mm)" disabled={dontKnowPd} />
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-[11px] text-muted-foreground mb-1">Right PD</div>
                              <Select value={pdRight} onChange={setPdRight} options={["27","28","29","30","31","32","33","34"]} placeholder="mm" disabled={dontKnowPd} />
                            </div>
                            <div>
                              <div className="text-[11px] text-muted-foreground mb-1">Left PD</div>
                              <Select value={pdLeft} onChange={setPdLeft} options={["27","28","29","30","31","32","33","34"]} placeholder="mm" disabled={dontKnowPd} />
                            </div>
                          </div>
                        )}

                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={dontKnowPd} onChange={(e) => setDontKnowPd(e.target.checked)} className="size-4" />
                          I don't know my PD
                        </label>
                        {dontKnowPd && (
                          <div className="text-xs text-muted-foreground bg-surface p-2.5 border-l-2 border-amber-500">
                            PD will be marked as <strong>Unknown</strong>. Our team will contact you before production.
                          </div>
                        )}

                        <div className="border-t border-border/60 pt-3">
                          <label className="flex items-start gap-2 text-sm">
                            <input type="checkbox" checked={hasPrism} onChange={(e) => { setHasPrism(e.target.checked); if (e.target.checked) setRxMethod("upload"); }} className="size-4 mt-0.5" />
                            <span className="flex-1">
                              My prescription includes prism
                              <button onClick={() => setShowPrism(true)} aria-label="help" className="ml-1 align-middle"><HelpCircle className="size-3.5 text-muted-foreground inline" /></button>
                            </span>
                          </label>
                          {hasPrism && (
                            <div className="text-xs text-muted-foreground bg-surface p-2.5 border-l-2 border-sale mt-2">
                              Prism prescriptions require manual review. Please upload your prescription image.
                            </div>
                          )}
                        </div>
                      </div>

                      {errors.length > 0 && (
                        <ul className="text-xs text-sale space-y-1 bg-sale/10 p-3">
                          {errors.map((e) => <li key={e}>• {e}</li>)}
                        </ul>
                      )}
                    </div>
                  )}


                  {rxMethod === "upload" && (
                    <div className="bg-background p-8 space-y-4">
                      <p className="text-sm text-muted-foreground">Upload a clear photo or PDF of your prescription. Our team will review it before production.</p>
                      <label className="border-2 border-dashed border-border block p-10 cursor-pointer hover:border-foreground transition text-center">
                        <Upload className="size-6 mx-auto mb-3" />
                        <div className="text-sm">Drop your prescription here or <span className="text-sale underline">click to upload</span></div>
                        <div className="text-xs text-muted-foreground mt-1">(Max 20 MB)</div>
                        <input type="file" className="sr-only" accept="image/*,.pdf" onChange={(e) => setUploadedFile(e.target.files?.[0]?.name ?? "prescription.jpg")} />
                      </label>
                      {uploadedFile && <div className="text-xs text-sale">✓ {uploadedFile} ready to submit</div>}
                      <div className="text-center text-xs text-muted-foreground">— or —</div>
                      <button onClick={() => setUploadedFile("camera-capture.jpg")} className="w-full bg-sale text-white py-3 text-[11px] uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-2"><Camera className="size-4" /> Take a photo</button>

                      <label className="flex items-center gap-2 text-sm pt-2 border-t border-border/60">
                        <input type="checkbox" checked={dontKnowPd} onChange={(e) => setDontKnowPd(e.target.checked)} className="size-4" />
                        I don't know my PD (we'll contact you)
                      </label>

                      {errors.length > 0 && (
                        <ul className="text-xs text-sale space-y-1 bg-sale/10 p-3">
                          {errors.map((e) => <li key={e}>• {e}</li>)}
                        </ul>
                      )}
                    </div>
                  )}
                </>
              )}

              {step === "rx-review" && (
                <div className="bg-background border border-border/60 p-6 space-y-4">
                  <h4 className="font-display text-xl">Please review your prescription</h4>
                  <p className="text-xs text-muted-foreground">Double-check the values below. You can edit before continuing.</p>

                  {rxMethod === "manual" ? (
                    <div className="text-sm">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="text-xs text-muted-foreground border-b border-border/60">
                            <th className="text-left py-2 font-medium"></th>
                            <th className="text-center py-2 font-medium">SPH</th>
                            <th className="text-center py-2 font-medium">CYL</th>
                            <th className="text-center py-2 font-medium">Axis</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border/40">
                            <td className="py-2.5 font-medium">OD (Right)</td>
                            <td className="text-center">{od.sph}</td>
                            <td className="text-center">{od.cyl}</td>
                            <td className="text-center">{od.cyl === "None" ? "—" : (od.axis || "—")}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-medium">OS (Left)</td>
                            <td className="text-center">{os.sph}</td>
                            <td className="text-center">{os.cyl}</td>
                            <td className="text-center">{os.cyl === "None" ? "—" : (os.axis || "—")}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-sm bg-surface p-3">📎 Uploaded: <strong>{uploadedFile || "prescription file"}</strong></div>
                  )}

                  <dl className="grid grid-cols-2 gap-y-2 text-sm border-t border-border/60 pt-4">
                    <dt className="text-muted-foreground">PD</dt>
                    <dd>{dontKnowPd ? "Unknown" : twoPd ? `R ${pdRight || "—"} / L ${pdLeft || "—"}` : (pd || "—")}</dd>
                    <dt className="text-muted-foreground">Prism</dt>
                    <dd>{hasPrism ? "Yes" : "No"}</dd>
                    <dt className="text-muted-foreground">Method</dt>
                    <dd>{rxMethod === "upload" ? "Uploaded" : "Manual entry"}</dd>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="text-sale font-medium">
                      {status === "pending" ? "Pending human review"
                        : status === "uploaded" ? "Pending human review (uploaded)"
                        : status === "pd-unknown" ? "PD unknown — pending review"
                        : status === "prism-review" ? "Prism — pending review"
                        : "Pending review"}
                    </dd>
                  </dl>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setStep("rx-entry")} className="flex-1 border-2 border-foreground/20 py-3 text-[11px] uppercase tracking-[0.18em] font-semibold hover:bg-surface">Edit prescription</button>
                  </div>
                </div>
              )}

              {step === "fn" && (
                <>
                  <p className="text-sm text-muted-foreground mb-2">Choose what your lenses should do.</p>
                  {FNS.map((f) => {
                    const active = fnKey === f.key;
                    return (
                      <button key={f.key} onClick={() => setFnKey(f.key)} className={`relative w-full text-left bg-background p-5 border-2 transition ${active ? "border-sale" : "border-transparent hover:border-border"}`}>
                        <div className="flex justify-between items-baseline">
                          <span className="font-medium">{f.label}</span>
                          <span className="text-sm">{f.price === 0 ? "Included" : `+$${f.price}`}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{f.desc}</div>
                      </button>
                    );
                  })}
                </>
              )}

              {step === "thick" && (
                <>
                  <p className="text-sm text-muted-foreground mb-1">Choose how thin and lightweight you want your lenses to be.</p>
                  <p className="text-xs text-muted-foreground bg-background border-l-2 border-sale p-3 mb-2">For stronger prescriptions, thinner lenses can look better and feel lighter.</p>
                  {THICKS.map((th) => {
                    const active = thickKey === th.key;
                    return (
                      <button key={th.key} onClick={() => setThickKey(th.key)} className={`relative w-full text-left bg-background p-5 border-2 transition ${active ? "border-sale" : "border-transparent hover:border-border"}`}>
                        <div className="flex justify-between items-baseline">
                          <span className="font-medium">{th.label}</span>
                          <span className="text-sm">{th.price === 0 ? "Included" : `+$${th.price}`}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{th.desc}</div>
                      </button>
                    );
                  })}
                </>
              )}

              {step === "addon" && (
                <>
                  <div className="bg-background/60 border border-border p-3 text-xs flex items-center gap-2 mb-2">
                    <Check className="size-3.5 text-sale" /> AR + scratch-resistant coatings — Included
                  </div>
                  {ADDONS.map((a) => {
                    const active = addonKey === a.key;
                    return (
                      <button key={a.key} onClick={() => setAddonKey(a.key)} className={`relative w-full text-left bg-background p-5 border-2 transition ${active ? "border-sale" : "border-transparent hover:border-border"}`}>
                        <div className="flex justify-between items-baseline">
                          <span className="font-medium">{a.label}</span>
                          <span className="text-sm">{a.price === 0 ? "Included" : `+$${a.price}`}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{a.desc}</div>
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
              {step === "rx-review" ? "Confirm and continue" : nextLabel}
            </button>
          </div>
        </section>

        {/* Persistent Order Summary — collapsible on mobile */}
        <aside className="bg-background border-b lg:border-b-0 lg:border-l border-border/60 lg:px-10 lg:py-8 flex flex-col gap-4 lg:gap-6 lg:overflow-y-auto order-1 lg:order-2">
          <details className="lg:hidden border-b border-border/60 group" open={false}>
            <summary className="list-none cursor-pointer flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 bg-surface shrink-0">
                  <img src={productImage(p, Math.max(0, p.colors.findIndex((cc: { name: string }) => cc.name === color)))} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Order summary</div>
                  <div className="text-sm font-medium truncate">{p.name} · {color}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-display text-lg">${total.toFixed(2)}</span>
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
              </div>
            </summary>
            <div className="px-4 pb-4">
              <SummaryBody {...{ p, rxType, fnReached, fnObj, fnPrice, thickReached, thickObj, thickPrice, addonReached, addonObj, addonPrice, shipFree, shipping, total, goto, rxTypeLabelOf }} />
            </div>
          </details>

          <div className="hidden lg:flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="size-20 bg-surface shrink-0">
                <img src={productImage(p, Math.max(0, p.colors.findIndex((cc: { name: string }) => cc.name === color)))} alt={p.name} className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-lg leading-tight">{p.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{color} · M</p>
              </div>
            </div>
            <SummaryBody {...{ p, rxType, fnReached, fnObj, fnPrice, thickReached, thickObj, thickPrice, addonReached, addonObj, addonPrice, shipFree, shipping, total, goto, rxTypeLabelOf }} />
          </div>
        </aside>

      </div>

      {showPd && (
        <Modal onClose={() => setShowPd(false)} title="How to measure your PD">
          <p className="text-sm text-muted-foreground">PD (Pupillary Distance) is the distance between the centres of your pupils. Adult PD is typically 54–74 mm. Your optician usually measures it during an eye exam — but you can also measure it yourself with a mirror and a ruler.</p>
        </Modal>
      )}
      {showPrism && (
        <Modal onClose={() => setShowPrism(false)} title="Prism">
          <p className="text-sm text-muted-foreground">Prism is a measure in prism diopters. We process prism prescriptions for strabismus, double vision and convergence correction. Because prism is complex, we ask you to upload your prescription so our optician can verify the values manually.</p>
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
          onEdit ? (
            <button onClick={onEdit} className="text-sm text-foreground inline-flex items-center gap-1 mt-0.5">
              {subValue} <Pencil className="size-3 text-muted-foreground" />
            </button>
          ) : (
            <div className="text-sm text-muted-foreground mt-0.5">{subValue}</div>
          )
        )}
      </div>
      {value && <span className="text-sm shrink-0">{value}</span>}
    </div>
  );
}

type SummaryProps = {
  p: ReturnType<typeof getProduct> extends infer T ? NonNullable<T> : never;
  rxType: RxType;
  fnReached: boolean; fnObj: { label: string }; fnPrice: number;
  thickReached: boolean; thickObj: { label: string }; thickPrice: number;
  addonReached: boolean; addonObj: { label: string }; addonPrice: number;
  shipFree: boolean; shipping: number; total: number;
  goto: (s: Step) => void;
  rxTypeLabelOf: (rt: RxType) => string;
};
function SummaryBody(props: SummaryProps) {
  const { p, rxType, fnReached, fnObj, fnPrice, thickReached, thickObj, thickPrice, addonReached, addonObj, addonPrice, shipFree, shipping, total, goto, rxTypeLabelOf } = props;
  return (
    <div className="border-t border-border/60 pt-5">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Order summary</div>
      <div className="space-y-2.5 text-sm">
        <SumRow label="Frame price" value={`$${p.price.toFixed(2)}`} />
        <SumRow label="Fulfillment" subValue={rxTypeLabelOf(rxType)} onEdit={() => goto("rx-type")} />
        {fnReached ? (
          <SumRow label="Lens function" subValue={fnObj.label} value={fnPrice === 0 ? "Included" : `+$${fnPrice.toFixed(2)}`} onEdit={() => goto("fn")} />
        ) : rxType !== "frame-only" && (<SumRow label="Lens function" subValue="Not selected yet" />)}
        {thickReached ? (
          <SumRow label="Lens thickness" subValue={thickObj.label} value={thickPrice === 0 ? "Included" : `+$${thickPrice.toFixed(2)}`} onEdit={() => goto("thick")} />
        ) : rxType !== "frame-only" && (<SumRow label="Lens thickness" subValue="Not selected yet" />)}
        {addonReached ? (
          <SumRow label="Add-on" subValue={addonObj.label} value={addonPrice === 0 ? "Included" : `+$${addonPrice.toFixed(2)}`} onEdit={() => goto("addon")} />
        ) : rxType !== "frame-only" && (<SumRow label="Add-on" subValue="Not selected yet" />)}
        <SumRow label="Shipping" value={shipFree ? "FREE" : `$${shipping.toFixed(2)}`} />
      </div>
      <div className="border-t border-border/60 pt-4 mt-4 flex justify-between items-baseline">
        <span className="text-[11px] uppercase tracking-[0.18em] font-semibold">Total</span>
        <span className="font-display text-3xl">${total.toFixed(2)}</span>
      </div>
      {rxType === "frame-only" && (<p className="text-[11px] text-muted-foreground mt-3">Ships with demo lenses only.</p>)}
      {rxType === "non-rx" && (<p className="text-[11px] text-muted-foreground mt-3">No prescription required.</p>)}
      {(rxType === "single-vision" || rxType === "reading") && (<p className="text-[11px] text-muted-foreground mt-3">Every prescription is reviewed by our team before production.</p>)}
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

function EyeCard({ label, sub, val, setVal }: { label: string; sub: string; val: { sph: string; cyl: string; axis: string }; setVal: (v: { sph: string; cyl: string; axis: string }) => void }) {
  const cylNone = val.cyl === "None";
  return (
    <div className="bg-background p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{sub}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="text-[11px] text-muted-foreground mb-1">SPH</div>
          <Select value={val.sph} onChange={(v) => setVal({ ...val, sph: v })} options={SPH} />
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground mb-1">CYL</div>
          <Select value={val.cyl} onChange={(v) => setVal({ ...val, cyl: v, axis: v === "None" ? "" : val.axis })} options={CYL} />
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground mb-1">Axis</div>
          <input
            value={val.axis}
            onChange={(e) => setVal({ ...val, axis: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) })}
            placeholder={cylNone ? "—" : "1–180"}
            disabled={cylNone}
            inputMode="numeric"
            className="w-full bg-surface border border-border px-2 py-2 text-sm text-center disabled:opacity-50"
          />
        </div>
      </div>
    </div>
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
