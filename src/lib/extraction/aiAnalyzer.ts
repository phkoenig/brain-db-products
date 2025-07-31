import OpenAI from 'openai';
import { AIAnalysisResult, FieldData } from '../types/extraction';
import { generateAIPrompt, getCachedFieldDefinitions } from '../schemas/product-fields';

export class AIAnalyzer {
  private openai: OpenAI;
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }
  
  async analyzeScreenshot(screenshotBase64: string, url: string, customPrompt?: string): Promise<AIAnalysisResult> {
    const prompt = customPrompt || await this.buildDynamicPrompt(url);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Du bist ein Experte für Baumaterialien und Produktdaten-Extraktion. Analysiere das Screenshot und extrahiere alle verfügbaren Produktinformationen basierend auf den angegebenen Feldern."
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { 
                type: "image_url", 
                image_url: { 
                  url: screenshotBase64.startsWith('data:') ? screenshotBase64 : `data:image/png;base64,${screenshotBase64}` 
                } 
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });
      
      return this.parseAIResponse(response.choices[0].message.content);
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
Analysiere das Screenshot der folgenden URL: ${url}

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

Antworte ausschließlich mit gültigem JSON.
      `;
    } catch (error) {
      console.error('Failed to build dynamic prompt, falling back to static prompt:', error);
      return this.buildStaticPrompt(url);
    }
  }
  
  private buildStaticPrompt(url: string): string {
    return `
Analysiere das Screenshot der folgenden URL: ${url}

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

Wichtige Hinweise:
- Gib nur gültiges JSON zurück
- Verwende confidence-Werte zwischen 0.0 und 1.0
- Bei unsicheren Werten verwende niedrige confidence-Werte
- Bei Preisen extrahiere nur die Zahl ohne Währungssymbol
- Bei fehlenden Informationen verwende leere Strings und confidence 0.0
    `;
  }
  
  private parseAIResponse(content: string | null): AIAnalysisResult {
    if (!content) {
      return this.handleError(new Error('Empty response from OpenAI'));
    }
    
    try {
      const data = JSON.parse(content);
      
      // Create a dynamic result object based on the response
      const result: AIAnalysisResult = {} as AIAnalysisResult;
      
      // Map all fields from the response to the result
      for (const [key, value] of Object.entries(data)) {
        if (this.isValidFieldName(key)) {
          (result as any)[key] = this.parseFieldData(value);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.handleError(error);
    }
  }
  
  private isValidFieldName(fieldName: string): boolean {
    // Add validation for field names if needed
    return fieldName.length > 0 && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName);
  }
  
  private parseFieldData(fieldData: unknown): FieldData {
    if (!fieldData || typeof fieldData !== 'object') {
      return this.createEmptyField();
    }
    
    const data = fieldData as Record<string, unknown>;
    
    return {
      value: String(data.value || ''),
      confidence: typeof data.confidence === 'number' ? Math.max(0, Math.min(1, data.confidence)) : 0,
      source: 'ai',
      reasoning: String(data.reasoning || 'No reasoning provided')
    };
  }
  
  private createEmptyField(): FieldData {
    return {
      value: '',
      confidence: 0,
      source: 'ai',
      reasoning: 'Field not found or invalid'
    };
  }
  
  private handleError(error: unknown): AIAnalysisResult {
    console.error('AI Analysis error:', error);
    
    // Return empty result with all fields
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
} 

// Export function for the enhanced analysis API
export async function analyzeWithOpenAI(screenshotBase64: string, fieldDefinitions: any): Promise<any> {
  console.log('DEBUG: Available environment variables:', Object.keys(process.env).filter(key => key.includes('OPENAI')));
  console.log('DEBUG: OPENAI_API_KEY value:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  const analyzer = new AIAnalyzer(apiKey);
  const result = await analyzer.analyzeScreenshot(screenshotBase64, '');
  return result;
} 