// Canonical product detail page: /product/:slug.
// Resolves slug → CMS product (via hydrated store), and reuses the legacy
// PDPBody for the actual presentation so this stays a thin lookup shim.

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { Layout } from "@/components/site/Layout";
import {
  getStorefrontProductBySlug,
  getStorefrontProductForPreviewBySlug,
} from "@/lib/storefront-cms";
import { PDPBody } from "./product.$id";

const searchSchema = z.object({
  preview: z.enum(["admin"]).optional(),
});

export const Route = createFileRoute("/product/$slug")({
  validateSearch: searchSchema,
  loader: ({ params }) => {
    const exists = getStorefrontProductForPreviewBySlug(params.slug);
    if (!exists) throw notFound();
    return { slug: params.slug, name: exists.name, descriptor: exists.descriptor };
  },
  head: ({ loaderData, params }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Frame"} — MIRAVUE` },
      { name: "description", content: loaderData?.descriptor ?? "" },
    ],
    links: [
      { rel: "canonical", href: `/product/${params.slug}` },
    ],
  }),
  component: PDPSlug,
  notFoundComponent: () => (
    <Layout>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl mb-3">Product not available</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This frame is no longer available or has not been published yet.
        </p>
        <Link
          to="/category/$slug"
          params={{ slug: "all" }}
          className="inline-block text-[11px] uppercase tracking-[0.18em] underline underline-offset-4"
        >
          Browse all frames
        </Link>
      </div>
    </Layout>
  ),
});

function PDPSlug() {
  const { slug } = Route.useParams();
  const { preview } = Route.useSearch();
  const isPreview = preview === "admin";

  const p = isPreview
    ? getStorefrontProductForPreviewBySlug(slug)
    : getStorefrontProductBySlug(slug);

  if (!p) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="font-display text-3xl mb-3">Product unavailable</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This product is currently {getStorefrontProductForPreviewBySlug(slug)?.status === "draft" ? "in draft" : "unpublished"} and not visible to customers.
            Append <code>?preview=admin</code> to view it from the admin.
          </p>
          <Link
            to="/category/$slug"
            params={{ slug: "all" }}
            className="inline-block text-[11px] uppercase tracking-[0.18em] underline underline-offset-4"
          >
            Browse all frames
          </Link>
        </div>
      </Layout>
    );
  }

  return <PDPBody p={p} isPreview={isPreview} />;
}
