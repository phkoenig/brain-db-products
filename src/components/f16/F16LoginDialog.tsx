"use client";

import React, { useState } from "react";
import { OAuthSocialButton } from "@/ui/components/OAuthSocialButton";
import { TextField } from "@/ui/components/TextField";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { useAuth } from "@/contexts/AuthContext";
import { FeatherX } from "@subframe/core";

interface F16LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function F16LoginDialog({ isOpen, onClose }: F16LoginDialogProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    } catch (err) {
      setError("Google-Anmeldung fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const result = isSignUp 
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);
        
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
        setEmail("");
        setPassword("");
        setError("");
      }
    } catch (err) {
      setError(isSignUp ? "Registrierung fehlgeschlagen" : "Anmeldung fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Bitte fülle alle Felder aus");
      return;
    }
    handleEmailAuth();
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setEmail("");
      setPassword("");
      setError("");
      setIsSignUp(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between border-b p-4">
          <span className="text-heading-2 font-heading-2 text-default-font">
            {isSignUp ? 'Registrieren' : 'Anmelden'}
          </span>
          <IconButton
            icon={<FeatherX />}
            onClick={handleClose}
            disabled={isLoading}
          />
        </div>
        
        <div className="p-6">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <span className="text-body font-body text-blue-700">
              <strong>Verfügbare Benutzer:</strong><br/>
              phkoenig@gmail.com (Philip König)<br/>
              philip@zepta.com (Philip Zepta - Admin)<br/>
              admin@megabrain.cloud (Admin User)<br/>
              test@megabrain.cloud (Test User)
            </span>
          </div>
          
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
                variant="filled"
                label="E-Mail"
                helpText=""
              >
                <TextField.Input
                  placeholder="E-Mail eingeben"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </TextField>
              
              <TextField
                className="h-auto w-full flex-none"
                variant="filled"
                label="Passwort"
                helpText=""
              >
                <TextField.Input
                  placeholder="Passwort eingeben"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </TextField>
              
              {error && (
                <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md">
                  <span className="text-body font-body text-red-600">
                    {error}
                  </span>
                </div>
              )}
              
              <Button
                className="h-10 w-full flex-none"
                variant="brand-primary"
                onClick={handleSubmit}
                disabled={!email || !password || isLoading}
              >
                {isLoading 
                  ? (isSignUp ? "Wird registriert..." : "Wird angemeldet...") 
                  : (isSignUp ? "Registrieren" : "Anmelden")
                }
              </Button>
              
              <div className="flex w-full items-center justify-center gap-2">
                <span className="text-body font-body text-subtext-color">
                  {isSignUp ? "Bereits ein Konto?" : "Noch kein Konto?"}
                </span>
                <Button
                  variant="neutral-tertiary"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                  }}
                  disabled={isLoading}
                >
                  {isSignUp ? "Anmelden" : "Registrieren"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
