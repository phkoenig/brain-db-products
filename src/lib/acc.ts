// Autodesk Construction Cloud (ACC) Service
// Verwendet die gleiche OAuth2-Authentifizierung wie APS

import { ACCOAuthService } from './acc-oauth';
import { supabase } from './supabase';
import { ACCProject } from '../types/products';
import { UrnProcessor } from './urn-processor';

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
  private static ACC_BASE_URL = 'https://developer.api.autodesk.com/construction/admin/v1';

  static async getToken(): Promise<string> {
    try {
      // First try to get shared token from database
      const sharedToken = await this.getSharedToken();
      if (sharedToken) {
        console.log('🔍 ACC: Using shared token from database');
        return sharedToken;
      }
      
      // Fallback to 3-legged OAuth if no shared token
      const token = await ACCOAuthService.getAccessToken();
      console.log('🔍 ACC: 3-legged OAuth token obtained successfully');
      return token;
    } catch (error) {
      console.error('🔍 ACC: Token retrieval failed:', error);
      throw new Error('ACC authentication failed. Please authenticate first.');
    }
  }

  /**
   * Get shared token from database (admin token for all users)
   */
  private static async getSharedToken(): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('acc_shared_tokens')
        .select('access_token, expires_at')
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.log('🔍 ACC: No shared token found in database');
        return null;
      }

      // Check if token is still valid
      if (Date.now() < new Date(data.expires_at).getTime()) {
        console.log('🔍 ACC: Shared token is valid');
        return data.access_token;
      } else {
        console.log('🔍 ACC: Shared token expired');
        return null;
      }
    } catch (error) {
      console.error('🔍 ACC: Error getting shared token:', error);
      return null;
    }
  }

  /**
   * Store shared token in database (admin token for all users)
   */
  static async storeSharedToken(tokens: any): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));
      
      const { error } = await supabase
        .from('acc_shared_tokens')
        .upsert({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt.toISOString(),
          is_active: true,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      console.log('🔍 ACC: Shared token stored in database');
    } catch (error) {
      console.error('🔍 ACC: Error storing shared token:', error);
      throw error;
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
        client_id: process.env.NEXT_PUBLIC_ACC_CLIENT_ID!,
        client_secret: process.env.ACC_CLIENT_SECRET!,
        grant_type: 'client_credentials',
        scope: 'data:read data:write bucket:create bucket:read bucket:delete viewables:read account:read'
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
    const token = await ACCOAuthService.getAccessToken();
    console.log('🔍 ACC: Fetching projects...');

    let allProjects: ACCProject[] = [];
    let offset = 0;
    const limit = 200; // Maximale Seitengröße für V1 API
    let hasMorePages = true;

    while (hasMorePages) {
      // Use the correct V1 endpoint with limit and offset pagination
      const url = `${this.ACC_BASE_URL}/accounts/${this.ACC_ACCOUNT_ID}/projects?limit=${limit}&offset=${offset}`;
      
      console.log(`🔍 ACC: Fetching projects with limit=${limit}, offset=${offset}...`);
      console.log(`🔍 ACC: URL: ${url}`);
      
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
      console.log(`🔍 ACC: Data received:`, projectsData);
      
      const pageProjects = projectsData.data || projectsData.results || [];
      allProjects = allProjects.concat(pageProjects);
      
      console.log(`🔍 ACC: Batch loaded: ${pageProjects.length} projects, total: ${allProjects.length}`);
      
      // Check if there are more pages
      if (pageProjects.length < limit) {
        hasMorePages = false;
        console.log('🔍 ACC: No more pages available');
      } else {
        offset += limit;
        // Safety check to prevent infinite loops
        if (offset > 4000) { // Erhöht auf 4000 (20 Seiten à 200)
          console.warn('🔍 ACC: Reached maximum offset limit (4000), stopping pagination');
          hasMorePages = false;
        }
      }
    }
    
    console.log(`🔍 ACC: Total projects loaded: ${allProjects.length}`);
    
    // Filter out archived projects
    const activeProjects = allProjects.filter((project: ACCProject) => {
      const status = project.status?.toLowerCase();
      return status !== 'archived' && status !== 'archive' && status !== 'closed';
    });
    
    console.log(`🔍 ACC: Filtered ${activeProjects.length} active projects from ${allProjects.length} total projects`);
    
    // Sort projects alphabetically by name
    const sortedProjects = activeProjects.sort((a: ACCProject, b: ACCProject) => {
      return a.name.localeCompare(b.name, 'de', { sensitivity: 'base' });
    });
    
    console.log('🔍 ACC: Projects sorted alphabetically');
    
    // Log first few projects for debugging
    console.log('🔍 ACC: First 10 projects:', sortedProjects.slice(0, 10).map(p => p.name));
    console.log('🔍 ACC: Last 10 projects:', sortedProjects.slice(-10).map(p => p.name));
    
    return sortedProjects;
  }

  static async getProject(projectId: string): Promise<ACCProject> {
    const token = await ACCOAuthService.getAccessToken();
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
    const token = await ACCOAuthService.getAccessToken();
    
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
    const token = await ACCOAuthService.getAccessToken();
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
    // Convert ACC URN to APS Viewer URN using the correct conversion logic
    return this.convertAccUrnToApsViewerUrn(itemId);
  }

  static convertAccUrnToApsViewerUrn(accUrn: string): string {
    // Step 1: Check and replace the region
    let apsUrn = accUrn.replace('wipemea', 'wipprod');

    // Step 2: Convert Lineage URN to Version URN if necessary
    const lineageUrnRegex = /^urn:adsk\.wip(prod|emea):dm\.lineage:([a-zA-Z0-9]+)\?version=(\d+)$/;
    if (lineageUrnRegex.test(apsUrn)) {
      // Extract the IDs
      const match = apsUrn.match(lineageUrnRegex);
      if (match) {
        const region = match[1];
        const lineageId = match[2];
        const version = match[3];
        // Build the correct Viewer URN - APS Viewer expects dm.lineage format!
        apsUrn = `urn:adsk.wipprod:dm.lineage:${lineageId}?version=${version}`;
      }
    }

    // Step 3: Ensure we have the correct production region
    if (apsUrn.includes('wipemea:')) {
      apsUrn = apsUrn.replace('wipemea:', 'wipprod:');
    }

    console.log(`🔍 ACC: URN converted: ${accUrn} → ${apsUrn}`);
    return apsUrn;
  }

  static urnToBase64(urn: string): string {
    // Remove 'urn:' prefix if present
    const plainUrn = urn.startsWith('urn:') ? urn.substring(4) : urn;
    // Base64-url-Encoding (replace +, /, =)
    return btoa(plainUrn)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  static async getVersionURN(itemId: string, projectId?: string): Promise<string> {
    console.log(`🔍 ACC getVersionURN: Called with itemId=${itemId}, projectId=${projectId}`);
    
    // For ACC files, we need to return the VERSION URN (fs.file:vf.) for APS Viewer
    // According to Perplexity AI, both Viewer and Translation need Version-URN, not Lineage-URN!
    try {
      // If we have a projectId and it's already a lineage URN, get the version URN
      if (projectId && itemId.includes('dm.lineage:')) {
        console.log(`🔍 ACC getVersionURN: Processing lineage URN with projectId`);
        const token = await ACCOAuthService.getAccessToken();
        
        // Get item details to find the version URN
        const itemDetailsUrl = `https://developer.api.autodesk.com/data/v1/projects/${projectId}/items/${itemId}`;
        
        console.log(`🔍 ACC: Getting item details for viewer URN: ${itemDetailsUrl}`);
        
        const itemResponse = await fetch(itemDetailsUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!itemResponse.ok) {
          throw new Error(`Failed to get item details: ${itemResponse.status}`);
        }

        const itemData = await itemResponse.json();
        console.log(`🔍 ACC: Item details received for viewer:`, itemData);

        // Get the tip version URN from the included versions
        if (itemData.included && itemData.included.length > 0) {
          const tipVersion = itemData.included.find((version: any) => 
            version.type === 'versions' && version.id.includes('fs.file:vf.')
          );
          
          if (tipVersion) {
            const versionUrn = tipVersion.id;
            console.log(`🔍 ACC: Using tip version URN for viewer: ${versionUrn}`);
            
            // Use UrnProcessor to get the correct APS-compatible URN
            console.log(`🔍 ACC getVersionURN: Calling UrnProcessor.processDerivativeUrn with: ${versionUrn}`);
            const apsUrn = UrnProcessor.processDerivativeUrn(versionUrn);
            console.log(`🔍 ACC: APS-compatible URN: ${apsUrn}`);
            
            return apsUrn;
          }
        }
      }
      
      // Fallback: if it's already a version URN, process it directly
      if (itemId.includes('fs.file:vf.')) {
        console.log(`🔍 ACC getVersionURN: Processing existing version URN: ${itemId}`);
        console.log(`🔍 ACC getVersionURN: Calling UrnProcessor.processDerivativeUrn with: ${itemId}`);
        return UrnProcessor.processDerivativeUrn(itemId);
      }
      
      // Final fallback: return the original itemId
      console.log(`🔍 ACC getVersionURN: Using original itemId as fallback: ${itemId}`);
      return itemId;
      
    } catch (error) {
      console.error('🔍 ACC: Error getting version URN:', error);
      // Fallback to original itemId
      return itemId;
    }
  }

  static async getTranslationURN(itemId: string, projectId?: string): Promise<string> {
    // For Translation Jobs, we need to return the VERSION URN (fs.file:vf.) for APS
    // The Translation API expects the version URN, not the design URN!
    try {
      // If we have a projectId and it's already a lineage URN, get the version URN
      if (projectId && itemId.includes('dm.lineage:')) {
        const token = await ACCOAuthService.getAccessToken();
        
        // Get item details to find the version URN
        const itemDetailsUrl = `https://developer.api.autodesk.com/data/v1/projects/${projectId}/items/${itemId}`;
        
        console.log(`🔍 ACC: Getting item details for translation URN: ${itemDetailsUrl}`);
        
        const itemResponse = await fetch(itemDetailsUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (itemResponse.ok) {
          const itemData = await itemResponse.json();
          console.log('🔍 ACC: Item details received for translation:', itemData);
          
          // Get the tip version URN - this is the correct URN for Translation Jobs
          const tipVersionId = itemData.data?.relationships?.tip?.data?.id;
          if (tipVersionId) {
            // Convert to APS Translation URN (version format)
            const translationUrn = this.convertAccUrnToApsTranslationUrn(tipVersionId);
            console.log(`🔍 ACC: Using tip version URN for translation: ${translationUrn}`);
            return translationUrn;
          }
          
          // Alternative: Get the first version if tip is not available
          const versions = itemData.data?.relationships?.versions?.data;
          if (versions && versions.length > 0) {
            const firstVersionId = versions[0].id;
            // Convert to APS Translation URN (version format)
            const translationUrn = this.convertAccUrnToApsTranslationUrn(firstVersionId);
            console.log(`🔍 ACC: Using first version URN for translation: ${translationUrn}`);
            return translationUrn;
          }
        }
      }
      
      // Fallback: convert the provided URN using the translation conversion
      const fallbackUrn = this.convertAccUrnToApsTranslationUrn(itemId);
      console.log(`🔍 ACC: Using fallback URN for translation: ${fallbackUrn}`);
      return fallbackUrn;
      
    } catch (error) {
      console.error('🔍 ACC: Error getting translation URN:', error);
      return this.convertAccUrnToApsTranslationUrn(itemId);
    }
  }

  static convertAccUrnToApsTranslationUrn(accUrn: string): string {
    // Step 1: Check and replace the region
    let apsUrn = accUrn.replace('wipemea', 'wipprod');

    // Step 2: Convert Lineage URN to Version URN for Translation Jobs
    const lineageUrnRegex = /^urn:adsk\.wip(prod|emea):dm\.lineage:([a-zA-Z0-9]+)\?version=(\d+)$/;
    if (lineageUrnRegex.test(apsUrn)) {
      // Extract the IDs
      const match = apsUrn.match(lineageUrnRegex);
      if (match) {
        const region = match[1];
        const lineageId = match[2];
        const version = match[3];
        // Build the correct Translation URN (Version format)
        apsUrn = `urn:adsk.wipprod:fs.file:vf.${lineageId}?version=${version}`;
      }
    }

    // Step 3: Ensure we have the correct production region
    if (apsUrn.includes('wipemea:')) {
      apsUrn = apsUrn.replace('wipemea:', 'wipprod:');
    }

    console.log(`🔍 ACC: URN converted for translation: ${accUrn} → ${apsUrn}`);
    return apsUrn;
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

  // Get top-level folders for a project
  static async getProjectTopFolders(projectId: string): Promise<any[]> {
    const token = await ACCOAuthService.getAccessToken();
    console.log(`🔍 ACC: Fetching top-level folders for project ${projectId}...`);

    // Convert Account ID to Hub ID (b. + accountId)
    const hubId = `b.${this.ACC_ACCOUNT_ID}`;
    
    const url = `https://developer.api.autodesk.com/project/v1/hubs/${hubId}/projects/${projectId}/topFolders`;
    
    console.log(`🔍 ACC: URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 ACC: Top-level folders request failed:', errorText);
      throw new Error(`ACC Top-level folders request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🔍 ACC: Top-level folders data received:', data);
    
    return data.data || [];
  }

  // Get folder contents
  static async getFolderContents(projectId: string, folderId: string): Promise<any[]> {
    const token = await ACCOAuthService.getAccessToken();
    console.log(`🔍 ACC: Fetching folder contents for project ${projectId}, folder ${folderId}...`);

    // Ensure projectId has the correct format for Data Management API
    const formattedProjectId = projectId.startsWith('b.') ? projectId : `b.${projectId}`;
    let targetFolderId = folderId;
    
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
    
    const url = `https://developer.api.autodesk.com/data/v1/projects/${formattedProjectId}/folders/${targetFolderId}/contents`;
    
    console.log(`🔍 ACC: URL: ${url}`);
    console.log(`🔍 ACC: Project ID (with b. prefix): ${formattedProjectId}`);
    console.log(`🔍 ACC: Folder ID: ${targetFolderId}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 ACC: Folder contents request failed:', errorText);
      
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
      
      throw new Error(`ACC Folder contents request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🔍 ACC: Folder contents data received:', data);
    
    return data.data || [];
  }

  // Get URN for a specific model path
  static async getModelURN(modelPath: string): Promise<string | null> {
    try {
      console.log('🔍 ACC: Getting URN for model path:', modelPath);
      
      // Parse the model path to extract project ID and item ID
      // Model path format: "b.{projectId}/items/{itemId}"
      const pathParts = modelPath.split('/');
      if (pathParts.length < 3 || pathParts[1] !== 'items') {
        throw new Error('Invalid model path format. Expected: b.{projectId}/items/{itemId}');
      }
      
      const projectId = pathParts[0];
      const itemId = pathParts[2];
      
      console.log('🔍 ACC: Parsed project ID:', projectId);
      console.log('🔍 ACC: Parsed item ID:', itemId);
      
      // Get the version URN for the item
      const versionUrn = await this.getVersionURN(itemId, projectId);
      console.log('🔍 ACC: Generated version URN:', versionUrn);
      
      return versionUrn;
      
    } catch (error) {
      console.error('🔍 ACC: Error getting model URN:', error);
      return null;
    }
  }

  // Get specific BIM model file from F16 project
  static async getF16BIMModel(): Promise<{ file: ACCItem; urn: string; token: string } | null> {
    try {
      console.log('🔍 ACC: Getting F16 BIM model...');
      console.log('🔍 ACC: Step 1: Getting access token...');
      
      const token = await ACCOAuthService.getAccessToken();
      console.log('🔍 ACC: Step 1 ✅: Access token obtained successfully');
      
      // Check if we have a saved model path in settings
      console.log('🔍 ACC: Step 1.5: Checking for saved model path...');
      try {
        const { data: settings } = await supabase
          .from('f16_settings')
          .select('model_path')
          .eq('project_id', 'f16')
          .single();
        
        if (settings?.model_path) {
          console.log('🔍 ACC: Step 1.5 ✅: Found saved model path:', settings.model_path);
          // TODO: Use saved path to directly load the model
          // For now, continue with the existing search logic
        } else {
          console.log('🔍 ACC: Step 1.5 ⚠️: No saved model path found, using search logic');
        }
      } catch (settingsError) {
        console.log('🔍 ACC: Step 1.5 ⚠️: Could not load settings, using search logic');
      }
      
      // First, get all projects to find F16 project
      console.log('🔍 ACC: Step 2: Getting projects via Data Management API...');
      const projects = await this.getProjectsDataManagement();
      console.log('🔍 ACC: Step 2 ✅: Projects loaded successfully');
      console.log('🔍 ACC: Available projects:', projects.map(p => p.name));
      
      const f16Project = projects.find(p => p.name.includes('F16') || p.name.includes('Fontaneallee'));
      
      if (!f16Project) {
        console.error('🔍 ACC: Step 2 ❌: F16 project not found. Available projects:', projects.map(p => p.name));
        return null;
      }
      
      console.log('🔍 ACC: Step 2 ✅: Found F16 project:', f16Project.name);
      console.log('🔍 ACC: F16 Project ID:', f16Project.id);
      
      // First, let's explore the root folder to see what's available
      console.log('🔍 ACC: Step 3: Exploring root folder...');
      const rootContents = await this.getFolderContents(f16Project.id, 'root');
      console.log('🔍 ACC: Step 3 ✅: Root folder contents loaded');
      console.log('🔍 ACC: Root folder contents:', rootContents.map(item => ({
        type: item.type,
        name: item.attributes?.name || item.attributes?.displayName,
        id: item.id
      })));
      
          // Try to find any folder that might contain BIM models
          console.log('🔍 ACC: Step 4: Searching for BIM model files...');
          let modelFiles: any[] = [];
          let searchPaths = [
            // Start with Project Files and explore recursively
            ['Project Files'],
            // Try the actual structure from the logs
            ['Project Files', 'BIM-Modell', '010 Architektur', 'Model'],
            ['Project Files', 'BIM-Modell'],
            // Try with ACCDocs prefix
            ['ACCDocs', 'ZEPTA', 'F16 Fontaneallee 16', 'Project Files', 'BIM-Modell', '010 Architektur', 'Model'],
            ['ACCDocs', 'ZEPTA', 'F16 Fontaneallee 16', 'Project Files', 'BIM-Modell'],
            ['ACCDocs', 'ZEPTA', 'F16 Fontaneallee 16', 'Project Files'],
            ['ACCDocs', 'ZEPTA', 'F16 Fontaneallee 16'],
            ['ACCDocs', 'ZEPTA'],
            ['ACCDocs'],
            // Try without ACCDocs prefix
            ['ZEPTA', 'F16 Fontaneallee 16', 'Project Files', 'BIM-Modell', '010 Architektur', 'Model'],
            ['ZEPTA', 'F16 Fontaneallee 16', 'Project Files', 'BIM-Modell'],
            ['ZEPTA', 'F16 Fontaneallee 16', 'Project Files'],
            ['ZEPTA', 'F16 Fontaneallee 16'],
            ['ZEPTA'],
            // Try direct search in root
            []
          ];
      console.log('🔍 ACC: Will search in', searchPaths.length, 'different paths');
      
      for (const pathSegments of searchPaths) {
        console.log(`🔍 ACC: Trying path: ${pathSegments.join(' > ') || 'root'}`);
        
        try {
          let currentFolderId = 'root';
          let found = true;
          
          // Navigate through each path segment
          for (const segment of pathSegments) {
            console.log(`🔍 ACC: Looking for folder: ${segment}`);
            
            const contents = await this.getFolderContents(f16Project.id, currentFolderId);
            console.log(`🔍 ACC: Contents in ${currentFolderId}:`, contents.map(item => ({
              type: item.type,
              name: item.attributes?.name || item.attributes?.displayName,
              id: item.id
            })));
            
            const folder = contents.find(item => 
              item.type === 'folders' && 
              (item.attributes?.name === segment || item.attributes?.displayName === segment)
            );
            
            if (!folder) {
              console.log(`🔍 ACC: Folder not found: ${segment}`);
              found = false;
              break;
            }
            
            currentFolderId = folder.id;
            console.log(`🔍 ACC: Found folder: ${segment} (ID: ${folder.id})`);
          }
          
          if (found) {
            // Get contents of the current folder
            const folderContents = await this.getFolderContents(f16Project.id, currentFolderId);
            console.log(`🔍 ACC: Contents of ${pathSegments.join(' > ') || 'root'}:`, folderContents.map(item => ({
              type: item.type,
              name: item.attributes?.name || item.attributes?.displayName,
              extension: item.attributes?.extension?.type,
              id: item.id
            })));
            
            // Filter for 3D model files (RVT, IFC, etc.)
            const files = folderContents.filter(item => 
              item.type === 'items' && 
              (item.attributes?.extension?.type?.includes('Revit') || 
               item.attributes?.extension?.type?.includes('IFC') ||
               item.attributes?.name?.toLowerCase().includes('.rvt') ||
               item.attributes?.name?.toLowerCase().includes('.ifc'))
            );
            
            if (files.length > 0) {
              console.log(`🔍 ACC: Found ${files.length} 3D model files in ${pathSegments.join(' > ') || 'root'}`);
              modelFiles = files;
              break;
            }
            
            // If this is Project Files, also search recursively in subfolders
            if (pathSegments.length === 1 && pathSegments[0] === 'Project Files') {
              console.log(`🔍 ACC: Searching recursively in Project Files subfolders...`);
              
              for (const subfolder of folderContents.filter(item => item.type === 'folders')) {
                console.log(`🔍 ACC: Searching in subfolder: ${subfolder.attributes?.name || subfolder.attributes?.displayName}`);
                
                try {
                  const subfolderContents = await this.getFolderContents(f16Project.id, subfolder.id);
                  console.log(`🔍 ACC: Subfolder contents:`, subfolderContents.map(item => ({
                    type: item.type,
                    name: item.attributes?.name || item.attributes?.displayName,
                    extension: item.attributes?.extension?.type,
                    id: item.id
                  })));
                  
                  const subfolderFiles = subfolderContents.filter(item => 
                    item.type === 'items' && 
                    (item.attributes?.extension?.type?.includes('Revit') || 
                     item.attributes?.extension?.type?.includes('IFC') ||
                     item.attributes?.name?.toLowerCase().includes('.rvt') ||
                     item.attributes?.name?.toLowerCase().includes('.ifc'))
                  );
                  
                  if (subfolderFiles.length > 0) {
                    console.log(`🔍 ACC: Found ${subfolderFiles.length} 3D model files in subfolder ${subfolder.attributes?.name || subfolder.attributes?.displayName}`);
                    modelFiles = subfolderFiles;
                    break;
                  }
                  
                  // Search one level deeper in subfolders
                  for (const subsubfolder of subfolderContents.filter(item => item.type === 'folders')) {
                    console.log(`🔍 ACC: Searching in sub-subfolder: ${subsubfolder.attributes?.name || subsubfolder.attributes?.displayName}`);
                    
                    try {
                      const subsubfolderContents = await this.getFolderContents(f16Project.id, subsubfolder.id);
                      const subsubfolderFiles = subsubfolderContents.filter(item => 
                        item.type === 'items' && 
                        (item.attributes?.extension?.type?.includes('Revit') || 
                         item.attributes?.extension?.type?.includes('IFC') ||
                         item.attributes?.name?.toLowerCase().includes('.rvt') ||
                         item.attributes?.name?.toLowerCase().includes('.ifc'))
                      );
                      
                      if (subsubfolderFiles.length > 0) {
                        console.log(`🔍 ACC: Found ${subsubfolderFiles.length} 3D model files in sub-subfolder ${subsubfolder.attributes?.name || subsubfolder.attributes?.displayName}`);
                        modelFiles = subsubfolderFiles;
                        break;
                      }
                    } catch (error) {
                      console.log(`🔍 ACC: Error searching sub-subfolder:`, error);
                    }
                  }
                  
                  if (modelFiles.length > 0) break;
                } catch (error) {
                  console.log(`🔍 ACC: Error searching subfolder:`, error);
                }
              }
              
              if (modelFiles.length > 0) break;
            }
          }
        } catch (error) {
          console.log(`🔍 ACC: Error exploring path ${pathSegments.join(' > ') || 'root'}:`, error);
          continue;
        }
      }
      
      if (modelFiles.length === 0) {
        console.error('🔍 ACC: Step 4 ❌: No 3D model files found in any explored path');
        return null;
      }
      
      console.log('🔍 ACC: Step 4 ✅: Found', modelFiles.length, '3D model files');
      
      // Sort by lastModifiedTime to get the newest file
      const newestFile = modelFiles.sort((a, b) => 
        new Date(b.attributes.lastModifiedTime).getTime() - new Date(a.attributes.lastModifiedTime).getTime()
      )[0];
      
      console.log('🔍 ACC: Step 5 ✅: Found newest 3D model file:', newestFile.attributes.name);
      console.log('🔍 ACC: File details:', {
        name: newestFile.attributes.name,
        type: newestFile.attributes.extension?.type,
        lastModified: newestFile.attributes.lastModifiedTime,
        id: newestFile.id
      });
      
      // Generate URN for the file
      const urn = `urn:adsk.wipprod:dm.lineage:${newestFile.id}`;
      console.log('🔍 ACC: Step 6 ✅: Generated URN:', urn);
      
      console.log('🔍 ACC: Step 7 ✅: Returning BIM model data');
      return {
        file: newestFile,
        urn: urn,
        token: token
      };
      
    } catch (error) {
      console.error('🔍 ACC: Error getting F16 BIM model:', error);
      return null;
    }
  }

  // Get projects using Data Management API (returns correct project IDs for folder API)
  static async getProjectsDataManagement(): Promise<ACCProject[]> {
    const token = await ACCOAuthService.getAccessToken();
    console.log('🔍 ACC: Fetching projects via Data Management API...');

    // Convert Account ID to Hub ID (b. + accountId)
    const hubId = `b.${this.ACC_ACCOUNT_ID}`;
    
    const url = `https://developer.api.autodesk.com/project/v1/hubs/${hubId}/projects`;
    
    console.log(`🔍 ACC: Data Management API URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 ACC: Data Management projects request failed:', errorText);
      throw new Error(`ACC Data Management projects request failed: ${response.status} - ${errorText}`);
    }

    const projectsData = await response.json();
    console.log('🔍 ACC: Data Management projects data received:', projectsData);
    
    const projects = projectsData.data || [];
    
    // Filter out archived projects
    const activeProjects = projects.filter((project: any) => {
      const status = project.attributes?.status?.toLowerCase();
      return status !== 'archived' && status !== 'archive' && status !== 'closed';
    });
    
    console.log(`🔍 ACC: Filtered ${activeProjects.length} active projects from ${projects.length} total projects`);
    
    // Sort projects alphabetically by name
    const sortedProjects = activeProjects.sort((a: any, b: any) => {
      return a.attributes.name.localeCompare(b.attributes.name, 'de', { sensitivity: 'base' });
    });
    
    console.log('🔍 ACC: Projects sorted alphabetically');
    
    // Convert to ACCProject format
    const accProjects: ACCProject[] = sortedProjects.map((project: any) => ({
      id: project.id,
      name: project.attributes.name,
      status: project.attributes.status || 'active',
      startDate: project.attributes.startDate,
      endDate: project.attributes.endDate,
      projectType: project.attributes.projectType,
      value: project.attributes.value,
      currency: project.attributes.currency
    }));
    
    console.log('🔍 ACC: Converted to ACCProject format');
    console.log('🔍 ACC: First 10 projects:', accProjects.slice(0, 10).map(p => p.name));
    
    return accProjects;
  }
}
