import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { shapes, collections, categories } from "@/lib/products";
import { getProductsByCategorySlug, sortStorefrontProducts, getStorefrontCategoryBySlug } from "@/lib/storefront-cms";
import { z } from "zod";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useI18n, type TKey } from "@/lib/i18n";

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
  const { t, locale } = useI18n();
  const cat = categories.find((c) => c.slug === slug) ?? getStorefrontCategoryBySlug(slug) ? { slug, title: getStorefrontCategoryBySlug(slug)?.title ?? "Shop", gender: null as null | "Women" | "Men" } : undefined;

  let list = getProductsByCategorySlug(slug).filter((p) => {
    if (search.shape && p.shape !== search.shape) return false;
    if (search.collection && p.collection !== search.collection) return false;
    if (search.color && !p.colors.some((c) => c.name === search.color)) return false;
    return true;
  });
  const sortKey = search.sort === "new" ? "new" : search.sort === "price-asc" ? "price-asc" : search.sort === "price-desc" ? "price-desc" : "recommend";
  list = sortStorefrontProducts(list, sortKey);

  const setParam = (key: string, value?: string) =>
    navigate({ to: "/category/$slug", params: { slug }, search: { ...search, [key]: value } as never });

  // Localize category title for ZH
  const catTitle = (() => {
    if (!cat) return t("common.shop");
    if (locale === "en") return cat.title;
    const map: Record<string, string> = {
      "all": "全部",
      "women-eyeglasses": "女款光学镜",
      "men-eyeglasses": "男款光学镜",
      "sunglasses": "太阳镜",
      "best-sellers": "热销榜",
      "new-arrivals": "新品上架",
    };
    return map[cat.slug] ?? cat.title;
  })();

  return (
    <Layout>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 pt-10 pb-6">
          <nav className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground">{t("common.home")}</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{catTitle}</span>
          </nav>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <h1 className="font-display text-5xl md:text-7xl tracking-tight leading-[0.95]">{catTitle}</h1>
              <p className="text-sm text-muted-foreground mt-3 max-w-xl">
                {t("cat.intro")}
              </p>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{list.length} {t("cat.pieces")}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-6 md:py-10 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-x-12 gap-y-8">
        <aside className="hidden md:block space-y-8 text-sm">
          <FiltersInner search={search} setParam={setParam} t={t} />
        </aside>

        <div>
          {/* Mobile filter + sort row */}
          <MobileFilterBar search={search} setParam={setParam} t={t} />

          <div className="hidden md:flex items-center justify-between border-b border-border/60 pb-4 mb-8">
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
                <option value="recommend">{t("common.featured")}</option>
                <option value="new">{t("common.newest")}</option>
                <option value="price-asc">{t("common.priceAsc")}</option>
                <option value="price-desc">{t("common.priceDesc")}</option>
              </select>
              <ChevronDown className="size-3 absolute right-0 top-1 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-10 sm:gap-y-12">
            {list.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>

          {list.length === 0 && (
            <div className="py-20 text-center text-sm text-muted-foreground">
              {t("cat.empty")} <button onClick={() => navigate({ to: "/category/$slug", params: { slug }, search: {} })} className="underline">{t("cat.reset")}</button>
            </div>
          )}
        </div>
      </div>

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">{t("cat.about")}</p>
          <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-6">
            {t("cat.aboutTitle")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {t("cat.aboutDesc")}
          </p>
          <div className="mt-12 divide-y divide-border/60 border-y border-border/60">
            {[
              [t("cat.faq1Q"), t("cat.faq1A")],
              [t("cat.faq2Q"), t("cat.faq2A")],
              [t("cat.faq3Q"), t("cat.faq3A")],
              [t("cat.faq4Q"), t("cat.faq4A")],
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

function FilterGroup({ title, current, options, onSelect, labelOf, allLabel }: { title: string; current?: string; options: string[]; onSelect: (v?: string) => void; labelOf: (o: string) => string; allLabel: string }) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3">{title}</h3>
      <ul className="space-y-1.5">
        <li>
          <button onClick={() => onSelect(undefined)} className={`text-sm ${!current ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
            {allLabel}
          </button>
        </li>
        {options.map((o) => (
          <li key={o}>
            <button onClick={() => onSelect(o)} className={`text-sm ${current === o ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              {labelOf(o)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

type SetParam = (key: string, value?: string) => void;
type TFn = (k: TKey) => string;

function FiltersInner({ search, setParam, t }: { search: { shape?: string; collection?: string; color?: string }; setParam: SetParam; t: TFn }) {
  return (
    <>
      <FilterGroup
        title={t("cat.shape")}
        current={search.shape}
        onSelect={(v) => setParam("shape", v)}
        options={[...shapes]}
        labelOf={(o) => t(`shape.${o}` as TKey)}
        allLabel={t("cat.allOf") + " " + t("cat.shape")}
      />
      <FilterGroup
        title={t("cat.collection")}
        current={search.collection}
        onSelect={(v) => setParam("collection", v)}
        options={[...collections]}
        labelOf={(o) => o}
        allLabel={t("cat.allOf") + " " + t("cat.collection")}
      />
      <div>
        <h3 className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3">{t("cat.color")}</h3>
        <div className="grid grid-cols-6 gap-2">
          <button
            onClick={() => setParam("color", undefined)}
            className={`size-7 rounded-full border ${!search.color ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "border-border"} bg-gradient-to-br from-secondary to-muted`}
            aria-label={t("cat.allColors")}
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
    </>
  );
}

function MobileFilterBar({ search, setParam, t }: { search: { shape?: string; collection?: string; color?: string; sort?: string }; setParam: SetParam; t: TFn }) {
  const [open, setOpen] = useState(false);
  const activeCount = (["shape", "collection", "color"] as const).filter((k) => search[k]).length;
  return (
    <div className="md:hidden mb-6">
      <div className="flex items-center gap-2 border-y border-border/60 py-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 border border-foreground text-[11px] uppercase tracking-[0.18em] font-semibold">
              <SlidersHorizontal className="size-3.5" />
              {t("cat.filter" as TKey) !== "cat.filter" ? t("cat.filter" as TKey) : "Filter"}
              {activeCount > 0 && <span className="ml-1 bg-foreground text-background rounded-full min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[10px] font-bold">{activeCount}</span>}
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[88%] sm:w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left uppercase tracking-[0.18em] text-sm">Filter</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-8 pb-8">
              <FiltersInner search={search} setParam={setParam} t={t} />
              {activeCount > 0 && (
                <button
                  onClick={() => { setParam("shape", undefined); setParam("collection", undefined); setParam("color", undefined); }}
                  className="w-full text-[11px] uppercase tracking-[0.18em] underline underline-offset-4 py-2"
                >
                  {t("cat.reset")}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="w-full bg-foreground text-background py-3 text-[11px] uppercase tracking-[0.18em] font-semibold">
                Apply
              </button>
            </div>
          </SheetContent>
        </Sheet>
        <div className="relative flex-1">
          <select
            className="w-full appearance-none text-[11px] uppercase tracking-[0.18em] bg-background border border-border py-2.5 pl-3 pr-8 cursor-pointer focus:outline-none"
            value={search.sort ?? "recommend"}
            onChange={(e) => setParam("sort", e.target.value)}
          >
            <option value="recommend">{t("common.featured")}</option>
            <option value="new">{t("common.newest")}</option>
            <option value="price-asc">{t("common.priceAsc")}</option>
            <option value="price-desc">{t("common.priceDesc")}</option>
          </select>
          <ChevronDown className="size-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {(["shape", "collection", "color"] as const).map((k) =>
            search[k] ? (
              <button
                key={k}
                onClick={() => setParam(k, undefined)}
                className="text-[10px] uppercase tracking-[0.15em] border border-foreground/80 px-2.5 py-1 hover:bg-foreground hover:text-background transition-colors"
              >
                {search[k]} ×
              </button>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
