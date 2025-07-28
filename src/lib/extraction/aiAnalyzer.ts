import OpenAI from 'openai';
import { AIAnalysisResult, FieldData } from '../types/extraction';

export class AIAnalyzer {
  private openai: OpenAI;
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }
  
  async analyzeScreenshot(screenshotBase64: string, url: string, customPrompt?: string): Promise<AIAnalysisResult> {
    const prompt = customPrompt || this.buildPrompt(url);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Du bist ein Experte für Baumaterialien und Produktdaten-Extraktion. Analysiere das Screenshot und extrahiere alle verfügbaren Produktinformationen."
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { 
                type: "image_url", 
                image_url: { 
                  url: `data:image/png;base64,${screenshotBase64}` 
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
  
  private buildPrompt(url: string): string {
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
      
      return {
        product_name: this.parseFieldData(data.product_name),
        manufacturer: this.parseFieldData(data.manufacturer),
        price: this.parseFieldData(data.price),
        description: this.parseFieldData(data.description),
        specifications: this.parseFieldData(data.specifications),
        confidence_scores: {
          product_name: data.product_name?.confidence || 0.0,
          manufacturer: data.manufacturer?.confidence || 0.0,
          price: data.price?.confidence || 0.0,
          description: data.description?.confidence || 0.0,
          specifications: data.specifications?.confidence || 0.0
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  private parseFieldData(fieldData: unknown): FieldData {
    if (!fieldData || typeof fieldData !== 'object') {
      return {
        value: '',
        confidence: 0.0,
        source: 'ai',
        reasoning: 'Invalid field data'
      };
    }
    
    return {
      value: fieldData.value || '',
      confidence: fieldData.confidence || 0.0,
      source: 'ai',
      reasoning: fieldData.reasoning || 'No reasoning provided'
    };
  }
  
  private handleError(error: unknown): AIAnalysisResult {
    const emptyField: FieldData = {
      value: '',
      confidence: 0.0,
      source: 'ai',
      reasoning: `Error: ${error.message}`
    };

    return {
      product_name: emptyField,
      manufacturer: emptyField,
      price: emptyField,
      description: emptyField,
      specifications: emptyField,
      confidence_scores: {
        product_name: 0.0,
        manufacturer: 0.0,
        price: 0.0,
        description: 0.0,
        specifications: 0.0
      }
    };
  }
} 