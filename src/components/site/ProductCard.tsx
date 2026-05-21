import { Link } from "@tanstack/react-router";
import { type Product, productImage } from "@/lib/products";
import { Heart } from "lucide-react";
import { useUser, user } from "@/lib/user-store";

export function ProductCard({ p }: { p: Product }) {
  const { wishlist } = useUser();
  const wished = wishlist.includes(p.id);
  return (
    <Link to="/product/$id" params={{ id: p.id }} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface">
        <img
          src={productImage(p)}
          alt={p.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        {/* badges top-left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {p.discountPct ? (
            <span className="bg-sale text-white text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0.5">{p.discountPct}% OFF</span>
          ) : null}
          {p.badge ? (
            <span className="bg-background/90 backdrop-blur text-foreground text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0.5">{p.badge}</span>
          ) : null}
        </div>
        {/* wishlist heart top-right */}
        <button
          onClick={(e) => { e.preventDefault(); user.toggleWish(p.id); }}
          aria-label="Toggle wishlist"
          className="absolute top-3 right-3 size-8 flex items-center justify-center text-foreground hover:scale-110 transition-transform"
        >
          <Heart className={`size-[18px] ${wished ? "fill-sale text-sale" : ""}`} strokeWidth={1.5} />
        </button>
        {/* try on bottom-right on hover */}
        <span className="absolute bottom-3 right-3 bg-background/95 text-foreground text-[10px] uppercase tracking-[0.15em] font-semibold px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          Try On
        </span>
      </div>
      <div className="mt-4 px-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-[15px] font-semibold tracking-tight">{p.name}</h3>
          <div className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="font-display text-[15px] font-semibold">${p.price.toFixed(2)}</span>
            {p.originalPrice && (
              <span className="text-[11px] text-muted-foreground line-through">${p.originalPrice.toFixed(2)}</span>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1">{p.descriptor}</p>
        <div className="flex items-center gap-1.5 mt-2.5">
          {p.colors.slice(0, 4).map((c) => (
            <span
              key={c.name}
              className="size-2.5 rounded-full ring-1 ring-border ring-offset-1 ring-offset-background"
              style={{ background: c.hex }}
              title={c.name}
            />
          ))}
          {p.colors.length > 4 && <span className="text-[10px] text-muted-foreground ml-1">+{p.colors.length - 4}</span>}
        </div>
      </div>
    </Link>
  );
}
