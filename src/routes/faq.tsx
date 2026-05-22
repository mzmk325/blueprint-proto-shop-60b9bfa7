import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { useI18n, type TKey } from "@/lib/i18n";
import { usePriceFormatter } from "@/lib/currency-store";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ, Shipping & Returns — MIRAVUE" }, { name: "description", content: "Help, shipping, returns, FSA/HSA." }] }),
  component: FAQ,
});

function FAQ() {
  const { t } = useI18n();
  const fmt = usePriceFormatter();
  const items: [TKey, TKey][] = [
    ["faq.q1", "faq.a1"],
    ["faq.q2", "faq.a2"],
    ["faq.q3", "faq.a3"],
    ["faq.q4", "faq.a4"],
    ["faq.q5", "faq.a5"],
    ["faq.q6", "faq.a6"],
  ];
  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl mb-2">{t("faq.title")}</h1>
        <p className="text-sm text-muted-foreground mb-10">{t("faq.sub")}</p>
        <div className="space-y-2">
          {items.map(([q, a]) => (
            <details key={q} className="border rounded-xl p-5 bg-card">
              <summary className="cursor-pointer font-medium">{t(q)}</summary>
              <p className="text-sm text-muted-foreground mt-3">{t(a, { ship: fmt(75) })}</p>
            </details>
          ))}
        </div>
      </div>
    </Layout>
  );
}
