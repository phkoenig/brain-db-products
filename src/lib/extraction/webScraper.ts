import * as cheerio from 'cheerio';
import axios from 'axios';
import { WebScrapingResult, FieldData } from '../types/extraction';

export class WebScraper {
  private session = axios.create({
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  async extractFromUrl(url: string, sourceType?: 'manufacturer' | 'reseller'): Promise<WebScrapingResult> {
    try {
      const response = await this.session.get(url);
      const $ = cheerio.load(response.data);
      
      return {
        product_name: this.extractProductName($, sourceType),
        manufacturer: this.extractManufacturer($, sourceType),
        price: this.extractPrice($, sourceType),
        description: this.extractDescription($, sourceType),
        specifications: this.extractSpecifications($, sourceType),
        confidence_scores: this.calculateConfidence($, sourceType)
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private extractProductName($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    const selectors = [
      'h1.product-title',
      'h1.product-name',
      '.product-name h1',
      'h1[data-testid="product-title"]',
      'h1'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text.length > 0) {
          return {
            value: text,
            confidence: sourceType === 'manufacturer' ? 0.9 : 0.8, // Higher confidence for manufacturer sites
            source: 'web',
            reasoning: `Found using selector: ${selector} (${sourceType || 'unknown'} site)`
          };
        }
      }
    }

    return {
      value: '',
      confidence: 0.0,
      source: 'web',
      reasoning: 'No product name found'
    };
  }

  private extractManufacturer($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    const selectors = [
      '.manufacturer',
      '.brand',
      '[data-testid="manufacturer"]',
      '.product-brand'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text.length > 0) {
          return {
            value: text,
            confidence: 0.7,
            source: 'web',
            reasoning: `Found using selector: ${selector}`
          };
        }
      }
    }

    return {
      value: '',
      confidence: 0.0,
      source: 'web',
      reasoning: 'No manufacturer found'
    };
  }

  private extractPrice($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    const selectors = sourceType === 'reseller' 
      ? [
          '.price',
          '.product-price',
          '[data-testid="price"]',
          '.current-price',
          '.sale-price',
          '.retail-price'
        ]
      : [
          '.price',
          '.product-price',
          '[data-testid="price"]',
          '.current-price'
        ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        const price = this.parsePrice(text);
        if (price) {
          return {
            value: price.toString(),
            confidence: 0.9,
            source: 'web',
            reasoning: `Found price: ${price} using selector: ${selector}`
          };
        }
      }
    }

    return {
      value: '',
      confidence: 0.0,
      source: 'web',
      reasoning: 'No price found'
    };
  }

  private extractDescription($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    const selectors = [
      '.product-description',
      '.description',
      '[data-testid="description"]',
      '.product-details'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text.length > 10) {
          return {
            value: text,
            confidence: 0.6,
            source: 'web',
            reasoning: `Found using selector: ${selector}`
          };
        }
      }
    }

    return {
      value: '',
      confidence: 0.0,
      source: 'web',
      reasoning: 'No description found'
    };
  }

  private extractSpecifications($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    const selectors = [
      '.specifications',
      '.product-specs',
      '[data-testid="specifications"]',
      '.tech-specs'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text.length > 10) {
          return {
            value: text,
            confidence: 0.7,
            source: 'web',
            reasoning: `Found using selector: ${selector}`
          };
        }
      }
    }

    return {
      value: '',
      confidence: 0.0,
      source: 'web',
      reasoning: 'No specifications found'
    };
  }

  private parsePrice(text: string): number | null {
    // Remove currency symbols and whitespace
    const cleanText = text.replace(/[€$£¥\s]/g, '');
    
    // Find numbers with optional decimal places
    const match = cleanText.match(/(\d+(?:[.,]\d{1,2})?)/);
    if (match) {
      const price = parseFloat(match[1].replace(',', '.'));
      return isNaN(price) ? null : price;
    }
    
    return null;
  }

  private calculateConfidence($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): Record<string, number> {
    // Simple confidence calculation based on element presence
    const confidence: Record<string, number> = {};
    
    confidence.product_name = $('h1').length > 0 ? (sourceType === 'manufacturer' ? 0.9 : 0.8) : 0.0;
    confidence.manufacturer = $('.manufacturer, .brand').length > 0 ? (sourceType === 'manufacturer' ? 0.9 : 0.7) : 0.0;
    confidence.price = $('.price, .product-price').length > 0 ? (sourceType === 'reseller' ? 0.9 : 0.6) : 0.0;
    confidence.description = $('.description, .product-description').length > 0 ? (sourceType === 'manufacturer' ? 0.8 : 0.6) : 0.0;
    confidence.specifications = $('.specifications, .product-specs').length > 0 ? (sourceType === 'manufacturer' ? 0.8 : 0.7) : 0.0;
    
    return confidence;
  }

  private handleError(error: unknown): WebScrapingResult {
    const emptyField: FieldData = {
      value: '',
      confidence: 0.0,
      source: 'web',
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