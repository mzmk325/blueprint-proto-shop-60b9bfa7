import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import {
  useCart,
  getFulfillmentType,
  getPrescriptionStatus,
  FULFILLMENT_LABEL,
  RX_STATUS_LABEL,
} from "@/lib/cart-store";
import { useI18n } from "@/lib/i18n";
import { usePriceFormatter } from "@/lib/currency-store";

export const Route = createFileRoute("/order/$id")({
  head: () => ({ meta: [{ title: "Order placed — MIRAVUE" }] }),
  component: OrderConfirm,
});

function OrderConfirm() {
  const { id } = Route.useParams();
  const { orders } = useCart();
  const { t } = useI18n();
  const fmt = usePriceFormatter();
  const order = orders.find((o) => o.id === id);
  if (!order) return <Layout><div className="p-20 text-center">{t("order.notFound")}</div></Layout>;

  const lineSummaries = order.lines.map((l) => ({
    line: l,
    ft: getFulfillmentType(l.lens),
    rxStatus: getPrescriptionStatus(l.lens),
  }));
  const hasPrescription = lineSummaries.some((x) => x.ft === "prescription");
  const hasNonRx = lineSummaries.some((x) => x.ft === "non-rx");

  const headlineType = hasPrescription ? "prescription" : hasNonRx ? "non-rx" : "frame-only";
  const headline =
    headlineType === "prescription" ? t("order.headline.prescription")
    : headlineType === "non-rx" ? t("order.headline.nonRx")
    : t("order.headline.frameOnly");

  const nextStep =
    headlineType === "prescription" ? t("order.next.prescription")
    : headlineType === "non-rx" ? t("order.next.nonRx")
    : t("order.next.frameOnly");

  const steps = headlineType === "prescription" ? [
    "We review your order details",
    "Our optician reviews your prescription",
    "We source the frame and lenses",
    "Your glasses are assembled at our partner lab",
    "We quality-check your order",
    "We ship via Yanwen with tracking · 13–20 days",
  ] : headlineType === "non-rx" ? [
    "We review your order details",
    "We source the frame and lenses",
    "Your glasses are assembled at our partner lab",
    "We quality-check your order",
    "We ship via Yanwen with tracking · 13–20 days",
  ] : [
    "We review your order details",
    "We source your frame from our supplier",
    "We pack the frame with demo lenses",
    "We quality-check the frame",
    "We ship via Yanwen with tracking · 13–20 days",
  ];

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="text-center">
          <div className="text-5xl mb-4 text-sale">✓</div>
          <h1 className="text-3xl">{t("order.confirmed")}, {order.name.split(" ")[0] || "friend"}!</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t("order.label")} <strong>{order.id}</strong> {t("order.receivedShort")} <strong>{order.email}</strong> {t("order.withUpdates")}
          </p>
        </div>

        <div className="mt-10 border rounded-xl p-6 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{t("order.fulfillment")}</div>
              <div className="font-medium text-lg mt-1">{headline}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{t("order.total")}</div>
              <div className="font-display text-2xl mt-1">{fmt(order.total)}</div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">{t("order.items")}</div>
            <ul className="space-y-3 text-sm">
              {lineSummaries.map(({ line, ft, rxStatus }) => (
                <li key={line.lineId} className="flex justify-between gap-3">
                  <div>
                    <div className="font-medium">{line.name} <span className="text-xs text-muted-foreground">· {line.color}</span></div>
                    <div className="text-xs text-muted-foreground">{FULFILLMENT_LABEL[ft]}{ft === "prescription" ? ` · ${RX_STATUS_LABEL[rxStatus]}` : ""}</div>
                  </div>
                  <div className="text-sm">{fmt(line.unitPrice + line.lens.priceAdd)}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t pt-4 bg-sale/5 -mx-6 px-6 -mb-6 pb-6 rounded-b-xl">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">{t("order.next")}</div>
            <div className="text-sm font-medium">{nextStep}</div>
          </div>
        </div>

        <div className="mt-8 border rounded-xl p-6 bg-background">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">{t("order.whatNext")}</div>
          <ol className="space-y-2 text-sm">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3"><span className="size-5 rounded-full bg-secondary text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span><span>{s}</span></li>
            ))}
          </ol>
        </div>

        <div className="flex gap-3 justify-center mt-8">
          <Link to="/" className="px-6 py-3 border rounded-full text-sm">{t("order.continue")}</Link>
          <Link to="/admin" className="px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm">{t("order.admin")}</Link>
        </div>
      </div>
    </Layout>
  );
}
