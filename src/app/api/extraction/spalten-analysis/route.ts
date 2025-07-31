import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithPerplexity } from '@/lib/extraction/perplexityAnalyzer';

export async function POST(request: NextRequest) {
  try {
    const { url, spalte, felder } = await request.json();

    console.log(`Spalten-Analyse: Starte ${spalte}-Analyse für URL:`, url);
    console.log(`Spalten-Analyse: Felder:`, felder);

    // Erstelle spalten-spezifischen Prompt
    const spaltenPrompts = {
      produkt: `
Analysiere die folgende Webseite: ${url}

Extrahiere die folgenden PRODUKT-Informationen und gib sie als JSON zurück:

- kategorie: Produktkategorie (wähle aus: Bauplatten, Dämmstoffe, Fliesen, Bodenbeläge, Türen, Fenster, Sanitär, Elektro, Heizung, Lüftung, Klima, Beleuchtung, Sicherheit, Werkzeuge, Maschinen, Sonstiges)
- hersteller: Herstellername
- name_modell: Produktname oder Modellbezeichnung
- produktlinie_serie: Produktlinie oder Serie
- code_id: Artikelnummer, SKU oder Produktcode
- anwendungsbereich: Wo kann das Produkt verwendet werden
- beschreibung: Detaillierte Produktbeschreibung
- hersteller_webseite: Hauptwebseite des Herstellers
- hersteller_produkt_url: Direkte URL zur Produktseite beim Hersteller

JSON-Format für jedes Feld:
{
  "value": "extrahierter Wert",
  "confidence": 0.0-1.0,
  "reasoning": "Begründung für die Extraktion"
}

Antworte ausschließlich mit gültigem JSON.
      `,
      parameter: `
Analysiere die folgende Webseite: ${url}

Extrahiere die folgenden PARAMETER-Informationen und gib sie als JSON zurück:

- masse: Produktmaße (Länge x Breite x Höhe)
- farbe: Produktfarbe oder -farben
- hauptmaterial: Hauptmaterial des Produkts
- oberflaeche: Oberflächenbeschaffenheit
- gewicht_pro_einheit: Gewicht pro Einheit
- feuerwiderstand: Feuerwiderstandsklasse
- waermeleitfaehigkeit: Wärmeleitfähigkeit (W/mK)
- u_wert: U-Wert (W/m²K)
- schalldaemmung: Schalldämmungswerte
- wasserbestaendigkeit: Wasserbeständigkeit
- dampfdiffusion: Dampfdiffusionswiderstand
- einbauart: Einbauart oder Montageweise
- wartung: Wartungsanforderungen
- umweltzertifikat: Umweltzertifikate

JSON-Format für jedes Feld:
{
  "value": "extrahierter Wert",
  "confidence": 0.0-1.0,
  "reasoning": "Begründung für die Extraktion"
}

Antworte ausschließlich mit gültigem JSON.
      `,
      dokumente: `
Analysiere die folgende Webseite: ${url}

Extrahiere die folgenden DOKUMENTE-Informationen und gib sie als JSON zurück:

- datenblatt: Link zum Produktdatenblatt
- technisches_merkblatt: Link zum technischen Merkblatt
- produktkatalog: Link zum Produktkatalog
- weitere_dokumente: Links zu weiteren Dokumenten
- bim_cad_technische_zeichnungen: Links zu BIM/CAD-Dateien

JSON-Format für jedes Feld:
{
  "value": "extrahierter Wert",
  "confidence": 0.0-1.0,
  "reasoning": "Begründung für die Extraktion"
}

Antworte ausschließlich mit gültigem JSON.
      `,
      haendler: `
Analysiere die folgende Webseite: ${url}

Extrahiere die folgenden HÄNDLER-Informationen und gib sie als JSON zurück:

- haendlername: Name des Händlers/Shops
- haendler_webseite: Hauptwebseite des Händlers
- haendler_produkt_url: Direkte URL zur Produktseite beim Händler
- verfuegbarkeit: Verfügbarkeitsstatus
- einheit: Preiseinheit (m², Stück, kg, etc.)
- preis: Preis in Euro
- preis_pro_einheit: Preis pro Einheit

JSON-Format für jedes Feld:
{
  "value": "extrahierter Wert",
  "confidence": 0.0-1.0,
  "reasoning": "Begründung für die Extraktion"
}

Antworte ausschließlich mit gültigem JSON.
      `
    };

    const prompt = spaltenPrompts[spalte];
    if (!prompt) {
      throw new Error(`Unbekannte Spalte: ${spalte}`);
    }

    // Führe Perplexity-Analyse durch
    const result = await analyzeWithPerplexity(url, { fields: felder }, prompt);

    console.log(`Spalten-Analyse: ${spalte}-Analyse abgeschlossen`);

    return NextResponse.json({
      success: true,
      data: result,
      spalte: spalte
    });

  } catch (error) {
    console.error('Spalten-Analyse: Fehler:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 