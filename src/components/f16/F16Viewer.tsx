'use client';

import React, { useEffect, useRef, useState } from 'react';

interface F16ViewerProps {
  onClose: () => void;
  modelPath: string;
  viewName?: string;
}

declare global {
  interface Window {
    Autodesk: any;
  }
}

export default function F16Viewer({ onClose, modelPath, viewName = 'KP-AXO-ZZ' }: F16ViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerInstance, setViewerInstance] = useState<any>(null);
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [availableViews, setAvailableViews] = useState<any[]>([]);

  // Function to load a specific view
  const loadView = (view: any) => {
    if (viewerInstance && currentDocument) {
      try {
        console.log('🔍 F16 Viewer: Loading view:', view.name, '(', view.type, ')');
        viewerInstance.loadDocumentNode(currentDocument, view.viewable);
        console.log('✅ F16 Viewer: View loaded successfully');
      } catch (err) {
        console.log('⚠️ F16 Viewer: Could not load view:', err);
      }
    }
  };

  useEffect(() => {
    const loadViewer = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('🔍 F16 Viewer: Starting viewer load process...');
        
        // Parse model path to get project ID and item ID
        const pathParts = modelPath.split('/');
        if (pathParts.length < 3 || pathParts[1] !== 'items') {
          throw new Error('Invalid model path format. Expected: b.{projectId}/items/{itemId}');
        }
        
        const projectId = pathParts[0];
        const itemId = pathParts[2];
        
        console.log('🔍 F16 Viewer: Project ID:', projectId);
        console.log('🔍 F16 Viewer: Item ID:', itemId);
        
        // Get access token
        const tokenResponse = await fetch('/api/acc/token');
        if (!tokenResponse.ok) {
          throw new Error('Failed to get access token');
        }
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.token;
        console.log('🔍 F16 Viewer: Access token obtained, length:', accessToken?.length);
        
        // Convert URN to base64 format for APS Viewer
        const urnWithoutPrefix = itemId.startsWith('urn:') ? itemId.substring(4) : itemId;
        const base64Urn = btoa(urnWithoutPrefix)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        // APS Viewer needs ONLY the base64 URN (no "urn:" prefix)
        const urn = base64Urn;
        const token = accessToken;
        
        console.log('🔍 F16 Viewer: Original URN:', itemId);
        console.log('🔍 F16 Viewer: URN without prefix:', urnWithoutPrefix);
        console.log('🔍 F16 Viewer: Base64 URN for viewer:', base64Urn);

        // Load APS Viewer script
        if (!window.Autodesk) {
          console.log('🔍 F16 Viewer: Loading Autodesk Viewer SDK...');
          const script = document.createElement('script');
          script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js';
          script.onload = () => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.css';
            document.head.appendChild(link);
            initializeViewer(token, urn);
          };
          script.onerror = () => {
            setError('Failed to load APS Viewer script');
            setLoading(false);
          };
          document.head.appendChild(script);
        } else {
          console.log('🔍 F16 Viewer: Autodesk SDK already loaded, initializing...');
          initializeViewer(token, urn);
        }
      } catch (err) {
        console.error('🔍 F16 Viewer: Error loading viewer:', err);
        setError('Failed to load viewer');
        setLoading(false);
      }
    };

    const initializeViewer = (accessToken: string, urn: string) => {
      if (!viewerRef.current) return;

      try {
        console.log('🔍 F16 Viewer: Initializing viewer with URN:', urn);
        
        const options = {
          env: 'AutodeskProduction',
          api: 'derivativeV2',
          getAccessToken: (onGetAccessToken: (token: string, expires: number) => void) => {
            onGetAccessToken(accessToken, 3600);
          }
        };

        window.Autodesk.Viewing.Initializer(options, () => {
          console.log('🔍 F16 Viewer: Initializer callback executed');
          
          // Create viewer with Revit-specific UI components
          const viewer = new window.Autodesk.Viewing.GuiViewer3D(viewerRef.current);
          console.log('🔍 F16 Viewer: GuiViewer3D created');
          
          // Store viewer instance for toggle functionality
          setViewerInstance(viewer);
          
          // Enable Revit-specific UI components
          viewer.setTheme('light-theme');
          console.log('🔍 F16 Viewer: Theme set to light-theme');
          
          // Start the viewer
          viewer.start();
          console.log('🔍 F16 Viewer: Viewer started');

          // Load the document using the URN
          console.log('🔍 F16 Viewer: Loading document:', urn);
          
          window.Autodesk.Viewing.Document.load(
            urn,
            (doc: any) => {
              console.log('🔍 F16 Viewer: Document loaded successfully');
              const defaultModel = doc.getRoot().getDefaultGeometry();
              viewer.loadDocumentNode(doc, defaultModel).then(() => {
                console.log('🔍 F16 Viewer: Model loaded successfully');
                
                // Store document for view panel functionality
                setCurrentDocument(doc);
                
                // Wait for the model to be fully loaded before checking type
                setTimeout(() => {
                  // Always extract viewables from the document, regardless of model type
                  console.log('🔍 F16 Viewer: Extracting viewables from document...');
                  const root = doc.getRoot();
                  
                  // Extract 3D geometry views
                  const geometryViewables = root.search({ type: 'geometry' });
                  // Extract 2D sheet views
                  const sheetViewables = root.search({ type: 'sheet' });
                  
                  console.log('🔍 F16 Viewer: Found geometry viewables:', geometryViewables.length);
                  console.log('🔍 F16 Viewer: Found sheet viewables:', sheetViewables.length);
                  
                  // Prepare views for UI
                  const views = [
                    ...geometryViewables.map((viewable: any) => ({ 
                      type: '3D', 
                      name: viewable.data?.name || viewable.name || '3D View', 
                      viewable,
                      role: viewable.data?.role || '3d',
                      guid: viewable.getGuid?.() || viewable.guid
                    })),
                    ...sheetViewables.map((viewable: any) => ({ 
                      type: '2D', 
                      name: viewable.data?.name || viewable.name || '2D Sheet', 
                      viewable,
                      role: viewable.data?.role || '2d',
                      guid: viewable.getGuid?.() || viewable.guid
                    }))
                  ];
                  
                  setAvailableViews(views);
                  console.log('✅ F16 Viewer: Extracted', views.length, 'available views');
                  console.log('🔍 F16 Viewer: Available views:', views.map(v => `${v.type}: ${v.name} (${v.role})`));
                  
                  // Auto-load specific view if viewName is provided
                  if (viewName) {
                    console.log('🔍 F16 Viewer: Looking for specific view:', viewName);
                    const targetView = views.find(v => 
                      v.name === viewName || 
                      v.name.toLowerCase().includes(viewName.toLowerCase()) ||
                      v.name.toLowerCase().includes('kp-axo-zz')
                    );
                    
                    if (targetView) {
                      console.log('✅ F16 Viewer: Found target view:', targetView.name);
                      setTimeout(() => {
                        loadView(targetView);
                      }, 1000); // Wait 1 second for viewer to be fully ready
                    } else {
                      console.log('⚠️ F16 Viewer: Target view not found:', viewName);
                      console.log('Available views:', views.map(v => v.name));
                    }
                  }
                }, 2000); // Wait 2 seconds for model to be fully loaded
              });
              
              setLoading(false);
            },
            (error: any) => {
              console.error('🔍 F16 Viewer: Error loading document:', error);
              setError('Failed to load document');
              setLoading(false);
            }
          );
        });
      } catch (err) {
        console.error('🔍 F16 Viewer: Error initializing viewer:', err);
        setError('Failed to initialize viewer');
        setLoading(false);
      }
    };

    loadViewer();
  }, [modelPath, viewName]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Viewer Header with horizontal buttons */}
      <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">3D-Viewer</h2>
          <span className="text-gray-600">- {modelPath.split('/').pop()}</span>
        </div>
        <div className="flex items-center space-x-3">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-md"
          >
            Schließen
          </button>
        </div>
      </div>

      {/* Viewer Container */}
      <div className="flex-1 relative bg-white">
        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Lade 3D-Viewer...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all"
              >
                Schließen
              </button>
            </div>
          </div>
        )}

        {/* Viewer Canvas */}
        <div ref={viewerRef} className="w-full h-full bg-white"></div>
      </div>
    </div>
  );
}