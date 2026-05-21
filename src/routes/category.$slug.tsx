import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { products, shapes, collections, categories } from "@/lib/products";
import { z } from "zod";
import { ChevronDown } from "lucide-react";

const searchSchema = z.object({
  shape: z.string().optional(),
  collection: z.string().optional(),
  color: z.string().optional(),
  sort: z.enum(["recommend", "price-asc", "price-desc", "new"]).optional(),
});

export const Route = createFileRoute("/category/$slug")({
  validateSearch: searchSchema,
  head: ({ params }) => ({
    meta: [
      { title: `${categories.find((c) => c.slug === params.slug)?.title ?? "Shop"} — MIRAVUE` },
      { name: "description", content: "Browse designer eyewear by shape, color, and style." },
    ],
  }),
  component: Category,
});

const COLOR_SWATCHES: Record<string, string> = {
  Black: "#0d0d0d", Tortoise: "#6b4423", Gold: "#c9a84c", Clear: "#e8e4dd",
  Red: "#c0392b", Pink: "#e8a0b4", Green: "#3d6b4a", Silver: "#bcbcbc",
};

function Category() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const cat = categories.find((c) => c.slug === slug);

  let list = products.filter((p) => {
    if (cat?.gender && p.gender !== cat.gender && p.gender !== "Unisex") return false;
    if (search.shape && p.shape !== search.shape) return false;
    if (search.collection && p.collection !== search.collection) return false;
    if (search.color && !p.colors.some((c) => c.name === search.color)) return false;
    return true;
  });
  if (search.sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (search.sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);

  const setParam = (key: string, value?: string) =>
    navigate({ to: "/category/$slug", params: { slug }, search: { ...search, [key]: value } as never });

  return (
    <Layout>
      {/* Editorial header */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 pt-10 pb-6">
          <nav className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{cat?.title ?? "Shop"}</span>
          </nav>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <h1 className="font-display text-5xl md:text-7xl tracking-tight leading-[0.95]">{cat?.title ?? "Shop"}</h1>
              <p className="text-sm text-muted-foreground mt-3 max-w-xl">
                Considered eyewear for the everyday — engineered in acetate and titanium, finished by hand.
              </p>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{list.length} pieces</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-x-12 gap-y-8">
        {/* Sidebar filters */}
        <aside className="space-y-8 text-sm">
          <FilterGroup title="Shape" current={search.shape} onSelect={(v) => setParam("shape", v)} options={[...shapes]} />
          <FilterGroup title="Collection" current={search.collection} onSelect={(v) => setParam("collection", v)} options={[...collections]} />
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3">Color</h3>
            <div className="grid grid-cols-6 gap-2">
              <button
                onClick={() => setParam("color", undefined)}
                className={`size-7 rounded-full border ${!search.color ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "border-border"} bg-gradient-to-br from-secondary to-muted`}
                aria-label="All colors"
              />
              {Object.entries(COLOR_SWATCHES).map(([name, hex]) => (
                <button
                  key={name}
                  onClick={() => setParam("color", name)}
                  className={`size-7 rounded-full border ${search.color === name ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "border-border"}`}
                  style={{ background: hex }}
                  aria-label={name}
                  title={name}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Right column */}
        <div>
          {/* Sort bar */}
          <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-8">
            <div className="flex flex-wrap gap-2">
              {(["shape", "collection", "color"] as const).map((k) =>
                search[k] ? (
                  <button
                    key={k}
                    onClick={() => setParam(k, undefined)}
                    className="text-[11px] uppercase tracking-[0.15em] border border-foreground/80 px-3 py-1.5 hover:bg-foreground hover:text-background transition-colors"
                  >
                    {search[k]} ×
                  </button>
                ) : null,
              )}
            </div>
            <div className="relative">
              <select
                className="appearance-none text-[11px] uppercase tracking-[0.18em] bg-transparent border-b border-foreground pb-1 pr-6 cursor-pointer focus:outline-none"
                value={search.sort ?? "recommend"}
                onChange={(e) => setParam("sort", e.target.value)}
              >
                <option value="recommend">Featured</option>
                <option value="new">Newest</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
              </select>
              <ChevronDown className="size-3 absolute right-0 top-1 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
            {list.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>

          {list.length === 0 && (
            <div className="py-20 text-center text-sm text-muted-foreground">
              No frames match. <button onClick={() => navigate({ to: "/category/$slug", params: { slug }, search: {} })} className="underline">Reset filters</button>
            </div>
          )}
        </div>
      </div>

      {/* Editorial FAQ */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">About the collection</p>
          <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-6">
            Frames designed for the way you actually live.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Every pair includes scratch-resistant lenses, anti-reflective coating, and free shipping
            on orders over $75. Try on virtually, ship in 13–20 days, return within 30.
          </p>
          <div className="mt-12 divide-y divide-border/60 border-y border-border/60">
            {[
              ["Do you offer prescription lenses?", "Yes — single vision, blue-light, and frame-only are all available at checkout."],
              ["How do I find the right style?", "Start by shape. Round softens angular faces; square balances softer ones."],
              ["Can I try on virtually?", "Tap Try On on any product card to open the virtual mirror."],
              ["What's your return policy?", "30 days, no questions asked, on all unused frames."],
            ].map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <span className="font-display text-base">{q}</span>
                  <span className="text-xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm text-muted-foreground mt-3 max-w-2xl">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function FilterGroup({ title, current, options, onSelect }: { title: string; current?: string; options: string[]; onSelect: (v?: string) => void }) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3">{title}</h3>
      <ul className="space-y-1.5">
        <li>
          <button onClick={() => onSelect(undefined)} className={`text-sm ${!current ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
            All {title.toLowerCase()}s
          </button>
        </li>
        {options.map((o) => (
          <li key={o}>
            <button onClick={() => onSelect(o)} className={`text-sm ${current === o ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              {o}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
