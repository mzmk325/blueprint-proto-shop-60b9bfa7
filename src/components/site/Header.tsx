import { Link } from "@tanstack/react-router";
import { Search, User, Heart, Menu } from "lucide-react";
import { useState } from "react";
import { useUser } from "@/lib/user-store";
import { MiniCart } from "./MiniCart";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function PromoBar() {
  return (
    <div className="bg-promo text-promo-foreground">
      <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center justify-center text-[10px] uppercase tracking-[0.25em] font-medium">
        Free shipping on orders over $75 · 15% off first order with <span className="ml-1.5 font-bold">HELLO15</span>
      </div>
    </div>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button aria-label="Menu" className="lg:hidden hover:opacity-60 transition-opacity">
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-background">
        <nav className="flex flex-col gap-1 mt-8 text-sm uppercase tracking-[0.15em] font-medium">
          {[
            ["all", "Eyeglasses"],
            ["women-eyeglasses", "Women"],
            ["men-eyeglasses", "Men"],
            ["sunglasses", "Sunglasses"],
            ["best-sellers", "Best Sellers"],
            ["new-arrivals", "New Arrivals"],
          ].map(([slug, label]) => (
            <Link key={slug} to="/category/$slug" params={{ slug }} onClick={() => setOpen(false)} className="py-3 border-b border-border">{label}</Link>
          ))}
          <Link to="/wishlist" onClick={() => setOpen(false)} className="py-3 border-b border-border">Wishlist</Link>
          <Link to="/faq" onClick={() => setOpen(false)} className="py-3 border-b border-border">FAQ</Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function Header() {
  const { wishlist } = useUser();
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
      <PromoBar />
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <MobileNav />
          <nav className="hidden lg:flex items-center gap-9 text-[11px] uppercase tracking-[0.18em] font-medium">
            <Link to="/category/$slug" params={{ slug: "all" }} className="hover:opacity-60 transition-opacity" activeProps={{ className: "font-bold" }}>Eyeglasses</Link>
            <Link to="/category/$slug" params={{ slug: "sunglasses" }} className="hover:opacity-60 transition-opacity" activeProps={{ className: "font-bold" }}>Sunglasses</Link>
            <Link to="/category/$slug" params={{ slug: "best-sellers" }} className="hover:opacity-60 transition-opacity">Collections</Link>
            <Link to="/category/$slug" params={{ slug: "new-arrivals" }} className="text-sale hover:opacity-70 transition-opacity">Special</Link>
          </nav>
        </div>

        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2 font-display text-2xl tracking-[-0.04em] font-bold uppercase"
        >
          Miravue<span className="text-accent">.</span>
        </Link>

        <div className="flex items-center gap-5 text-foreground/80">
          <button aria-label="Search" className="hover:text-foreground transition-colors"><Search className="size-[18px]" strokeWidth={1.5} /></button>
          <Link to="/admin" aria-label="Account" className="hover:text-foreground transition-colors hidden sm:block"><User className="size-[18px]" strokeWidth={1.5} /></Link>
          <Link to="/wishlist" aria-label="Wishlist" className="relative hover:text-foreground transition-colors hidden sm:block">
            <Heart className="size-[18px]" strokeWidth={1.5} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[9px] rounded-full size-3.5 flex items-center justify-center font-bold">{wishlist.length}</span>
            )}
          </Link>
          <MiniCart />
        </div>
      </div>
    </header>
  );
}
