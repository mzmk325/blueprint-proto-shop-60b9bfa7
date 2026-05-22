import { Link } from "@tanstack/react-router";
import { Heart, Menu, User, Headphones } from "lucide-react";
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
      <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center justify-center text-[10px] uppercase tracking-[0.25em] font-medium text-center">
        {t("promo.banner")} <span className="ml-1.5 font-bold">HELLO15</span>
      </div>
    </div>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const { wishlist } = useUser();
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
        <button aria-label={t("a11y.menu")} className="sm:hidden -ml-1 grid size-10 place-items-center hover:opacity-60 transition-opacity">
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 bg-background overflow-y-auto">
        <nav className="flex flex-col gap-1 mt-8 text-sm uppercase tracking-[0.15em] font-medium">
          {items.map(([slug, label]) => (
            <Link key={slug} to="/category/$slug" params={{ slug }} onClick={() => setOpen(false)} className="py-3 border-b border-border">{label}</Link>
          ))}
        </nav>
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">{t("acct.profile")}</p>
          <nav className="flex flex-col gap-1 text-sm">
            <Link to="/wishlist" onClick={() => setOpen(false)} className="py-3 border-b border-border flex items-center gap-3">
              <Heart className="size-4" strokeWidth={1.5} />
              <span>{t("nav.wishlist")}</span>
              {wishlist.length > 0 && <span className="ml-auto text-xs text-muted-foreground">{wishlist.length}</span>}
            </Link>
            <Link to="/admin" onClick={() => setOpen(false)} className="py-3 border-b border-border flex items-center gap-3">
              <User className="size-4" strokeWidth={1.5} />
              <span>{t("acct.profile")}</span>
            </Link>
            <Link to="/faq" onClick={() => setOpen(false)} className="py-3 border-b border-border flex items-center gap-3">
              <Headphones className="size-4" strokeWidth={1.5} />
              <span>{t("support.help")}</span>
            </Link>
            <Link to="/faq" onClick={() => setOpen(false)} className="py-3 border-b border-border">{t("nav.faq")}</Link>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function Header() {
  const { wishlist } = useUser();
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border [--header-h:100px]">
      <PromoBar />
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-3 sm:px-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
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
          className="font-display text-xl sm:text-2xl tracking-[-0.04em] font-bold uppercase"
        >
          Miravue<span className="text-accent">.</span>
        </Link>

        <div className="flex items-center justify-end gap-0.5 sm:gap-1 text-foreground/80">
          <SearchPopover />
          <Link to="/wishlist" aria-label={t("a11y.wishlist")} className="hidden sm:inline-flex items-center justify-center">
            <span className="relative grid size-9 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground">
              <Heart className="size-[18px]" strokeWidth={1.5} />
              {wishlist.length > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground text-[10px] leading-none rounded-full min-w-[16px] h-[16px] px-1 inline-flex items-center justify-center font-semibold tabular-nums ring-2 ring-background">{wishlist.length > 99 ? "99+" : wishlist.length}</span>
              )}
            </span>
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
