import { Headphones } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function SupportPopover() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((v) => !v)}
        aria-label={t("support.label")}
        className="hidden size-9 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground sm:grid"
      >
        <Headphones className="size-[18px]" strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[240px] bg-background border border-border shadow-lg z-50 p-2">
          <Link to="/admin" onClick={() => setOpen(false)} className="block px-5 py-3 text-sm hover:bg-secondary transition-colors text-center">{t("support.track")}</Link>
          <Link to="/faq" onClick={() => setOpen(false)} className="block px-5 py-3 text-sm hover:bg-secondary transition-colors text-center">{t("support.help")}</Link>
          <Link to="/faq" onClick={() => setOpen(false)} className="block px-5 py-3 text-sm hover:bg-secondary transition-colors text-center">{t("support.contact")}</Link>
        </div>
      )}
    </div>
  );
}
