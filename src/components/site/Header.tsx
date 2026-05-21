import { Link } from "@tanstack/react-router";
import { Search, User, Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-store";

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

export function Header() {
  const { lines } = useCart();
  const count = lines.reduce((s, l) => s + l.qty, 0);
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
      <PromoBar />
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-8">
        <Link to="/" className="font-display text-2xl tracking-tight">MIRAVUE</Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/category/$slug" params={{ slug: "all" }} activeProps={{ className: "font-semibold" }}>Eyeglasses</Link>
          <Link to="/category/$slug" params={{ slug: "sunglasses" }} activeProps={{ className: "font-semibold" }}>Sunglasses</Link>
          <Link to="/category/$slug" params={{ slug: "best-sellers" }}>Collections</Link>
          <Link to="/category/$slug" params={{ slug: "new-arrivals" }} className="text-sale">Special Offers</Link>
        </nav>
        <div className="ml-auto flex items-center gap-4 text-foreground/80">
          <button aria-label="Search" className="hover:text-foreground"><Search className="size-5" /></button>
          <Link to="/admin" aria-label="Account" className="hover:text-foreground"><User className="size-5" /></Link>
          <button aria-label="Wishlist" className="hover:text-foreground hidden sm:block"><Heart className="size-5" /></button>
          <Link to="/cart" aria-label="Cart" className="relative hover:text-foreground">
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-sale text-white text-[10px] rounded-full size-4 flex items-center justify-center">{count}</span>
            )}
          </Link>
        </div>
      </div>
      <TrustBar />
    </header>
  );
}
