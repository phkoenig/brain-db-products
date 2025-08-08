"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";

export default function ForceLogoutPage() {
  const { signOut, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const performForceLogout = async () => {
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Sign out from Supabase
      if (user) {
        await signOut();
      }
      
      // Force page reload to clear all state
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    };

    performForceLogout();
  }, [signOut, user]);

  return (
    <DefaultPageLayout>
      <div className="flex w-full flex-col items-center justify-center gap-4 px-12 py-12">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-heading-1 font-heading-1 text-default-font">
            Force Logout läuft...
          </h1>
          <p className="text-body font-body text-neutral-600">
            Alle Sessions und Cookies werden gelöscht.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </div>
      </div>
    </DefaultPageLayout>
  );
}
