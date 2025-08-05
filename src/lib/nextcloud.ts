import { createClient, WebDAVClient } from 'webdav';

export interface NextcloudFolder {
  id: string;
  label: string;
  main_category: string;
  sub_category: string;
  path: string;
  type: 'folder' | 'file';
  size?: number;
  lastModified?: Date;
  children?: NextcloudFolder[];
  hasChildren?: boolean;
}

export class NextcloudService {
  private client: WebDAVClient;

  constructor() {
    const nextcloudUrl = process.env.NEXTCLOUD_URL;
    const nextcloudUsername = process.env.NEXTCLOUD_USERNAME;
    const nextcloudPassword = process.env.NEXTCLOUD_PASSWORD;

    if (!nextcloudUrl || !nextcloudUsername || !nextcloudPassword) {
      throw new Error('Nextcloud credentials not configured');
    }

    this.client = createClient(nextcloudUrl, {
      username: nextcloudUsername,
      password: nextcloudPassword,
    });
  }

  async getFolderStructure(path: string = '/', recursive: boolean = false): Promise<NextcloudFolder[]> {
    try {
      console.log(`🔍 Nextcloud: Fetching folder structure for path: ${path} (recursive: ${recursive})`);
      
      const contents = await this.client.getDirectoryContents(path);
      
      const items: NextcloudFolder[] = [];
      
      for (const item of contents as any[]) {
        const pathParts = this.parsePathToHierarchy(item.filename);
        
        const folderItem: NextcloudFolder = {
          id: item.basename,
          label: item.basename,
          main_category: pathParts.mainCategory,
          sub_category: pathParts.subCategory,
          path: item.filename,
          type: item.type === 'directory' ? 'folder' : 'file',
          size: item.size,
          lastModified: item.lastmod ? new Date(item.lastmod) : undefined,
          hasChildren: item.type === 'directory' ? true : false,
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
      
      console.log(`✅ Nextcloud: Found ${items.length} items in ${path}`);
      return items;
      
    } catch (error) {
      console.error('❌ Nextcloud: Error fetching folder structure:', error);
      throw new Error(`Failed to fetch Nextcloud folder structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSubfolders(path: string): Promise<NextcloudFolder[]> {
    try {
      console.log(`🔍 Nextcloud: Fetching subfolders for path: ${path}`);
      
      const contents = await this.client.getDirectoryContents(path);
      
      const folders: NextcloudFolder[] = [];
      
      for (const item of contents as any[]) {
        if (item.type === 'directory') {
          const pathParts = this.parsePathToHierarchy(item.filename);
          
          folders.push({
            id: item.basename,
            label: item.basename,
            main_category: pathParts.mainCategory,
            sub_category: pathParts.subCategory,
            path: item.filename,
            type: 'folder',
            lastModified: item.lastmod ? new Date(item.lastmod) : undefined,
            hasChildren: true, // We'll check this when expanding
          });
        }
      }
      
      console.log(`✅ Nextcloud: Found ${folders.length} subfolders in ${path}`);
      return folders;
      
    } catch (error) {
      console.error('❌ Nextcloud: Error fetching subfolders:', error);
      throw new Error(`Failed to fetch subfolders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async checkHasChildren(path: string): Promise<boolean> {
    try {
      const contents = await this.client.getDirectoryContents(path);
      return (contents as any[]).some((item: any) => item.type === 'directory');
    } catch (error) {
      console.warn(`⚠️ Could not check children for ${path}:`, error);
      return false;
    }
  }

  private parsePathToHierarchy(path: string): { mainCategory: string, subCategory: string } {
    const parts = path.split('/').filter(Boolean);
    
    if (parts.length === 0) {
      return { mainCategory: 'Root', subCategory: 'Allgemein' };
    }
    
    if (parts.length === 1) {
      return { mainCategory: parts[0], subCategory: 'Allgemein' };
    }
    
    return {
      mainCategory: parts[0],
      subCategory: parts[1]
    };
  }

  async getFileContents(path: string): Promise<string> {
    try {
      console.log(`📄 Nextcloud: Fetching file contents for: ${path}`);
      
      const response = await this.client.getFileContents(path, { format: 'text' });
      
      console.log(`✅ Nextcloud: Successfully fetched file contents`);
      return response as string;
      
    } catch (error) {
      console.error('❌ Nextcloud: Error fetching file contents:', error);
      throw new Error(`Failed to fetch file contents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadFile(path: string, content: string): Promise<void> {
    try {
      console.log(`📤 Nextcloud: Uploading file to: ${path}`);
      
      await this.client.putFileContents(path, content);
      
      console.log(`✅ Nextcloud: Successfully uploaded file`);
      
    } catch (error) {
      console.error('❌ Nextcloud: Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createFolder(path: string): Promise<void> {
    try {
      console.log(`📁 Nextcloud: Creating folder: ${path}`);
      
      await this.client.createDirectory(path);
      
      console.log(`✅ Nextcloud: Successfully created folder`);
      
    } catch (error) {
      console.error('❌ Nextcloud: Error creating folder:', error);
      throw new Error(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteItem(path: string): Promise<void> {
    try {
      console.log(`🗑️ Nextcloud: Deleting item: ${path}`);
      
      await this.client.deleteFile(path);
      
      console.log(`✅ Nextcloud: Successfully deleted item`);
      
    } catch (error) {
      console.error('❌ Nextcloud: Error deleting item:', error);
      throw new Error(`Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 