"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthService from "@/lib/auth";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    async function complete() {
      // 1) If PKCE code exists, exchange it for a session
      const code = params.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          router.replace("/auth/auth-code-error?reason=exchange_failed");
          return;
        }
      }

      // 2) Get the user and enforce allowlist
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email || "";
      if (!email || !AuthService.checkAllowlist(email)) {
        await supabase.auth.signOut();
        router.replace("/auth/auth-code-error?reason=not-allowed");
        return;
      }

      // 3) Done → redirect to home
      router.replace("/");
    }
    complete();
  }, [router, params]);

  return (
    <div className="p-6">Anmeldung wird abgeschlossen…</div>
  );
}
