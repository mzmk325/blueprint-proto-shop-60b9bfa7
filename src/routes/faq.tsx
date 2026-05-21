import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ, Shipping & Returns — MIRAVUE" }, { name: "description", content: "Help, shipping, returns, FSA/HSA." }] }),
  component: FAQ,
});

const FAQS = [
  ["How long does shipping take?", "Standard delivery is 13–20 days. Express is 5–8 days. Free shipping on orders over $75."],
  ["What's your return policy?", "30 days, no questions asked, on all unused frames."],
  ["Do you accept FSA/HSA?", "Yes — frames and prescription lenses are FSA/HSA eligible."],
  ["Can I upload my prescription later?", "Yes. Select \"send later\" during the lens flow and we'll email you a secure link."],
  ["What if my prescription has errors?", "Every Rx is reviewed by a human optician. We'll reach out before production if anything looks off."],
  ["Do you offer progressive lenses?", "Coming soon. MVP supports single-vision today."],
];

function FAQ() {
  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl mb-2">Help & FAQ</h1>
        <p className="text-sm text-muted-foreground mb-10">Quick answers about shipping, returns, and your prescription.</p>
        <div className="space-y-2">
          {FAQS.map(([q, a]) => (
            <details key={q} className="border rounded-xl p-5 bg-card">
              <summary className="cursor-pointer font-medium">{q}</summary>
              <p className="text-sm text-muted-foreground mt-3">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </Layout>
  );
}
