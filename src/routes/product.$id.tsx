import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { RecentlyViewed } from "@/components/site/RecentlyViewed";
import { getProduct, productImage, products, type Product } from "@/lib/products";
import { useUser, user } from "@/lib/user-store";
import { Star, Truck, RefreshCw, ShieldCheck, Heart, Minus, Plus } from "lucide-react";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const p = getProduct(params.id);
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Frame"} — MIRAVUE` },
      { name: "description", content: loaderData?.descriptor ?? "" },
    ],
  }),
  component: PDP,
  notFoundComponent: () => <Layout><div className="p-20 text-center">Product not found.</div></Layout>,
});

function PDP() {
  const p = Route.useLoaderData() as Product;
  const [colorIdx, setColorIdx] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState<"S" | "M" | "L">("M");
  const [openSection, setOpenSection] = useState<string | null>("details");
  const { wishlist } = useUser();
  const wished = wishlist.includes(p.id);
  useEffect(() => { user.pushRecent(p.id); }, [p.id]);

  const thumbs = [0, 1, 2, 3];

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 pt-6 pb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/category/$slug" params={{ slug: "all" }} className="hover:text-foreground">{p.shape}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{p.name}</span>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 grid md:grid-cols-[80px_1fr_440px] gap-8">
        {/* Thumbnail rail */}
        <div className="hidden md:flex flex-col gap-3 order-1">
          {thumbs.map((i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={`aspect-square w-full overflow-hidden bg-surface border ${activeImg === i ? "border-foreground" : "border-transparent hover:border-border"} transition-colors`}
            >
              <img src={productImage(p, (colorIdx + i) % p.colors.length)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Main image */}
        <div className="order-2 relative aspect-[4/5] bg-surface overflow-hidden">
          <img src={productImage(p, (colorIdx + activeImg) % p.colors.length)} alt={p.name} className="w-full h-full object-cover" />
          <button className="absolute bottom-5 right-5 bg-background/95 text-foreground text-[10px] uppercase tracking-[0.18em] font-semibold px-4 py-2 hover:bg-foreground hover:text-background transition-colors">
            Try On
          </button>
          <button
            onClick={() => user.toggleWish(p.id)}
            className="absolute top-5 right-5 size-10 flex items-center justify-center bg-background/95 hover:scale-105 transition-transform"
            aria-label="Wishlist"
          >
            <Heart className={`size-5 ${wished ? "fill-sale text-sale" : ""}`} strokeWidth={1.5} />
          </button>
        </div>

        {/* Details rail */}
        <div className="order-3 space-y-7">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{p.shape} · {p.collection}</p>
              {p.badge === "NEW" && <span className="text-[10px] bg-foreground text-background px-2 py-0.5 uppercase tracking-wider">New Arrival</span>}
            </div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight leading-tight">{p.name}</h1>
            <p className="text-sm text-muted-foreground mt-2">{p.descriptor}</p>
          </div>

          <div className="flex items-center gap-3 pb-5 border-b border-border/60">
            <span className="font-display text-2xl">${p.price.toFixed(2)}</span>
            {p.originalPrice && <span className="text-sm text-muted-foreground line-through">${p.originalPrice.toFixed(2)}</span>}
            {p.discountPct && <span className="text-[10px] bg-sale text-white px-2 py-0.5 font-bold uppercase tracking-tighter">{p.discountPct}% Off</span>}
            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <div className="flex">{[1,2,3,4,5].map((i) => <Star key={i} className="size-3 fill-foreground text-foreground" />)}</div>
              <span>(1,284)</span>
            </div>
          </div>

          {/* Color */}
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-[11px] uppercase tracking-[0.18em] font-semibold">Frame color</span>
              <span className="text-xs text-muted-foreground">{p.colors[colorIdx].name}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {p.colors.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => { setColorIdx(i); setActiveImg(0); }}
                  className={`size-14 overflow-hidden border-2 transition ${i === colorIdx ? "border-foreground" : "border-transparent hover:border-border"}`}
                  aria-label={c.name}
                >
                  <img src={productImage(p, i)} alt={c.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-[11px] uppercase tracking-[0.18em] font-semibold">Size</span>
              <button className="text-xs text-muted-foreground underline underline-offset-2">Size guide</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["S", "M", "L"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`py-3 text-xs uppercase tracking-[0.15em] border transition-colors ${size === s ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
                >
                  {s === "S" ? "Small" : s === "M" ? "Medium" : "Large"}
                </button>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-2.5 pt-2">
            <Link
              to="/lens/$id"
              params={{ id: p.id }}
              search={{ color: p.colors[colorIdx].name }}
              className="relative block w-full bg-sale text-white text-center py-4 text-[11px] uppercase tracking-[0.2em] font-semibold hover:opacity-90 transition-opacity"
            >
              Select lens color
              <span className="absolute top-0 right-3 -translate-y-1/2 bg-foreground text-background text-[9px] px-2 py-0.5 tracking-wider">15% Off</span>
            </Link>
            <Link
              to="/lens/$id"
              params={{ id: p.id }}
              search={{ color: p.colors[colorIdx].name, frameOnly: true }}
              className="block w-full bg-foreground text-background text-center py-4 text-[11px] uppercase tracking-[0.2em] font-semibold hover:opacity-90 transition-opacity"
            >
              Frame only
            </Link>
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              or 4 interest-free payments of ${(p.price / 4).toFixed(2)} with Klarna
            </p>
          </div>

          {/* Trust */}
          <ul className="grid grid-cols-2 gap-3 pt-4 border-t border-border/60 text-[11px]">
            <li className="flex items-center gap-2 text-muted-foreground"><Truck className="size-3.5" /> Free shipping $75+</li>
            <li className="flex items-center gap-2 text-muted-foreground"><RefreshCw className="size-3.5" /> 30-day returns</li>
            <li className="flex items-center gap-2 text-muted-foreground"><ShieldCheck className="size-3.5" /> 365-day warranty</li>
            <li className="flex items-center gap-2 text-muted-foreground"><Truck className="size-3.5" /> Ships in 13–20 days</li>
          </ul>

          {/* Accordion */}
          <div className="border-t border-border/60 pt-2">
            {[
              { k: "details", t: "Product details" },
              { k: "lens", t: "Lens recommendations" },
              { k: "shipping", t: "Shipping & returns" },
              { k: "reviews", t: "Reviews (1,284)" },
            ].map(({ k, t }) => {
              const open = openSection === k;
              return (
                <div key={k} className="border-b border-border/60">
                  <button
                    onClick={() => setOpenSection(open ? null : k)}
                    className="w-full flex justify-between items-center py-4 text-left"
                  >
                    <span className="text-[11px] uppercase tracking-[0.18em] font-semibold">{t}</span>
                    {open ? <Minus className="size-4" /> : <Plus className="size-4" />}
                  </button>
                  {open && (
                    <div className="pb-5 text-sm text-muted-foreground">
                      {k === "details" && (
                        <div className="space-y-5">
                          {/* Measurement diagram */}
                          <div className="bg-surface/60 border border-border/60 p-4">
                            <svg viewBox="0 0 300 130" className="w-full h-auto text-foreground/70">
                              <g fill="none" stroke="currentColor" strokeWidth="1">
                                <rect x="40" y="40" width="80" height="50" rx="6" />
                                <rect x="180" y="40" width="80" height="50" rx="6" />
                                <line x1="120" y1="65" x2="180" y2="65" />
                                <line x1="40" y1="20" x2="260" y2="20" strokeDasharray="2 3" />
                                <line x1="40" y1="100" x2="40" y2="115" />
                                <line x1="120" y1="100" x2="120" y2="115" />
                                <line x1="120" y1="40" x2="120" y2="25" />
                                <line x1="180" y1="40" x2="180" y2="25" />
                              </g>
                              <g fill="currentColor" fontSize="9" fontFamily="DM Sans" textAnchor="middle">
                                <text x="150" y="15">{p.dims.frameWidth} mm</text>
                                <text x="80" y="115">{p.dims.lensWidth} mm</text>
                                <text x="150" y="60">{p.dims.bridge}</text>
                                <text x="280" y="65">{p.dims.lensHeight}</text>
                              </g>
                            </svg>
                          </div>
                          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                            {[
                              ["Model", p.modelCode],
                              ["Frame width", `${p.dims.frameWidth} mm`],
                              ["Lens width", `${p.dims.lensWidth} mm`],
                              ["Lens height", `${p.dims.lensHeight} mm`],
                              ["Bridge", `${p.dims.bridge} mm`],
                              ["Temple", `${p.dims.temple} mm`],
                              ["Material", p.material],
                              ["Weight", p.weight],
                            ].map(([k2, v]) => (
                              <div key={k2 as string}>
                                <dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">{k2}</dt>
                                <dd className="text-foreground mt-0.5">{v}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      )}
                      {k === "lens" && <p>Recommended: Blue Light Blocking for daily screen use, Photochromic for indoor/outdoor versatility. Configure on the next step.</p>}
                      {k === "shipping" && <p>Ships in 13–20 days. Free over $75. 30-day returns, no questions asked. 365-day quality warranty.</p>}
                      {k === "reviews" && (
                        <div className="space-y-4">
                          <div className="flex items-baseline gap-3">
                            <span className="font-display text-3xl text-foreground">4.6</span>
                            <span className="text-xs">Based on 1,284 reviews</span>
                          </div>
                          {[
                            ["Love these!", "Lightweight and exactly as pictured. Lots of compliments.", "A. M."],
                            ["Great fit", "Frames sit perfectly. Lenses are crystal clear.", "J. R."],
                          ].map(([t, b, n]) => (
                            <div key={t} className="pt-3 border-t border-border/60">
                              <div className="flex items-center justify-between">
                                <span className="text-foreground font-medium text-sm">{t}</span>
                                <div className="flex">{[1,2,3,4,5].map((i) => <Star key={i} className="size-3 fill-foreground text-foreground" />)}</div>
                              </div>
                              <p className="text-xs mt-1">{b} — {n}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <RecentlyViewed excludeId={p.id} />

      {/* You may also like */}
      <section className="mx-auto max-w-7xl px-6 py-20 border-t border-border/60">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl tracking-tight">You may also like</h2>
          <Link to="/category/$slug" params={{ slug: "all" }} className="text-[11px] uppercase tracking-[0.18em] underline underline-offset-4">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
          {products.filter((x) => x.id !== p.id).slice(0, 4).map((r) => <ProductCard key={r.id} p={r} />)}
        </div>
      </section>
    </Layout>
  );
}
