import { useI18n, type Locale } from "@/lib/i18n";
import { Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const options: { code: Locale; label: string }[] = [
    { code: "en", label: "English" },
    { code: "zh", label: "中文" },
  ];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 hover:text-foreground transition-colors text-foreground/80"
        aria-label="Language"
      >
        <Globe className="size-[18px]" strokeWidth={1.5} />
        <span className="text-[11px] uppercase tracking-[0.15em] font-medium hidden sm:inline">
          {locale === "zh" ? "中文" : "EN"}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-[140px] bg-background border border-border shadow-lg z-50">
          {options.map((o) => (
            <button
              key={o.code}
              onClick={() => {
                setLocale(o.code);
                setOpen(false);
              }}
              className={`block w-full text-left px-4 py-2.5 text-xs uppercase tracking-[0.15em] hover:bg-secondary transition-colors ${
                locale === o.code ? "font-bold" : "text-foreground/70"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
