"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";

export default function LogoutPage() {
  const { signOut, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      if (user) {
        await signOut();
      }
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/");
      }, 1000);
    };

    performLogout();
  }, [signOut, user, router]);

  return (
    <DefaultPageLayout>
      <div className="flex w-full flex-col items-center justify-center gap-4 px-12 py-12">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-heading-1 font-heading-1 text-default-font">
            Abmeldung läuft...
          </h1>
          <p className="text-body font-body text-neutral-600">
            Sie werden automatisch zur Anmeldeseite weitergeleitet.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </div>
      </div>
    </DefaultPageLayout>
  );
}
