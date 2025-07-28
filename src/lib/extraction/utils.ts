/**
 * Utility functions for the extraction process
 */

/**
 * Convert an image URL to base64 string
 * @param imageUrl - The URL of the image to convert
 * @returns Promise<string> - Base64 encoded image data
 */
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to convert image to base64');
  }
}

/**
 * Validate if a string is a valid URL
 * @param url - The URL to validate
 * @returns boolean - True if valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL for logging and identification
 * @param url - The URL to extract domain from
 * @returns string - The domain name
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * Sanitize text for AI analysis
 * @param text - The text to sanitize
 * @returns string - Sanitized text
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s\-_\.\(\)]/g, '') // Remove special characters except allowed ones
    .substring(0, 1000); // Limit length for AI processing
}

/**
 * Format confidence score for display
 * @param confidence - Confidence score (0-1)
 * @returns string - Formatted percentage
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

/**
 * Get confidence level label
 * @param confidence - Confidence score (0-1)
 * @returns string - Confidence level label
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'Hoch';
  if (confidence >= 0.6) return 'Mittel';
  if (confidence >= 0.4) return 'Niedrig';
  return 'Sehr niedrig';
}

/**
 * Get confidence color for UI
 * @param confidence - Confidence score (0-1)
 * @returns string - CSS color class
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.6) return 'text-yellow-600';
  if (confidence >= 0.4) return 'text-orange-600';
  return 'text-red-600';
} 