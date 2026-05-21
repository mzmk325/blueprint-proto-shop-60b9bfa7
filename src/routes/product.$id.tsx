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
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">{p.shape} · {p.collection}</p>
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
              <span className="text-[11px] uppercase tracking-[0.18em] font-semibold">Color</span>
              <span className="text-xs text-muted-foreground">{p.colors[colorIdx].name}</span>
            </div>
            <div className="flex gap-2.5 flex-wrap">
              {p.colors.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => { setColorIdx(i); setActiveImg(0); }}
                  className={`size-10 rounded-full border ${i === colorIdx ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "border-border"}`}
                  style={{ background: c.hex }}
                  aria-label={c.name}
                />
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
              className="block w-full bg-sale text-white text-center py-4 text-[11px] uppercase tracking-[0.2em] font-semibold hover:opacity-90 transition-opacity"
            >
              Select lens color — ${p.price.toFixed(2)}
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
