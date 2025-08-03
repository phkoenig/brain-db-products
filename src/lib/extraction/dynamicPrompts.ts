import { supabase } from '@/lib/supabase';

interface DynamicPromptOptions {
  url: string;
  spalte: string;
  buttonType?: 'hersteller' | 'haendler'; // Neuer Parameter für Button-Typ
  manufacturer?: string; // Hersteller aus Request-Parametern
  productName?: string; // Produktname aus Request-Parametern  
  productCode?: string; // Produktcode aus Request-Parametern
}

/**
 * Generiert dynamische Prompts basierend auf Datenbank-Felddefinitionen
 */
export async function generateDynamicPrompt({ url, spalte, buttonType, manufacturer, productName, productCode }: DynamicPromptOptions): Promise<string> {
  try {
    console.log(`generateDynamicPrompt: Lade Felddefinitionen für Spalte: ${spalte}`);
    
    // Lade Felddefinitionen für die spezifische Spalte aus der Datenbank
    const { data: fieldDefinitions, error } = await supabase
      .from('product_field_definitions')
      .select('field_name, label, description, examples, extraction_hints, data_type')
      .eq('category', spalte)
      .order('field_name');

    if (error) {
      console.error('generateDynamicPrompt: Fehler beim Laden der Felddefinitionen:', error);
      throw error;
    }

    if (!fieldDefinitions || fieldDefinitions.length === 0) {
      console.warn(`generateDynamicPrompt: Keine Felddefinitionen für Spalte '${spalte}' gefunden`);
      return buildFallbackPrompt(url, spalte);
    }

    console.log(`generateDynamicPrompt: ${fieldDefinitions.length} Felddefinitionen geladen`);

    // Lade Materialkategorien für bessere Kontextualisierung (nur für produkt-Spalte)
    let materialCategoriesContext = '';
    let productContext = '';
    
    if (spalte === 'produkt') {
      const { data: categories } = await supabase
        .from('material_categories')
        .select('main_category, sub_category, label, id')
        .order('main_category, sub_category');
      
      if (categories && categories.length > 0) {
        const categoryGroups = categories.reduce((acc: Record<string, string[]>, cat) => {
          if (!acc[cat.main_category]) acc[cat.main_category] = [];
          // Format: "Label (ID)" für bessere AI-Verständlichkeit
          acc[cat.main_category].push(`${cat.label} (${cat.id})`);
          return acc;
        }, {});

        const categoryList = Object.entries(categoryGroups)
          .map(([main, subs]) => `  ${main}: ${subs.join(', ')}`)
          .join('\n');

        materialCategoriesContext = `
VERFÜGBARE MATERIALKATEGORIEN (für produkt_kategorie):
${categoryList}
`;
        console.log(`generateDynamicPrompt: ${categories.length} Materialkategorien geladen`);
      }
    }
    
    // Für Dokumente- und Händler-Suche: Lade bereits bekannte Produktdaten als Kontext
    if (spalte === 'dokumente' || spalte === 'haendler') {
      try {
        const { data: existingProducts } = await supabase
          .from('products')
          .select('produkt_hersteller, produkt_name_modell, produkt_code_id, produkt_hersteller_webseite')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (existingProducts && existingProducts.length > 0) {
          const product = existingProducts[0];
          productContext = `
BEREITS IDENTIFIZIERTE PRODUKTDATEN:
- Hersteller: ${product.produkt_hersteller || 'Unbekannt'}
- Produktname: ${product.produkt_name_modell || 'Unbekannt'}
- Produktcode: ${product.produkt_code_id || 'Unbekannt'}
- Hersteller-Website: ${product.produkt_hersteller_webseite || 'Unbekannt'}

Nutze diese Informationen für gezielte Suche nach Dokumenten und Händlern.
`;
          console.log(`generateDynamicPrompt: Produkt-Kontext für ${spalte}-Suche geladen`);
        }
      } catch (error) {
        console.warn(`generateDynamicPrompt: Fehler beim Laden des Produkt-Kontexts:`, error);
      }
    }

    // Spezielle Logik für Händler-Suche basierend auf Button-Typ
    if (spalte === 'haendler' && buttonType) {
      let retailerPrompt = '';
      
      if (buttonType === 'haendler') {
        // Händler-Button: ZUERST Preis auf aktueller URL extrahieren, DANN alternative Händler
        retailerPrompt = `
SPEZIELLE HÄNDLER-SUCHE (Händler-Seite):
Du analysierst eine Händler-Produktseite: ${url}

WICHTIGE AUFGABEN:
1. PRIMÄRHÄNDLER-PREIS: Extrahiere den Verkaufspreis des Produkts von der angegebenen URL
2. ALTERNATIVE HÄNDLER: Suche zusätzlich nach anderen Händlern, die das gleiche Produkt anbieten

AUSGABEFORMAT (JSON-Array):
[
  {
    "name": "Händlername von der URL",
    "url": "${url}",
    "price": "PREIS VON DER URL (z.B. 5.399,00 €)"
  },
  {
    "name": "Alternative Händler 1",
    "url": "https://andere-händler.de/produkt-url", 
    "price": "Preis falls verfügbar"
  }
]

PRIORITÄT: Der Preis von der angegebenen URL ${url} ist KRITISCH wichtig!
- Besuche die URL und extrahiere den aktuellen Verkaufspreis
- Suche nach mindestens 3-5 zusätzlichen alternativen Händlern
- Verwende spezifische Suchbegriffe wie "Preisvergleich", "online kaufen", "Händler"
`;
      } else if (buttonType === 'hersteller') {
        // Hersteller-Button: Verwende die direkt übergebenen Parameter
        const currentManufacturer = manufacturer || 'Unbekannt';
        const currentProductName = productName || 'Unbekannt';
        const currentProductCode = productCode || '';
        
        retailerPrompt = `
SPEZIELLE HÄNDLER-SUCHE (Hersteller-Seite):
Du analysierst eine Hersteller-Produktseite: ${url}

WICHTIGE AUFGABEN:
1. PRIMÄRHÄNDLER-PREIS: Extrahiere den Verkaufspreis des Produkts von der angegebenen Hersteller-URL
2. ALTERNATIVE HÄNDLER: Suche zusätzlich nach anderen Händlern, die das gleiche Produkt anbieten

AUSGABEFORMAT (JSON-Array):
[
  {
    "name": "Herstellername (von der URL)",
    "url": "${url}",
    "price": "PREIS VON DER HERSTELLER-URL (z.B. 1.499,00 €)"
  },
  {
    "name": "Alternative Händler 1",
    "url": "https://händler.de/produkt-url",
    "price": "Preis falls verfügbar"
  }
]

PRIORITÄT: Der Preis von der angegebenen Hersteller-URL ${url} ist KRITISCH wichtig!
- Besuche die Hersteller-URL und extrahiere den aktuellen Verkaufspreis
- Suche nach mindestens 3-5 zusätzlichen alternativen Händlern
- Verwende spezifische Suchbegriffe wie "Preisvergleich", "online kaufen", "Händler", "Lieferanten"
`;
      }
      
      if (retailerPrompt) {
        console.log(`generateDynamicPrompt: Spezieller Händler-Prompt für Button-Typ '${buttonType}' generiert`);
        return retailerPrompt.trim();
      }
    }

    // Erstelle erweiterte Feld-Beschreibungen
    const fieldDescriptions = fieldDefinitions.map(field => {
      // Verwende erweiterte Beschreibung falls verfügbar
      let description = getEnhancedFieldDescription(field.field_name, field.label, field.description);
      
      // Füge Beispiele hinzu, falls vorhanden
      if (field.examples && Array.isArray(field.examples) && field.examples.length > 0) {
        description += ` (Beispiele: ${field.examples.join(', ')})`;
      } else if (field.examples && typeof field.examples === 'object' && field.examples !== null) {
        const examples = Object.values(field.examples).filter(v => v).join(', ');
        if (examples) description += ` (Beispiele: ${examples})`;
      }
      
      // Füge Extraktionshinweise hinzu, falls vorhanden
      if (field.extraction_hints && Array.isArray(field.extraction_hints) && field.extraction_hints.length > 0) {
        description += ` [Hinweise: ${field.extraction_hints.join('; ')}]`;
      }
      
      return `- ${field.field_name}: ${description}`;
    }).join('\n');

    // Generiere JSON-Schema für strukturierte Antwort
    const jsonSchema = generateJsonSchema(fieldDefinitions, spalte);
    
    // Generiere spalten-spezifischen strukturierten Prompt
    const spaltenName = spalte.toUpperCase();
    
    const prompt = `Du bist ein Experte für Produktdatenextraktion aus Webseiten. Analysiere die folgende Webseite und extrahiere strukturierte ${spaltenName}-Informationen.

WEBSEITE: ${url}
${materialCategoriesContext}
${productContext}
AUFGABE: Extrahiere die folgenden ${spaltenName}-Informationen und gib sie im exakten JSON-Format zurück.

FELD-DEFINITIONEN:
${fieldDescriptions}

ERFORDERLICHES JSON-SCHEMA:
${jsonSchema}

EXTRAKTIONS-REGELN:
1. Analysiere den gesamten Webseiteninhalt sorgfältig
2. Extrahiere nur korrekte, auf der Webseite gefundene Informationen
3. Verwende confidence-Werte: 1.0 = sicher gefunden, 0.5 = wahrscheinlich, 0.0 = nicht gefunden
4. Bei numerischen Werten: nur Zahlen ohne Einheiten (z.B. "29.90" statt "29,90 €")
5. Bei Arrays (produkt_kategorie): verwende die IDs aus den Klammern (z.B. "FB.FL" statt "Fliesen")
6. Bei fehlenden Informationen: leere Strings verwenden
7. Gib eine kurze Begründung für jeden extrahierten Wert
${spalte === 'dokumente' ? `
8. DOKUMENTE-SUCHE: Suche aktiv nach Download-Links, PDFs, Datenblättern, technischen Merkblättern
9. Prüfe auch die Hersteller-Website für zusätzliche Dokumente
10. Bei gefundenen Dokumenten: Verwende die vollständige URL` : ''}
${spalte === 'haendler' ? `
8. HÄNDLER-SUCHE: Suche nach alternativen Händlern, die das gleiche Produkt anbieten
9. Prüfe Preise und Verfügbarkeit bei verschiedenen Händlern
10. Verwende die Hersteller-Informationen für gezielte Händler-Suche` : ''}

ANTWORT-FORMAT: Antworte ausschließlich mit gültigem JSON entsprechend dem Schema oben.`.trim();

    console.log(`generateDynamicPrompt: Prompt für Spalte '${spalte}' generiert (${prompt.length} Zeichen)`);
    return prompt;

  } catch (error) {
    console.error('generateDynamicPrompt: Fehler:', error);
    // Fallback zu statischem Prompt bei Fehlern
    return buildFallbackPrompt(url, spalte);
  }
}

/**
 * Generiert ein JSON-Schema für strukturierte AI-Antworten
 */
function generateJsonSchema(fieldDefinitions: any[], spalte: string): string {
  const schemaFields = fieldDefinitions.map(field => {
    const fieldName = field.field_name;
    let type = 'string';
    let example = '';
    
    // Bestimme Datentyp basierend auf Feldname
    if (fieldName.includes('preis') || fieldName.includes('gewicht') || fieldName.includes('u_wert')) {
      type = 'number';
      example = '29.90';
    } else if (fieldName === 'produkt_kategorie') {
      type = 'array';
      example = '["FB.FL", "DS.MI"]';
    } else {
      example = '"extrahierter Wert"';
    }
    
    return `  "${fieldName}": {
    "value": ${example},
    "confidence": 0.8,
    "reasoning": "Kurze Begründung"
  }`;
  }).join(',\n');
  
  return `{
${schemaFields}
}`;
}

/**
 * Erweitert die Feldbeschreibung mit kontextspezifischen Informationen
 */
function getEnhancedFieldDescription(fieldName: string, label?: string, originalDescription?: string): string {
  // Spezifische Beschreibungen für wichtige Felder
  const enhancedDescriptions: Record<string, string> = {
    'produkt_kategorie': 'Materialkategorie(n) des Produkts - wähle aus verfügbaren Kategorien (Multi-Select möglich)',
    'produkt_hersteller': 'Name des Herstellers/Produzenten des Materials',
    'produkt_name_modell': 'Vollständiger Produktname oder Modellbezeichnung',
    'produkt_produktlinie_serie': 'Produktlinie, Serie oder Kollektion des Materials',
    'produkt_code_id': 'Produktcode, Artikelnummer oder eindeutige Identifikation',
    'produkt_anwendungsbereich': 'Einsatzgebiet und Verwendungszweck des Materials (z.B. Innenbereich, Außenbereich)',
    'produkt_beschreibung': 'Detaillierte Produktbeschreibung und Eigenschaften',
    'produkt_hersteller_webseite': 'Hauptwebseite des Herstellers (Domain ohne Produktseite)',
    'produkt_hersteller_produkt_url': 'Direkte URL zur Produktseite beim Hersteller',
    
    'parameter_farbe': 'Farbe oder Farbbezeichnung des Materials',
    'parameter_masse': 'Abmessungen, Größe oder Maße (z.B. 60x60cm, 1200x800mm, Dicke)',
    'parameter_hauptmaterial': 'Grundmaterial oder Hauptbestandteil (z.B. Keramik, Holz, Metall, Beton)',
    'parameter_oberflaeche': 'Oberflächenbeschaffenheit oder -behandlung (z.B. matt, glänzend, strukturiert)',
    'parameter_gewicht_pro_einheit': 'Gewicht pro Einheit oder spezifisches Gewicht',
    'parameter_feuerwiderstand': 'Brandschutzklasse oder Feuerwiderstandsdauer (z.B. A1, B1, REI 60)',
    'parameter_waermeleitfaehigkeit': 'Wärmeleitfähigkeit in W/mK',
    'parameter_u_wert': 'U-Wert für Wärmedämmung in W/m²K',
    'parameter_schalldaemmung': 'Schallschutzwerte oder Lärmschutzklasse',
    'parameter_wasserbestaendigkeit': 'Wasserdichtigkeit oder Feuchtigkeitsresistenz',
    'parameter_dampfdiffusion': 'Dampfdiffusionswiderstand oder μ-Wert',
    'parameter_einbauart': 'Art der Installation oder Verlegung',
    'parameter_wartung': 'Wartungsanforderungen und Pflegehinweise',
    'parameter_umweltzertifikat': 'Umweltzertifikate oder Nachhaltigkeitssiegel',
    
    'dokumente_datenblatt': 'Link oder Verweis auf technisches Datenblatt',
    'dokumente_technisches_merkblatt': 'Link zu technischem Merkblatt oder Spezifikation',
    'dokumente_produktkatalog': 'Link zum Produktkatalog oder Broschüre',
    'dokumente_weitere_dokumente': 'Weitere relevante Dokumente oder Downloads',
    'dokumente_bim_cad_technische_zeichnungen': 'BIM-Objekte, CAD-Dateien oder technische Zeichnungen',
    
    'haendler_haendlername': 'Name des Händlers oder Verkäufers',
    'haendler_haendler_webseite': 'Hauptwebseite des Händlers (Domain)',
    'haendler_haendler_produkt_url': 'Direkte URL zur Produktseite beim Händler',
    'haendler_verfuegbarkeit': 'Verfügbarkeitsstatus oder Lieferzeit',
    'haendler_einheit': 'Verkaufseinheit (z.B. m², Stück, m, kg)',
    'haendler_preis': 'Verkaufspreis beim Händler (nur Zahl ohne Währungszeichen)',
    'haendler_preis_pro_einheit': 'Preis pro Einheit (nur Zahl ohne Währungszeichen)',
    
    'erfahrung_einsatz_in_projekt': 'Projektname oder -referenz wo das Material eingesetzt wurde',
    'erfahrung_muster_bestellt': 'Status der Musterbestellung (ja/nein/geplant)',
    'erfahrung_muster_abgelegt': 'Ort oder Status der Musterablage',
    'erfahrung_bewertung': 'Persönliche Bewertung oder Einschätzung des Materials',
    'erfahrung_bemerkungen_notizen': 'Zusätzliche Notizen oder Erfahrungen',
    
    'erfassung_quell_url': 'Ursprungs-URL der Datenerfassung',
    'erfassung_erfassungsdatum': 'Datum und Zeit der Erfassung',
    'erfassung_erfassung_fuer': 'Land oder Region für die Erfassung',
    'erfassung_extraktions_log': 'Log der Extraktionsprozesse'
  };

  // Verwende erweiterte Beschreibung falls verfügbar, sonst Original oder Label
  return enhancedDescriptions[fieldName] || 
         originalDescription || 
         `${label || fieldName} - extrahiere relevante Informationen`;
}

/**
 * Fallback-Prompt wenn keine Datenbank-Definitionen verfügbar sind
 */
function buildFallbackPrompt(url: string, spalte: string): string {
  console.log(`generateDynamicPrompt: Verwende Fallback-Prompt für Spalte: ${spalte}`);
  
  const spaltenName = spalte.toUpperCase();
  
  return `
Analysiere die folgende Webseite: ${url}

Extrahiere ${spaltenName}-Informationen aus der Webseite und gib sie als JSON zurück.

JSON-Format für jedes gefundene Feld:
{
  "value": "extrahierter Wert",
  "confidence": 0.0-1.0,
  "reasoning": "Begründung für die Extraktion"
}

Wichtige Hinweise:
- Gib nur gültiges JSON zurück
- Verwende confidence-Werte zwischen 0.0 und 1.0
- Bei unsicheren Werten verwende niedrige confidence-Werte
- Bei fehlenden Informationen verwende leere Strings und confidence 0.0

Antworte ausschließlich mit gültigem JSON.
  `.trim();
}