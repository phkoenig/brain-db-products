"use client";

import React from 'react';
import { Button } from '@/ui/components/Button';
import { useRouter } from 'next/navigation';

export default function AuthCodeErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Authentifizierungsfehler
        </h1>
        <p className="text-gray-600 mb-6">
          Es gab ein Problem bei der Anmeldung. Das kann verschiedene Ursachen haben:
        </p>
        
        <div className="text-left mb-6 space-y-2 text-sm text-gray-600">
          <div>• Google OAuth ist noch nicht konfiguriert</div>
          <div>• Die Redirect-URLs sind nicht korrekt eingerichtet</div>
          <div>• Die Anmeldung wurde abgebrochen</div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => router.push('/')}
            className="w-full"
          >
            Zurück zur Anmeldung
          </Button>
          
          <Button
            onClick={() => router.push('/capture')}
            variant="outline"
            className="w-full"
          >
            Mit Email/Password anmelden
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tipp:</strong> Verwende Email/Password-Anmeldung, bis Google OAuth konfiguriert ist.
          </p>
        </div>
      </div>
    </div>
  );
}
