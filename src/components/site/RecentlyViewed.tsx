import { useEffect, useState } from "react";
import { useUser } from "@/lib/user-store";
import { getProduct } from "@/lib/products";
import { ProductCard } from "./ProductCard";

export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const { recent } = useUser();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const items = recent
    .filter((id) => id !== excludeId)
    .map(getProduct)
    .filter((p): p is NonNullable<typeof p> => !!p)
    .slice(0, 4);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 border-t border-border/60">
      <div className="flex items-end justify-between mb-8">
        <h2 className="font-display text-2xl md:text-3xl tracking-tight">Recently viewed</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        {items.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}
