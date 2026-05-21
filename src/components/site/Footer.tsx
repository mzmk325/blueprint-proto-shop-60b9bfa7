import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  const col = "flex flex-col gap-2.5 text-[12px] text-muted-foreground";
  const h = "text-foreground text-[10px] uppercase tracking-[0.25em] font-bold mb-5";
  return (
    <footer className="mt-24 border-t border-border bg-background">
      {/* Newsletter */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-14 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="font-display text-2xl md:text-3xl tracking-tight font-bold">{t("footer.newsletter.title")}</h3>
            <p className="text-sm text-muted-foreground mt-2">{t("footer.newsletter.desc")}</p>
          </div>
          <form className="flex border-b border-foreground pb-2 md:max-w-md md:ml-auto w-full">
            <input
              type="email"
              placeholder={t("footer.newsletter.placeholder")}
              className="bg-transparent w-full text-[11px] uppercase tracking-[0.2em] outline-none placeholder:text-muted-foreground/60"
            />
            <button className="text-[11px] uppercase tracking-[0.2em] font-bold hover:opacity-60">{t("footer.newsletter.subscribe")}</button>
          </form>
        </div>
      </div>

      {/* Trust strip */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6 flex flex-wrap items-center justify-center gap-8 text-[10px] uppercase tracking-[0.25em] font-medium text-muted-foreground">
          <span>{t("footer.trust.returns")}</span><span className="opacity-30">/</span>
          <span>{t("footer.trust.warranty")}</span><span className="opacity-30">/</span>
          <span>{t("footer.trust.fsa")}</span><span className="opacity-30">/</span>
          <span className="text-foreground font-bold">{t("footer.trust.rating")}</span>
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-14 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div>
          <h4 className={h}>{t("footer.col.shop")}</h4>
          <div className={col}>
            <Link to="/category/$slug" params={{ slug: "women-eyeglasses" }}>{t("nav.women")}</Link>
            <Link to="/category/$slug" params={{ slug: "men-eyeglasses" }}>{t("nav.men")}</Link>
            <Link to="/category/$slug" params={{ slug: "sunglasses" }}>{t("nav.sunglasses")}</Link>
            <Link to="/category/$slug" params={{ slug: "best-sellers" }}>{t("nav.bestSellers")}</Link>
            <Link to="/category/$slug" params={{ slug: "new-arrivals" }}>{t("nav.newArrivals")}</Link>
          </div>
        </div>
        <div>
          <h4 className={h}>{t("footer.col.lenses")}</h4>
          <div className={col}>
            <span>{t("footer.lenses.blueLight")}</span>
            <span>{t("footer.lenses.photochromic")}</span>
            <span>{t("footer.lenses.polarized")}</span>
            <span>{t("footer.lenses.progressive")}</span>
          </div>
        </div>
        <div>
          <h4 className={h}>{t("footer.col.help")}</h4>
          <div className={col}>
            <Link to="/faq">{t("nav.faq")}</Link>
            <span>{t("footer.help.shipping")}</span>
            <span>{t("footer.help.returns")}</span>
            <span>{t("footer.help.size")}</span>
          </div>
        </div>
        <div>
          <h4 className={h}>{t("footer.col.about")}</h4>
          <div className={col}>
            <span>{t("footer.about.story")}</span>
            <span>{t("footer.about.sustainability")}</span>
            <span>{t("footer.about.lookbook")}</span>
            <span>{t("footer.about.press")}</span>
          </div>
        </div>
        <div>
          <h4 className={h}>{t("footer.col.follow")}</h4>
          <div className="flex gap-4 text-foreground">
            <a href="#" aria-label="Instagram" className="hover:opacity-60"><Instagram className="size-4" strokeWidth={1.5} /></a>
            <a href="#" aria-label="Facebook" className="hover:opacity-60"><Facebook className="size-4" strokeWidth={1.5} /></a>
            <a href="#" aria-label="YouTube" className="hover:opacity-60"><Youtube className="size-4" strokeWidth={1.5} /></a>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>{t("footer.copyright")}</span>
          <span>{t("footer.tagline")}</span>
        </div>
      </div>
    </footer>
  );
}
