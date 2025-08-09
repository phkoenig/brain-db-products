// APS Configuration
const APS_CLIENT_ID = process.env.APS_CLIENT_ID;
const APS_CLIENT_SECRET = process.env.APS_CLIENT_SECRET;
const APS_BASE_URL = 'https://developer.api.autodesk.com';

export interface APSBucket {
  bucketKey: string;
  bucketOwner: string;
  createdDate: number;
  permissions: any[];
  policyKey: string;
}

export interface APSObject {
  bucketKey: string;
  objectKey: string;
  objectId: string;
  sha1: string;
  size: number;
  location: string;
}

export class APSService {
  private static async getToken(): Promise<string> {
    try {
      console.log('🔍 APS: Getting token...');
      
      const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-ads-region': 'EMEA'
        },
        body: new URLSearchParams({
          client_id: process.env.APS_CLIENT_ID!,
          client_secret: process.env.APS_CLIENT_SECRET!,
          grant_type: 'client_credentials',
          scope: 'data:read data:write bucket:create bucket:read bucket:delete code:all viewables:read'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 APS: Token request failed:', errorText);
        throw new Error(`Token request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 APS: Token received successfully');
      
      return data.access_token;
    } catch (error) {
      console.error('🔍 APS: getToken error:', error);
      throw error;
    }
  }

  // Public method to get token for external use
  static async getAccessToken(): Promise<string> {
    return await this.getToken();
  }

  static async createBucket(bucketKey: string, policyKey: 'transient' | 'temporary' | 'persistent' = 'transient'): Promise<APSBucket> {
    try {
      const token = await this.getToken();
      
      const response = await fetch(`${APS_BASE_URL}/oss/v2/buckets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ads-region': 'EMEA', // This is the key fix from Autodesk Support!
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bucketKey,
          policyKey
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('APS Bucket creation error:', response.status, errorText);
        throw new Error(`Failed to create bucket: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('APS createBucket error:', error);
      throw error;
    }
  }

  static async listBuckets(): Promise<APSBucket[]> {
    try {
      const token = await this.getToken();
      
      const response = await fetch(`${APS_BASE_URL}/oss/v2/buckets`, {
        method: 'GET',
        headers: {
          'x-ads-region': 'EMEA',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list buckets: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('APS listBuckets error:', error);
      throw error;
    }
  }

  static async uploadObject(bucketKey: string, objectKey: string, file: File): Promise<APSObject> {
    try {
      const token = await this.getToken();
      
      // Step 1: Get signed URL for upload
      const signedUrlResponse = await fetch(`${APS_BASE_URL}/oss/v2/buckets/${bucketKey}/objects/${objectKey}/signeds3upload`, {
        method: 'GET',
        headers: {
          'x-ads-region': 'EMEA',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!signedUrlResponse.ok) {
        const errorText = await signedUrlResponse.text();
        console.error('APS signed URL response error:', errorText);
        throw new Error(`Failed to get signed URL: ${signedUrlResponse.status} - ${errorText}`);
      }

      const signedUrlData = await signedUrlResponse.json();
      console.log('APS signed URL data:', signedUrlData);

      // The response should contain a signed URL, not just an uploadKey
      if (!signedUrlData.urls || !signedUrlData.urls[0]) {
        throw new Error('No signed URL found in response');
      }

      const signedUrl = signedUrlData.urls[0];
      console.log('APS using signed URL:', signedUrl);

      // Step 2: Upload file to signed URL
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: file
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('APS upload to signed URL error:', errorText);
        throw new Error(`Failed to upload to signed URL: ${uploadResponse.status} - ${errorText}`);
      }

      // Step 3: Complete the upload
      const completeResponse = await fetch(`${APS_BASE_URL}/oss/v2/buckets/${bucketKey}/objects/${objectKey}/signeds3upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ads-region': 'EMEA',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          uploadKey: signedUrlData.uploadKey
        })
      });

      if (!completeResponse.ok) {
        const errorText = await completeResponse.text();
        console.error('APS complete upload error:', errorText);
        throw new Error(`Failed to complete upload: ${completeResponse.status} - ${errorText}`);
      }

      const result = await completeResponse.json();
      console.log('APS upload successful:', result);
      
      return result;
    } catch (error) {
      console.error('APS uploadObject error:', error);
      throw error;
    }
  }

  static async getObjectDetails(bucketKey: string, objectKey: string): Promise<APSObject> {
    try {
      const token = await this.getToken();
      
      const response = await fetch(`${APS_BASE_URL}/oss/v2/buckets/${bucketKey}/objects/${objectKey}/details`, {
        method: 'GET',
        headers: {
          'x-ads-region': 'EMEA',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get object details: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('APS getObjectDetails error:', error);
      throw error;
    }
  }

  static async deleteObject(bucketKey: string, objectKey: string): Promise<void> {
    try {
      const token = await this.getToken();
      
      const response = await fetch(`${APS_BASE_URL}/oss/v2/buckets/${bucketKey}/objects/${objectKey}`, {
        method: 'DELETE',
        headers: {
          'x-ads-region': 'EMEA',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete object: ${response.status}`);
      }
    } catch (error) {
      console.error('APS deleteObject error:', error);
      throw error;
    }
  }

  static async deleteBucket(bucketKey: string): Promise<void> {
    try {
      const token = await this.getToken();
      
      const response = await fetch(`${APS_BASE_URL}/oss/v2/buckets/${bucketKey}`, {
        method: 'DELETE',
        headers: {
          'x-ads-region': 'EMEA',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete bucket: ${response.status}`);
      }
    } catch (error) {
      console.error('APS deleteBucket error:', error);
      throw error;
    }
  }

  static async getTranslationStatus(urn: string): Promise<any> {
    try {
      const token = await this.getToken();
      
      console.log('🔍 APS: Checking translation status for URN:', urn);
      
      const response = await fetch(`${APS_BASE_URL}/modelderivative/v2/designdata/${urn}/manifest`, {
        method: 'GET',
        headers: {
          'x-ads-region': 'EMEA',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('🔍 APS: Translation not found (404)');
          return { status: 'n/a', progress: '', messages: [], manifest: null };
        }
        const errorText = await response.text();
        console.error('🔍 APS: Translation status error:', errorText);
        throw new Error(`Failed to get translation status: ${response.status} - ${errorText}`);
      }

      const manifest = await response.json();
      console.log('🔍 APS: Translation manifest:', manifest);

      // Extract messages from derivatives
      let messages: string[] = [];
      if (manifest.derivatives) {
        for (const derivative of manifest.derivatives) {
          if (derivative.messages) {
            messages = messages.concat(derivative.messages.map((msg: any) => msg.message));
          }
          if (derivative.children) {
            for (const child of derivative.children) {
              if (child.messages) {
                messages = messages.concat(child.messages.map((msg: any) => msg.message));
              }
            }
          }
        }
      }

      return {
        status: manifest.status,
        progress: manifest.progress,
        messages: messages,
        manifest: manifest // Return the full manifest for frontend processing
      };

    } catch (error) {
      console.error('🔍 APS: getTranslationStatus error:', error);
      throw error;
    }
  }

  static async startTranslation(urn: string, force: boolean = false): Promise<any> {
    try {
      const token = await this.getToken();
      
      console.log('🔍 APS: Starting translation for URN:', urn, 'force:', force);
      
      // Check if URN is properly URL-safe Base64 encoded
      const isUrlSafeBase64 = /^[A-Za-z0-9_-]+$/.test(urn);
      console.log('🔍 APS: URN URL-safe Base64 check:', isUrlSafeBase64);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
  
      // Add force flag if requested
      if (force) {
        headers['x-ads-force'] = 'true';
        console.log('🔍 APS: Using x-ads-force: true flag');
      }
      
      // Use a simpler, more reliable output format for DWG files
      const outputFormats = [{
        type: 'svf2',
        views: ['2d', '3d']
      }];
      
      console.log('🔍 APS: Using output formats:', outputFormats);
      console.log('🔍 APS: Request body:', JSON.stringify({
        input: { urn },
        output: { formats: outputFormats }
      }));
      
      const response = await fetch(`${APS_BASE_URL}/modelderivative/v2/designdata/job`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          input: {
            urn: urn
          },
          output: {
            formats: outputFormats
          }
        })
      });
  
      console.log('🔍 APS: Response status:', response.status);
      console.log('🔍 APS: Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 APS: Start translation error:', errorText);
        console.error('🔍 APS: Response status:', response.status);
        console.error('🔍 APS: Response headers:', Object.fromEntries(response.headers.entries()));
        throw new Error(`Failed to start translation: ${response.status} - ${errorText}`);
      }
  
      const result = await response.json();
      console.log('🔍 APS: Translation started:', result);
      
      return result;
  
    } catch (error) {
      console.error('🔍 APS: startTranslation error:', error);
      throw error;
    }
  }
}
