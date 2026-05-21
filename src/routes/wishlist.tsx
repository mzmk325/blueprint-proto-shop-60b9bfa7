import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { useUser } from "@/lib/user-store";
import { getProduct } from "@/lib/products";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — MIRAVUE" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist } = useUser();
  const items = wishlist.map(getProduct).filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-4xl mb-2">Wishlist</h1>
        <p className="text-sm text-muted-foreground mb-8">{items.length} saved {items.length === 1 ? "frame" : "frames"}</p>

        {items.length === 0 ? (
          <div className="text-center py-20 border rounded-2xl">
            <Heart className="size-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No frames saved yet. Tap the heart on any product.</p>
            <Link to="/category/$slug" params={{ slug: "all" }} className="inline-block mt-6 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm">Browse frames</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {items.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}
