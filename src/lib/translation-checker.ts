/**
 * Translation Checker for APS Model Derivative API
 * Handles checking translation status and finding correct URNs for translated files
 */

export interface TranslationStatus {
  isTranslated: boolean;
  status: 'success' | 'pending' | 'failed' | 'not_found' | 'unknown';
  translatedUrn?: string;
  originalUrn: string;
  manifestUrl?: string;
  error?: string;
  derivativeType?: string;
  manifestData?: any;
}

export interface DerivativeInfo {
  urn: string;
  type: string;
  status: 'success' | 'pending' | 'failed' | 'unknown';
  progress?: string;
}

export class TranslationChecker {
  /**
   * Normalize status string to valid TranslationStatus status
   */
  private static normalizeStatus(status: string): 'success' | 'pending' | 'failed' | 'not_found' | 'unknown' {
    switch (status?.toLowerCase()) {
      case 'success':
        return 'success';
      case 'pending':
        return 'pending';
      case 'failed':
        return 'failed';
      case 'not_found':
        return 'not_found';
      default:
        return 'unknown';
    }
  }

  /**
   * Normalize status string to valid DerivativeInfo status
   */
  private static normalizeDerivativeStatus(status: string): 'success' | 'pending' | 'failed' | 'unknown' {
    switch (status?.toLowerCase()) {
      case 'success':
        return 'success';
      case 'pending':
        return 'pending';
      case 'failed':
        return 'failed';
      default:
        return 'unknown';
    }
  }

  /**
   * Check if a file is already translated and get the correct URN
   * Uses Manifest-based approach to find derivatives
   */
  static async checkTranslationStatus(
    originalUrn: string, 
    token: string
  ): Promise<TranslationStatus> {
    console.log(`🔍 Translation Checker: Checking status for URN: ${originalUrn}`);
    
    try {
      // Step 1: Check if manifest exists for the original URN
      const manifestUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${originalUrn}/manifest`;
      console.log(`🔍 Translation Checker: Checking manifest: ${manifestUrl}`);
      
      const manifestResponse = await fetch(manifestUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (manifestResponse.ok) {
        const manifestData = await manifestResponse.json();
        console.log(`🔍 Translation Checker: Manifest found, status: ${manifestData.status}`);
        console.log(`🔍 Translation Checker: Manifest data:`, manifestData);
        
        // Step 2: Look for SVF/SVF2 derivatives in the manifest
        const derivatives = this.extractDerivativesFromManifest(manifestData);
        console.log(`🔍 Translation Checker: Found derivatives:`, derivatives);
        
        // Step 3: Find the best available derivative for viewing
        const bestDerivative = this.findBestViewingDerivative(derivatives);
        
        if (bestDerivative) {
          console.log(`🔍 Translation Checker: Best derivative found:`, bestDerivative);
          return {
            isTranslated: bestDerivative.status === 'success',
            status: bestDerivative.status,
            translatedUrn: bestDerivative.urn,
            originalUrn,
            manifestUrl,
            derivativeType: bestDerivative.type,
            manifestData
          };
        } else {
          console.log(`🔍 Translation Checker: No suitable derivative found in manifest`);
          return {
            isTranslated: false,
            status: this.normalizeStatus(manifestData.status),
            originalUrn,
            manifestUrl,
            manifestData,
            error: 'No suitable derivative found in manifest'
          };
        }
      }
      
      // Step 4: If no manifest exists, check if there's an automatic translation
      console.log(`🔍 Translation Checker: No manifest found, checking for automatic translation...`);
      
      // Try different URN patterns that APS might use for automatic translations
      const possibleUrns = this.generatePossibleTranslatedUrns(originalUrn);
      
      for (const possibleUrn of possibleUrns) {
        const possibleManifestUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${possibleUrn}/manifest`;
        console.log(`🔍 Translation Checker: Trying possible URN: ${possibleUrn}`);
        
        const possibleResponse = await fetch(possibleManifestUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (possibleResponse.ok) {
          const possibleData = await possibleResponse.json();
          console.log(`🔍 Translation Checker: Found manifest with possible URN: ${possibleUrn}`);
          
          const derivatives = this.extractDerivativesFromManifest(possibleData);
          const bestDerivative = this.findBestViewingDerivative(derivatives);
          
          if (bestDerivative) {
            console.log(`🔍 Translation Checker: Found translated file with URN: ${possibleUrn}, derivative: ${bestDerivative.type}`);
            return {
              isTranslated: bestDerivative.status === 'success',
              status: this.normalizeStatus(bestDerivative.status),
              translatedUrn: bestDerivative.urn,
              originalUrn,
              manifestUrl: possibleManifestUrl,
              derivativeType: bestDerivative.type,
              manifestData: possibleData
            };
          }
        }
      }
      
      // Step 5: No translation found
      console.log(`🔍 Translation Checker: No translation found for any URN pattern`);
      return {
        isTranslated: false,
        status: 'not_found',
        originalUrn,
        error: 'No translation found for this file'
      };
      
    } catch (error) {
      console.error(`🔍 Translation Checker: Error checking translation status:`, error);
      return {
        isTranslated: false,
        status: 'failed',
        originalUrn,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Extract derivatives from manifest data
   * Looks for SVF, SVF2, and other viewable formats
   */
  private static extractDerivativesFromManifest(manifestData: any): DerivativeInfo[] {
    const derivatives: DerivativeInfo[] = [];
    
    try {
      console.log(`🔍 Translation Checker: Extracting derivatives from manifest...`);
      
      // Check if manifest has derivatives
      if (manifestData.derivatives && Array.isArray(manifestData.derivatives)) {
        for (const derivative of manifestData.derivatives) {
          console.log(`🔍 Translation Checker: Processing derivative:`, derivative);
          
          if (derivative.outputType && derivative.urn) {
            derivatives.push({
              urn: derivative.urn,
              type: derivative.outputType,
              status: this.normalizeDerivativeStatus(derivative.status || 'unknown'),
              progress: derivative.progress
            });
          }
          
          // Check for nested derivatives (e.g., SVF with 2D/3D views)
          if (derivative.children && Array.isArray(derivative.children)) {
            for (const child of derivative.children) {
              if (child.outputType && child.urn) {
                derivatives.push({
                  urn: child.urn,
                  type: child.outputType,
                  status: this.normalizeDerivativeStatus(child.status || 'unknown'),
                  progress: child.progress
                });
              }
            }
          }
        }
      }
      
      // Also check for legacy manifest structure
      if (manifestData.urn && manifestData.outputType) {
        derivatives.push({
          urn: manifestData.urn,
          type: manifestData.outputType,
          status: manifestData.status || 'unknown',
          progress: manifestData.progress
        });
      }
      
      console.log(`🔍 Translation Checker: Extracted ${derivatives.length} derivatives`);
      
    } catch (error) {
      console.error(`🔍 Translation Checker: Error extracting derivatives:`, error);
    }
    
    return derivatives;
  }
  
  /**
   * Find the best derivative for viewing
   * Prioritizes SVF2 > SVF > other viewable formats
   */
  private static findBestViewingDerivative(derivatives: DerivativeInfo[]): DerivativeInfo | null {
    console.log(`🔍 Translation Checker: Finding best viewing derivative from ${derivatives.length} options`);
    
    // Priority order for viewing derivatives
    const priorityOrder = ['svf2', 'svf', 'f2d', 'thumbnail', 'pdf'];
    
    // First, try to find by priority order
    for (const priorityType of priorityOrder) {
      const derivative = derivatives.find(d => 
        d.type.toLowerCase() === priorityType && 
        d.status === 'success'
      );
      
      if (derivative) {
        console.log(`🔍 Translation Checker: Found priority derivative: ${derivative.type}`);
        return derivative;
      }
    }
    
    // If no success status found, return the first available derivative
    if (derivatives.length > 0) {
      console.log(`🔍 Translation Checker: No success derivative found, using first available: ${derivatives[0].type}`);
      return derivatives[0];
    }
    
    return null;
  }
  
  /**
   * Generate possible URN patterns for translated files
   * APS might use different URN patterns for automatic translations
   */
  private static generatePossibleTranslatedUrns(originalUrn: string): string[] {
    const possibleUrns: string[] = [];
    
    try {
      // Decode the original URN to work with it
      const decodedUrn = Buffer.from(originalUrn, 'base64').toString();
      console.log(`🔍 Translation Checker: Decoded original URN: ${decodedUrn}`);
      
      // Pattern 1: Remove version suffix
      if (decodedUrn.includes('_version=')) {
        const withoutVersion = decodedUrn.replace(/_version=\d+$/, '');
        possibleUrns.push(Buffer.from(withoutVersion).toString('base64'));
        console.log(`🔍 Translation Checker: Generated URN without version: ${withoutVersion}`);
      }
      
      // Pattern 2: Change region from wipprod to wipemea (or vice versa)
      if (decodedUrn.includes('wipprod')) {
        const withWipemea = decodedUrn.replace('wipprod', 'wipemea');
        possibleUrns.push(Buffer.from(withWipemea).toString('base64'));
        console.log(`🔍 Translation Checker: Generated URN with wipemea: ${withWipemea}`);
      } else if (decodedUrn.includes('wipemea')) {
        const withWipprod = decodedUrn.replace('wipemea', 'wipprod');
        possibleUrns.push(Buffer.from(withWipprod).toString('base64'));
        console.log(`🔍 Translation Checker: Generated URN with wipprod: ${withWipprod}`);
      }
      
      // Pattern 3: Remove query parameters entirely
      const withoutQuery = decodedUrn.split('?')[0];
      if (withoutQuery !== decodedUrn) {
        possibleUrns.push(Buffer.from(withoutQuery).toString('base64'));
        console.log(`🔍 Translation Checker: Generated URN without query: ${withoutQuery}`);
      }
      
      // Pattern 4: Change file type suffix (e.g., .ifc to .svf)
      if (decodedUrn.includes('.ifc')) {
        const withSvf = decodedUrn.replace('.ifc', '.svf');
        possibleUrns.push(Buffer.from(withSvf).toString('base64'));
        console.log(`🔍 Translation Checker: Generated URN with .svf: ${withSvf}`);
      }
      
      // Pattern 5: Add translation suffix
      const withTranslationSuffix = decodedUrn + '_translated';
      possibleUrns.push(Buffer.from(withTranslationSuffix).toString('base64'));
      console.log(`🔍 Translation Checker: Generated URN with translation suffix: ${withTranslationSuffix}`);
      
    } catch (error) {
      console.error(`🔍 Translation Checker: Error generating possible URNs:`, error);
    }
    
    console.log(`🔍 Translation Checker: Generated ${possibleUrns.length} possible URNs`);
    return possibleUrns;
  }
  
  /**
   * Get translation job status
   */
  static async getTranslationJobStatus(
    jobUrn: string, 
    token: string
  ): Promise<{ status: string; progress?: string }> {
    try {
      const statusUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${jobUrn}/manifest`;
      const response = await fetch(statusUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          status: data.status,
          progress: data.progress
        };
      }
      
      return { status: 'unknown' };
    } catch (error) {
      console.error(`🔍 Translation Checker: Error getting job status:`, error);
      return { status: 'error' };
    }
  }
  
  /**
   * Start a translation job if needed
   */
  static async startTranslationJob(
    urn: string, 
    token: string
  ): Promise<{ success: boolean; jobUrn?: string; error?: string }> {
    try {
      const jobBody = {
        input: { urn },
        output: {
          formats: [
            {
              type: "svf",
              views: ["2d", "3d"]
            }
          ]
        }
      };
      
      const response = await fetch('https://developer.api.autodesk.com/modelderivative/v2/designdata/job', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-ads-force': 'true'
        },
        body: JSON.stringify(jobBody)
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          jobUrn: data.urn
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: errorText
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
