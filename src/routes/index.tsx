import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { RecentlyViewed } from "@/components/site/RecentlyViewed";
import { products, shapes, categories, collections } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "MIRAVUE — Designer Eyewear, Honestly Priced" }, { name: "description", content: "Fashion-forward eyeglasses & sunglasses. Try on, find your fit, ship in days." }] }),
  component: Home,
});

function Home() {
  const featured = products.slice(0, 6);
  return (
    <Layout>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-secondary via-background to-accent/20">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <span className="inline-block text-xs uppercase tracking-widest text-muted-foreground">New Collection · 2026</span>
            <h1 className="text-5xl md:text-7xl leading-[1.05]">See the world<br/><em className="text-accent not-italic">differently.</em></h1>
            <p className="text-lg text-muted-foreground max-w-md">Designer frames crafted for the way you actually live. From $35, with free shipping over $75.</p>
            <div className="flex gap-3">
              <Link to="/category/$slug" params={{ slug: "all" }} className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90">Shop Eyeglasses</Link>
              <Link to="/category/$slug" params={{ slug: "sunglasses" }} className="inline-flex items-center px-6 py-3 border rounded-full text-sm font-medium hover:bg-secondary">Shop Sunglasses</Link>
            </div>
          </div>
          <div className="aspect-square rounded-3xl bg-card shadow-xl overflow-hidden">
            <img src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23efe6d8'/%3E%3Ccircle cx='140' cy='200' r='70' fill='none' stroke='%231a1a1a' stroke-width='10'/%3E%3Ccircle cx='280' cy='200' r='70' fill='none' stroke='%231a1a1a' stroke-width='10'/%3E%3Cpath d='M210,195 q10,-10 20,0' stroke='%231a1a1a' stroke-width='8' fill='none'/%3E%3C/svg%3E" alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 4).map((c, i) => (
            <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-secondary to-accent/30 p-6 flex flex-col justify-end hover:shadow-lg transition" style={{ background: ["#efe6d8","#e4dfd3","#d8d2c2","#e8e2d4"][i] }}>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Shop</span>
              <h3 className="text-2xl mt-1">{c.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Shapes */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl md:text-4xl">Shop by shape</h2>
          <Link to="/category/$slug" params={{ slug: "all" }} className="text-sm underline">View all</Link>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {shapes.map((s) => (
            <Link key={s} to="/category/$slug" params={{ slug: "all" }} search={{ shape: s }} className="text-center group">
              <div className="aspect-square rounded-full bg-secondary group-hover:bg-accent/40 transition flex items-center justify-center text-xs">{s.split(" ")[0]}</div>
              <div className="mt-2 text-xs">{s}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Collections */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid md:grid-cols-3 gap-4">
          {collections.slice(0, 3).map((col, i) => (
            <Link key={col} to="/category/$slug" params={{ slug: "all" }} search={{ collection: col }} className="aspect-[4/5] rounded-2xl p-8 flex flex-col justify-between text-white" style={{ background: ["#1a1a1a","#5e3a2f","#a82424"][i] }}>
              <span className="text-xs uppercase tracking-widest opacity-70">Collection {String(i+1).padStart(2,'0')}</span>
              <div>
                <h3 className="text-4xl text-white">{col}</h3>
                <p className="text-sm opacity-80 mt-2">{["Unconventional & experimental","Monochrome & edgy","Daily originals"][i]}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl md:text-4xl">Featured frames</h2>
          <Link to="/category/$slug" params={{ slug: "all" }} className="text-sm underline">Shop all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {featured.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      <RecentlyViewed />

      {/* Lens education */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-3xl md:text-4xl mb-8">Multi-purpose lenses</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["Blue Light", "Cut digital glare"],
            ["Photochromic", "Indoor to outdoor"],
            ["Polarized", "Crisp & glare-free"],
            ["Progressive", "Near, mid, far"],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border p-6 bg-card">
              <h3 className="text-lg">{t}</h3>
              <p className="text-sm text-muted-foreground mt-2">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto max-w-7xl px-4 py-12 border-t">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            ["30-Day", "Easy Returns"],
            ["365-Day", "Quality Warranty"],
            ["FSA/HSA", "Eligible"],
            ["4.6 ★", "20,000+ reviews"],
          ].map(([a, b]) => (
            <div key={a}>
              <div className="text-2xl font-display">{a}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{b}</div>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
