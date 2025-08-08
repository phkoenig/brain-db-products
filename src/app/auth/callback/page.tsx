"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    async function complete() {
      try {
        console.log("OAuth callback started");
        
        // Check if we have an error from OAuth
        const error = params.get("error");
        if (error) {
          console.error("OAuth error:", error);
          router.replace(`/auth/auth-code-error?reason=oauth_error&error=${error}`);
          return;
        }

        const code = params.get("code");
        if (!code) {
          console.error("No OAuth code received");
          router.replace("/auth/auth-code-error?reason=no_code");
          return;
        }

        console.log("Exchanging code for session...");
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error("Session exchange error:", exchangeError);
          router.replace(`/auth/auth-code-error?reason=exchange_failed&error=${exchangeError.message}`);
          return;
        }

        console.log("Session exchanged successfully:", data.session?.user?.email);
        
        // Get user data
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error("Get user error:", userError);
          router.replace(`/auth/auth-code-error?reason=get_user_failed&error=${userError.message}`);
          return;
        }

        const email = userData.user?.email;
        if (!email) {
          console.error("No email in user data");
          router.replace("/auth/auth-code-error?reason=missing_email");
          return;
        }

        console.log("Validating email in allowlist:", email);
        
        // DB-first allowlist validation via server endpoint
        const res = await fetch(`/api/auth/allowlist/validate?email=${encodeURIComponent(email)}`, { 
          cache: "no-store" 
        });
        
        if (!res.ok) {
          console.error("Allowlist validation failed:", res.status);
          await supabase.auth.signOut();
          router.replace(`/auth/auth-code-error?reason=allowlist_error&status=${res.status}`);
          return;
        }

        const body = await res.json().catch(() => ({}));
        console.log("Allowlist response:", body);
        
        if (!body.allowed) {
          console.error("Email not allowed:", email);
          await supabase.auth.signOut();
          router.replace(`/auth/auth-code-error?reason=not-allowed&source=${body.source || "unknown"}`);
          return;
        }

        console.log("Login successful, redirecting to home");
        router.replace("/");
        
      } catch (error) {
        console.error("Unexpected error in callback:", error);
        router.replace(`/auth/auth-code-error?reason=unexpected_error&error=${error}`);
      }
    }
    
    complete();
  }, [router, params]);

  return <div className="p-6">Anmeldung wird abgeschlossen…</div>;
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="p-6">Lade…</div>}>
      <CallbackInner />
    </Suspense>
  );
}
