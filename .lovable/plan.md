# Miravue: Mock → Real Ecommerce Operating System

This is a large, multi-area refactor. I'll break it into 6 phases. Each phase ships independently and the build stays green between phases.

## Phase 1 — CMS as source of truth for storefront

**Goal:** Admin CMS products fully drive `/product/:id`, category pages, cards, search.

- Extend `cms-store.ts` product schema with everything the storefront needs that's currently only on static seed: `descriptor`, `description`, `sellingPoints`, `seoTitle`, `seoDescription`, `status: 'draft' | 'published' | 'unpublished'`, `originalPrice`, `gender`, `shape`, `material`.
- Migrate existing seed products into CMS on first load (one-time idempotent seed) so every storefront-visible product is a CMSProduct. Keep `products.ts` as the seed source only.
- Rewrite `storefront-cms.ts`:
  - `getStorefrontProducts()` returns **only** `status === 'published'` CMS products (no mock fallback for public consumers).
  - Add `getStorefrontProductForView(id, { preview })` that returns drafts/unpublished only when `preview === 'admin'`.
  - `getProductsByCategorySlug`, `getBestsellers`, `getNewArrivals` filter by published status.
- Update `product.$id.tsx`:
  - Read `?preview=admin` via `validateSearch`.
  - If product is draft/unpublished and not in preview, render a clean "Product unavailable" state (not 404 hard crash).
  - Show a yellow admin banner in preview mode: "Draft preview · not visible to customers".
- Update `category.$slug.tsx` and `ProductCard.tsx` to consume the CMS-published list.

## Phase 2 — Production product editor

In `CmsModules.tsx` ProductsModule:
- Replace status toggles with explicit `Draft / Published / Unpublished` status pill + actions: **Save Draft**, **Publish**, **Unpublish**, **Preview** (opens `/product/:id?preview=admin`), **View Live** (only when published), **Duplicate**, **Delete**.
- Add fields for: descriptor, long description, selling points list, SEO title/description, originalPrice, gender/shape/material, badges, featured/hot, newOverride.
- Variant editor: add/remove/reorder variants; per-variant image list with add (from library or URL), reorder (up/down), remove.
- Replace any "saved locally" / "mock" / "demo" copy with operational wording.
- After publish, show toast with link to live URL.

## Phase 3 — Mobile PDP fixes

In `product.$id.tsx`:
- **Mobile gallery:** add swipeable carousel using existing embla (`carousel.tsx`). Active index resets when variant changes. Show `1 / N` counter + horizontal thumbnail strip below. Keep desktop unchanged (detect via `useIsMobile`).
- **Sticky CTA:** make the existing bottom bar appear only after primary CTA scrolls out of viewport, using `IntersectionObserver` on the primary CTA. Add `pb-24 md:pb-0` to the page so it doesn't cover footer/recs.
- **Accordion jump bug:** the current accordion likely uses `<a href="#...">` or anchor scroll. Replace with Radix `Accordion` from `components/ui/accordion.tsx`, buttons get `type="button"`, no anchor hash, no scrollIntoView on toggle.

## Phase 4 — Admin Chinese preview entry & wording cleanup

- Add a "Preview" group in admin topbar (in `admin.tsx`): **Open Chinese Storefront**, **Open English Storefront**. In the product editor row add **Preview in Chinese** (`/product/:id?preview_lang=zh&preview=admin`).
- `LanguageSwitcher.tsx`: keep zh-CN hidden unless `sessionStorage.preview_lang === 'zh'` is set (already reads URL param; persist to session and surface).
- Sweep critical UI for mock/demo/placeholder/占位/mock 数据/仅保存到本地/未来接入 in admin + storefront; replace with operating wording. Leave AI Console as "Not enabled yet".

## Phase 5 — Image library (operational v1)

Extend `cms-store.ts` with an `assets` collection:
```ts
type CMSAsset = {
  id, url, name, note, type: AssetType,
  width?, height?, createdAt,
}
```
- `AssetsModule` in `CmsModules.tsx`: grid view, type filter dropdown, search by name/url/note, add-by-URL form (with auto-detect dimensions via `new Image()`), copy URL button, delete with usage-check, recommended dimensions hint per type.
- **Usage tracking:** compute on-the-fly by scanning products/variants/heroes/homeCards/shapeBanners/reviews for the URL. Show "Used in: …" chips. Block delete when used (with override-confirm).
- **Product editor integration:** image input becomes a combo — "Select from library" opens a dialog (filter type=variant), or paste URL manually. Selected images appear as reorderable list with remove.

## Phase 6 — QA & polish

- Run build, fix TS errors.
- Walk the user's validation checklist: create draft → preview → publish → category appears → edit → unpublish → gone publicly; mobile gallery swipe; sticky CTA visibility; accordion first-tap; Chinese preview from admin; image library add + select.

## Technical notes

- Migration of seed → CMS runs in `cms-store.ts` initial state hydration; uses a version flag in localStorage so it only runs once. Existing users keep their data.
- `status` defaults to `'published'` for seeded products so nothing disappears.
- Storefront helpers stay synchronous (read CMS snapshot, no network) — keeps existing component shape.
- No backend changes — everything remains client-side CMS. The user can later swap the store for a real API without changing storefront components.

## Out of scope

- AI Console expansion (explicitly deferred).
- Real auth, real persistence beyond localStorage (CMS already persists to localStorage; that's "real enough" for ops until a backend is wired).
- Checkout/cart/lens flows untouched.

Estimated edits: ~10–12 files, ~2000 lines net. I'll ship in the phase order above and verify build after each phase.