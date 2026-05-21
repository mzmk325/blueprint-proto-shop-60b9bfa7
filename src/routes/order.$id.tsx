import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { useCart } from "@/lib/cart-store";

export const Route = createFileRoute("/order/$id")({
  head: () => ({ meta: [{ title: "Order placed — MIRAVUE" }] }),
  component: OrderConfirm,
});

function OrderConfirm() {
  const { id } = Route.useParams();
  const { orders } = useCart();
  const order = orders.find((o) => o.id === id);
  if (!order) return <Layout><div className="p-20 text-center">Order not found.</div></Layout>;
  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-3xl">Thanks, {order.name.split(" ")[0]}!</h1>
        <p className="text-sm text-muted-foreground mt-2">Order <strong>{order.id}</strong> received. We'll email <strong>{order.email}</strong> with tracking once it ships.</p>
        <p className="text-sm text-muted-foreground mt-2">Any prescriptions on this order are now pending optician review.</p>
        <div className="flex gap-3 justify-center mt-8">
          <Link to="/" className="px-6 py-3 border rounded-full text-sm">Continue shopping</Link>
          <Link to="/admin" className="px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm">View in Admin</Link>
        </div>
      </div>
    </Layout>
  );
}
