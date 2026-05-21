import { Link } from "@tanstack/react-router";
import { Search, User, Heart, Menu } from "lucide-react";
import { useState } from "react";
import { useUser } from "@/lib/user-store";
import { MiniCart } from "./MiniCart";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function PromoBar() {
  return (
    <div className="bg-promo text-promo-foreground text-xs">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-6 flex-wrap">
        <span>15% OFF your first order — code <strong>HELLO15</strong></span>
        <span className="hidden md:inline opacity-70">·</span>
        <span className="hidden md:inline">Free shipping on orders over $75</span>
      </div>
    </div>
  );
}

export function TrustBar() {
  return (
    <div className="border-b bg-muted/40 text-xs text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 py-1.5 flex items-center justify-center gap-6 flex-wrap">
        <span>Fast Shipping</span><span>·</span>
        <span>30-Day Returns</span><span>·</span>
        <span>365-Day Warranty</span><span>·</span>
        <span>FSA/HSA Eligible</span>
      </div>
    </div>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button aria-label="Menu" className="md:hidden hover:text-foreground"><Menu className="size-5" /></button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <nav className="flex flex-col gap-1 mt-8 text-base">
          {[
            ["all", "Eyeglasses"],
            ["women-eyeglasses", "Women"],
            ["men-eyeglasses", "Men"],
            ["sunglasses", "Sunglasses"],
            ["best-sellers", "Best Sellers"],
            ["new-arrivals", "New Arrivals"],
          ].map(([slug, label]) => (
            <Link key={slug} to="/category/$slug" params={{ slug }} onClick={() => setOpen(false)} className="py-3 border-b">{label}</Link>
          ))}
          <Link to="/wishlist" onClick={() => setOpen(false)} className="py-3 border-b">Wishlist</Link>
          <Link to="/faq" onClick={() => setOpen(false)} className="py-3 border-b">FAQ</Link>
          <Link to="/admin" onClick={() => setOpen(false)} className="py-3 border-b">Admin</Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function Header() {
  const { wishlist } = useUser();
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
      <PromoBar />
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-4 md:gap-8">
        <MobileNav />
        <Link to="/" className="font-display text-2xl tracking-tight">MIRAVUE</Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/category/$slug" params={{ slug: "all" }} activeProps={{ className: "font-semibold" }}>Eyeglasses</Link>
          <Link to="/category/$slug" params={{ slug: "sunglasses" }} activeProps={{ className: "font-semibold" }}>Sunglasses</Link>
          <Link to="/category/$slug" params={{ slug: "best-sellers" }}>Collections</Link>
          <Link to="/category/$slug" params={{ slug: "new-arrivals" }} className="text-sale">Special Offers</Link>
        </nav>
        <div className="ml-auto flex items-center gap-4 text-foreground/80">
          <button aria-label="Search" className="hover:text-foreground"><Search className="size-5" /></button>
          <Link to="/admin" aria-label="Account" className="hover:text-foreground hidden sm:block"><User className="size-5" /></Link>
          <Link to="/wishlist" aria-label="Wishlist" className="relative hover:text-foreground hidden sm:block">
            <Heart className="size-5" />
            {wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] rounded-full size-4 flex items-center justify-center">{wishlist.length}</span>
            )}
          </Link>
          <MiniCart />
        </div>
      </div>
      <TrustBar />
    </header>
  );
}
