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

  const close = () => setOpen(false);
  const itemCls = "flex items-center justify-between py-2.5 text-sm hover:text-foreground text-foreground/80";

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
            <li><Link to="/admin" onClick={close} className={itemCls}>{t("acct.rewards")}</Link></li>
            <li>
              <Link to="/admin" onClick={close} className={itemCls}>
                <span>{t("acct.profile")}</span>
                <span className="text-[10px] bg-sale text-white px-1.5 py-0.5 rounded font-bold">+Points</span>
              </Link>
            </li>
            <li><Link to="/admin" onClick={close} className={itemCls}>{t("acct.orders")}</Link></li>
            <li><Link to="/admin" onClick={close} className={itemCls}>{t("acct.address")}</Link></li>
            <li><Link to="/admin" onClick={close} className={itemCls}>{t("acct.rx")}</Link></li>
            <li><Link to="/admin" onClick={close} className={itemCls}>{t("acct.coupons")}</Link></li>
            <li><Link to="/wishlist" onClick={close} className={itemCls}>{t("acct.wishlist")}</Link></li>
            <li><Link to="/admin" onClick={close} className={itemCls}>{t("acct.points")}</Link></li>
            <li><Link to="/admin" onClick={close} className={itemCls}>{t("acct.recent")}</Link></li>
          </ul>
          <div className="pt-3 border-t border-border">
            <button className="text-sm text-sale font-medium underline">{t("acct.signOut")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
