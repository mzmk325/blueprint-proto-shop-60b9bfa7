import { Link } from "@tanstack/react-router";
import { type Product, productImage } from "@/lib/products";
import { Eye, Heart } from "lucide-react";
import { useUser, user } from "@/lib/user-store";

export function ProductCard({ p }: { p: Product }) {
  const { wishlist } = useUser();
  const wished = wishlist.includes(p.id);
  return (
    <Link to="/product/$id" params={{ id: p.id }} className="group block">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary">
        <img src={productImage(p)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
        {p.discountPct && (
          <span className="absolute top-2 left-2 bg-sale text-white text-xs font-semibold px-2 py-1 rounded">{p.discountPct}% OFF</span>
        )}
        {p.badge && (
          <span className="absolute top-2 right-10 bg-background/90 text-foreground text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wide">{p.badge}</span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); user.toggleWish(p.id); }}
          aria-label="Toggle wishlist"
          className="absolute top-2 right-2 size-8 rounded-full bg-background/90 hover:bg-background flex items-center justify-center"
        >
          <Heart className={`size-4 ${wished ? "fill-sale text-sale" : ""}`} />
        </button>
        <button className="absolute bottom-2 right-2 bg-background/90 hover:bg-background text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <Eye className="size-3" /> Try On
        </button>
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex items-baseline justify-between">
          <h3 className="font-medium text-sm">{p.name}</h3>
          <div className="text-sm">
            <span className="font-semibold">${p.price.toFixed(2)}</span>
            {p.originalPrice && <span className="ml-1.5 text-xs text-muted-foreground line-through">${p.originalPrice.toFixed(2)}</span>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{p.descriptor}</p>
        <div className="flex items-center gap-1 pt-1">
          {p.colors.slice(0, 3).map((c) => (
            <span key={c.name} className="size-3 rounded-full border" style={{ background: c.hex }} title={c.name} />
          ))}
          {p.colors.length > 3 && <span className="text-[10px] text-muted-foreground ml-1">+{p.colors.length - 3}</span>}
        </div>
      </div>
    </Link>
  );
}
