import { WebScrapingResult, AIAnalysisResult, FusedResult, FieldStrategy } from '../types/extraction';

export class DataFusionEngine {
  private fieldStrategies: Record<string, FieldStrategy> = {
    product_name: { 
      aiWeight: 0.8, 
      webWeight: 0.2,
      validationRules: {
        minLength: 2,
        maxLength: 200
      }
    },
    manufacturer: { 
      aiWeight: 0.7, 
      webWeight: 0.3,
      validationRules: {
        minLength: 2,
        maxLength: 100
      }
    },
    price: { 
      aiWeight: 0.3, 
      webWeight: 0.7,
      validationRules: {
        minValue: 0,
        maxValue: 100000
      }
    },
    description: { 
      aiWeight: 0.6, 
      webWeight: 0.4,
      validationRules: {
        minLength: 10,
        maxLength: 2000
      }
    },
    specifications: { 
      aiWeight: 0.4, 
      webWeight: 0.6,
      validationRules: {
        minLength: 10,
        maxLength: 1000
      }
    }
  };

  fuseData(webData: WebScrapingResult, aiData: AIAnalysisResult): FusedResult {
    const result: FusedResult = {};
    
    // Fuse each field
    result.product_name = this.fuseField('product_name', webData.product_name, aiData.product_name);
    result.manufacturer = this.fuseField('manufacturer', webData.manufacturer, aiData.manufacturer);
    result.price = this.fuseField('price', webData.price, aiData.price);
    result.description = this.fuseField('description', webData.description, aiData.description);
    result.specifications = this.fuseField('specifications', webData.specifications, aiData.specifications);
    
    return result;
  }

  private fuseField(fieldName: string, webField: FieldData, aiField: FieldData): FusedResult[string] {
    const strategy = this.fieldStrategies[fieldName];
    
    // If one source has no data, use the other
    if (!webField.value && !aiField.value) {
      return {
        value: '',
        confidence: 0.0,
        source: 'conflict',
        needsManualReview: true,
        conflictReason: 'No data from either source'
      };
    }
    
    if (!webField.value) {
      return {
        value: aiField.value,
        confidence: aiField.confidence,
        source: 'ai',
        needsManualReview: aiField.confidence < 0.5
      };
    }
    
    if (!aiField.value) {
      return {
        value: webField.value,
        confidence: webField.confidence,
        source: 'web',
        needsManualReview: webField.confidence < 0.5
      };
    }
    
    // Check if values match (with some tolerance for minor differences)
    const valuesMatch = this.valuesMatch(webField.value, aiField.value);
    
    if (valuesMatch) {
      // Both sources agree
      const weightedConfidence = this.calculateWeightedConfidence(
        webField.confidence,
        aiField.confidence,
        strategy
      );
      
      return {
        value: webField.value, // Use web value as it's usually more structured
        confidence: weightedConfidence,
        source: 'both_agree',
        needsManualReview: weightedConfidence < 0.6
      };
    } else {
      // Values conflict - use confidence-weighted decision
      const webScore = webField.confidence * strategy.webWeight;
      const aiScore = aiField.confidence * strategy.aiWeight;
      
      if (webScore > aiScore) {
        return {
          value: webField.value,
          confidence: webScore,
          source: 'web',
          needsManualReview: true,
          alternatives: [aiField.value],
          conflictReason: `Web scraping preferred (${webScore.toFixed(2)} vs ${aiScore.toFixed(2)})`
        };
      } else {
        return {
          value: aiField.value,
          confidence: aiScore,
          source: 'ai',
          needsManualReview: true,
          alternatives: [webField.value],
          conflictReason: `AI analysis preferred (${aiScore.toFixed(2)} vs ${webScore.toFixed(2)})`
        };
      }
    }
  }

  private valuesMatch(value1: string, value2: string): boolean {
    if (!value1 || !value2) return false;
    
    // Normalize values for comparison
    const normalize = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ');
    const norm1 = normalize(value1);
    const norm2 = normalize(value2);
    
    // Exact match
    if (norm1 === norm2) return true;
    
    // Check if one is contained in the other (for partial matches)
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
    
    // For prices, allow small differences
    const price1 = parseFloat(value1.replace(/[^\d.,]/g, '').replace(',', '.'));
    const price2 = parseFloat(value2.replace(/[^\d.,]/g, '').replace(',', '.'));
    
    if (!isNaN(price1) && !isNaN(price2)) {
      const diff = Math.abs(price1 - price2);
      const tolerance = Math.max(price1, price2) * 0.05; // 5% tolerance
      return diff <= tolerance;
    }
    
    return false;
  }

  private calculateWeightedConfidence(
    webConfidence: number,
    aiConfidence: number,
    strategy: FieldStrategy
  ): number {
    return (webConfidence * strategy.webWeight) + (aiConfidence * strategy.aiWeight);
  }

  // Method to get fields that need manual review
  getFieldsNeedingReview(fusedResult: FusedResult): string[] {
    return Object.keys(fusedResult).filter(field => 
      fusedResult[field].needsManualReview
    );
  }

  // Method to get overall confidence score
  getOverallConfidence(fusedResult: FusedResult): number {
    const fields = Object.keys(fusedResult);
    if (fields.length === 0) return 0.0;
    
    const totalConfidence = fields.reduce((sum, field) => {
      return sum + fusedResult[field].confidence;
    }, 0);
    
    return totalConfidence / fields.length;
  }
} 