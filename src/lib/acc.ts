// Autodesk Construction Cloud (ACC) Service
// Verwendet die gleiche OAuth2-Authentifizierung wie APS

import { ACCOAuthService } from './acc-oauth';

export interface ACCProject {
  id: string;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
  projectType?: string;
  value?: number;
  currency?: string;
}

export interface ACCItem {
  id: string;
  name: string;
  type: 'items:autodesk.core:File' | 'items:autodesk.core:Folder';
  displayName: string;
  createTime: string;
  createUserId: string;
  createUserName: string;
  lastModifiedTime: string;
  lastModifiedUserId: string;
  lastModifiedUserName: string;
  versionNumber: number;
  hidden: boolean;
  reserved: boolean;
  reservedTime: string;
  reservedUserId: string;
  reservedUserName: string;
  pathInProject: string;
  size: number;
  extension: {
    type: string;
    version: string;
    schema: {
      href: string;
    };
    data: any;
  };
  attributes?: {
    displayName: string;
    extension: string;
  };
}

export interface ACCFolder {
  id: string;
  name: string;
  displayName: string;
  createTime: string;
  createUserId: string;
  createUserName: string;
  lastModifiedTime: string;
  lastModifiedUserId: string;
  lastModifiedUserName: string;
  hidden: boolean;
  reserved: boolean;
  reservedTime: string;
  reservedUserId: string;
  reservedUserName: string;
  pathInProject: string;
  extension: {
    type: string;
    version: string;
    schema: {
      href: string;
    };
    data: any;
  };
}

export class ACCService {
  private static tokenCache: { token: string; expiresAt: number } | null = null;
  
  // Account ID from ACC Custom Integration
  private static readonly ACC_ACCOUNT_ID = '969ae436-36e7-4a4b-8744-298cf384974a';
  
  // Updated base URL for construction admin API
  private static readonly ACC_BASE_URL = 'https://developer.api.autodesk.com/construction/admin/v1';

  static async getToken(): Promise<string> {
    try {
      // Use 3-legged OAuth for Data Management API
      return await ACCOAuthService.getAccessToken();
    } catch (error) {
      console.error('🔍 ACC: 3-legged OAuth failed, falling back to 2-legged:', error);
      
      // Fallback to 2-legged OAuth for admin operations
      return await this.get2LeggedToken();
    }
  }

  private static async get2LeggedToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.token;
    }

    console.log('🔍 ACC: Getting 2-legged OAuth token (fallback)...');
    
    const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-ads-region': 'EMEA'
      },
      body: new URLSearchParams({
        client_id: process.env.APS_WEB_APP_CLIENT_ID!,
        client_secret: process.env.APS_WEB_APP_CLIENT_SECRET!,
        grant_type: 'client_credentials',
        scope: 'data:read data:write bucket:create bucket:read bucket:delete account:read user-profile:read'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 ACC: Token request failed:', errorText);
      throw new Error(`ACC Token request failed: ${response.status} - ${errorText}`);
    }

    const tokenData = await response.json();
    const token = tokenData.access_token;
    
    // Cache token for 50 minutes (tokens expire after 1 hour)
    this.tokenCache = {
      token,
      expiresAt: Date.now() + (50 * 60 * 1000)
    };

    console.log('🔍 ACC: 2-legged token received successfully (fallback)');
    return token;
  }

  static async getProjects(): Promise<ACCProject[]> {
    const token = await this.getToken();
    console.log('🔍 ACC: Fetching projects...');

    // Use the correct endpoint with account ID
    const url = `${this.ACC_BASE_URL}/accounts/${this.ACC_ACCOUNT_ID}/projects`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-ads-region': 'EMEA'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 ACC: Projects request failed:', errorText);
      
      if (response.status === 404) {
        console.error('🔍 ACC: 404 Error - Endpoint nicht gefunden. Mögliche Ursachen:');
        console.error('🔍 ACC: 1. Falsche API-Version');
        console.error('🔍 ACC: 2. Fehlende Berechtigungen');
        console.error('🔍 ACC: 3. Falsche Region');
        console.error('🔍 ACC: 4. ACC-Projekte nicht verfügbar');
      }
      
      throw new Error(`ACC Projects request failed: ${response.status} - ${errorText}`);
    }

    const projectsData = await response.json();
    console.log('🔍 ACC: Projects data received:', projectsData);
    
    return projectsData.data || projectsData.results || [];
  }

  static async getProject(projectId: string): Promise<ACCProject> {
    const token = await this.getToken();
    console.log('🔍 ACC: Fetching project details...');

    const url = `${this.ACC_BASE_URL}/accounts/${this.ACC_ACCOUNT_ID}/projects/${projectId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-ads-region': 'EMEA'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 ACC: Project details request failed:', errorText);
      throw new Error(`ACC Project details request failed: ${response.status} - ${errorText}`);
    }

    const projectData = await response.json();
    console.log('🔍 ACC: Project details received:', projectData);
    
    return projectData;
  }

  static async getProjectContents(projectId: string, folderId?: string): Promise<{ folders: ACCFolder[], items: ACCItem[] }> {
    const token = await this.getToken();
    
    // KORREKTE API: Data Management API v1 (nicht v2!)
    // Perplexity-Lösung: Nur Data Management API erlaubt Zugriff auf ACC-Projektinhalte
    const dataManagementUrl = 'https://developer.api.autodesk.com/data/v1';
    
    // KORREKTES URN-FORMAT für ACC: b.{GUID} (Perplexity-Research)
    // Das "b."-Präfix ist MANDATORISCH für ACC-Projekte!
    const formattedProjectId = projectId.startsWith('b.') ? projectId : `b.${projectId}`;
    let targetFolderId = folderId || 'root';
    
    // Wenn folderId 'root' ist, versuche zuerst die echte Root-Folder-ID zu bekommen
    if (targetFolderId === 'root') {
      try {
        console.log('🔍 ACC: Getting project details to find root folder ID...');
        
        // Versuche alle Hubs durchzugehen um das Projekt zu finden
        const hubsResponse = await fetch('https://developer.api.autodesk.com/project/v1/hubs', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (hubsResponse.ok) {
          const hubsData = await hubsResponse.json();
          
          for (const hub of hubsData.data || []) {
            const projectUrl = `https://developer.api.autodesk.com/project/v1/hubs/${hub.id}/projects/${formattedProjectId}`;
            console.log('🔍 ACC: Trying hub:', hub.attributes?.name, 'URL:', projectUrl);
            
            const projectResponse = await fetch(projectUrl, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (projectResponse.ok) {
              const projectData = await projectResponse.json();
              const rootFolderId = projectData.data?.relationships?.rootFolder?.data?.id;
              if (rootFolderId) {
                console.log('🔍 ACC: Found root folder ID:', rootFolderId);
                targetFolderId = rootFolderId;
                break; // Projekt gefunden, Schleife beenden
              }
            }
          }
        }
        
        if (targetFolderId === 'root') {
          console.log('⚠️ ACC: No root folder ID found, using "root"');
        }
      } catch (error) {
        console.log('⚠️ ACC: Could not get project details, using "root"');
      }
    }
    
    // Korrekter Data Management API v1 Endpoint mit "b."-Präfix
    const url = `${dataManagementUrl}/projects/${formattedProjectId}/folders/${targetFolderId}/contents`;
    
    console.log('🔍 ACC: Fetching project contents with Data Management API v1...');
    console.log('🔍 ACC: URL:', url);
    console.log('🔍 ACC: Project ID (with b. prefix):', formattedProjectId);
    console.log('🔍 ACC: Folder ID:', targetFolderId);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
        // Keine speziellen Headers nötig für Data Management API v1
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 ACC: Project contents request failed:', errorText);
      
      if (response.status === 400) {
        console.error('🔍 ACC: 400 Error - Mögliche Ursachen:');
        console.error('🔍 ACC: 1. Falsches Projekt-ID-Format (sollte b.{GUID} sein)');
        console.error('🔍 ACC: 2. Projekt-ID nicht korrekt');
        console.error('🔍 ACC: 3. Kein Zugriff auf das Projekt');
      } else if (response.status === 404) {
        console.error('🔍 ACC: 404 Error - Mögliche Ursachen:');
        console.error('🔍 ACC: 1. Projekt nicht gefunden');
        console.error('🔍 ACC: 2. Kein Zugriff auf "Docs"-Modul im Projekt');
        console.error('🔍 ACC: 3. Falsche Folder-ID - versuche /topFolders zuerst');
      }
      
      throw new Error(`ACC Project contents request failed: ${response.status} - ${errorText}`);
    }

    const contentsData = await response.json();
    console.log('🔍 ACC: Project contents retrieved successfully');
    
    return {
      folders: contentsData.data?.filter((item: any) => item.type === 'folders') || [],
      items: contentsData.data?.filter((item: any) => item.type === 'items') || []
    };
  }

  static async getItemDetails(projectId: string, itemId: string): Promise<ACCItem> {
    const token = await this.getToken();
    console.log('🔍 ACC: Fetching item details...');

    const url = `${this.ACC_BASE_URL}/accounts/${this.ACC_ACCOUNT_ID}/projects/${projectId}/items/${itemId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-ads-region': 'EMEA'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 ACC: Item details request failed:', errorText);
      throw new Error(`ACC Item details request failed: ${response.status} - ${errorText}`);
    }

    const itemData = await response.json();
    console.log('🔍 ACC: Item details received:', itemData);
    
    return itemData;
  }

  static generateViewerURN(itemId: string): string {
    // Generate URN for ACC items
    return `urn:adsk.wipprod:dm.lineage:${itemId}`;
  }

  static isViewerCompatible(item: ACCItem): boolean {
    const supportedExtensions = [
      '.dwg', '.rvt', '.ifc', '.nwd', '.nwc', '.3ds', '.obj', '.stl', '.fbx',
      '.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp'
    ];
    
    const extension = item.attributes?.displayName?.toLowerCase().split('.').pop();
    return supportedExtensions.includes(`.${extension}`);
  }

  static getFileStatus(item: ACCItem): { status: string; icon: string; description: string } {
    if (this.isViewerCompatible(item)) {
      return {
        status: 'viewer-ready',
        icon: '🟢',
        description: 'Direkt im Viewer anzeigbar'
      };
    }
    
    // Check if it's a CAD file that needs translation
    const cadExtensions = ['.dwg', '.rvt', '.ifc', '.nwd', '.nwc'];
    const extension = item.attributes?.displayName?.toLowerCase().split('.').pop();
    
    if (cadExtensions.includes(`.${extension}`)) {
      return {
        status: 'needs-translation',
        icon: '🔴',
        description: 'Translation nötig (~2€)'
      };
    }
    
    return {
      status: 'unknown',
      icon: '⚪',
      description: 'Format unbekannt'
    };
  }
}
