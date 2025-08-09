'use client';

import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/ui/components/Button';
import { useSearchParams } from 'next/navigation';

function OAuthSuccessContent() {
  const searchParams = useSearchParams();
  const [tokenInfo, setTokenInfo] = useState<{
    access_token: string;
    expires_in: number;
  } | null>(null);

  useEffect(() => {
    const access_token = searchParams.get('access_token');
    const expires_in = searchParams.get('expires_in');

    if (access_token && expires_in) {
      setTokenInfo({
        access_token,
        expires_in: parseInt(expires_in)
      });
    }
  }, [searchParams]);

  const handleGoToBrowser = () => {
    window.location.href = '/acc-browser';
  };

  const handleGoToTest = () => {
    window.location.href = '/acc-test';
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="bg-white border rounded-lg p-8 shadow-md">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold mb-6 text-green-600">OAuth-Autorisierung erfolgreich!</h1>
        </div>
        
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="font-semibold text-green-800 mb-2">🎉 Erfolgreich autorisiert!</h2>
            <p className="text-green-700 text-sm">
              Du hast erfolgreich den Zugriff auf deine ACC-Projekte autorisiert. 
              Jetzt kannst du deine Projektdateien durchsuchen und im Viewer anzeigen.
            </p>
          </div>

          {tokenInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-semibold text-blue-800 mb-2">🔑 Token-Informationen:</h2>
              <div className="text-blue-700 text-sm space-y-1">
                <p><strong>Access Token:</strong> {tokenInfo.access_token.substring(0, 20)}...</p>
                <p><strong>Gültig für:</strong> {tokenInfo.expires_in} Sekunden</p>
                <p><strong>Typ:</strong> 3-Legged OAuth (Benutzer-autorisiert)</p>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="font-semibold text-yellow-800 mb-2">⚠️ Wichtige Hinweise:</h2>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Der Token ist temporär und läuft ab</li>
              <li>• Bei Ablauf wird automatisch erneuert</li>
              <li>• Du kannst jederzeit die Autorisierung widerrufen</li>
              <li>• Alle ACC-Projekte sind jetzt zugänglich</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGoToBrowser}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
            >
              📁 ACC Browser öffnen
            </Button>
            
            <Button
              onClick={handleGoToTest}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
            >
              🧪 ACC Tests ausführen
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Du kannst jetzt deine ACC-Projekte durchsuchen und Dateien im Viewer anzeigen!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-8 max-w-2xl">
        <div className="bg-white border rounded-lg p-8 shadow-md">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-3xl font-bold mb-6 text-gray-600">Lade...</h1>
          </div>
        </div>
      </div>
    }>
      <OAuthSuccessContent />
    </Suspense>
  );
}
