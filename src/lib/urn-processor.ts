/**
 * URN Processor for APS Model Derivative API
 * Handles conversion of ACC URNs to APS-compatible format
 */

export class UrnProcessor {
  /**
   * Process ACC URN for APS Model Derivative API
   * Converts region, fixes query parameters, and Base64 encodes
   */
  static processDerivativeUrn(accUrn: string): string {
    console.log(`🔍 URN Processor: Processing ACC URN: ${accUrn}`);
    
    // Step 1: Convert region (wipemea -> wipprod)
    const regionConverted = this.convertRegion(accUrn);
    console.log(`🔍 URN Processor: Region converted: ${regionConverted}`);
    
    // Step 2: Fix query parameters (?version=1 -> _version=1)
    const queryFixed = this.fixQueryParameters(regionConverted);
    console.log(`🔍 URN Processor: Query parameters fixed: ${queryFixed}`);
    
    // Step 3: Base64 encode
    const base64Encoded = this.base64Encode(queryFixed);
    console.log(`🔍 URN Processor: Base64 encoded: ${base64Encoded}`);
    
    return base64Encoded;
  }

  /**
   * Convert ACC region to APS region
   * wipemea -> wipprod
   */
  private static convertRegion(urn: string): string {
    return urn.replace('wipemea', 'wipprod');
  }

  /**
   * Fix query parameters for APS compatibility
   * ?version=1 -> _version=1
   */
  private static fixQueryParameters(urn: string): string {
    return urn.replace('?version=', '_version=');
  }

  /**
   * Base64 encode URN for APS API
   */
  private static base64Encode(urn: string): string {
    return Buffer.from(urn).toString('base64');
  }

  /**
   * Validate if URN is in correct format for APS
   */
  static validateUrn(urn: string): boolean {
    const validPatterns = [
      /^urn:adsk\.wipprod:fs\.file:vf\..*_version=\d+$/,
      /^urn:adsk\.wipprod:fs\.file:vf\..*$/
    ];
    
    return validPatterns.some(pattern => pattern.test(urn));
  }

  /**
   * Get clean URN without query parameters (for backward compatibility)
   */
  static getCleanUrn(urn: string): string {
    return urn.split('?')[0].split('_version=')[0];
  }
}
