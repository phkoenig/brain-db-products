"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthService from "@/lib/auth";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    async function complete() {
      const code = params.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          router.replace("/auth/auth-code-error?reason=exchange_failed");
          return;
        }
      }
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email || "";
      if (!email || !AuthService.checkAllowlist(email)) {
        await supabase.auth.signOut();
        router.replace("/auth/auth-code-error?reason=not-allowed");
        return;
      }
      router.replace("/");
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
