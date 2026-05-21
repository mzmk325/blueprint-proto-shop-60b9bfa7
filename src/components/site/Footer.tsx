import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube } from "lucide-react";

export function Footer() {
  const col = "flex flex-col gap-2.5 text-[12px] text-muted-foreground";
  const h = "text-foreground text-[10px] uppercase tracking-[0.25em] font-bold mb-5";
  return (
    <footer className="mt-24 border-t border-border bg-background">
      {/* Newsletter */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-14 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="font-display text-2xl md:text-3xl tracking-tight font-bold">Join the Miravue list.</h3>
            <p className="text-sm text-muted-foreground mt-2">Early drops, lookbooks, member-only offers. No noise.</p>
          </div>
          <form className="flex border-b border-foreground pb-2 md:max-w-md md:ml-auto w-full">
            <input
              type="email"
              placeholder="EMAIL ADDRESS"
              className="bg-transparent w-full text-[11px] uppercase tracking-[0.2em] outline-none placeholder:text-muted-foreground/60"
            />
            <button className="text-[11px] uppercase tracking-[0.2em] font-bold hover:opacity-60">Subscribe</button>
          </form>
        </div>
      </div>

      {/* Trust strip */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6 flex flex-wrap items-center justify-center gap-8 text-[10px] uppercase tracking-[0.25em] font-medium text-muted-foreground">
          <span>30-Day Returns</span><span className="opacity-30">/</span>
          <span>365-Day Warranty</span><span className="opacity-30">/</span>
          <span>FSA/HSA Eligible</span><span className="opacity-30">/</span>
          <span className="text-foreground font-bold">★ 4.6 Trustpilot</span>
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-14 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div>
          <h4 className={h}>Shop</h4>
          <div className={col}>
            <Link to="/category/$slug" params={{ slug: "women-eyeglasses" }}>Women</Link>
            <Link to="/category/$slug" params={{ slug: "men-eyeglasses" }}>Men</Link>
            <Link to="/category/$slug" params={{ slug: "sunglasses" }}>Sunglasses</Link>
            <Link to="/category/$slug" params={{ slug: "best-sellers" }}>Best Sellers</Link>
            <Link to="/category/$slug" params={{ slug: "new-arrivals" }}>New Arrivals</Link>
          </div>
        </div>
        <div>
          <h4 className={h}>Lenses</h4>
          <div className={col}>
            <span>Blue Light</span><span>Photochromic</span><span>Polarized</span><span>Progressive</span>
          </div>
        </div>
        <div>
          <h4 className={h}>Help</h4>
          <div className={col}>
            <Link to="/faq">FAQ</Link>
            <span>Shipping</span><span>Returns</span><span>Size Guide</span>
          </div>
        </div>
        <div>
          <h4 className={h}>About</h4>
          <div className={col}><span>Our Story</span><span>Sustainability</span><span>Lookbook</span><span>Press</span></div>
        </div>
        <div>
          <h4 className={h}>Follow</h4>
          <div className="flex gap-4 text-foreground">
            <a href="#" aria-label="Instagram" className="hover:opacity-60"><Instagram className="size-4" strokeWidth={1.5} /></a>
            <a href="#" aria-label="Facebook" className="hover:opacity-60"><Facebook className="size-4" strokeWidth={1.5} /></a>
            <a href="#" aria-label="YouTube" className="hover:opacity-60"><Youtube className="size-4" strokeWidth={1.5} /></a>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>© 2026 Miravue. All rights reserved.</span>
          <span>Designed in studio · Hand-finished worldwide.</span>
        </div>
      </div>
    </footer>
  );
}
