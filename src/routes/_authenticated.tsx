// Pathless layout that guards every child route. Requires authenticated
// session AND admin role. Both checks happen on the client because admin
// routes are not SSR-prerendered for non-admin visitors.

import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const loc = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!isAuthenticated) {
    throw redirect({ to: "/login", search: { redirect: loc.href } });
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is signed in but does not have admin permission.
          </p>
          <a
            href="/login"
            className="mt-5 inline-block rounded-md bg-foreground text-background px-4 py-2 text-xs uppercase tracking-[0.18em]"
          >
            Switch account
          </a>
        </div>
      </div>
    );
  }
  return <Outlet />;
}
