import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";

export default function Home() {
  return (
    <DefaultPageLayout>
      <div className="flex flex-col items-center justify-center min-h-full p-8">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            BRAIN DB - AI Material Capture Tool
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            KI-gestützte Erfassung von Baumaterialien beim Browsen
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h2 className="text-xl font-semibold mb-3 text-blue-600">Produkt-Erfassung</h2>
              <p className="text-gray-600 mb-4">
                Erfassen Sie neue Produkte mit KI-gestützter Extraktion aus Webseiten
              </p>
              <a 
                href="/capture" 
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Neues Produkt erfassen
              </a>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h2 className="text-xl font-semibold mb-3 text-green-600">Datenbank</h2>
              <p className="text-gray-600 mb-4">
                Durchsuchen und verwalten Sie Ihre erfassten Produktdaten
              </p>
              <a 
                href="/database" 
                className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Datenbank öffnen
              </a>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Funktionen</h3>
            <ul className="text-left space-y-2 text-gray-600">
              <li>• KI-gestützte Extraktion von Produktdaten</li>
              <li>• Automatische Händler- und Preisanalyse</li>
              <li>• Dokumenten-Management</li>
              <li>• OnBlur Auto-Save für alle Felder</li>
              <li>• Deutsche Preis-Formatierung</li>
            </ul>
          </div>
        </div>
      </div>
    </DefaultPageLayout>
  );
}
