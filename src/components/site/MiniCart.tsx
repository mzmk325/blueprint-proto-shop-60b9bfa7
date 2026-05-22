import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCart, cart, cartSubtotal, lineTotal, FREE_SHIPPING_THRESHOLD } from "@/lib/cart-store";
import { getProduct, productImage } from "@/lib/products";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export function MiniCart() {
  const { lines } = useCart();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = cartSubtotal(lines);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button aria-label={t("a11y.cart")} className="hover:text-foreground">
          <span className="relative grid size-9 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground">
            <ShoppingBag className="size-[18px]" strokeWidth={1.5} />
            {mounted && count > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-sale text-white text-[10px] leading-none rounded-full min-w-[16px] h-[16px] px-1 inline-flex items-center justify-center font-semibold tabular-nums ring-2 ring-background">{count > 99 ? "99+" : count}</span>
            )}
          </span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{t("mini.title")} ({count})</SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <ShoppingBag className="size-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{t("mini.empty")}</p>
            <Link to="/category/$slug" params={{ slug: "all" }} onClick={() => setOpen(false)} className="mt-4 px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm">{t("cart.shopFrames")}</Link>
          </div>
        ) : (
          <>
            <div className="px-1 py-2 text-xs">
              {remaining > 0 ? (
                <p className="text-muted-foreground mb-1">{t("cart.addMore")} <strong className="text-foreground">${remaining.toFixed(2)}</strong> {t("mini.addFor")}</p>
              ) : (
                <p className="text-foreground mb-1">{t("mini.unlocked")}</p>
              )}
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 -mx-2 px-2">
              {lines.map((l) => {
                const p = getProduct(l.productId);
                return (
                  <div key={l.lineId} className="flex gap-3 border rounded-lg p-3">
                    <img src={p ? productImage(p) : ""} alt="" className="size-16 rounded bg-secondary" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <div className="text-sm font-medium truncate">{l.name}</div>
                        <button onClick={() => cart.remove(l.lineId)} className="text-muted-foreground hover:text-foreground"><Trash2 className="size-3.5" /></button>
                      </div>
                      <div className="text-xs text-muted-foreground">{l.color} · {l.lens.label}</div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded-full text-xs">
                          <button onClick={() => cart.setQty(l.lineId, l.qty - 1)} className="size-6">−</button>
                          <span className="w-6 text-center">{l.qty}</span>
                          <button onClick={() => cart.setQty(l.lineId, l.qty + 1)} className="size-6">+</button>
                        </div>
                        <div className="text-sm font-medium">${lineTotal(l).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm"><span>{t("cart.subtotal")}</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
              <Link to="/cart" onClick={() => setOpen(false)} className="block text-center border-2 py-2.5 rounded-full text-sm">{t("mini.viewCart")}</Link>
              <Link to="/checkout" onClick={() => setOpen(false)} className="block text-center bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-medium">{t("mini.checkout")}</Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
