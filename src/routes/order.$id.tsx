import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { useCart } from "@/lib/cart-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/order/$id")({
  head: () => ({ meta: [{ title: "Order placed — MIRAVUE" }] }),
  component: OrderConfirm,
});

function OrderConfirm() {
  const { id } = Route.useParams();
  const { orders } = useCart();
  const { t } = useI18n();
  const order = orders.find((o) => o.id === id);
  if (!order) return <Layout><div className="p-20 text-center">{t("order.notFound")}</div></Layout>;
  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-3xl">{t("order.thanks")}, {order.name.split(" ")[0]}!</h1>
        <p className="text-sm text-muted-foreground mt-2">{t("order.label")} <strong>{order.id}</strong> {t("order.received")} <strong>{order.email}</strong> {t("order.received2")}</p>
        <p className="text-sm text-muted-foreground mt-2">{t("order.rxNote")}</p>
        <div className="flex gap-3 justify-center mt-8">
          <Link to="/" className="px-6 py-3 border rounded-full text-sm">{t("order.continue")}</Link>
          <Link to="/admin" className="px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm">{t("order.admin")}</Link>
        </div>
      </div>
    </Layout>
  );
}
