import { Search, Flame, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { products } from "@/lib/products";

const HOT = ["Lightweight", "Cateye", "Retro", "Pink", "Aviator", "Red", "Blue", "Sunglasses", "Black", "Green"];
const FAQ_ITEMS: { key: "faq.q1" | "faq.q2" | "faq.q3" | "faq.q4" }[] = [
  { key: "faq.q1" }, { key: "faq.q2" }, { key: "faq.q3" },
];

export function SearchPopover() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter((p) => (p.name + " " + p.descriptor + " " + p.shape + " " + p.collection).toLowerCase().includes(term))
      .slice(0, 6);
  }, [q]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("a11y.search")}
        className="hover:text-foreground transition-colors text-foreground/80"
      >
        <Search className="size-[18px]" strokeWidth={1.5} />
      </button>
      {open && (
        <>
          <div className="fixed inset-x-0 top-[var(--header-h,104px)] bottom-0 bg-foreground/10 z-40" onClick={() => setOpen(false)} />
          <div className="fixed left-0 right-0 top-[var(--header-h,104px)] z-50 bg-background border-b border-border shadow-lg">
            <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && q.trim()) {
                      setOpen(false);
                      navigate({ to: "/category/$slug", params: { slug: "all" }, search: { q: q.trim() } as never });
                    }
                  }}
                  placeholder={t("search.placeholder")}
                  className="w-full pl-11 pr-4 py-3.5 rounded-full bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.15em] mb-4">{t("search.hot")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {HOT.map((tag, i) => (
                      <button
                        key={tag}
                        onClick={() => setQ(tag)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md bg-secondary hover:bg-secondary/70 text-sm transition-colors"
                      >
                        {i < 3 && <Flame className="size-3.5 text-sale" />}
                        <span className={i < 3 ? "text-sale font-medium" : ""}>{tag}</span>
                      </button>
                    ))}
                  </div>

                  {q.trim() && (
                    <div className="mt-6">
                      {results.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t("search.empty").replace("{q}", q)}</p>
                      ) : (
                        <ul className="divide-y divide-border/60">
                          {results.map((p) => (
                            <li key={p.id}>
                              <Link
                                to="/product/$id"
                                params={{ id: p.id }}
                                onClick={() => setOpen(false)}
                                className="flex items-center justify-between py-3 hover:opacity-70"
                              >
                                <span className="text-sm">{p.name} <span className="text-muted-foreground">· {p.descriptor}</span></span>
                                <span className="text-sm font-medium">${p.price}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <aside className="lg:border-l lg:border-border lg:pl-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-[0.15em]">{t("search.faqTitle")}</h3>
                    <Link to="/faq" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5">
                      {t("search.viewMore")} <ChevronRight className="size-3" />
                    </Link>
                  </div>
                  <ul className="space-y-3">
                    {FAQ_ITEMS.map((item) => (
                      <li key={item.key}>
                        <Link to="/faq" onClick={() => setOpen(false)} className="text-sm hover:text-foreground text-foreground/80 block">
                          {t(item.key)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </aside>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
