// ACC Derivative Finder
// Finds automatically translated derivatives (SVF/SVF2) for ACC files

export interface DerivativeInfo {
  urn: string;
  type: string;
  status: 'success' | 'pending' | 'failed' | 'unknown';
  progress?: number;
}

export interface ManifestInfo {
  isTranslated: boolean;
  status: 'success' | 'pending' | 'failed' | 'not_found' | 'unknown';
  derivatives: DerivativeInfo[];
  bestViewingDerivative?: DerivativeInfo;
  originalUrn: string;
  manifestUrl: string;
  error?: string;
}

export class ACCDerivativeFinder {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * Find derivatives for an ACC item using the correct workflow
   */
  async findDerivatives(projectId: string, itemId: string): Promise<ManifestInfo> {
    console.log('🔍 ACC Derivative Finder: Starting search...');
    console.log(`Project ID: ${projectId}`);
    console.log(`Item ID: ${itemId}`);

    try {
      // Step 1: Get item details from ACC Data Management API
      const itemDetails = await this.getItemDetails(projectId, itemId);
      console.log('✅ Item details retrieved');

      // Step 2: Get version URN from derivatives relationship
      const versionUrn = await this.getVersionUrnFromDerivatives(projectId, itemId);
      if (!versionUrn) {
        console.log('❌ No version URN found in derivatives relationship');
        return {
          isTranslated: false,
          status: 'not_found',
          derivatives: [],
          originalUrn: '',
          manifestUrl: '',
          error: 'No version URN found in derivatives relationship'
        };
      }

      console.log(`✅ Version URN found: ${versionUrn}`);

      // Step 3: Use derivatives.data.id directly as viewer URN (NO MANIFEST QUERY!)
      // The derivatives.data.id is already the correct URN for the APS Viewer!
      console.log(`✅ Using derivatives.data.id directly as viewer URN: ${versionUrn}`);
      
      return {
        isTranslated: true,
        status: 'success',
        derivatives: [{
          urn: versionUrn,
          type: 'derivatives',
          status: 'success'
        }],
        bestViewingDerivative: {
          urn: versionUrn,
          type: 'derivatives',
          status: 'success'
        },
        originalUrn: versionUrn,
        manifestUrl: `https://developer.api.autodesk.com/modelderivative/v2/designdata/${versionUrn}/manifest`
      };

    } catch (error) {
      console.error('❌ Error finding derivatives:', error);
      return {
        isTranslated: false,
        status: 'failed',
        derivatives: [],
        originalUrn: '',
        manifestUrl: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get item details from ACC Data Management API
   */
  private async getItemDetails(projectId: string, itemId: string): Promise<any> {
    const url = `https://developer.api.autodesk.com/data/v1/projects/${projectId}/items/${itemId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get item details: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get version URN from derivatives relationship
   * This is the key step - we need to find the derivatives.data.id
   */
  private async getVersionUrnFromDerivatives(projectId: string, itemId: string): Promise<string | null> {
    console.log('🔍 Looking for derivatives relationship...');

    // Get item details with included versions to find derivatives
    try {
      const itemDetailsUrl = `https://developer.api.autodesk.com/data/v1/projects/${projectId}/items/${itemId}?include=versions`;
      const response = await fetch(itemDetailsUrl, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const itemData = await response.json();
        console.log('✅ Item details with versions response received');
        
        // Look for versions in included data - ROBUST ITERATION
        if (itemData.included && itemData.included.length > 0) {
          console.log(`🔍 Checking ${itemData.included.length} included items for versions with derivatives...`);
          
          for (const included of itemData.included) {
            console.log(`🔍 Checking included item type: ${included.type}`);
            
            if (included.type === 'versions') {
              console.log(`🔍 Found version: ${included.id}`);
              
              if (included.relationships && included.relationships.derivatives) {
                console.log(`🔍 Version has derivatives relationship`);
                
                const derivatives = included.relationships.derivatives.data;
                console.log(`🔍 Derivatives data:`, JSON.stringify(derivatives, null, 2));
                
                // Check if derivatives.data is an object (not an array)
                if (derivatives && derivatives.id) {
                  console.log(`✅ Found derivative ID in version: ${derivatives.id}`);
                  console.log(`✅ Derivative type: ${derivatives.type}`);
                  return derivatives.id;
                } else if (derivatives && Array.isArray(derivatives) && derivatives.length > 0) {
                  // Fallback: Check if it's an array
                  for (const derivative of derivatives) {
                    if (derivative.id) {
                      console.log(`✅ Found derivative ID in version: ${derivative.id}`);
                      console.log(`✅ Derivative type: ${derivative.type}`);
                      return derivative.id;
                    }
                  }
                } else {
                  console.log(`⚠️ Derivatives data is empty or invalid for version: ${included.id}`);
                }
              } else {
                console.log(`⚠️ Version has no derivatives relationship: ${included.id}`);
              }
            }
          }
        } else {
          console.log(`⚠️ No included items found in response`);
        }
      } else {
        console.log(`❌ Item details request failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log('⚠️ Item details with versions failed:', error);
    }

    // Fallback: Get versions directly
    try {
      console.log('🔍 Fallback: Getting versions directly...');
      const versionsUrl = `https://developer.api.autodesk.com/data/v1/projects/${projectId}/items/${itemId}/versions`;
      const response = await fetch(versionsUrl, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const versionsData = await response.json();
        console.log(`✅ Versions response received with ${versionsData.data?.length || 0} versions`);
        
        // Look for derivatives relationship in versions - ROBUST ITERATION
        if (versionsData.data && versionsData.data.length > 0) {
          for (const version of versionsData.data) {
            console.log(`🔍 Checking version: ${version.id}`);
            
            if (version.relationships && version.relationships.derivatives) {
              console.log(`🔍 Version has derivatives relationship`);
              
              const derivatives = version.relationships.derivatives.data;
              console.log(`🔍 Derivatives data:`, JSON.stringify(derivatives, null, 2));
              
              // Check if derivatives.data is an object (not an array)
              if (derivatives && derivatives.id) {
                console.log(`✅ Found derivative ID in version: ${derivatives.id}`);
                console.log(`✅ Derivative type: ${derivatives.type}`);
                return derivatives.id;
              } else if (derivatives && Array.isArray(derivatives) && derivatives.length > 0) {
                // Fallback: Check if it's an array
                for (const derivative of derivatives) {
                  if (derivative.id) {
                    console.log(`✅ Found derivative ID in version: ${derivative.id}`);
                    console.log(`✅ Derivative type: ${derivative.type}`);
                    return derivative.id;
                  }
                }
              } else {
                console.log(`⚠️ Derivatives data is empty or invalid for version: ${version.id}`);
              }
            } else {
              console.log(`⚠️ Version has no derivatives relationship: ${version.id}`);
            }
          }
        } else {
          console.log(`⚠️ No versions found in response`);
        }
      } else {
        console.log(`❌ Versions request failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log('⚠️ Versions endpoint failed:', error);
    }

    console.log('❌ No derivative ID found in any version');
    return null;
  }
}
