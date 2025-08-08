"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { Button } from "@/ui/components/Button";
import { TextField } from "@/ui/components/TextField";
import { Alert } from "@/ui/components/Alert";

export default function AuthTestPage() {
  const { user, loading, signUpWithEmail, signInWithEmail, signInWithGoogle, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [realUser, setRealUser] = useState<any>(null);

  // Validate if user is actually authenticated
  useEffect(() => {
    const validateUser = async () => {
      if (user) {
        try {
          const res = await fetch("/api/auth/debug");
          const data = await res.json();
          
          if (data.currentSession && data.currentSession.user.id === user.id) {
            setRealUser(data.currentSession.user);
          } else {
            setRealUser(null);
          }
        } catch (error) {
          console.error("User validation failed:", error);
          setRealUser(null);
        }
      } else {
        setRealUser(null);
      }
    };

    validateUser();
  }, [user]);

  const handleSignUp = async () => {
    setMessage("");
    setError("");
    
    const result = await signUpWithEmail(email, password);
    if (result.error) {
      setError(`Signup failed: ${result.error}`);
    } else {
      setMessage("Signup successful!");
    }
  };

  const handleSignIn = async () => {
    setMessage("");
    setError("");
    
    const result = await signInWithEmail(email, password);
    if (result.error) {
      setError(`Signin failed: ${result.error}`);
    } else {
      setMessage("Signin successful!");
    }
  };

  const handleGoogleSignIn = async () => {
    setMessage("");
    setError("");
    
    const result = await signInWithGoogle();
    if (result.error) {
      setError(`Google signin failed: ${result.error}`);
    } else {
      setMessage("Redirecting to Google...");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setMessage("Signed out successfully!");
  };

  if (loading) {
    return (
      <DefaultPageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div>Loading...</div>
        </div>
      </DefaultPageLayout>
    );
  }

  return (
    <DefaultPageLayout>
      <div className="flex w-full flex-col items-start gap-6 px-12 py-12">
        <div className="flex flex-col items-start gap-4">
          <h1 className="text-heading-1 font-heading-1 text-default-font">
            Authentifizierung Test
          </h1>
          
          {realUser && (
            <Alert variant="success">
              ✅ ECHT angemeldet als: {realUser.email} (ID: {realUser.id})
            </Alert>
          )}

          {user && !realUser && (
            <Alert variant="error">
              ⚠️ FALSCHER User-State: {user.email} (ID: {user.id}) - Keine echte Session!
            </Alert>
          )}

          {!user && !realUser && (
            <Alert variant="neutral">
              ℹ️ Nicht angemeldet - Bitte testen Sie die Authentifizierung
            </Alert>
          )}

          {message && (
            <Alert variant="success">
              {message}
            </Alert>
          )}

          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          <div className="flex flex-col gap-4 w-full max-w-md">
            <TextField label="E-Mail">
              <TextField.Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@megabrain.cloud"
              />
            </TextField>

            <TextField label="Passwort">
              <TextField.Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="test123"
              />
            </TextField>

            <div className="flex flex-col gap-2">
              <Button onClick={handleSignUp} disabled={!email || !password}>
                Registrieren
              </Button>
              
              <Button onClick={handleSignIn} disabled={!email || !password}>
                Anmelden
              </Button>
              
              <Button onClick={handleGoogleSignIn}>
                Mit Google anmelden
              </Button>
              
              {user && (
                <Button onClick={handleSignOut} variant="neutral-secondary">
                  Abmelden
                </Button>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-heading-2 font-heading-2 text-default-font mb-4">
              Test-E-Mail-Adressen:
            </h2>
            <ul className="list-disc list-inside space-y-2 text-body font-body text-neutral-600">
              <li><strong>phkoenig@gmail.com</strong> - Existierender Benutzer</li>
              <li><strong>test@megabrain.cloud</strong> - Neuer Test-Benutzer (in Allowlist)</li>
              <li><strong>test@example.com</strong> - Nicht erlaubt (nicht in Allowlist)</li>
            </ul>
          </div>
        </div>
      </div>
    </DefaultPageLayout>
  );
}
