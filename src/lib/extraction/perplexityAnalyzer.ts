import { AIAnalysisResult, FieldData } from '../types/extraction';
import { generateAIPrompt, getCachedFieldDefinitions } from '../schemas/product-fields';

export class PerplexityAnalyzer {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async analyzeUrl(url: string, customPrompt?: string): Promise<AIAnalysisResult> {
    const prompt = customPrompt || await this.buildDynamicPrompt(url);
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-instruct',
          messages: [
            {
              role: 'system',
              content: 'Du bist ein Experte für Baumaterialien und Produktdaten-Extraktion. Analysiere die Webseite und extrahiere alle verfügbaren Produktinformationen basierend auf den angegebenen Feldern.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseAIResponse(data.choices[0].message.content);
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  private async buildDynamicPrompt(url: string): Promise<string> {
    try {
      const schema = await getCachedFieldDefinitions();
      
      const fieldDescriptions = schema.fields.map(field => {
        const examples = field.examples ? ` (Beispiele: ${field.examples.join(', ')})` : '';
        const hints = field.extraction_hints ? ` (Hinweise: ${field.extraction_hints.join(', ')})` : '';
        return `- ${field.field_name}: ${field.description}${examples}${hints}`;
      }).join('\n');

      return `
Analysiere die folgende Webseite: ${url}

Extrahiere die folgenden Produktinformationen und gib sie als JSON zurück:

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
      `;
    } catch (error) {
      console.error('Failed to build dynamic prompt, falling back to static prompt:', error);
      return this.buildStaticPrompt(url);
    }
  }
  
  private buildStaticPrompt(url: string): string {
    return `
Analysiere die folgende Webseite: ${url}

Extrahiere die folgenden Produktinformationen und gib sie als JSON zurück:

{
  "product_name": {
    "value": "Produktname",
    "confidence": 0.0-1.0,
    "reasoning": "Begründung für die Extraktion"
  },
  "manufacturer": {
    "value": "Hersteller",
    "confidence": 0.0-1.0,
    "reasoning": "Begründung für die Extraktion"
  },
  "price": {
    "value": "Preis als Zahl",
    "confidence": 0.0-1.0,
    "reasoning": "Begründung für die Extraktion"
  },
  "description": {
    "value": "Produktbeschreibung",
    "confidence": 0.0-1.0,
    "reasoning": "Begründung für die Extraktion"
  },
  "specifications": {
    "value": "Technische Spezifikationen",
    "confidence": 0.0-1.0,
    "reasoning": "Begründung für die Extraktion"
  }
}
    `;
  }
  
  private parseAIResponse(content: string | null): AIAnalysisResult {
    if (!content) {
      return this.createEmptyResult();
    }

    try {
      const parsed = JSON.parse(content);
      const result = this.createEmptyResult();
      
      // Dynamically parse all fields from the response
      for (const [fieldName, fieldData] of Object.entries(parsed)) {
        if (this.isValidFieldName(fieldName) && fieldName in result) {
          (result as any)[fieldName] = this.parseFieldData(fieldData);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Failed to parse Perplexity AI response:', error);
      return this.createEmptyResult();
    }
  }
  
  private isValidFieldName(fieldName: string): boolean {
    // Add validation logic if needed
    return typeof fieldName === 'string' && fieldName.length > 0;
  }
  
  private parseFieldData(fieldData: unknown): FieldData {
    if (!fieldData || typeof fieldData !== 'object') {
      return this.createEmptyField();
    }
    
    const data = fieldData as any;
    return {
      value: data.value || '',
      confidence: typeof data.confidence === 'number' ? Math.max(0, Math.min(1, data.confidence)) : 0,
      reasoning: data.reasoning || '',
      source: 'perplexity'
    };
  }
  
  private createEmptyField(): FieldData {
    return {
      value: '',
      confidence: 0,
      reasoning: '',
      source: 'perplexity'
    };
  }
  
  private createEmptyResult(): AIAnalysisResult {
    const emptyField = this.createEmptyField();
    return {
      // Basic product information
      product_name: emptyField,
      manufacturer: emptyField,
      series: emptyField,
      product_code: emptyField,
      application_area: emptyField,
      description: emptyField,
      
      // URLs
      manufacturer_url: emptyField,
      manufacturer_product_url: emptyField,
      
      // Retailer information
      retailer_name: emptyField,
      retailer_url: emptyField,
      product_page_url: emptyField,
      
      // Pricing
      price: emptyField,
      unit: emptyField,
      price_per_unit: emptyField,
      availability: emptyField,
      
      // Specifications
      dimensions: emptyField,
      color: emptyField,
      main_material: emptyField,
      surface: emptyField,
      weight_per_unit: emptyField,
      fire_resistance: emptyField,
      thermal_conductivity: emptyField,
      u_value: emptyField,
      sound_insulation: emptyField,
      water_resistance: emptyField,
      vapor_diffusion: emptyField,
      installation_type: emptyField,
      maintenance: emptyField,
      environment_cert: emptyField,
      
      // Documents
      datasheet_url: emptyField,
      technical_sheet_url: emptyField,
      additional_documents_url: emptyField,
      catalog_url: emptyField,
      
      // Experience
      project: emptyField,
      sample_ordered: emptyField,
      sample_stored_in: emptyField,
      rating: emptyField,
      notes: emptyField,
      
      confidence_scores: {}
    };
  }
  
  private handleError(error: unknown): AIAnalysisResult {
    console.error('Perplexity AI analysis error:', error);
    return this.createEmptyResult();
  }
} 