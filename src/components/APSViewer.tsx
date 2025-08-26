'use client';

import { useEffect, useRef, useState } from 'react';

interface APSViewerProps {
  urn: string;
  token: string;
  onClose: () => void;
  fileName: string;
  base64Urn?: string; // Add base64 URN prop
}

declare global {
  interface Window {
    Autodesk: any;
  }
}

export default function APSViewer({ urn, token, onClose, fileName, base64Urn }: APSViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isViewerReady, setIsViewerReady] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false); // Structure panel closed by default
  const [isViewPanelVisible, setIsViewPanelVisible] = useState(true); // Views panel open by default
  const [availableViews, setAvailableViews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'2D' | '3D'>('3D');
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [viewerInstance, setViewerInstance] = useState<any>(null);

  // Toggle function for the model browser panel
  const toggleModelBrowserPanel = () => {
    if (viewerInstance && isViewerReady) {
      try {
        console.log('🔍 APS Viewer: Attempting to toggle ModelStructure Extension...');
        
        // Get the ModelStructure Extension
        const modelStructureExt = viewerInstance.getExtension('Autodesk.ModelStructure');
        if (modelStructureExt) {
          const newVisibility = !isPanelVisible;
          
          if (newVisibility) {
            // Activate the extension to show the panel
            modelStructureExt.activate();
            console.log('✅ APS Viewer: ModelStructure Extension activated');
          } else {
            // Deactivate the extension to hide the panel
            modelStructureExt.deactivate();
            console.log('✅ APS Viewer: ModelStructure Extension deactivated');
          }
          
          setIsPanelVisible(newVisibility);
        } else {
          console.log('⚠️ APS Viewer: ModelStructure Extension not found');
          
          // Try to load the extension if it's not loaded
          try {
            console.log('🔍 APS Viewer: Loading ModelStructure Extension...');
            viewerInstance.loadExtension('Autodesk.ModelStructure')
              .then(() => {
                const ext = viewerInstance.getExtension('Autodesk.ModelStructure');
                ext.activate();
                setIsPanelVisible(true);
                console.log('✅ APS Viewer: ModelStructure Extension loaded and activated');
              })
              .catch((err: any) => {
                console.log('⚠️ APS Viewer: Could not load ModelStructure Extension:', err);
              });
          } catch (loadErr) {
            console.log('⚠️ APS Viewer: Could not load ModelStructure Extension:', loadErr);
          }
        }
      } catch (err) {
        console.log('⚠️ APS Viewer: Could not toggle ModelStructure Extension:', err);
      }
    } else {
      console.log('⚠️ APS Viewer: Viewer not ready for panel toggle');
    }
  };

  // Modified toggleViewPanel function - always show view panel if viewables are available
  const toggleViewPanel = async () => {
    console.log('🔍 APS Viewer: Button clicked!');
    
    // Log to server for terminal visibility
    try {
      await fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '🔍 APS Viewer: Button clicked!',
          details: {
            viewerInstance: !!viewerInstance,
            isViewerReady,
            availableViewsCount: availableViews.length,
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (err) {
      console.log('Failed to log to server:', err);
    }
    
    if (viewerInstance && isViewerReady) {
      try {
        console.log('🔍 APS Viewer: Attempting to toggle View Panel (Pläne und Ansichten)...');
        
        // Check if we already have viewables extracted
        if (availableViews.length > 0) {
          console.log('🔍 APS Viewer: Viewables already available, toggling panel...');
          setIsViewPanelVisible(!isViewPanelVisible);
          
          // Log success to server
          try {
            await fetch('/api/log-error', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: '✅ APS Viewer: View Panel toggled successfully',
                details: {
                  viewsCount: availableViews.length,
                  availableViews: availableViews.map(v => `${v.type}: ${v.name} (${v.role})`),
                  isViewPanelVisible: !isViewPanelVisible,
                  timestamp: new Date().toISOString()
                }
              })
            });
          } catch (err) {
            console.log('Failed to log success to server:', err);
          }
        } else {
          console.log('⚠️ APS Viewer: No viewables available');
          
          // Try to extract viewables from current document
          if (currentDocument) {
            console.log('🔍 APS Viewer: Attempting to extract viewables from current document...');
            const root = currentDocument.getRoot();
            
            // Extract 3D geometry views
            const geometryViewables = root.search({ type: 'geometry' });
            // Extract 2D sheet views
            const sheetViewables = root.search({ type: 'sheet' });
            
            console.log('🔍 APS Viewer: Found geometry viewables:', geometryViewables.length);
            console.log('🔍 APS Viewer: Found sheet viewables:', sheetViewables.length);
            
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
            setIsViewPanelVisible(true);
            
            console.log('✅ APS Viewer: Extracted and toggled view panel with', views.length, 'available views');
            console.log('🔍 APS Viewer: Available views:', views.map(v => `${v.type}: ${v.name} (${v.role})`));
            
            // Log success to server
            try {
              await fetch('/api/log-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: '✅ APS Viewer: Viewables extracted and panel toggled',
                  details: {
                    viewsCount: views.length,
                    availableViews: views.map(v => `${v.type}: ${v.name} (${v.role})`),
                    isViewPanelVisible: true,
                    timestamp: new Date().toISOString()
                  }
                })
              });
            } catch (err) {
              console.log('Failed to log success to server:', err);
            }
          } else {
            console.log('⚠️ APS Viewer: No current document available');
            
            // Log error to server
            try {
              await fetch('/api/log-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: '⚠️ APS Viewer: No current document available',
                  details: {
                    timestamp: new Date().toISOString()
                  }
                })
              });
            } catch (err) {
              console.log('Failed to log error to server:', err);
            }
          }
        }
      } catch (err) {
        console.log('⚠️ APS Viewer: Could not toggle View Panel:', err);
        
        // Log general error to server
        try {
          await fetch('/api/log-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: '⚠️ APS Viewer: Could not toggle View Panel',
              details: {
                error: err instanceof Error ? err.message : String(err),
                timestamp: new Date().toISOString()
              }
            })
          });
        } catch (logErr) {
          console.log('Failed to log general error to server:', logErr);
        }
      }
    } else {
      console.log('⚠️ APS Viewer: Viewer not ready for view panel toggle');
      console.log('🔍 APS Viewer: viewerInstance:', viewerInstance);
      console.log('🔍 APS Viewer: isViewerReady:', isViewerReady);
      
      // Log viewer not ready error to server
      try {
        await fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: '⚠️ APS Viewer: Viewer not ready for view panel toggle',
            details: {
              viewerInstance: !!viewerInstance,
              isViewerReady,
              timestamp: new Date().toISOString()
            }
          })
        });
      } catch (err) {
        console.log('Failed to log viewer not ready error to server:', err);
      }
    }
  };

  // Function to load a specific view
  const loadView = (view: any) => {
    if (viewerInstance && currentDocument) {
      try {
        console.log('🔍 APS Viewer: Loading view:', view.name, '(', view.type, ')');
        viewerInstance.loadDocumentNode(currentDocument, view.viewable);
        console.log('✅ APS Viewer: View loaded successfully');
      } catch (err) {
        console.log('⚠️ APS Viewer: Could not load view:', err);
      }
    }
  };

  useEffect(() => {
    const loadViewer = async () => {
      try {
        setLoading(true);
        setError('');

        // Load APS Viewer script
        if (!window.Autodesk) {
          const script = document.createElement('script');
          script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js';
          script.onload = () => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.css';
            document.head.appendChild(link);
            initializeViewer();
          };
          script.onerror = () => {
            setError('Failed to load APS Viewer script');
            setLoading(false);
          };
          document.head.appendChild(script);
        } else {
          initializeViewer();
        }
      } catch (err) {
        console.error('🔍 APS Viewer: Error loading viewer:', err);
        setError('Failed to load viewer');
        setLoading(false);
      }
    };

    const initializeViewer = () => {
      if (!viewerRef.current) return;

      try {
        const options = {
          env: 'AutodeskProduction',
          api: 'derivativeV2',
          getAccessToken: (onGetAccessToken: (token: string, expires: number) => void) => {
            onGetAccessToken(token, 3600);
          }
        };

        window.Autodesk.Viewing.Initializer(options, () => {
          // Create viewer with Revit-specific UI components
          const viewer = new window.Autodesk.Viewing.GuiViewer3D(viewerRef.current);
          
          // Store viewer instance for toggle functionality
          setViewerInstance(viewer);
          
          // Enable Revit-specific UI components
          viewer.setTheme('light-theme');
          
          // Start the viewer
          viewer.start();

          // Invert zoom scroll direction (make it more intuitive) - UNIVERSAL for all file types
          try {
            console.log('🔍 APS Viewer: Inverting zoom scroll direction for all file types...');
            
            // Method 1: Override the default zoom behavior
            const originalZoom = viewer.impl.camera.zoom;
            viewer.impl.camera.zoom = function(delta: number) {
              // Invert the delta to reverse zoom direction
              return originalZoom.call(this, -delta);
            };
            
            // Method 2: Universal wheel event listener for all file types (clean implementation)
            viewer.impl.canvas.addEventListener('wheel', function(event: WheelEvent) {
              // Prevent default behavior and handle manually
              event.preventDefault();
              
              // Get the delta and invert it
              const delta = event.deltaY;
              const zoomFactor = 0.1;
              
              // Apply zoom manually with inverted direction
              if (delta < 0) {
                // Scroll up = zoom in
                viewer.impl.camera.zoom(zoomFactor);
              } else {
                // Scroll down = zoom out
                viewer.impl.camera.zoom(-zoomFactor);
              }
              
              // Update the viewer
              viewer.impl.invalidate(true, true, true);
            }, { passive: false });
            
            console.log('✅ APS Viewer: Zoom scroll direction inverted for all file types');
          } catch (err) {
            console.log('⚠️ APS Viewer: Could not invert zoom direction:', err);
          }

          // Load the document using base64 URN if available, otherwise use regular URN
          const documentId = base64Urn ? base64Urn : (urn.startsWith('urn:') ? urn : 'urn:' + urn);
          console.log('🔍 APS Viewer: Loading document:', documentId);
          
          window.Autodesk.Viewing.Document.load(
            documentId,
            (doc: any) => {
              console.log('🔍 APS Viewer: Document loaded successfully');
              const defaultModel = doc.getRoot().getDefaultGeometry();
              viewer.loadDocumentNode(doc, defaultModel).then(() => {
                console.log('🔍 APS Viewer: Model loaded successfully, activating ModelStructure Extension...');
                
                // Store document for view panel functionality
                setCurrentDocument(doc);
                
                // Wait for the model to be fully loaded before checking type
                setTimeout(() => {
                  // Always extract viewables from the document, regardless of model type
                  console.log('🔍 APS Viewer: Extracting viewables from document...');
                  const root = doc.getRoot();
                  
                  // Extract 3D geometry views
                  const geometryViewables = root.search({ type: 'geometry' });
                  // Extract 2D sheet views
                  const sheetViewables = root.search({ type: 'sheet' });
                  
                  console.log('🔍 APS Viewer: Found geometry viewables:', geometryViewables.length);
                  console.log('🔍 APS Viewer: Found sheet viewables:', sheetViewables.length);
                  
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
                  console.log('✅ APS Viewer: Extracted', views.length, 'available views');
                  console.log('🔍 APS Viewer: Available views:', views.map(v => `${v.type}: ${v.name} (${v.role})`));
                  
                  // Log view extraction results to server
                  try {
                    fetch('/api/log-error', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        message: '✅ APS Viewer: Viewables extracted successfully',
                        details: {
                          geometryViewablesCount: geometryViewables.length,
                          sheetViewablesCount: sheetViewables.length,
                          totalViews: views.length,
                          availableViews: views.map(v => `${v.type}: ${v.name} (${v.role})`),
                          timestamp: new Date().toISOString()
                        }
                      })
                    });
                  } catch (err) {
                    console.log('Failed to log view extraction to server:', err);
                  }
                  
                  // Load and activate ModelStructure Extension for Revit Model Browser Panel
                  viewer.loadExtension('Autodesk.ModelStructure')
                    .then(() => {
                      console.log('✅ APS Viewer: ModelStructure Extension loaded successfully');
                      
                      // Don't activate the extension automatically - let user choose when to open it
                      console.log('✅ APS Viewer: ModelStructure Extension ready (not activated)');
                      
                      // Mark viewer as ready after extension is loaded
                      setIsViewerReady(true);
                      console.log('✅ APS Viewer: Viewer is now ready');
                    })
                    .catch((err: any) => {
                      console.error('⚠️ APS Viewer: ModelStructure Extension could not be loaded:', err);
                      // Still mark viewer as ready even if extension fails
                      setIsViewerReady(true);
                      console.log('✅ APS Viewer: Viewer is now ready (without ModelStructure Extension)');
                    });
                }, 2000); // Wait 2 seconds for model to be fully loaded
              });
              
              setLoading(false);
            },
            (error: any) => {
              console.error('🔍 APS Viewer: Error loading document:', error);
              setError('Failed to load document');
              setLoading(false);
            }
          );
                 });
       } catch (err) {
        console.error('🔍 APS Viewer: Error initializing viewer:', err);
        setError('Failed to initialize viewer');
        setLoading(false);
      }
    };

    loadViewer();
  }, [urn, token, base64Urn]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Viewer Header with horizontal buttons */}
      <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">APS Viewer</h2>
          <span className="text-gray-600">- {fileName}</span>
        </div>
        <div className="flex items-center space-x-3">
          {/* Views Panel Button */}
          <button
            onClick={toggleViewPanel}
            disabled={!isViewerReady}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isViewerReady 
                ? isViewPanelVisible
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title={isViewerReady ? 'Toggle Views Panel' : 'Viewer not ready'}
          >
            {isViewerReady ? (isViewPanelVisible ? 'Hide Views' : 'Show Views') : 'Loading...'}
          </button>
          
          {/* Model Structure Panel Button */}
          <button
            onClick={toggleModelBrowserPanel}
            disabled={!isViewerReady}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isViewerReady 
                ? isPanelVisible
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title={isViewerReady ? "Toggle Model Structure Panel" : "Viewer not ready yet"}
          >
            {!isViewerReady ? 'Loading...' : (isPanelVisible ? 'Hide Structure' : 'Show Structure')}
          </button>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-md"
          >
            Close
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
              <p className="text-gray-600">Loading APS Viewer...</p>
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
                Close
              </button>
            </div>
          </div>
        )}

        {/* Viewer Canvas */}
        <div ref={viewerRef} className="w-full h-full bg-white"></div>

        {/* Custom View Panel (Pläne und Ansichten) - Open by default */}
        {isViewPanelVisible && availableViews.length > 0 && (
          <div className="absolute left-0 top-0 w-80 h-full bg-white border-r border-gray-200 z-20 shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Pläne und Ansichten</h3>
                <button
                  onClick={() => setIsViewPanelVisible(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>
              
              {/* 2D/3D Tabs */}
              <div className="flex mb-4 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('2D')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === '2D' 
                      ? 'text-gray-900 border-b-2 border-gray-900' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  2D Pläne
                </button>
                <button
                  onClick={() => setActiveTab('3D')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === '3D' 
                      ? 'text-gray-900 border-b-2 border-gray-900' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  3D Ansichten
                </button>
              </div>
              
              {/* View List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableViews
                  .filter(view => view.type === activeTab)
                  .map((view, index) => (
                    <button
                      key={index}
                      onClick={() => loadView(view)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all hover:shadow-sm"
                    >
                      <div className="font-medium text-gray-900">{view.name}</div>
                      <div className="text-sm text-gray-500">{view.type}</div>
                    </button>
                  ))}
              </div>
              
              {/* Only show "no views" message if there are actually no views of the current type */}
              {availableViews.filter(view => view.type === activeTab).length === 0 && availableViews.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                  Keine {activeTab === '2D' ? 'Pläne' : 'Ansichten'} verfügbar
                </div>
              )}
            </div>
          </div>
        )}

        {/* Model Structure Panel - Only show when explicitly opened */}
        {isPanelVisible && (
          <div className="absolute right-0 top-0 w-80 h-full bg-white border-l border-gray-200 z-20 shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Model Structure</h3>
                <button
                  onClick={() => setIsPanelVisible(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="text-gray-600">
                Model structure panel content will appear here when the ModelStructure extension is loaded.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

