"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function GoogleOAuthPage() {
  const router = useRouter();

  useEffect(() => {
    async function initiateGoogleOAuth() {
      try {
        console.log("Starting client-side Google OAuth...");
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          console.error("Google OAuth error:", error);
          router.replace("/auth/auth-code-error?reason=oauth_error&error=" + encodeURIComponent(error.message));
          return;
        }

        if (!data?.url) {
          console.error("No OAuth URL returned");
          router.replace("/auth/auth-code-error?reason=no_url");
          return;
        }

        console.log("Redirecting to Google OAuth URL:", data.url);
        window.location.href = data.url;
      } catch (err: any) {
        console.error("Unexpected error in Google OAuth:", err);
        router.replace("/auth/auth-code-error?reason=unexpected_error&error=" + encodeURIComponent(err?.message || "Unknown error"));
      }
    }

    initiateGoogleOAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg">Weiterleitung zu Google...</p>
      </div>
    </div>
  );
}
