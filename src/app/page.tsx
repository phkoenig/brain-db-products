"use client";

import React, { useState, useEffect } from "react";
import { OAuthSocialButton } from "@/ui/components/OAuthSocialButton";
import { TextField } from "@/ui/components/TextField";
import { Button } from "@/ui/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

function ZeptaSignIn() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading, user } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect authenticated users to capture page
  useEffect(() => {
    if (!loading && user && user.id && user.email) {
      // Additional validation: check if user is actually authenticated
      const checkAuth = async () => {
        try {
          const res = await fetch("/api/auth/debug");
          const data = await res.json();
          
          // Only redirect if there's a valid session
          if (data.currentSession && data.currentSession.user.id === user.id) {
            router.push("/capture");
          }
        } catch (error) {
          console.error("Auth validation failed:", error);
        }
      };
      
      checkAuth();
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-neutral-50">
        <div className="text-lg">Lade...</div>
      </div>
    );
  }

  // Don't show login form if user is authenticated
  if (user) {
    return null;
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError("");
      await signInWithGoogle();
      // Redirect will be handled by OAuth callback
    } catch (error) {
      setError("Google-Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.");
      console.error("Google sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setError("Bitte bestätigen Sie Ihre E-Mail-Adresse, bevor Sie sich anmelden.");
      } else {
        const result = await signInWithEmail(email, password);
        
        if (result.error) {
          setError(`Anmeldung fehlgeschlagen: ${result.error}`);
        } else {
          router.push("/capture");
        }
      }
    } catch (error: any) {
      console.error("Email auth error:", error);
      setError(error.message || "Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Bitte füllen Sie alle Felder aus.");
      return;
    }
    handleEmailAuth();
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-neutral-50">
      <div className="flex w-full max-w-[384px] flex-col items-center justify-center gap-10 rounded-lg border border-solid border-neutral-border bg-white px-12 py-12 shadow-lg">
        <img
          className="w-80 flex-none"
          src="https://res.cloudinary.com/subframe/image/upload/v1753600242/uploads/15448/zrscgsuc06otegltdsaj.jpg"
        />
        
        <form onSubmit={handleSubmit} className="flex w-full flex-col items-start gap-6">
          <div className="flex w-full flex-col items-start gap-4">
            <OAuthSocialButton
              className="h-10 w-full flex-none"
              logo="https://res.cloudinary.com/subframe/image/upload/v1711417516/shared/z0i3zyjjqkobzuaecgno.svg"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? "Wird angemeldet..." : "Anmelden mit Google"}
            </OAuthSocialButton>
            <OAuthSocialButton
              className="h-10 w-full flex-none"
              logo="https://res.cloudinary.com/subframe/image/upload/v1711417561/shared/kplo8lv2zjit3brqmadv.png"
              onClick={() => setError("Apple-Anmeldung ist derzeit nicht verfügbar.")}
              disabled={isLoading}
            >
              Anmelden mit Apple
            </OAuthSocialButton>
          </div>
          
          <div className="flex w-full items-center justify-center gap-2">
            <div className="flex h-px grow shrink-0 basis-0 flex-col items-center gap-2 bg-neutral-border" />
            <span className="text-caption font-caption text-subtext-color">
              oder
            </span>
            <div className="flex h-px grow shrink-0 basis-0 flex-col items-center gap-2 bg-neutral-border" />
          </div>
          
          <div className="flex w-full flex-col items-start gap-6">
            <TextField
              className="h-auto w-full flex-none"
              label="E-Mail"
              helpText=""
            >
              <TextField.Input
                type="email"
                placeholder="Ihre E-Mail-Adresse..."
                value={email}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                disabled={isLoading}
              />
            </TextField>
            <TextField
              className="h-auto w-full flex-none"
              label="Passwort"
              helpText=""
            >
              <TextField.Input
                type="password"
                placeholder="Ihr Passwort..."
                value={password}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                disabled={isLoading}
              />
            </TextField>
          </div>
          
          {error && (
            <div className="w-full p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <Button
            type="submit"
            className="h-10 w-full flex-none"
            size="large"
            disabled={isLoading}
          >
            {isLoading ? "Wird verarbeitet..." : (isSignUp ? "Registrieren" : "Anmelden")}
          </Button>
          
          <div className="w-full text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
              disabled={isLoading}
            >
              {isSignUp ? "Bereits ein Konto? Anmelden" : "Neues Konto erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ZeptaSignIn;
