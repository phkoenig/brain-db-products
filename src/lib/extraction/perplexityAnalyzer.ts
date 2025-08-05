import { AIAnalysisResult, FieldData } from '../types/extraction';
import { generateAIPrompt, getCachedFieldDefinitions } from '../schemas/product-fields';

export class PerplexityAnalyzer {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async analyzeUrl(url: string, customPrompt?: string): Promise<AIAnalysisResult> {
    return this.analyzeWithEnhancedSearch({ url, prompt: customPrompt });
  }

  async analyzeWithEnhancedSearch({ 
    url, 
    prompt, 
    searchQueries = [] 
  }: {
    url: string;
    prompt?: string;
    searchQueries?: string[];
  }): Promise<AIAnalysisResult> {
    const finalPrompt = prompt || await this.buildDynamicPrompt(url);
    
    console.log('DEBUG: Perplexity prompt length:', finalPrompt.length);
    console.log('DEBUG: Perplexity prompt preview:', finalPrompt.substring(0, 200) + '...');
    if (searchQueries.length > 0) {
      console.log('DEBUG: Enhanced search queries:', searchQueries);
    }
    
    const requestBody = {
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `URL: ${url}${searchQueries.length > 0 ? `\nZusätzliche Suchbegriffe: ${searchQueries.join(', ')}` : ''}`
        },
        {
          role: 'user',
          content: finalPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    };
    
    console.log('DEBUG: Perplexity request body:', JSON.stringify(requestBody, null, 2));
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('DEBUG: Perplexity response status:', response.status);
      console.log('DEBUG: Perplexity response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DEBUG: Perplexity error response body:', errorText);
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('DEBUG: Perplexity success response preview:', JSON.stringify(data).substring(0, 500) + '...');
      
      // Parse die rohe AI-Antwort direkt als JSON
      const content = data.choices[0].message.content;
      console.log('DEBUG: Raw content from Perplexity:', content.substring(0, 300) + '...');
      
      try {
        // Bereinige den Content für JSON-Parsing
        let cleanedContent = content.trim();
        
        // Extrahiere JSON aus Markdown-Code-Blöcken
        const jsonMatch = cleanedContent.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedContent = jsonMatch[1].trim();
          console.log('DEBUG: Extracted JSON from markdown block');
        } else if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```[\s\S]*$/, '');
        } else if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```[\s\S]*$/, '');
        } else {
          // Versuche JSON-Array oder -Objekt zu finden
          const arrayMatch = cleanedContent.match(/(\[[\s\S]*?\])/);
          const objectMatch = cleanedContent.match(/(\{[\s\S]*?\})/);
          
          if (arrayMatch) {
            cleanedContent = arrayMatch[1];
            console.log('DEBUG: Extracted JSON array from text');
          } else if (objectMatch) {
            cleanedContent = objectMatch[1];
            console.log('DEBUG: Extracted JSON object from text');
          }
        }
        
        console.log('DEBUG: Final cleaned content for JSON parsing:', cleanedContent.substring(0, 300) + '...');
        
        const parsedResult = JSON.parse(cleanedContent);
        console.log('DEBUG: Successfully parsed JSON result');
        
        // Validiere und normalisiere das Ergebnis
        return this.parseAIResponse(parsedResult);
      } catch (parseError) {
        console.error('DEBUG: Failed to parse JSON response:', parseError);
        console.error('DEBUG: Raw content that failed to parse:', content);
        throw new Error(`Failed to parse Perplexity response as JSON: ${parseError}`);
      }
    } catch (error) {
      console.error('DEBUG: Perplexity analysis failed:', error);
      return this.handleError(error);
    }
  }

  private async buildDynamicPrompt(url: string): Promise<string> {
    try {
      const fieldDefinitions = await getCachedFieldDefinitions();
      return await generateAIPrompt(url, fieldDefinitions);
    } catch (error) {
      console.warn('Failed to build dynamic prompt, falling back to static prompt:', error);
      return this.buildStaticPrompt(url);
    }
  }

  private buildStaticPrompt(url: string): string {
    return `
Analysiere die folgende Webseite: ${url}

Extrahiere alle verfügbaren Produktinformationen und gib sie als JSON-Objekt zurück. 
Verwende folgende Struktur für jedes Feld:

{
  "fieldName": {
    "value": "extrahierter Wert",
    "confidence": 0.95,
    "source": "URL oder Textstelle"
  }
}

Fokussiere dich auf:
- Produktname und Beschreibung
- Technische Spezifikationen
- Preise und Verfügbarkeit
- Hersteller- und Händlerinformationen
- Maße und Gewicht
- Materialien und Eigenschaften

Gib nur gültiges JSON zurück, ohne zusätzlichen Text oder Erklärungen.
    `;
  }

  private parseAIResponse(content: string | null): AIAnalysisResult {
    if (!content) {
      return this.createEmptyResult();
    }

    try {
      // Wenn content bereits ein Objekt ist, verwende es direkt
      const data = typeof content === 'string' ? JSON.parse(content) : content;
      
      if (!data || typeof data !== 'object') {
        console.warn('Invalid AI response format:', data);
        return this.createEmptyResult();
      }

      const result: AIAnalysisResult = {
        data: {},
        searchQueries: [],
        sources: [content.toString()],
        error: null
      };

      // Iteriere über alle Felder im Response
      for (const [fieldName, fieldData] of Object.entries(data)) {
        if (this.isValidFieldName(fieldName)) {
          result.data[fieldName] = this.parseFieldData(fieldData);
        }
      }

      return result;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.createEmptyResult();
    }
  }

  private isValidFieldName(fieldName: string): boolean {
    return typeof fieldName === 'string' && fieldName.length > 0;
  }

  private parseFieldData(fieldData: unknown): FieldData {
    if (typeof fieldData === 'object' && fieldData !== null) {
      const data = fieldData as any;
      return {
        value: data.value || '',
        confidence: typeof data.confidence === 'number' ? data.confidence : 0.5,
        source: data.source || ''
      };
    } else {
      return {
        value: String(fieldData || ''),
        confidence: 0.5,
        source: ''
      };
    }
  }

  private createEmptyField(): FieldData {
    return {
      value: '',
      confidence: 0,
      source: ''
    };
  }

  private createEmptyResult(): AIAnalysisResult {
    return {
      data: {},
      searchQueries: [],
      sources: [],
      error: null
    };
  }
  
  private handleError(error: unknown): any {
    console.error('Perplexity AI analysis error:', error);
    return {
      data: {},
      searchQueries: [],
      sources: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export function for the enhanced analysis API with dynamic prompts
export async function analyzeWithPerplexity(url: string, fieldDefinitions: any, customPrompt?: string): Promise<any> {
  console.log('DEBUG: analyzeWithPerplexity called with URL:', url);
  console.log('DEBUG: Field definitions keys:', Object.keys(fieldDefinitions || {}));
  
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY environment variable is not set');
  }
  
  console.log('DEBUG: PERPLEXITY_API_KEY is set');
  
  // Verwende den dynamischen Prompt direkt
  const prompt = customPrompt || `Analysiere die Webseite ${url} und extrahiere relevante Produktinformationen als JSON.`;
  
  console.log('DEBUG: Perplexity prompt length:', prompt.length);
  console.log('DEBUG: Perplexity prompt preview:', prompt.substring(0, 200) + '...');
  
  const requestBody = {
    model: 'sonar-pro',
    messages: [
      {
        role: 'system',
        content: `URL: ${url}`
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.1,
    max_tokens: 4000
  };
  
  console.log('DEBUG: Perplexity request body:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('DEBUG: Perplexity response status:', response.status);
    console.log('DEBUG: Perplexity response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DEBUG: Perplexity error response body:', errorText);
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('DEBUG: Perplexity success response preview:', JSON.stringify(data).substring(0, 500) + '...');
    
    // Parse die JSON-Antwort
    const content = data.choices[0].message.content;
    console.log('DEBUG: Raw content from Perplexity:', content.substring(0, 300) + '...');
    
    try {
      // Bereinige den Content für JSON-Parsing
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      console.log('DEBUG: Cleaned content for JSON parsing:', cleanedContent.substring(0, 300) + '...');
      
      const parsedResult = JSON.parse(cleanedContent);
      console.log('DEBUG: Perplexity analysis completed successfully');
      return parsedResult;
    } catch (parseError) {
      console.error('DEBUG: Failed to parse JSON response:', parseError);
      console.error('DEBUG: Raw content that failed to parse:', content);
      throw new Error(`Failed to parse Perplexity response as JSON: ${parseError}`);
    }
  } catch (error) {
    console.error('DEBUG: Perplexity analysis failed:', error);
    throw error;
  }
} 