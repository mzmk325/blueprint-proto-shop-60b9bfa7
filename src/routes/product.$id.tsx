import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { RecentlyViewed } from "@/components/site/RecentlyViewed";
import { getProduct, productImage, products, type Product } from "@/lib/products";
import { useUser, user } from "@/lib/user-store";
import { Star, Truck, RefreshCw, ShieldCheck, Heart } from "lucide-react";

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
  const [size, setSize] = useState<"S" | "M" | "L">("M");
  const [tab, setTab] = useState<"details" | "lens" | "shipping" | "reviews">("details");
  const { wishlist } = useUser();
  const wished = wishlist.includes(p.id);
  useEffect(() => { user.pushRecent(p.id); }, [p.id]);


  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground">
        <Link to="/">Home</Link> / <Link to="/category/$slug" params={{ slug: "all" }}>{p.shape} Eyeglasses</Link> / {p.name}
      </div>

      <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-2 gap-10">
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl bg-secondary overflow-hidden relative">
            <img src={productImage(p, colorIdx)} alt={p.name} className="w-full h-full object-cover" />
            <button className="absolute bottom-4 right-4 bg-background/95 px-4 py-2 rounded-full text-sm font-medium shadow">Try On</button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted overflow-hidden">
                <img src={productImage(p, i)} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl">{p.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{p.descriptor}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold">${p.price.toFixed(2)}</span>
            {p.originalPrice && <span className="text-base text-muted-foreground line-through">${p.originalPrice.toFixed(2)}</span>}
            {p.discountPct && <span className="text-xs bg-sale text-white px-2 py-0.5 rounded">{p.discountPct}% OFF</span>}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex">{[1,2,3,4,5].map((i) => <Star key={i} className="size-4 fill-accent text-accent" />)}</div>
            <span className="text-muted-foreground">4.6 (1,284 reviews)</span>
          </div>
          <div className="bg-accent/10 border border-accent/30 rounded-lg px-3 py-2 text-xs">
            🎁 Free shipping on your first order + 15% off with <strong>HELLO15</strong>
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Color: <span className="text-foreground">{p.colors[colorIdx].name}</span></div>
            <div className="flex gap-2">
              {p.colors.map((c, i) => (
                <button key={c.name} onClick={() => setColorIdx(i)} className={`size-9 rounded-full border-2 ${i === colorIdx ? "border-foreground" : "border-border"}`} style={{ background: c.hex }} aria-label={c.name} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Size: <span className="text-foreground">{size === "S" ? "Small" : size === "M" ? "Medium" : "Large"}</span></span>
              <button className="text-xs underline">Size Chart</button>
            </div>
            <div className="flex gap-2">
              {(["S", "M", "L"] as const).map((s) => (
                <button key={s} onClick={() => setSize(s)} className={`px-4 py-2 border rounded-lg text-sm ${size === s ? "border-foreground bg-secondary" : ""}`}>{s === "S" ? "Small" : s === "M" ? "Medium" : "Large"}</button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Link to="/lens/$id" params={{ id: p.id }} search={{ color: p.colors[colorIdx].name }} className="flex-1 bg-primary text-primary-foreground py-4 rounded-full text-center font-medium hover:opacity-90">Select Lenses</Link>
            <Link to="/lens/$id" params={{ id: p.id }} search={{ color: p.colors[colorIdx].name, frameOnly: true }} className="flex-1 border-2 py-4 rounded-full text-center font-medium hover:bg-secondary">Frame Only</Link>
            <button onClick={() => user.toggleWish(p.id)} className={`border-2 px-4 rounded-full hover:bg-secondary ${wished ? "border-sale" : ""}`} aria-label="Wishlist"><Heart className={`size-5 ${wished ? "fill-sale text-sale" : ""}`} /></button>
          </div>

          <div className="text-xs text-muted-foreground">or 4 interest-free payments of ${(p.price / 4).toFixed(2)} with Klarna / Afterpay</div>

          <ul className="space-y-2 text-sm border-t pt-4">
            <li className="flex items-center gap-2"><Truck className="size-4" /> Free shipping on your first order</li>
            <li className="flex items-center gap-2"><RefreshCw className="size-4" /> Easy 30-day returns</li>
            <li className="flex items-center gap-2"><Truck className="size-4" /> Delivery in 13–20 days</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-4" /> FSA/HSA eligible</li>
          </ul>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-4 mt-20">
        <div className="border-b flex gap-6 text-sm">
          {([["details","Product Details"],["lens","Lens Recommendations"],["shipping","Shipping & Returns"],["reviews","Reviews"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`pb-3 ${tab === k ? "border-b-2 border-foreground font-medium" : "text-muted-foreground"}`}>{label}</button>
          ))}
        </div>
        <div className="py-8">
          {tab === "details" && (
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              {[
                ["Model Code", p.modelCode],
                ["Frame Size", `${p.dims.frameWidth}mm`],
                ["Weight", p.weight],
                ["Bridge Fit", "Universal"],
                ["Lens Width", `${p.dims.lensWidth}mm`],
                ["Lens Height", `${p.dims.lensHeight}mm`],
                ["Bridge", `${p.dims.bridge}mm`],
                ["Temple", `${p.dims.temple}mm`],
                ["Shape", p.shape],
                ["Material", p.material],
                ["Color", p.colors[colorIdx].name],
                ["Features", "Spring Hinges"],
              ].map(([k, v]) => (
                <div key={k as string}><dt className="text-xs uppercase tracking-widest text-muted-foreground">{k}</dt><dd className="mt-1">{v}</dd></div>
              ))}
            </dl>
          )}
          {tab === "lens" && <p className="text-sm text-muted-foreground">Recommended: Blue Light Blocking for daily screen use, Photochromic for indoor/outdoor versatility. Configure on the next step.</p>}
          {tab === "shipping" && <p className="text-sm text-muted-foreground">Ships in 13–20 days. Free over $75. 30-day returns, no questions asked. 365-day quality warranty.</p>}
          {tab === "reviews" && (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="text-5xl font-display">4.6</div>
                <div className="text-sm text-muted-foreground">Based on 1,284 reviews<br/>Quality 4.7 · Design 4.6 · Fit 4.5</div>
              </div>
              {[
                ["Love these!", "Lightweight and exactly as pictured. Lots of compliments.", "A. M.", "Tortoise"],
                ["Great fit", "Frames sit perfectly. Lenses are crystal clear.", "J. R.", "Black"],
              ].map(([t, b, n, col]) => (
                <div key={t} className="border-t pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{t}</div>
                      <div className="text-xs text-muted-foreground">{n} · {col} · 5 days ago</div>
                    </div>
                    <div className="flex">{[1,2,3,4,5].map((i) => <Star key={i} className="size-3 fill-accent text-accent" />)}</div>
                  </div>
                  <p className="text-sm mt-2">{b}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <RecentlyViewed excludeId={p.id} />

      {/* You may also like */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl md:text-3xl mb-8">You may also like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.filter((x) => x.id !== p.id).slice(0, 4).map((r) => <ProductCard key={r.id} p={r} />)}
        </div>
      </section>
    </Layout>
  );
}
