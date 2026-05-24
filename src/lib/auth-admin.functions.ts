// Auth bootstrap server fns: check if any admin exists, and let the first
// signed-in user claim the admin role. Once any admin exists, this is a no-op.

import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const anyAdminExists = createServerFn({ method: "GET" }).handler(
  async () => {
    const { count, error } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    return { exists: (count ?? 0) > 0 };
  },
);

// First signed-in user can claim the admin role. After that, the gate closes.
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count, error: cErr } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) > 0) {
      // Idempotent: if caller already is admin, succeed silently.
      const { data: own } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", context.userId)
        .eq("role", "admin")
        .maybeSingle();
      if (own) return { claimed: false, alreadyAdmin: true };
      throw new Error("Admin already exists. Ask an existing admin to grant you access.");
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { claimed: true, alreadyAdmin: false };
  });

// Check whether the currently authenticated user is an admin.
export const meIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { isAdmin: !!data, userId: context.userId };
  });
