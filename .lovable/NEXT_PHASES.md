# Next phases — planning only

**Do not implement anything in this file yet.** P0 is the current bar.
Each phase should land behind verification + RLS review.

## P1 — Transactions

Goal: a real customer can place a paid order, an admin can see it,
fulfillment can act on it.

### New tables

- `orders` — id, user_id, status (enum: cart, placed, paid, in_production,
  shipped, delivered, canceled, refunded), currency, subtotal, shipping_total,
  tax_total, discount_total, grand_total, placed_at, paid_at, contact_email,
  contact_phone, shipping_address (jsonb), billing_address (jsonb), notes.
- `order_items` — id, order_id, product_id, variant_id, lens_config (jsonb),
  prescription_id nullable, qty, unit_price, line_total.
- `prescriptions` — id, user_id, sphere_l/r, cyl_l/r, axis_l/r, add_l/r,
  pd, prism, source ("manual" | "upload" | "exam"), file_asset_id nullable,
  status ("pending" | "verified" | "rejected"), verified_by, verified_at.
- `shipping_zones` — id, name, country_codes (text[]), method, base_price,
  per_item_price, free_threshold, eta_days_min, eta_days_max, enabled.
- `promotions` — id, code, type ("percent" | "fixed" | "free_ship"), value,
  starts_at, ends_at, min_subtotal, max_uses, used_count, scope (jsonb).
- `promotion_redemptions` — id, promotion_id, order_id, user_id, amount.
- `admin_logs` — id, actor_id, action, target_table, target_id, payload
  (jsonb), created_at. Append-only.

### Server logic

- Order state machine: `placed → paid → in_production → shipped → delivered`
  + `canceled` / `refunded` branches. Centralize transitions in one server
  function so RLS-bypassing admin writes are auditable.
- Promotion engine: rule evaluator pure-function, run at quote time on cart;
  re-validate at checkout submit.
- Tax + shipping: simple per-zone calculation in P1. Defer real tax provider
  (Stripe Tax / Avalara) to P2.

### Payment integration

- Use **Stripe** (server route at `src/routes/api/public/stripe-webhook.ts`).
- Flow: client → `createCheckoutSession` server fn → Stripe Checkout →
  webhook updates `orders.status = 'paid'` after signature verification.
- Never trust client-side payment success; only the webhook flips state.

### Account UI

- `/account/orders`, `/account/orders/$id`, `/account/prescriptions`.
- All under `_authenticated/` layout with user-scoped RLS
  (`auth.uid() = orders.user_id`).

## P2 — Trust + ops

### Reviews

- `reviews` — id, product_id, user_id (nullable for guest), order_item_id
  (proof of purchase), stars, title, body, status
  (`pending` | `approved` | `rejected`), images (uuid[] of assets), created_at.
- QC workflow: admin queue for moderating new reviews.
- Public read: `status = 'approved'` only.

### After-sales

- `returns` / `exchanges` tables tied to `order_items`.
- Admin RMA console: approve, generate label, refund.
- Customer-facing return request form under `_authenticated/`.

### Localization

- ZH columns on `products` / `categories` already exist. Build the admin
  bilingual editor and storefront locale switch hooks.
- Add `seo_title_zh` / `seo_description_zh` to surface in `head()` per locale.

### Private storage

- New buckets, all **private**:
  - `prescriptions` — patient files, RLS by user_id.
  - `customer-uploads` — selfies for VTO / face match.
  - `qc-photos` — internal QC evidence per order_item.
- Generate signed URLs on demand from server fns; never expose object paths
  in client bundles.

### AI Console

- Strictly **after** ops are stable.
- Use Lovable AI Gateway (`google/gemini-2.5-flash`,
  `google/gemini-3.5-flash`) for: SEO draft, descriptor generation, review
  summarization, photo tagging suggestions.
- Always human-approved before publish.

## Sequencing notes

- Do P1 strictly in order: orders → order_items → prescriptions → shipping
  → admin_logs → promotion engine → payment integration → state machine.
  Skipping ahead leaves orphan rows and unaudited writes.
- Do not start P2 work until at least one real order has been placed and
  fulfilled through the P1 stack.
- Visual redesign is its own track and should not block backend phases.
