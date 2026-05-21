import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { RecentlyViewed } from "@/components/site/RecentlyViewed";
import { products, shapes, categories } from "@/lib/products";
import { ArrowRight, ShieldCheck, RotateCcw, Truck, Star } from "lucide-react";
import { useI18n, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MIRAVUE — Designer Eyewear, Honestly Priced" },
      { name: "description", content: "Designer eyeglasses & sunglasses. Architectural acetate, hand-finished, virtual try-on." },
    ],
  }),
  component: Home,
});

const heroImg =
  "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=2000&q=80";
const tile = {
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

function Home() {
  const { t } = useI18n();
  const bestsellers = products.slice(0, 4);
  const newArrivals = products.slice(4, 8);

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
        {[
          { slug: "women-eyeglasses", label: t("home.tile.women"), img: tile.women },
          { slug: "men-eyeglasses", label: t("home.tile.men"), img: tile.men },
          { slug: "sunglasses", label: t("home.tile.womenSun"), img: tile.sunW },
          { slug: "sunglasses", label: t("home.tile.menSun"), img: tile.sunM },
        ].map((tt, i) => (
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
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl uppercase tracking-tight font-bold">{t("home.shape.title")}</h2>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mt-3">{t("home.shape.sub")}</p>
        </div>
        <div className="flex justify-start lg:justify-center gap-10 lg:gap-16 overflow-x-auto no-scrollbar pb-4 px-2 max-w-6xl mx-auto">
          {shapes.map((s) => (
            <Link
              key={s}
              to="/category/$slug"
              params={{ slug: "all" }}
              search={{ shape: s }}
              className="group flex-shrink-0 flex flex-col items-center gap-4"
            >
              <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <ShapeIcon shape={s} />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold">{t(`shape.${s}` as TKey)}</span>
            </Link>
          ))}
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

      <RecentlyViewed />

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
            { icon: Truck, tt: t("home.trust.shipT"), s: t("home.trust.shipS") },
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

function ShapeIcon({ shape }: { shape: string }) {
  const common = "fill-none stroke-current";
  switch (shape) {
    case "Round":
      return <svg viewBox="0 0 60 30" className="w-12 h-6"><circle cx="14" cy="15" r="11" strokeWidth="2" className={common} /><circle cx="46" cy="15" r="11" strokeWidth="2" className={common} /><line x1="25" y1="15" x2="35" y2="15" strokeWidth="2" className={common} /></svg>;
    case "Square":
      return <svg viewBox="0 0 60 30" className="w-12 h-6"><rect x="3" y="5" width="22" height="20" strokeWidth="2" className={common} /><rect x="35" y="5" width="22" height="20" strokeWidth="2" className={common} /><line x1="25" y1="15" x2="35" y2="15" strokeWidth="2" className={common} /></svg>;
    case "Cat eye":
      return <svg viewBox="0 0 60 30" className="w-12 h-6"><path d="M2,18 Q5,5 25,8 Q27,18 14,22 Z" strokeWidth="2" className={common} /><path d="M35,8 Q55,5 58,18 Q46,22 33,18 Z" strokeWidth="2" className={common} /></svg>;
    case "Aviator":
      return <svg viewBox="0 0 60 30" className="w-12 h-6"><path d="M3,8 L25,5 L22,25 L8,25 Z" strokeWidth="2" className={common} /><path d="M35,5 L57,8 L52,25 L38,25 Z" strokeWidth="2" className={common} /></svg>;
    case "Rectangle":
      return <svg viewBox="0 0 60 30" className="w-12 h-6"><rect x="3" y="9" width="22" height="14" strokeWidth="2" className={common} /><rect x="35" y="9" width="22" height="14" strokeWidth="2" className={common} /></svg>;
    case "Geometric":
      return <svg viewBox="0 0 60 30" className="w-12 h-6"><polygon points="3,8 25,6 22,25 5,23" strokeWidth="2" className={common} /><polygon points="35,6 57,8 55,23 38,25" strokeWidth="2" className={common} /></svg>;
    case "Butterfly":
      return <svg viewBox="0 0 60 30" className="w-12 h-6"><path d="M3,12 Q5,5 25,7 Q26,22 8,24 Z" strokeWidth="2" className={common} /><path d="M35,7 Q55,5 57,12 Q52,24 34,22 Z" strokeWidth="2" className={common} /></svg>;
    case "Oval":
    default:
      return <svg viewBox="0 0 60 30" className="w-12 h-6"><ellipse cx="14" cy="15" rx="11" ry="8" strokeWidth="2" className={common} /><ellipse cx="46" cy="15" rx="11" ry="8" strokeWidth="2" className={common} /></svg>;
  }
}
