import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";

import { shapes, categories } from "@/lib/products";
import {
  getHomepageCMS,
  getBestsellers,
  getNewArrivals,
  shapeBannerImage,
} from "@/lib/storefront-cms";
import { ArrowRight, ShieldCheck, RotateCcw, Truck, Star } from "lucide-react";
import { useI18n, type TKey } from "@/lib/i18n";
import { usePriceFormatter } from "@/lib/currency-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MIRAVUE — Designer Eyewear, Honestly Priced" },
      { name: "description", content: "Designer eyeglasses & sunglasses. Architectural acetate, hand-finished, virtual try-on." },
    ],
  }),
  component: Home,
});

const heroImgFallback =
  "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=2000&q=80";
const tileFallback = {
  women: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=900&q=80",
  men: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=900&q=80",
  sunW: "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=900&q=80",
  sunM: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=900&q=80",
};
const editorial = {
  bold: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1200&q=80",
  dark: "https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?auto=format&fit=crop&w=1200&q=80",
  daily: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=1200&q=80",
};

// Convert a CMS link like "/category/women-eyeglasses" into a category slug.
function linkToSlug(link: string): string {
  const m = link.match(/\/category\/([^/?#]+)/);
  return m?.[1] ?? "all";
}

function Home() {
  const { t } = useI18n();
  const { heroes, homeCards, shapeBanners } = getHomepageCMS();
  const hero = heroes[0];
  const heroImg = hero?.desktopImage || heroImgFallback;
  const bestsellers = getBestsellers(4);
  const newArrivals = getNewArrivals(4);

  const tiles = homeCards.length
    ? homeCards.slice(0, 4).map((c) => ({ slug: linkToSlug(c.link), label: c.title, img: c.image }))
    : [
        { slug: "women-eyeglasses", label: t("home.tile.women"),   img: tileFallback.women },
        { slug: "men-eyeglasses",   label: t("home.tile.men"),     img: tileFallback.men },
        { slug: "sunglasses",       label: t("home.tile.womenSun"), img: tileFallback.sunW },
        { slug: "sunglasses",       label: t("home.tile.menSun"),  img: tileFallback.sunM },
      ];

  const banners = shapeBanners.length
    ? shapeBanners
    : shapes.map((s, i) => ({ id: `fb-${s}`, shape: s, image: "", link: `/category/all?shape=${encodeURIComponent(s)}`, sortOrder: i, active: true }));

  return (
    <Layout>
      <section className="relative h-[88vh] min-h-[600px] w-full overflow-hidden bg-surface">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <span className="text-white/90 text-[11px] uppercase tracking-[0.3em] mb-6 font-medium">
            {t("home.hero.tag")}
          </span>
          <h1 className="text-white text-[14vw] md:text-[9rem] font-bold leading-[0.85] tracking-[-0.04em] uppercase">
            {t("home.hero.title1")}<br />{t("home.hero.title2")}
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-md mt-8 font-light">
            {t("home.hero.lead")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-10">
            <Link
              to="/category/$slug"
              params={{ slug: "all" }}
              className="bg-primary text-primary-foreground px-10 py-4 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-foreground transition-colors"
            >
              {t("home.hero.shopEye")}
            </Link>
            <Link
              to="/category/$slug"
              params={{ slug: "sunglasses" }}
              className="bg-background/90 backdrop-blur text-foreground px-10 py-4 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-background transition-colors"
            >
              {t("home.hero.shopSun")}
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-0.5 transition-all ${i === 0 ? "w-10 bg-white" : "w-6 bg-white/40"}`} />
          ))}
        </div>
      </section>

      <section className="bg-surface/60 py-10 text-center">
        <h2 className="font-display text-2xl md:text-3xl tracking-tight">
          {t("home.tagline")}
        </h2>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 w-full border-b border-border">
        {tiles.map((tt, i) => (
          <Link
            key={i}
            to="/category/$slug"
            params={{ slug: tt.slug }}
            className={`relative aspect-[3/4] overflow-hidden group ${i < 3 ? "lg:border-r border-border" : ""}`}
          >
            <img src={tt.img} alt={tt.label} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-colors" />
            <div className="absolute bottom-6 left-6">
              <h3 className="text-white font-display text-2xl uppercase tracking-tight font-bold">{tt.label}</h3>
              <span className="text-white/80 text-[10px] uppercase tracking-[0.25em] mt-1 inline-block">{t("common.shopNow")} →</span>
            </div>
          </Link>
        ))}
      </section>

      <section className="py-20 lg:py-24 px-6 lg:px-8">
        <div className="text-center mb-10 lg:mb-12">
          <h2 className="text-3xl md:text-4xl uppercase tracking-tight font-bold">{t("home.shape.title")}</h2>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mt-3">{t("home.shape.sub")}</p>
        </div>
        <div className="max-w-7xl mx-auto">
          <div
            className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory px-6 md:px-0 pb-2"
            style={{ scrollPaddingLeft: 24 }}
          >
            {banners.map((b) => (
              <Link
                key={b.id}
                to="/category/$slug"
                params={{ slug: "all" }}
                search={{ shape: b.shape }}
                className="group relative flex-shrink-0 snap-start overflow-hidden bg-surface
                           w-[68%] sm:w-[42%] md:w-[calc((100%-3rem)/4)] lg:w-[calc((100%-4rem)/5)]
                           aspect-[4/5]"
              >
                <img
                  src={shapeBannerImage(b)}
                  alt={b.shape}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="font-display text-lg md:text-xl tracking-tight font-bold uppercase">
                    {t(`shape.${b.shape}` as TKey)}
                  </h3>
                  <span className="text-[10px] uppercase tracking-[0.22em] opacity-90">
                    {t("common.shopNow")} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-8 pb-20 lg:pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4 border-b border-border pb-6">
            <h2 className="text-4xl md:text-5xl uppercase tracking-tight font-bold">{t("home.bestsellers")}</h2>
            <Link to="/category/$slug" params={{ slug: "best-sellers" }} className="text-[11px] uppercase tracking-[0.2em] font-bold flex items-center gap-2 hover:opacity-60">
              {t("common.shopAll")} <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {bestsellers.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-8 pb-24 bg-surface/40 pt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4 border-b border-border pb-6">
            <h2 className="text-4xl md:text-5xl uppercase tracking-tight font-bold">{t("home.newArrivals")}</h2>
            <Link to="/category/$slug" params={{ slug: "new-arrivals" }} className="text-[11px] uppercase tracking-[0.2em] font-bold flex items-center gap-2 hover:opacity-60">
              {t("common.shopAll")} <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {newArrivals.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32 px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl uppercase tracking-tight font-bold">{t("home.editorial.title")}</h2>
          <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto">
            {t("home.editorial.sub")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          {[
            { title: t("home.editorial.boldT"), desc: t("home.editorial.boldD"), img: editorial.bold, slug: "all", filter: "Bold" },
            { title: t("home.editorial.darkT"), desc: t("home.editorial.darkD"), img: editorial.dark, slug: "all", filter: "Dark" },
            { title: t("home.editorial.dailyT"), desc: t("home.editorial.dailyD"), img: editorial.daily, slug: "all", filter: "Daily" },
          ].map((e) => (
            <Link
              key={e.title}
              to="/category/$slug"
              params={{ slug: e.slug }}
              search={{ collection: e.filter }}
              className="relative aspect-[3/4] overflow-hidden group"
            >
              <img src={e.img} alt={e.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <h3 className="font-display text-3xl uppercase tracking-tight font-bold">{e.title}</h3>
                <p className="text-sm opacity-90 mt-1 max-w-xs">{e.desc}</p>
                <span className="inline-block mt-4 text-[10px] uppercase tracking-[0.25em] font-bold border-b border-white pb-0.5">{t("common.discover")}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* RecentlyViewed hidden on homepage to keep main rhythm intact */}

      <section className="py-20 px-6 lg:px-8 bg-surface/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl uppercase tracking-tight font-bold">{t("home.lens.title")}</h2>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mt-3">{t("home.lens.sub")}</p>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { tt: t("home.lens.polT"), d: t("home.lens.polD"), img: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=800&q=80" },
            { tt: t("home.lens.proT"), d: t("home.lens.proD"), img: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=800&q=80" },
            { tt: t("home.lens.bluT"), d: t("home.lens.bluD"), img: "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?auto=format&fit=crop&w=800&q=80" },
          ].map((l) => (
            <div key={l.tt} className="group">
              <div className="aspect-[4/5] overflow-hidden bg-surface">
                <img src={l.img} alt={l.tt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="mt-5">
                <h3 className="font-display text-xl font-semibold">{l.tt}</h3>
                <p className="text-sm text-muted-foreground mt-1">{l.d}</p>
                <button className="mt-3 text-[11px] uppercase tracking-[0.2em] font-bold border-b border-foreground pb-0.5">{t("common.learnMore")}</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14 px-6 lg:px-8 border-t border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: RotateCcw, tt: t("home.trust.returnsT"), s: t("home.trust.returnsS") },
            { icon: ShieldCheck, tt: t("home.trust.warrantyT"), s: t("home.trust.warrantyS") },
            { icon: Truck, tt: t("home.trust.shipT"), s: t("home.trust.shipS", { ship: fmt(75) }) },
            { icon: Star, tt: "4.6 / 5", s: t("home.trust.ratingS") },
          ].map((b) => (
            <div key={b.tt} className="flex flex-col items-center gap-2">
              <b.icon className="size-5" strokeWidth={1.5} />
              <div className="font-display text-sm font-semibold tracking-tight">{b.tt}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{b.s}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="hidden">
        {categories.map((c) => (
          <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }}>{c.title}</Link>
        ))}
      </section>
    </Layout>
  );
}

