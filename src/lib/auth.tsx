// Browser auth context: tracks supabase session + admin flag. Drives the
// router's _authenticated guard and the admin sidebar account chip.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { meIsAdmin } from "./auth-admin.functions";
import { hydrateCatalogFromDb } from "./cms-store";

export type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  refreshAdmin: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const adminCheckedFor = useRef<string | null>(null);

  // Subscribe BEFORE checking session (Supabase auth pattern).
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Invalidate queries + router on auth change so user-scoped data refreshes.
      queryClient.invalidateQueries();
      router.invalidate();
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient, router]);

  // Check admin role whenever the user changes.
  useEffect(() => {
    const uid = session?.user?.id ?? null;
    if (!uid) {
      setIsAdmin(false);
      adminCheckedFor.current = null;
      return;
    }
    if (adminCheckedFor.current === uid) return;
    adminCheckedFor.current = uid;
    meIsAdmin()
      .then((r) => setIsAdmin(r.isAdmin))
      .catch(() => setIsAdmin(false));
  }, [session?.user?.id]);

  // Hydrate catalog from DB whenever auth/admin state changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    hydrateCatalogFromDb(isAdmin).catch((e) =>
      console.error("[auth] hydrate failed", e),
    );
  }, [isAdmin, session?.user?.id]);

  const value = useMemo<AuthState>(
    () => ({
      isAuthenticated: !!session,
      isLoading,
      user: session?.user ?? null,
      session,
      isAdmin,
      async refreshAdmin() {
        if (!session?.user?.id) {
          setIsAdmin(false);
          return;
        }
        try {
          const r = await meIsAdmin();
          setIsAdmin(r.isAdmin);
        } catch {
          setIsAdmin(false);
        }
      },
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUp(email, password) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, isLoading, isAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
