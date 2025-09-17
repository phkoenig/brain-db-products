/**
 * URN Processor for APS Model Derivative API
 * Handles conversion of ACC URNs to APS-compatible format
 */

export class UrnProcessor {
  /**
   * Process ACC URN for APS Model Derivative API
   * Converts region and Base64 encodes (no query parameters for lineage URNs)
   */
  static processDerivativeUrn(accUrn: string): string {
    console.log(`🔍 URN Processor: Processing ACC URN: ${accUrn}`);
    
    // Step 1: Convert region (wipemea -> wipprod)
    const regionConverted = this.convertRegion(accUrn);
    console.log(`🔍 URN Processor: Region converted: ${regionConverted}`);
    
    // Step 2: For lineage URNs, no query parameters needed
    // Lineage URNs are automatically translated and ready for viewing
    const queryFixed = regionConverted;
    console.log(`🔍 URN Processor: Query parameters preserved: ${queryFixed}`);
    
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
   * Keep ?version= format for Model Derivative API
   */
  private static fixQueryParameters(urn: string): string {
    // Keep the original ?version= format - Model Derivative API requires it
    return urn;
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
      /^urn:adsk\.wipprod:fs\.file:vf\..*\?version=\d+$/,
      /^urn:adsk\.wipprod:fs\.file:vf\..*$/
    ];
    
    return validPatterns.some(pattern => pattern.test(urn));
  }

  /**
   * Get clean URN without query parameters (for backward compatibility)
   */
  static getCleanUrn(urn: string): string {
    return urn.split('?')[0];
  }
}
