import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { anyAdminExists, claimFirstAdmin } from "@/lib/auth-admin.functions";
import { toast } from "sonner";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Admin login — MIRAVUE" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { isAuthenticated, isAdmin, signIn, signUp, refreshAdmin, isLoading } = useAuth();
  const { redirect: redirectTo } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [noAdminYet, setNoAdminYet] = useState<boolean | null>(null);

  useEffect(() => {
    anyAdminExists()
      .then((r) => setNoAdminYet(!r.exists))
      .catch(() => setNoAdminYet(null));
  }, []);

  // Once signed in AND admin, bounce to /admin (or redirect target).
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    navigate({ to: (redirectTo as "/admin" | undefined) ?? "/admin" });
  }, [isAuthenticated, isAdmin, redirectTo, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signUp(email, password);
        toast.success("Account created. Check your email if confirmation is required, then sign in.");
        setMode("signin");
      } else {
        await signIn(email, password);
        // Claim admin if none exists yet
        const r = await anyAdminExists();
        if (!r.exists) {
          await claimFirstAdmin();
          toast.success("You are now the first admin.");
          setNoAdminYet(false);
        }
        await refreshAdmin();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-2xl tracking-tight">MIRAVUE</Link>
          <h1 className="mt-3 text-xl font-semibold">Admin {mode === "signin" ? "Sign in" : "Sign up"}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {noAdminYet === true
              ? "No admin exists yet. The first signed-in account will be granted admin."
              : "Restricted area. Sign in with your admin account."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Password</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={submitting || isLoading}
            className="w-full rounded-md bg-foreground text-background py-2.5 text-[12px] uppercase tracking-[0.18em] font-semibold disabled:opacity-50"
          >
            {submitting ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "signin" ? (
            <>No account?{" "}
              <button onClick={() => setMode("signup")} className="underline">Create one</button>
            </>
          ) : (
            <>Have an account?{" "}
              <button onClick={() => setMode("signin")} className="underline">Sign in</button>
            </>
          )}
        </div>

        {isAuthenticated && !isAdmin && (
          <div className="mt-6 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
            Signed in, but this account is not an admin. Ask an existing admin to grant access.
          </div>
        )}

        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <Link to="/">← Back to storefront</Link>
        </p>
      </div>
    </div>
  );
}
