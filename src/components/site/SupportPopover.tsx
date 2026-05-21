import { Headphones } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function SupportPopover() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const items: { label: string; to: string; params?: Record<string, string> }[] = [
    { label: t("support.track"), to: "/admin" },
    { label: t("support.help"), to: "/faq" },
    { label: t("support.contact"), to: "/faq" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("support.label")}
        className="hover:text-foreground transition-colors text-foreground/80 hidden sm:block"
      >
        <Headphones className="size-[18px]" strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-[220px] bg-background border border-border shadow-lg z-50 py-2">
          {items.map((it) => (
            <Link
              key={it.label}
              to={it.to}
              onClick={() => setOpen(false)}
              className="block px-5 py-3 text-sm hover:bg-secondary transition-colors text-center"
            >
              {it.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
