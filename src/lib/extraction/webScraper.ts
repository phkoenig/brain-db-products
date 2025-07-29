import * as cheerio from 'cheerio';
import axios from 'axios';
import { WebScrapingResult, FieldData } from '../types/extraction';

export class WebScraper {
  private session = axios.create({
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  async extractFromUrl(url: string, sourceType?: 'manufacturer' | 'reseller'): Promise<WebScrapingResult> {
    try {
      const response = await this.session.get(url);
      const $ = cheerio.load(response.data);
      
      return {
        // Basic product information
        product_name: this.extractProductName($, sourceType),
        manufacturer: this.extractManufacturer($, sourceType),
        series: this.extractSeries($, sourceType),
        product_code: this.extractProductCode($, sourceType),
        application_area: this.extractApplicationArea($, sourceType),
        description: this.extractDescription($, sourceType),
        
        // URLs
        manufacturer_url: this.extractManufacturerUrl($, sourceType),
        manufacturer_product_url: this.extractManufacturerProductUrl($, sourceType),
        
        // Retailer information
        retailer_name: this.extractRetailerName($, sourceType),
        retailer_url: this.extractRetailerUrl($, sourceType),
        product_page_url: this.extractProductPageUrl($, sourceType),
        
        // Pricing
        price: this.extractPrice($, sourceType),
        unit: this.extractUnit($, sourceType),
        price_per_unit: this.extractPricePerUnit($, sourceType),
        availability: this.extractAvailability($, sourceType),
        
        // Specifications
        dimensions: this.extractDimensions($, sourceType),
        color: this.extractColor($, sourceType),
        main_material: this.extractMainMaterial($, sourceType),
        surface: this.extractSurface($, sourceType),
        weight_per_unit: this.extractWeightPerUnit($, sourceType),
        fire_resistance: this.extractFireResistance($, sourceType),
        thermal_conductivity: this.extractThermalConductivity($, sourceType),
        u_value: this.extractUValue($, sourceType),
        sound_insulation: this.extractSoundInsulation($, sourceType),
        water_resistance: this.extractWaterResistance($, sourceType),
        vapor_diffusion: this.extractVaporDiffusion($, sourceType),
        installation_type: this.extractInstallationType($, sourceType),
        maintenance: this.extractMaintenance($, sourceType),
        environment_cert: this.extractEnvironmentCert($, sourceType),
        
        // Documents
        datasheet_url: this.extractDatasheetUrl($, sourceType),
        technical_sheet_url: this.extractTechnicalSheetUrl($, sourceType),
        additional_documents_url: this.extractAdditionalDocumentsUrl($, sourceType),
        catalog_url: this.extractCatalogUrl($, sourceType),
        
        // Experience
        project: this.extractProject($, sourceType),
        sample_ordered: this.extractSampleOrdered($, sourceType),
        sample_stored_in: this.extractSampleStoredIn($, sourceType),
        rating: this.extractRating($, sourceType),
        notes: this.extractNotes($, sourceType),
        
        confidence_scores: this.calculateConfidence($, sourceType)
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private safeSelector($: cheerio.CheerioAPI, selector: string): cheerio.Cheerio<any> {
    try {
      return $(selector);
    } catch (error) {
      console.warn(`Invalid CSS selector: ${selector}`, error);
      return $(''); // Return empty selection
    }
  }

  private extractProductName($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    const selectors = [
      'h1.product-title',
      'h1.product-name',
      '.product-name h1',
      'h1[data-testid="product-title"]',
      '.product-title',
      '.product-name',
      'h1',
      '.title',
      '[class*="product"][class*="title"]',
      '[class*="product"][class*="name"]'
    ];

    for (const selector of selectors) {
      try {
        const element = this.safeSelector($, selector).first();
        if (element.length > 0) {
          const text = element.text().trim();
          if (text.length > 0 && text.length < 200) {
            return {
              value: text,
              confidence: sourceType === 'manufacturer' ? 0.9 : 0.8,
              source: 'web',
              reasoning: `Found using selector: ${selector}`
            };
          }
        }
      } catch (error) {
        console.warn(`Error with selector ${selector}:`, error);
        continue;
      }
    }

    return this.createEmptyField('Product name not found in any expected selectors');
  }

  private extractManufacturer($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    const selectors = [
      '.manufacturer',
      '.brand',
      '.producer',
      '[class*="manufacturer"]',
      '[class*="brand"]',
      '[class*="producer"]',
      'meta[property="og:site_name"]',
      'meta[name="author"]'
    ];

    for (const selector of selectors) {
      try {
        const element = this.safeSelector($, selector).first();
        if (element.length > 0) {
          let text = element.text().trim();
          if (!text && element.attr('content')) {
            text = element.attr('content') || '';
          }
          if (text.length > 0 && text.length < 100) {
            return {
              value: text,
              confidence: sourceType === 'manufacturer' ? 0.95 : 0.7,
              source: 'web',
              reasoning: `Found using selector: ${selector}`
            };
          }
        }
      } catch (error) {
        console.warn(`Error with selector ${selector}:`, error);
        continue;
      }
    }

    return this.createEmptyField('Manufacturer not found in any expected selectors');
  }

  private extractSeries($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractSpecification($, 'series', ['serie', 'series', 'line', 'familie', 'collection']);
  }

  private extractProductCode($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    const selectors = [
      '.product-code',
      '.sku',
      '.artikelnummer',
      '.product-id',
      '[class*="code"]',
      '[class*="sku"]',
      '[class*="artikelnummer"]'
    ];

    for (const selector of selectors) {
      try {
        const element = this.safeSelector($, selector).first();
        if (element.length > 0) {
          const text = element.text().trim();
          if (text.length > 0 && text.length < 50) {
            return {
              value: text,
              confidence: 0.8,
              source: 'web',
              reasoning: `Found using selector: ${selector}`
            };
          }
        }
      } catch (error) {
        console.warn(`Error with selector ${selector}:`, error);
        continue;
      }
    }

    return this.createEmptyField('Product code not found in any expected selectors');
  }

  private extractApplicationArea($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractSpecification($, 'application_area', ['anwendung', 'application', 'einsatz', 'verwendung']);
  }

  private extractDescription($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    const selectors = [
      '.product-description',
      '.description',
      '.product-details',
      '.product-info',
      '[class*="description"]',
      '[class*="details"]',
      'meta[name="description"]'
    ];

    for (const selector of selectors) {
      try {
        const element = this.safeSelector($, selector).first();
        if (element.length > 0) {
          let text = element.text().trim();
          if (!text && element.attr('content')) {
            text = element.attr('content') || '';
          }
          if (text.length > 10 && text.length < 1000) {
            return {
              value: text,
              confidence: 0.8,
              source: 'web',
              reasoning: `Found using selector: ${selector}`
            };
          }
        }
      } catch (error) {
        console.warn(`Error with selector ${selector}:`, error);
        continue;
      }
    }

    return this.createEmptyField('Description not found in any expected selectors');
  }

  private extractManufacturerUrl($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    const selectors = [
      'a[href*="manufacturer"]',
      'a[href*="brand"]',
      'a[href*="producer"]',
      '.manufacturer a',
      '.brand a'
    ];

    for (const selector of selectors) {
      try {
        const element = this.safeSelector($, selector).first();
        if (element.length > 0) {
          const href = element.attr('href');
          if (href && href.length > 0) {
            return {
              value: href,
              confidence: 0.7,
              source: 'web',
              reasoning: `Found using selector: ${selector}`
            };
          }
        }
      } catch (error) {
        console.warn(`Error with selector ${selector}:`, error);
        continue;
      }
    }

    return this.createEmptyField('Manufacturer URL not found');
  }

  private extractManufacturerProductUrl($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractDocumentUrl($, 'manufacturer_product_url', ['hersteller', 'manufacturer', 'original']);
  }

  private extractRetailerName($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    const selectors = [
      '.retailer-name',
      '.shop-name',
      '.store-name',
      '.händler',
      '[class*="retailer"]',
      '[class*="shop"]',
      '[class*="store"]',
      'meta[property="og:site_name"]'
    ];

    for (const selector of selectors) {
      try {
        const element = this.safeSelector($, selector).first();
        if (element.length > 0) {
          let text = element.text().trim();
          if (!text && element.attr('content')) {
            text = element.attr('content') || '';
          }
          if (text.length > 0 && text.length < 100) {
            return {
              value: text,
              confidence: sourceType === 'reseller' ? 0.9 : 0.6,
              source: 'web',
              reasoning: `Found using selector: ${selector}`
            };
          }
        }
      } catch (error) {
        console.warn(`Error with selector ${selector}:`, error);
        continue;
      }
    }

    return this.createEmptyField('Retailer name not found');
  }

  private extractRetailerUrl($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractDocumentUrl($, 'retailer_url', ['shop', 'store', 'händler', 'retailer']);
  }

  private extractProductPageUrl($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.createEmptyField('Product page URL is the current URL');
  }

  private extractPrice($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    const selectors = [
      '.price',
      '.product-price',
      '.cost',
      '.preis',
      '[class*="price"]',
      '[class*="cost"]',
      '[class*="preis"]',
      'meta[property="product:price:amount"]'
    ];

    for (const selector of selectors) {
      try {
        const element = this.safeSelector($, selector).first();
        if (element.length > 0) {
          const text = element.text().trim();
          const price = this.parsePrice(text);
          if (price !== null) {
            return {
              value: price.toString(),
              confidence: sourceType === 'reseller' ? 0.9 : 0.7,
              source: 'web',
              reasoning: `Found using selector: ${selector}`
            };
          }
        }
      } catch (error) {
        console.warn(`Error with selector ${selector}:`, error);
        continue;
      }
    }

    return this.createEmptyField('Price not found in any expected selectors');
  }

  private extractUnit($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    const selectors = [
      '.unit',
      '.einheit',
      '.price-unit',
      '[class*="unit"]',
      '[class*="einheit"]'
    ];

    for (const selector of selectors) {
      try {
        const element = this.safeSelector($, selector).first();
        if (element.length > 0) {
          const text = element.text().trim();
          if (text.length > 0 && text.length < 20) {
            return {
              value: text,
              confidence: 0.7,
              source: 'web',
              reasoning: `Found using selector: ${selector}`
            };
          }
        }
      } catch (error) {
        console.warn(`Error with selector ${selector}:`, error);
        continue;
      }
    }

    return this.createEmptyField('Unit not found');
  }

  private extractPricePerUnit($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractSpecification($, 'price_per_unit', ['stückpreis', 'price per unit', 'preis pro einheit']);
  }

  private extractAvailability($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    const selectors = [
      '.availability',
      '.stock',
      '.lager',
      '.verfügbarkeit',
      '[class*="availability"]',
      '[class*="stock"]',
      '[class*="lager"]'
    ];

    for (const selector of selectors) {
      try {
        const element = this.safeSelector($, selector).first();
        if (element.length > 0) {
          const text = element.text().trim();
          if (text.length > 0 && text.length < 50) {
            return {
              value: text,
              confidence: sourceType === 'reseller' ? 0.8 : 0.6,
              source: 'web',
              reasoning: `Found using selector: ${selector}`
            };
          }
        }
      } catch (error) {
        console.warn(`Error with selector ${selector}:`, error);
        continue;
      }
    }

    return this.createEmptyField('Availability not found');
  }

  private extractDimensions($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractSpecification($, 'dimensions', ['abmessungen', 'maße', 'dimensions', 'size']);
  }

  private extractColor($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractSpecification($, 'color', ['farbe', 'colour', 'color']);
  }

  private extractMainMaterial($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractSpecification($, 'main_material', ['material', 'werkstoff', 'zusammensetzung']);
  }

  private extractSurface($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractSpecification($, 'surface', ['oberfläche', 'surface', 'finish']);
  }

  private extractWeightPerUnit($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractSpecification($, 'weight_per_unit', ['gewicht', 'weight', 'kg']);
  }

  private extractFireResistance($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractSpecification($, 'fire_resistance', ['brandschutz', 'fire resistance', 'feuerwiderstand']);
  }

  private extractThermalConductivity($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractSpecification($, 'thermal_conductivity', ['wärmeleitfähigkeit', 'thermal conductivity', 'lambda']);
  }

  private extractUValue($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractSpecification($, 'u_value', ['u-wert', 'u-value', 'wärmedurchgang']);
  }

  private extractSoundInsulation($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractSpecification($, 'sound_insulation', ['schallschutz', 'sound insulation', 'akustik']);
  }

  private extractWaterResistance($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractSpecification($, 'water_resistance', ['wasserschutz', 'water resistance', 'feuchtigkeit']);
  }

  private extractVaporDiffusion($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractSpecification($, 'vapor_diffusion', ['dampfdiffusion', 'vapor diffusion', 'μ']);
  }

  private extractInstallationType($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractSpecification($, 'installation_type', ['installation', 'montage', 'verlegung']);
  }

  private extractMaintenance($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractSpecification($, 'maintenance', ['wartung', 'maintenance', 'pflege']);
  }

  private extractEnvironmentCert($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractSpecification($, 'environment_cert', ['umwelt', 'environment', 'zertifikat']);
  }

  private extractDatasheetUrl($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractDocumentUrl($, 'datasheet_url', ['datenblatt', 'datasheet', 'pdf']);
  }

  private extractTechnicalSheetUrl($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractDocumentUrl($, 'technical_sheet_url', ['technisches blatt', 'technical sheet']);
  }

  private extractAdditionalDocumentsUrl($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractDocumentUrl($, 'additional_documents_url', ['dokumente', 'documents', 'unterlagen']);
  }

  private extractCatalogUrl($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.extractDocumentUrl($, 'catalog_url', ['katalog', 'catalog', 'prospekt']);
  }

  private extractProject($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.createEmptyField('Project field not applicable for web scraping');
  }

  private extractSampleOrdered($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.createEmptyField('Sample ordered field not applicable for web scraping');
  }

  private extractSampleStoredIn($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.createEmptyField('Sample stored in field not applicable for web scraping');
  }

  private extractRating($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    const selectors = [
      '.rating',
      '.stars',
      '.bewertung',
      '[class*="rating"]',
      '[class*="stars"]',
      '[class*="bewertung"]'
    ];

    for (const selector of selectors) {
      try {
        const element = this.safeSelector($, selector).first();
        if (element.length > 0) {
          const text = element.text().trim();
          const rating = this.parseRating(text);
          if (rating !== null) {
            return {
              value: rating.toString(),
              confidence: 0.7,
              source: 'web',
              reasoning: `Found using selector: ${selector}`
            };
          }
        }
      } catch (error) {
        console.warn(`Error with selector ${selector}:`, error);
        continue;
      }
    }

    return this.createEmptyField('Rating not found');
  }

  private extractNotes($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): FieldData {
    return this.createEmptyField('Notes field not applicable for web scraping');
  }

  private extractSpecification($: cheerio.CheerioAPI, fieldName: string, keywords: string[]): FieldData {
    // Search for text containing the keywords
    const textNodes = $('body').find('*').contents().filter(function() {
      return this.type === 'text' && (this as any).data && (this as any).data.trim().length > 0;
    });

    for (const node of textNodes.toArray()) {
      const text = (node as any).data.trim();
      for (const keyword of keywords) {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          // Look for the value after the keyword
          const regex = new RegExp(`${keyword}[\\s:]*([^\\n\\r]+)`, 'i');
          const match = text.match(regex);
          if (match && match[1]) {
            const value = match[1].trim();
            if (value.length > 0 && value.length < 200) {
              return {
                value: value,
                confidence: 0.6,
                source: 'web',
                reasoning: `Found ${fieldName} using keyword: ${keyword}`
              };
            }
          }
        }
      }
    }

    return this.createEmptyField(`${fieldName} not found using keywords: ${keywords.join(', ')}`);
  }

  private extractDocumentUrl($: cheerio.CheerioAPI, fieldName: string, keywords: string[]): FieldData {
    const links = $('a[href]');
    
    for (const link of links.toArray()) {
      const href = $(link).attr('href');
      const text = $(link).text().trim();
      
      if (href && text) {
        for (const keyword of keywords) {
          if (text.toLowerCase().includes(keyword.toLowerCase()) || 
              href.toLowerCase().includes(keyword.toLowerCase())) {
            return {
              value: href,
              confidence: 0.7,
              source: 'web',
              reasoning: `Found ${fieldName} using keyword: ${keyword}`
            };
          }
        }
      }
    }

    return this.createEmptyField(`${fieldName} not found using keywords: ${keywords.join(', ')}`);
  }

  private parsePrice(text: string): number | null {
    const priceRegex = /[\d,]+\.?\d*/g;
    const matches = text.match(priceRegex);
    if (matches && matches.length > 0) {
      const priceStr = matches[0].replace(',', '');
      const price = parseFloat(priceStr);
      return isNaN(price) ? null : price;
    }
    return null;
  }

  private parseRating(text: string): number | null {
    const ratingRegex = /(\d+(?:\.\d+)?)/g;
    const matches = text.match(ratingRegex);
    if (matches && matches.length > 0) {
      const rating = parseFloat(matches[0]);
      return isNaN(rating) ? null : rating;
    }
    return null;
  }

  private createEmptyField(reasoning: string): FieldData {
    return {
      value: '',
      confidence: 0,
      source: 'web',
      reasoning: reasoning
    };
  }

  private calculateConfidence($: cheerio.CheerioAPI, sourceType?: 'manufacturer' | 'reseller'): Record<string, number> {
    const scores: Record<string, number> = {};
    
    // Calculate confidence based on presence of elements
    const elements = [
      'h1', '.product-title', '.product-name',
      '.price', '.manufacturer', '.description'
    ];
    
    let totalScore = 0;
    for (const element of elements) {
      try {
        const count = this.safeSelector($, element).length;
        if (count > 0) {
          totalScore += 1;
        }
      } catch (error) {
        // Ignore selector errors
      }
    }
    
    const baseConfidence = totalScore / elements.length;
    
    // Adjust confidence based on source type
    const adjustedConfidence = sourceType === 'manufacturer' ? 
      Math.min(0.95, baseConfidence + 0.1) : 
      Math.min(0.85, baseConfidence);
    
    return {
      overall: adjustedConfidence,
      product_name: adjustedConfidence,
      manufacturer: adjustedConfidence,
      price: adjustedConfidence,
      description: adjustedConfidence
    };
  }

  private handleError(error: unknown): WebScrapingResult {
    console.error('Web scraping error:', error);
    
    const emptyField = this.createEmptyField(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      product_name: emptyField,
      manufacturer: emptyField,
      series: emptyField,
      product_code: emptyField,
      application_area: emptyField,
      description: emptyField,
      manufacturer_url: emptyField,
      manufacturer_product_url: emptyField,
      retailer_name: emptyField,
      retailer_url: emptyField,
      product_page_url: emptyField,
      price: emptyField,
      unit: emptyField,
      price_per_unit: emptyField,
      availability: emptyField,
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
      datasheet_url: emptyField,
      technical_sheet_url: emptyField,
      additional_documents_url: emptyField,
      catalog_url: emptyField,
      project: emptyField,
      sample_ordered: emptyField,
      sample_stored_in: emptyField,
      rating: emptyField,
      notes: emptyField,
      confidence_scores: {
        overall: 0,
        product_name: 0,
        manufacturer: 0,
        price: 0,
        description: 0
      }
    };
  }
} 