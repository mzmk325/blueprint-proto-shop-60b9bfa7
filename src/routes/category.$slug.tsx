import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { products, shapes, collections, categories } from "@/lib/products";
import { z } from "zod";

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

function Category() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const cat = categories.find((c) => c.slug === slug);
  const [showFilters, setShowFilters] = useState(true);

  let list = products.filter((p) => {
    if (cat?.gender && p.gender !== cat.gender && p.gender !== "Unisex") return false;
    if (search.shape && p.shape !== search.shape) return false;
    if (search.collection && p.collection !== search.collection) return false;
    if (search.color && !p.colors.some((c) => c.name === search.color)) return false;
    return true;
  });
  if (search.sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (search.sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground">
        <Link to="/">Home</Link> / {cat?.title ?? "Shop"}
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl md:text-5xl">{cat?.title ?? "Shop"}</h1>
          <p className="text-sm text-muted-foreground mt-2">{list.length} results</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFilters((s) => !s)} className="text-sm border px-4 py-2 rounded-full hover:bg-secondary">
            {showFilters ? "Hide" : "Show"} Filters
          </button>
          <select
            className="text-sm border rounded-full px-4 py-2 bg-background"
            value={search.sort ?? "recommend"}
            onChange={(e) => { window.location.search = `?sort=${e.target.value}`; }}
          >
            <option value="recommend">Recommended</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="new">Newest</option>
          </select>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
        {showFilters && (
          <aside className="space-y-6 text-sm">
            <FilterGroup title="Shape" current={search.shape} param="shape" options={[...shapes]} slug={slug} />
            <FilterGroup title="Collection" current={search.collection} param="collection" options={[...collections]} slug={slug} />
            <FilterGroup title="Color" current={search.color} param="color" options={["Black","Tortoise","Gold","Clear","Red","Pink","Green","Silver"]} slug={slug} />
          </aside>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {list.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>

      {/* SEO/FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-20">
        <h2 className="text-2xl mb-4">About our {cat?.title.toLowerCase() ?? "frames"}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Find frames designed for the way you actually live. Every pair includes
          scratch-resistant lenses, anti-reflective coating, and free shipping on orders
          over $75. Try on virtually, ship in 13–20 days, return within 30.
        </p>
        <div className="mt-10 space-y-3">
          {[
            ["Do you offer prescription lenses?", "Yes — single vision, blue-light, and frame-only are all available at checkout."],
            ["How do I find the right style?", "Start by shape. Round softens angular faces; square balances softer ones."],
            ["Can I try on virtually?", "Tap the Try On button on any product card. (MVP stub — wire camera later.)"],
            ["What's your return policy?", "30 days, no questions asked, on all unused frames."],
          ].map(([q, a]) => (
            <details key={q} className="border-b py-3">
              <summary className="cursor-pointer font-medium">{q}</summary>
              <p className="text-sm text-muted-foreground mt-2">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </Layout>
  );
}

function FilterGroup({ title, current, param, options, slug }: { title: string; current?: string; param: string; options: string[]; slug: string }) {
  return (
    <div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="space-y-1">
        <Link to="/category/$slug" params={{ slug }} className={!current ? "block text-foreground" : "block text-muted-foreground hover:text-foreground"}>All</Link>
        {options.map((o) => (
          <Link key={o} to="/category/$slug" params={{ slug }} search={{ [param]: o } as never} className={current === o ? "block text-foreground font-medium" : "block text-muted-foreground hover:text-foreground"}>
            {o}
          </Link>
        ))}
      </div>
    </div>
  );
}
