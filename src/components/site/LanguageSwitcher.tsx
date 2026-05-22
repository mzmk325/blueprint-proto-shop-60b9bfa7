import { useI18n, PUBLIC_LOCALES, INTERNAL_LOCALES, isZhPreviewEnabled, LOCALE_CURRENCY, type Locale } from "@/lib/i18n";
import { Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCurrency, getCurrencySymbol } from "@/lib/currency-store";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const currency = useCurrency();
  const [open, setOpen] = useState(false);
  const [zhVisible, setZhVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Detect ?preview_lang=zh on mount only (client-side)
  useEffect(() => { setZhVisible(isZhPreviewEnabled()); }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const locales = zhVisible
    ? [...PUBLIC_LOCALES, ...INTERNAL_LOCALES]
    : PUBLIC_LOCALES;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((v) => !v)}
        className="grid size-9 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Language and currency"
      >
        <Globe className="size-[18px]" strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[320px] bg-background border border-border shadow-lg z-50 p-5 space-y-5">
          <div>
            <div className="text-sm font-bold mb-2">{t("lc.language")}</div>
            <div className="relative">
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="w-full appearance-none border border-border rounded-md px-3 py-2.5 text-sm bg-background pr-8 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {locales.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">▾</span>
            </div>
          </div>
          <div>
            <div className="text-sm font-bold mb-1">{t("lc.currency")}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-between border border-border rounded-md px-3 py-2.5 bg-muted/30">
              <span>{getCurrencySymbol(currency)} {currency}</span>
              <span className="text-xs">{LOCALE_CURRENCY[locale] ? "auto" : ""}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Currency follows the selected language.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
