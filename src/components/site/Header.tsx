import { Link } from "@tanstack/react-router";
import { Heart, Menu } from "lucide-react";
import { useState } from "react";
import { useUser } from "@/lib/user-store";
import { MiniCart } from "./MiniCart";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SearchPopover } from "./SearchPopover";
import { SupportPopover } from "./SupportPopover";
import { AccountPopover } from "./AccountPopover";

export function PromoBar() {
  const { t } = useI18n();
  return (
    <div className="bg-promo text-promo-foreground">
      <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center justify-center text-[10px] uppercase tracking-[0.25em] font-medium">
        {t("promo.banner")} <span className="ml-1.5 font-bold">HELLO15</span>
      </div>
    </div>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const items: [string, ReturnType<typeof t>][] = [
    ["all", t("nav.eyeglasses")],
    ["women-eyeglasses", t("nav.women")],
    ["men-eyeglasses", t("nav.men")],
    ["sunglasses", t("nav.sunglasses")],
    ["best-sellers", t("nav.bestSellers")],
    ["new-arrivals", t("nav.newArrivals")],
  ];
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button aria-label={t("a11y.menu")} className="lg:hidden hover:opacity-60 transition-opacity">
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-background">
        <nav className="flex flex-col gap-1 mt-8 text-sm uppercase tracking-[0.15em] font-medium">
          {items.map(([slug, label]) => (
            <Link key={slug} to="/category/$slug" params={{ slug }} onClick={() => setOpen(false)} className="py-3 border-b border-border">{label}</Link>
          ))}
          <Link to="/wishlist" onClick={() => setOpen(false)} className="py-3 border-b border-border">{t("nav.wishlist")}</Link>
          <Link to="/faq" onClick={() => setOpen(false)} className="py-3 border-b border-border">{t("nav.faq")}</Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function Header() {
  const { wishlist } = useUser();
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
      <PromoBar />
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <MobileNav />
          <nav className="hidden lg:flex items-center gap-9 text-[11px] uppercase tracking-[0.18em] font-medium">
            <Link to="/category/$slug" params={{ slug: "all" }} className="hover:opacity-60 transition-opacity" activeProps={{ className: "font-bold" }}>{t("nav.eyeglasses")}</Link>
            <Link to="/category/$slug" params={{ slug: "sunglasses" }} className="hover:opacity-60 transition-opacity" activeProps={{ className: "font-bold" }}>{t("nav.sunglasses")}</Link>
            <Link to="/category/$slug" params={{ slug: "best-sellers" }} className="hover:opacity-60 transition-opacity">{t("nav.collections")}</Link>
            <Link to="/category/$slug" params={{ slug: "new-arrivals" }} className="text-sale hover:opacity-70 transition-opacity">{t("nav.special")}</Link>
          </nav>
        </div>

        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2 font-display text-2xl tracking-[-0.04em] font-bold uppercase"
        >
          Miravue<span className="text-accent">.</span>
        </Link>

        <div className="flex items-center gap-5 text-foreground/80">
          <SearchPopover />
          <Link to="/wishlist" aria-label={t("a11y.wishlist")} className="relative hover:text-foreground transition-colors hidden sm:block">
            <Heart className="size-[18px]" strokeWidth={1.5} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[9px] rounded-full size-3.5 flex items-center justify-center font-bold">{wishlist.length}</span>
            )}
          </Link>
          <MiniCart />
          <SupportPopover />
          <AccountPopover />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
