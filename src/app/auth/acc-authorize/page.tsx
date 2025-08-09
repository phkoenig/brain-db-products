'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/ui/components/Button';

export default function ACCAuthorizePage() {
  const [authorizationUrl, setAuthorizationUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const generateAuthUrl = async () => {
      try {
        console.log('🔍 ACC OAuth: Generating authorization URL...');
        const response = await fetch('/api/auth/acc-authorize-url');
        
        if (!response.ok) {
          throw new Error(`Failed to generate auth URL: ${response.status}`);
        }
        
        const data = await response.json();
        setAuthorizationUrl(data.authorizationUrl);
        console.log('🔍 ACC OAuth: Authorization URL received:', data.authorizationUrl);
      } catch (error) {
        console.error('Error generating authorization URL:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    generateAuthUrl();
  }, []);

  const handleAuthorize = () => {
    if (authorizationUrl) {
      console.log('🔍 ACC OAuth: Redirecting to authorization URL:', authorizationUrl);
      // Redirect to Autodesk OAuth authorization page
      window.location.href = authorizationUrl;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Bereite OAuth-Autorisierung vor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 shadow-md">
          <h1 className="text-3xl font-bold mb-6 text-center text-red-600">❌ Fehler</h1>
          <p className="text-red-700 mb-4">Fehler beim Generieren der OAuth-URL:</p>
          <p className="text-red-600 font-mono text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="bg-white border rounded-lg p-8 shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">🔐 ACC OAuth-Autorisierung</h1>
        
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="font-semibold text-blue-800 mb-2">ℹ️ Warum ist OAuth nötig?</h2>
            <p className="text-blue-700 text-sm">
              Die Autodesk Data Management API erfordert eine 3-Legged OAuth-Autorisierung, 
              um auf deine ACC-Projektdateien zuzugreifen. Dies ist sicherer als Client Credentials.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="font-semibold text-yellow-800 mb-2">⚠️ Wichtige Hinweise:</h2>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Du wirst zu Autodesk weitergeleitet</li>
              <li>• Melde dich mit deinem Autodesk-Account an</li>
              <li>• Erlaube den Zugriff auf deine ACC-Projekte</li>
              <li>• Du wirst zurück zu dieser App geleitet</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="font-semibold text-green-800 mb-2">✅ Berechtigungen:</h2>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• <strong>data:read</strong> - Projektdateien und Ordner lesen</li>
              <li>• <strong>data:write</strong> - Projektdateien schreiben (falls nötig)</li>
              <li>• <strong>bucket:read</strong> - Buckets lesen</li>
              <li>• <strong>account:read</strong> - Account-Informationen lesen</li>
              <li>• <strong>user-profile:read</strong> - Benutzerprofil lesen</li>
            </ul>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleAuthorize}
              disabled={!authorizationUrl}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              🔐 Mit Autodesk autorisieren
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Nach der Autorisierung kannst du deine ACC-Projekte durchsuchen</p>
          </div>
        </div>
      </div>
    </div>
  );
}
