export interface NextcloudFile {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  lastModified: Date;
  mimeType?: string;
  etag?: string;
  permissions?: number;
}

export interface NextcloudFolder {
  id: string;
  label: string;
  path: string;
  type: 'folder' | 'file';
  size?: number;
  lastModified?: Date;
  children?: NextcloudFolder[];
  hasChildren?: boolean;
}

export class NextcloudRestService {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor() {
    const nextcloudUrl = process.env.NEXTCLOUD_URL;
    const nextcloudUsername = process.env.NEXTCLOUD_USERNAME;
    const nextcloudPassword = process.env.NEXTCLOUD_PASSWORD;

    if (!nextcloudUrl || !nextcloudUsername || !nextcloudPassword) {
      throw new Error('Nextcloud credentials not configured');
    }

    this.baseUrl = nextcloudUrl.replace(/\/$/, ''); // Remove trailing slash
    this.username = nextcloudUsername;
    this.password = nextcloudPassword;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'OCS-APIRequest': 'true',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Nextcloud API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get folder contents using Nextcloud REST API
   * Much faster than WebDAV for directory listing
   */
  async getFolderContents(path: string = '/'): Promise<NextcloudFile[]> {
    try {
      console.log(`🔍 Nextcloud REST: Fetching folder contents for path: ${path}`);
      
      // Use the Nextcloud REST API endpoint
      const endpoint = `/remote.php/dav/files/${this.username}${path}`;
      
      // Create auth header exactly like the webdav library
      const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Depth': '1',
          'Content-Type': 'application/xml',
          'User-Agent': 'Nextcloud REST Client',
        },
        body: `<?xml version="1.0" encoding="utf-8" ?>
<propfind xmlns="DAV:">
  <prop>
    <resourcetype/>
    <getcontentlength/>
    <getlastmodified/>
    <getcontenttype/>
    <getetag/>
  </prop>
</propfind>`,
      });

      console.log('🔍 Nextcloud REST: Response status:', response.status);
      console.log('🔍 Nextcloud REST: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`Nextcloud API error: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      
      // Debug: Log the raw XML response
      console.log('🔍 Nextcloud REST: Raw XML response:', xmlText.substring(0, 500) + '...');
      
      const files = this.parseWebDAVResponse(xmlText, path);
      
      console.log(`✅ Nextcloud REST: Found ${files.length} items in ${path}`);
      console.log('🔍 Nextcloud REST: Parsed files:', files.map(f => ({ name: f.name, type: f.type, path: f.path })));
      
      return files;
      
    } catch (error) {
      console.error('❌ Nextcloud REST: Error fetching folder contents:', error);
      throw error;
    }
  }

  /**
   * Get folder structure optimized for tree view
   */
  async getFolderStructure(path: string = '/', recursive: boolean = false): Promise<NextcloudFolder[]> {
    try {
      const files = await this.getFolderContents(path);
      
      // Convert to NextcloudFolder format
      const folders: NextcloudFolder[] = files
        .filter(file => file.type === 'folder' || file.type === 'file')
        .map(file => ({
          id: file.id,
          label: file.name,
          path: file.path,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          hasChildren: file.type === 'folder' ? true : false,
        }))
        .sort((a, b) => {
          // Folders first, then files
          if (a.type === 'folder' && b.type === 'file') return -1;
          if (a.type === 'file' && b.type === 'folder') return 1;
          return a.label.localeCompare(b.label);
        });

      return folders;
      
    } catch (error) {
      console.error('❌ Nextcloud REST: Error getting folder structure:', error);
      throw error;
    }
  }

  /**
   * Get subfolders for a specific path
   */
  async getSubfolders(path: string): Promise<NextcloudFolder[]> {
    try {
      const files = await this.getFolderContents(path);
      
      // Filter only folders
      const subfolders: NextcloudFolder[] = files
        .filter(file => file.type === 'folder')
        .map(file => ({
          id: file.id,
          label: file.name,
          path: file.path,
          type: 'folder' as const,
          size: file.size,
          lastModified: file.lastModified,
          hasChildren: true, // Assume folders have children until proven otherwise
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      return subfolders;
      
    } catch (error) {
      console.error('❌ Nextcloud REST: Error getting subfolders:', error);
      throw error;
    }
  }

  /**
   * Parse WebDAV XML response
   */
  private parseWebDAVResponse(xmlText: string, basePath: string): NextcloudFile[] {
    // Simple XML parsing - in production you might want to use a proper XML parser
    const files: NextcloudFile[] = [];
    
    console.log('🔍 Nextcloud REST: Starting XML parsing for basePath:', basePath);
    
    // Extract file information from XML
    const fileMatches = xmlText.match(/<d:response>([\s\S]*?)<\/d:response>/g);
    
    console.log('🔍 Nextcloud REST: Found', fileMatches?.length || 0, 'response elements');
    
    if (fileMatches) {
      for (const match of fileMatches) {
        try {
          // Extract href (path)
          const hrefMatch = match.match(/<d:href>([^<]+)<\/d:href>/);
          if (!hrefMatch) {
            console.log('🔍 Nextcloud REST: No href found in response element');
            continue;
          }
          
          const href = decodeURIComponent(hrefMatch[1]);
          console.log('🔍 Nextcloud REST: Processing href:', href);
          
          const relativePath = href.replace(`/remote.php/dav/files/${this.username}`, '');
          console.log('🔍 Nextcloud REST: Relative path:', relativePath, 'Base path:', basePath);
          
          // Skip the base path itself
          if (relativePath === basePath) {
            console.log('🔍 Nextcloud REST: Skipping base path itself');
            continue;
          }
          
          // Extract filename
          const name = relativePath.split('/').pop() || '';
          console.log('🔍 Nextcloud REST: Extracted name:', name);
          
          // Extract type (folder or file)
          const isFolder = match.includes('<d:collection/>');
          const type: 'file' | 'folder' = isFolder ? 'folder' : 'file';
          console.log('🔍 Nextcloud REST: Type:', type, 'isFolder:', isFolder);
          
          // Extract size
          const sizeMatch = match.match(/<d:getcontentlength>(\d+)<\/d:getcontentlength>/);
          const size = sizeMatch ? parseInt(sizeMatch[1]) : 0;
          
          // Extract last modified
          const dateMatch = match.match(/<d:getlastmodified>([^<]+)<\/d:getlastmodified>/);
          const lastModified = dateMatch ? new Date(dateMatch[1]) : new Date();
          
          // Extract content type
          const mimeMatch = match.match(/<d:getcontenttype>([^<]+)<\/d:getcontenttype>/);
          const mimeType = mimeMatch ? mimeMatch[1] : undefined;
          
          const file = {
            id: relativePath,
            name,
            path: relativePath,
            type,
            size,
            lastModified,
            mimeType,
          };
          
          console.log('🔍 Nextcloud REST: Adding file:', file);
          files.push(file);
          
        } catch (error) {
          console.warn('Warning: Could not parse file entry:', error);
        }
      }
    }
    
    console.log('🔍 Nextcloud REST: Final parsed files count:', files.length);
    return files;
  }

  /**
   * Get file metadata for a specific file
   */
  async getFileMetadata(path: string): Promise<NextcloudFile | null> {
    try {
      const endpoint = `/remote.php/dav/files/${this.username}${path}`;
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`,
          'Depth': '0',
          'Content-Type': 'application/xml',
        },
        body: `<?xml version="1.0" encoding="utf-8" ?>
<propfind xmlns="DAV:">
  <prop>
    <resourcetype/>
    <getcontentlength/>
    <getlastmodified/>
    <getcontenttype/>
    <getetag/>
  </prop>
</propfind>`,
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Nextcloud API error: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      const files = this.parseWebDAVResponse(xmlText, path);
      
      return files.length > 0 ? files[0] : null;
      
    } catch (error) {
      console.error('❌ Nextcloud REST: Error getting file metadata:', error);
      throw error;
    }
  }
} 