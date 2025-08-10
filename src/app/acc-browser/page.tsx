'use client';

import { useState, useEffect } from 'react';
import { DefaultPageLayout } from '@/ui/layouts/DefaultPageLayout';
import APSViewer from '@/components/APSViewer';

interface ACCProject {
  id: string;
  name: string;
  status: string;
}

interface ACCContent {
  id: string;
  type: string;
  attributes: {
    name: string;
    displayName: string;
    createTime: string;
    lastModifiedTime: string;
    hidden: boolean;
  };
  relationships?: {
    tip?: {
      data: {
        id: string;
        type: string;
      };
    };
  };
}

interface ViewerData {
  urn: string;
  token: string;
  status?: 'ready' | 'translating';
  jobId?: string;
  base64Urn?: string;
}

export default function ACCBrowserPage() {
  const [projects, setProjects] = useState<ACCProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [contents, setContents] = useState<ACCContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ACCContent | null>(null);
  const [viewerData, setViewerData] = useState<ViewerData | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load project contents when project is selected
  useEffect(() => {
    if (selectedProject) {
      loadProjectContents(selectedProject);
    } else {
      setContents([]);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/acc/projects');
      if (!response.ok) throw new Error('Failed to load projects');
      
      const data = await response.json();
      console.log('🔍 ACC Browser: Raw API response:', data);
      console.log('🔍 ACC Browser: Data.data:', data.data);
      console.log('🔍 ACC Browser: Data.data length:', data.data?.length);
      
      setProjects(data.data || []);
      console.log('🔍 ACC Browser: Projects state set:', data.data?.length);
    } catch (err) {
      console.error('🔍 ACC Browser: Error loading projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectContents = async (projectId: string) => {
    try {
      setLoading(true);
      setError('');
      
      // First, get the top-level folders to find the "Project Files" folder
      const response = await fetch(`/api/acc/projects/${projectId}/contents`);
      if (!response.ok) throw new Error('Failed to load project contents');
      
      const data = await response.json();
      const topFolders = data.data || [];
      
      // Find the "Project Files" folder
      const projectFilesFolder = topFolders.find((folder: any) => 
        folder.attributes?.displayName === 'Project Files' || 
        folder.attributes?.name === 'Project Files'
      );
      
      if (projectFilesFolder) {
        console.log('🔍 ACC Browser: Found Project Files folder, navigating to it...');
        // Reset breadcrumbs and navigate to the Project Files folder
        setCurrentPath(['Project Files']);
        setCurrentFolderId(projectFilesFolder.id);
        await handleFolderClick(projectFilesFolder.id, 'Project Files');
      } else {
        console.log('🔍 ACC Browser: Project Files folder not found, showing top-level folders');
        setContents(topFolders);
        setCurrentPath([]);
        setCurrentFolderId('');
      }
      
      console.log('🔍 ACC Browser: Project contents loaded:', topFolders.length);
    } catch (err) {
      console.error('🔍 ACC Browser: Error loading project contents:', err);
      setError('Failed to load project contents');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleFolderClick = async (folderId: string, folderName?: string) => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/acc/projects/${selectedProject}/folders/${folderId}/contents`);
      if (!response.ok) throw new Error('Failed to load folder contents');
      
      const data = await response.json();
      setContents(data.data || []);
      
      // Update breadcrumb navigation
      if (folderName) {
        setCurrentPath(prev => [...prev, folderName]);
      }
      setCurrentFolderId(folderId);
      
      console.log('🔍 ACC Browser: Folder contents loaded:', data.data?.length);
    } catch (err) {
      console.error('🔍 ACC Browser: Error loading folder contents:', err);
      setError('Failed to load folder contents');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderDoubleClick = (folderId: string, folderName: string) => {
    handleFolderClick(folderId, folderName);
  };

  const handleFileView = async (file: ACCContent) => {
    try {
      setViewerLoading(true);
      setSelectedFile(file);
      setViewerOpen(true);
      
      // Get viewer token from APS API
      const response = await fetch('/api/aps/viewer-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: file.id,
          projectId: selectedProject
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get viewer token');
      }
      
      const data = await response.json();
      // Show appropriate message based on status
      if (data.status === 'translating') {
        setError('File is being translated. This may take a few minutes. Please try again later.');
        setViewerOpen(false);
        setSelectedFile(null);
      } else {
        // File is ready, set viewer data
        setViewerData({
          urn: data.urn,
          base64Urn: data.base64Urn,
          token: data.token,
          status: data.status,
          jobId: data.jobId
        });
      }
      
      console.log('🔍 ACC Browser: APS Viewer token received:', data);
      
    } catch (err) {
      console.error('🔍 ACC Browser: Error getting APS viewer token:', err);
      setError('Failed to open viewer');
      setViewerOpen(false);
      setSelectedFile(null);
    } finally {
      setViewerLoading(false);
    }
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedFile(null);
    setViewerData(null);
  };

  const filteredContents = contents.filter(item => 
    item.attributes.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DefaultPageLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">ACC File Browser</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Autodesk Construction Cloud</span>
          </div>
        </div>

        {/* Project Selection */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Project:</label>
            <select
              value={selectedProject}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-80 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Breadcrumb Navigation */}
          {currentPath.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Path:</span>
              {currentPath.map((path, index) => (
                <span key={index}>
                  {index > 0 && <span className="mx-2">/</span>}
                  <span className="font-medium">{path}</span>
                </span>
              ))}
            </div>
          )}

          {/* Search Bar */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files and folders..."
              className="w-80 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading...</span>
          </div>
        )}

        {/* Content Table - Full Width */}
        {!loading && selectedProject && (
          <div className="bg-white rounded-lg border overflow-hidden w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'No files found matching your search.' : 'No files in this location.'}
                    </td>
                  </tr>
                ) : (
                  filteredContents.map((item) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-gray-50 ${item.type === 'folders' ? 'cursor-pointer' : ''}`}
                      onDoubleClick={() => {
                        if (item.type === 'folders') {
                          handleFolderDoubleClick(item.id, item.attributes.displayName);
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{item.attributes.displayName}</span>
                          {item.type === 'folders' && (
                            <span className="text-xs text-gray-400">(Double-click to open)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.type === 'folders' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {item.type === 'folders' ? 'Folder' : 'File'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.attributes.createTime).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.attributes.lastModifiedTime).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {item.type === 'folders' && (
                            <button
                              onClick={() => handleFolderClick(item.id, item.attributes.displayName)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                            >
                              Open
                            </button>
                          )}
                          {item.type === 'items' && (
                            <button 
                              onClick={() => handleFileView(item)}
                              disabled={viewerLoading}
                              className={`px-3 py-1 rounded text-xs ${
                                viewerLoading 
                                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {viewerLoading ? 'Loading...' : 'View'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* No Project Selected */}
        {!selectedProject && !loading && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Project</h3>
            <p className="text-gray-600">Choose a project from the dropdown above to browse its files and folders.</p>
          </div>
        )}
      </div>

      {/* APS Viewer */}
      {viewerOpen && selectedFile && viewerData && (
        <APSViewer
          urn={viewerData.urn}
          base64Urn={viewerData.base64Urn}
          token={viewerData.token}
          onClose={() => {
            setViewerOpen(false);
            setSelectedFile(null);
            setViewerData(null);
          }}
          fileName={selectedFile.attributes.displayName}
        />
      )}
    </DefaultPageLayout>
  );
}
