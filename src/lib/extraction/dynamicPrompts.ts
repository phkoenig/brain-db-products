import { supabase } from '@/lib/supabase';

interface DynamicPromptOptions {
  url: string;
  spalte: string;
}

/**
 * Generiert dynamische Prompts basierend auf Datenbank-Felddefinitionen
 */
export async function generateDynamicPrompt({ url, spalte }: DynamicPromptOptions): Promise<string> {
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

    // Erstelle Feld-Beschreibungen
    const fieldDescriptions = fieldDefinitions.map(field => {
      const examples = field.examples && field.examples.length > 0 
        ? ` (Beispiele: ${field.examples.join(', ')})` 
        : '';
      const hints = field.extraction_hints && field.extraction_hints.length > 0 
        ? ` (Hinweise: ${field.extraction_hints.join(', ')})` 
        : '';
      const description = field.description || `${field.label || field.field_name}`;
      
      return `- ${field.field_name}: ${description}${examples}${hints}`;
    }).join('\n');

    // Generiere spalten-spezifischen Prompt
    const spaltenName = spalte.toUpperCase();
    
    const prompt = `
Analysiere die folgende Webseite: ${url}

Extrahiere die folgenden ${spaltenName}-Informationen und gib sie als JSON zurück:

Ziel-Felder:
${fieldDescriptions}

JSON-Format für jedes Feld:
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
- Bei numerischen Werten (Preis, Gewicht, etc.) extrahiere nur die Zahl ohne Einheiten
- Verwende die angegebenen Hinweise und Beispiele zur besseren Extraktion
- Analysiere den gesamten Inhalt der Webseite, nicht nur den sichtbaren Text

Antworte ausschließlich mit gültigem JSON.
    `.trim();

    console.log(`generateDynamicPrompt: Prompt für Spalte '${spalte}' generiert (${prompt.length} Zeichen)`);
    return prompt;

  } catch (error) {
    console.error('generateDynamicPrompt: Fehler:', error);
    // Fallback zu statischem Prompt bei Fehlern
    return buildFallbackPrompt(url, spalte);
  }
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