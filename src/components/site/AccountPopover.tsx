import { User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function AccountPopover() {
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

  const items: { label: string; to: string; badge?: string }[] = [
    { label: t("acct.rewards"), to: "/admin" },
    { label: t("acct.profile"), to: "/admin", badge: "+Points" },
    { label: t("acct.orders"), to: "/admin" },
    { label: t("acct.address"), to: "/admin" },
    { label: t("acct.rx"), to: "/admin" },
    { label: t("acct.coupons"), to: "/admin" },
    { label: t("acct.wishlist"), to: "/wishlist" },
    { label: t("acct.points"), to: "/admin" },
    { label: t("acct.recent"), to: "/admin" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("a11y.account")}
        className="hover:text-foreground transition-colors text-foreground/80 hidden sm:block"
      >
        <User className="size-[18px]" strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[280px] bg-background border border-border shadow-lg z-50 p-5">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold">M</div>
            <div className="font-bold text-sm">Miravue Member</div>
          </div>
          <ul className="py-2">
            {items.map((it) => (
              <li key={it.label}>
                <Link
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-2.5 text-sm hover:text-foreground text-foreground/80"
                >
                  <span>{it.label}</span>
                  {it.badge && (
                    <span className="text-[10px] bg-sale text-white px-1.5 py-0.5 rounded font-bold">{it.badge}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <div className="pt-3 border-t border-border">
            <button className="text-sm text-sale font-medium underline">{t("acct.signOut")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
