import { createClient, WebDAVClient } from 'webdav';

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
  lastModified?: Date | string;
  children?: NextcloudFolder[];
  hasChildren?: boolean;
  mimeType?: string;
  fileExtension?: string;
}

export class NextcloudOptimizedService {
  private client: WebDAVClient;
  private cache: Map<string, { data: NextcloudFolder[], timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor() {
    const nextcloudUrl = process.env.NEXTCLOUD_URL;
    const nextcloudUsername = process.env.NEXTCLOUD_USERNAME;
    const nextcloudPassword = process.env.NEXTCLOUD_PASSWORD;

    if (!nextcloudUrl || !nextcloudUsername || !nextcloudPassword) {
      throw new Error('Nextcloud credentials not configured');
    }

    // Use the URL as provided in .env.local (should already include /remote.php/webdav)
    this.client = createClient(nextcloudUrl, {
      username: nextcloudUsername,
      password: nextcloudPassword,
    });
  }

  /**
   * Get file extension and type from filename
   */
  private getFileInfo(filename: string): { extension: string; type: string } {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    // Map common file extensions to types
    const typeMap: Record<string, string> = {
      'pdf': 'PDF',
      'dwg': 'DWG',
      'dxf': 'DXF',
      'jpg': 'JPG',
      'jpeg': 'JPG',
      'png': 'PNG',
      'gif': 'GIF',
      'doc': 'DOC',
      'docx': 'DOCX',
      'xls': 'XLS',
      'xlsx': 'XLSX',
      'txt': 'TXT',
      'zip': 'ZIP',
      'rar': 'RAR',
      '7z': '7Z',
    };
    
    return {
      extension,
      type: typeMap[extension] || extension.toUpperCase()
    };
  }

  /**
   * Get folder structure with caching for better performance
   */
  async getFolderStructure(path: string = '/', recursive: boolean = false): Promise<NextcloudFolder[]> {
    try {
      console.log(`🔍 Nextcloud Optimized: Fetching folder structure for path: ${path}`);
      
      // Check cache first
      const cacheKey = `${path}_${recursive}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log(`✅ Nextcloud Optimized: Using cached data for ${path}`);
        return cached.data;
      }
      
      const contents = await this.client.getDirectoryContents(path);
      
      const items: NextcloudFolder[] = [];
      
      for (const item of contents as any[]) {
        const fileInfo = this.getFileInfo(item.basename);
        
        const folderItem: NextcloudFolder = {
          id: item.basename,
          label: item.basename,
          path: item.filename,
          type: item.type === 'directory' ? 'folder' : 'file',
          size: item.size,
          lastModified: item.lastmod ? new Date(item.lastmod) : undefined,
          hasChildren: item.type === 'directory' ? true : false,
          mimeType: item.mimeType,
          fileExtension: fileInfo.extension,
        };

        // If recursive and it's a directory, fetch children
        if (recursive && item.type === 'directory') {
          try {
            const children = await this.getFolderStructure(item.filename, true);
            folderItem.children = children;
            folderItem.hasChildren = children.length > 0;
          } catch (error) {
            console.warn(`⚠️ Could not fetch children for ${item.filename}:`, error);
            folderItem.hasChildren = false;
          }
        }

        items.push(folderItem);
      }
      
      // Sort: folders first, then files
      items.sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return a.label.localeCompare(b.label);
      });
      
      // Cache the result
      this.cache.set(cacheKey, { data: items, timestamp: Date.now() });
      
      console.log(`✅ Nextcloud Optimized: Found ${items.length} items in ${path}`);
      return items;
      
    } catch (error) {
      console.error('❌ Nextcloud Optimized: Error fetching folder structure:', error);
      throw new Error(`Failed to fetch Nextcloud folder structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get subfolders with optimized caching
   */
  async getSubfolders(path: string): Promise<NextcloudFolder[]> {
    try {
      console.log(`🔍 Nextcloud Optimized: Fetching subfolders for path: ${path}`);
      
      // Check cache first
      const cacheKey = `subfolders_${path}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log(`✅ Nextcloud Optimized: Using cached subfolders for ${path}`);
        return cached.data;
      }
      
      const contents = await this.client.getDirectoryContents(path);
      
      const folders: NextcloudFolder[] = [];
      
      for (const item of contents as any[]) {
        if (item.type === 'directory') {
          folders.push({
            id: item.basename,
            label: item.basename,
            path: item.filename,
            type: 'folder',
            lastModified: item.lastmod ? new Date(item.lastmod) : undefined,
            hasChildren: true, // Assume folders have children until proven otherwise
          });
        }
      }
      
      // Sort alphabetically
      folders.sort((a, b) => a.label.localeCompare(b.label));
      
      // Cache the result
      this.cache.set(cacheKey, { data: folders, timestamp: Date.now() });
      
      console.log(`✅ Nextcloud Optimized: Found ${folders.length} subfolders in ${path}`);
      return folders;
      
    } catch (error) {
      console.error('❌ Nextcloud Optimized: Error fetching subfolders:', error);
      throw new Error(`Failed to fetch Nextcloud subfolders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear cache for a specific path or all cache
   */
  clearCache(path?: string): void {
    if (path) {
      // Clear cache for specific path and its subfolders
      for (const key of this.cache.keys()) {
        if (key.startsWith(path) || key.startsWith(`subfolders_${path}`)) {
          this.cache.delete(key);
        }
      }
      console.log(`🧹 Nextcloud Optimized: Cleared cache for ${path}`);
    } else {
      // Clear all cache
      this.cache.clear();
      console.log('🧹 Nextcloud Optimized: Cleared all cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number, keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
} 