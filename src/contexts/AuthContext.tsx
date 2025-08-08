"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthService from "@/lib/auth";

export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string }>; 
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>; 
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email || null } : null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ? { id: data.session.user.id, email: data.session.user.email || null } : null);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async signUpWithEmail(email: string, password: string) {
      // Check allowlist via API instead of local AuthService
      const allowlistRes = await fetch(`/api/auth/allowlist/validate?email=${encodeURIComponent(email)}`);
      const allowlistData = await allowlistRes.json();
      
      if (!allowlistData.allowed) {
        return { error: "Email not allowed" };
      }
      
      // Delegate to server API to avoid exposing service key
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { error: body.error || "Signup failed" };
      }
      // Optionally sign in the user
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    },
    async signInWithEmail(email: string, password: string) {
      console.log("🔍 DEBUG: AuthContext.signInWithEmail called with:", { email, password });
      
      // Use API route for authentication and session management
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include" // Include cookies
      });
      
      console.log("🔍 DEBUG: API response status:", res.status);
      
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.log("🔍 DEBUG: API error response:", body);
        return { error: body.error || "Signin failed" };
      }
      
      const responseData = await res.json();
      console.log("🔍 DEBUG: API success response:", responseData);
      
      // Force refresh the auth state to pick up the new session
      await supabase.auth.refreshSession();
      
      console.log("🔍 DEBUG: Session refreshed, returning success");
      return {};
    },
    async signInWithGoogle() {
      try {
        // Use the Supabase default callback URL that matches the Google OAuth configuration
        const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const redirectTo = `${projectUrl}/auth/v1/callback`;
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          return { error: error.message };
        }

        if (!data?.url) {
          return { error: "No OAuth URL returned" };
        }

        // Redirect to Google OAuth
        window.location.href = data.url;
        return {};
      } catch (error: any) {
        return { error: error?.message || "Google OAuth failed" };
      }
    },
    async signOut() {
      await supabase.auth.signOut();
    }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}