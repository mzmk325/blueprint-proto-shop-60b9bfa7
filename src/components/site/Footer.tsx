import { Link } from "@tanstack/react-router";

export function Footer() {
  const col = "flex flex-col gap-2 text-sm text-muted-foreground";
  const h = "text-foreground font-semibold mb-3 text-sm uppercase tracking-wide";
  return (
    <footer className="mt-24 border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div>
          <h4 className={h}>Shop</h4>
          <div className={col}>
            <Link to="/category/$slug" params={{ slug: "women-eyeglasses" }}>Women</Link>
            <Link to="/category/$slug" params={{ slug: "men-eyeglasses" }}>Men</Link>
            <Link to="/category/$slug" params={{ slug: "sunglasses" }}>Sunglasses</Link>
            <Link to="/category/$slug" params={{ slug: "best-sellers" }}>Best Sellers</Link>
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
          <div className={col}><span>Our Story</span><span>Sustainability</span><span>Lookbook</span></div>
        </div>
        <div>
          <h4 className={h}>Programs</h4>
          <div className={col}><span>FSA / HSA</span><span>Student Discount</span><span>Affiliates</span></div>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 MIRAVUE. MVP prototype — replace branding & copy.</span>
          <span>Made for try-on, made for you.</span>
        </div>
      </div>
    </footer>
  );
}
