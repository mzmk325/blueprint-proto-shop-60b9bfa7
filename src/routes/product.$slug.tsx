// Canonical product detail page: /product/:slug.
// DB-first: loader reads via getProductBySlugOrLegacyId server fn (public,
// no auth needed). Admin draft preview is a separate client-side fetch
// gated by the AuthProvider's isAdmin flag.

import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Layout } from "@/components/site/Layout";
import { getProductBySlugOrLegacyId } from "@/lib/catalog.functions";
import { getProductForPreview } from "@/lib/catalog-admin.functions";
import { dbToStorefront } from "@/lib/storefront-db";
import { useAuth } from "@/lib/auth";
import { PDPBody } from "./product.$id";

const searchSchema = z.object({
  preview: z.enum(["admin"]).optional(),
});

const publicProductQuery = (slug: string) =>
  queryOptions({
    queryKey: ["public-product", slug],
    queryFn: () => getProductBySlugOrLegacyId({ data: { key: slug } }),
  });

export const Route = createFileRoute("/product/$slug")({
  validateSearch: searchSchema,
  loader: async ({ params, context }) => {
    const res = await context.queryClient.ensureQueryData(publicProductQuery(params.slug));
    // If user hit a legacy id at /product/:slug, redirect to canonical slug.
    if (res.product && res.matchedBy === "legacy" && res.product.slug !== params.slug) {
      throw redirect({
        to: "/product/$slug",
        params: { slug: res.product.slug },
        replace: true,
      });
    }
    return res;
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.product;
    return {
      meta: [
        { title: `${p?.name_en ?? "Frame"} — MIRAVUE` },
        { name: "description", content: p?.descriptor_en ?? "" },
      ],
      links: [{ rel: "canonical", href: `/product/${params.slug}` }],
    };
  },
  component: PDPSlug,
});

function PDPSlug() {
  const { slug } = Route.useParams();
  const { preview } = Route.useSearch();
  const isPreview = preview === "admin";
  const { data } = useSuspenseQuery(publicProductQuery(slug));
  const { isAdmin, isAuthenticated, isLoading } = useAuth();

  // Admin preview fetch — runs only when ?preview=admin and the public lookup
  // didn't find a published product (i.e., draft / unpublished).
  const adminQ = useQuery({
    queryKey: ["admin-product-preview", slug],
    queryFn: () => getProductForPreview({ data: { key: slug } }),
    enabled: isPreview && !data.product && isAuthenticated && isAdmin,
  });

  const adminDb = adminQ.data?.product;
  // Adapt admin shape (which includes everything incl. cost) — we only pass
  // the same FullProduct-compatible fields into the storefront adapter.
  const productDto = data.product ?? (adminDb
    ? {
        ...adminDb,
        variants: adminDb.variants,
        images: adminDb.images,
        category_ids: adminDb.category_ids,
      }
    : null);

  if (!productDto) {
    if (isPreview) {
      if (isLoading || adminQ.isLoading) {
        return (
          <Layout>
            <div className="mx-auto max-w-2xl px-6 py-24 text-center text-sm text-muted-foreground">
              Loading preview…
            </div>
          </Layout>
        );
      }
      if (!isAuthenticated || !isAdmin) {
        return (
          <Layout>
            <div className="mx-auto max-w-2xl px-6 py-24 text-center">
              <h1 className="font-display text-3xl mb-3">Admin sign-in required</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Draft / unpublished previews are only visible to signed-in admins.
              </p>
              <Link to="/login" className="underline text-[11px] uppercase tracking-[0.18em]">
                Sign in
              </Link>
            </div>
          </Layout>
        );
      }
    }
    return (
      <Layout>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="font-display text-3xl mb-3">Product unavailable</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This frame is not available or has not been published yet.
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storefront = dbToStorefront(productDto as any);
  return <PDPBody p={storefront} isPreview={isPreview} />;
}
