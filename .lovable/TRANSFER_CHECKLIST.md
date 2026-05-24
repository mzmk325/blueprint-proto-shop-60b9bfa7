# Transfer checklist — MIRAVUE

Run through this list immediately before and after handing the project to
the new Lovable account/workspace. Do not skip any item.

## Before transfer

### Secrets hygiene

- [ ] `cat .env` shows ONLY `VITE_SUPABASE_URL`,
      `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`. No service
      role key.
- [ ] `rg -n "SERVICE_ROLE|service_role" .env` returns no matches.
- [ ] `rg -n "SUPABASE_SERVICE_ROLE_KEY" src` returns matches ONLY inside
      `src/integrations/supabase/client.server.ts` (the auto-generated admin
      client) — never in route files, components, or `*.functions.ts` that
      runs in the browser.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is stored as a Lovable Cloud **secret**,
      not committed.
- [ ] No `.env.local`, `.env.production`, or `secrets.json` committed.
- [ ] No API keys for third-party services (Stripe, OpenAI, etc.) hard-coded
      anywhere.

### Database

- [ ] Every catalog table has RLS enabled (`products`, `product_variants`,
      `product_images`, `product_categories`, `categories`, `assets`,
      `user_roles`).
- [ ] Every public-read policy is scoped (e.g. `status = 'published'`).
- [ ] Every admin-write policy uses `is_admin()`, not a hard-coded uuid.
- [ ] `user_roles` table contains AT MOST the admin accounts that should
      survive the transfer. Remove old test admins.
- [ ] Backup: export full schema + data via Lovable Cloud / Supabase before
      transfer.

### Code

- [ ] `bun install` succeeds on a clean clone.
- [ ] Build is green (no TS errors).
- [ ] `/admin` redirects to `/login` when signed out.
- [ ] `/login` accepts the seeded admin and lands on `/admin`.

### Ownership

- [ ] GitHub repo is connected and the new owner has push access (or the
      repo can be transferred to their org).
- [ ] Lovable Cloud project is transferred together with the Lovable project
      (they move together — confirm in Lovable settings before initiating).
- [ ] Custom domains, if any, have DNS noted down so the new owner can move
      them.

## During transfer

- [ ] Initiate Lovable project transfer to the new account.
- [ ] Confirm new owner accepts.
- [ ] Confirm Lovable Cloud transferred with it (the new owner should see
      the same Supabase project ref under Connectors → Lovable Cloud).

## After transfer

### Access cleanup

- [ ] Old account is removed from project members.
- [ ] Old admin accounts are removed from `user_roles` (run a migration or
      delete via Cloud table view).
- [ ] Rotate `SUPABASE_SERVICE_ROLE_KEY` if the previous account ever saw it.
- [ ] Rotate `SUPABASE_PUBLISHABLE_KEY` if any concern about leakage.
- [ ] Revoke any GitHub deploy keys / PATs tied to the old account.

### Verify

- [ ] New owner can open the project in Lovable.
- [ ] Build succeeds in the new workspace.
- [ ] `/admin` redirects to `/login` (signed out).
- [ ] New owner can sign up, then run `claimFirstAdmin` (or be granted admin
      via existing admin) to reach `/admin`.
- [ ] `/login` flow works end-to-end.
- [ ] `/product/<published-slug>` renders.
- [ ] `/category/<slug>` renders DB products.
- [ ] Image upload in admin → asset appears in `product-images` bucket and
      `assets` table.
- [ ] `P0_VERIFICATION.md` passes end-to-end on the new workspace.

### First prompt to send after transfer

Paste this exactly into Lovable chat as the very first message in the new
account:

> Read `.lovable/MIRAVUE_HANDOFF.md`, `.lovable/P0_VERIFICATION.md`,
> `.lovable/NEXT_PHASES.md`, and `.lovable/TRANSFER_CHECKLIST.md` in full.
> Do not write any code. Confirm in chat: (1) which P0 items are verified
> in this workspace, (2) any TS or build errors, (3) any RLS or secrets
> hygiene concerns, (4) the proposed first P1 task. Wait for my approval
> before starting P1.
