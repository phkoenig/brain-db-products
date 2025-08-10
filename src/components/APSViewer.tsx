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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

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
          
          // Enable Revit-specific UI components
          viewer.setTheme('light-theme');
          
          // Start the viewer
          viewer.start();

          // Load the document using base64 URN if available, otherwise use regular URN
          const documentId = base64Urn ? base64Urn : (urn.startsWith('urn:') ? urn : 'urn:' + urn);
          console.log('🔍 APS Viewer: Loading document:', documentId);
          
          window.Autodesk.Viewing.Document.load(
            documentId,
            (doc: any) => {
              console.log('🔍 APS Viewer: Document loaded successfully');
              const defaultModel = doc.getRoot().getDefaultGeometry();
              viewer.loadDocumentNode(doc, defaultModel);
              
              // Enable Revit-specific UI after document is loaded
              setTimeout(() => {
                try {
                  // Enable the Revit View Selector (Model Browser)
                  if (viewer.impl && viewer.impl.model) {
                    console.log('🔍 APS Viewer: Enabling Revit View Selector...');
                    
                    // Show the model browser panel (contains Revit views)
                    viewer.showPanel(window.Autodesk.Viewing.UI.PANEL_ID.MODELBROWSER);
                    
                    // Enable Revit-specific features
                    if (viewer.impl.model.getData().type === 'rvt') {
                      console.log('🔍 APS Viewer: Revit model detected, enabling view selector');
                      
                      // Force refresh of the model browser to show Revit views
                      const modelBrowser = viewer.getPanel(window.Autodesk.Viewing.UI.PANEL_ID.MODELBROWSER);
                      if (modelBrowser) {
                        modelBrowser.setVisible(true);
                        modelBrowser.update();
                      }
                    }
                  }
                } catch (err) {
                  console.log('🔍 APS Viewer: Could not enable Revit View Selector:', err);
                }
              }, 2000); // Wait 2 seconds for document to fully load
              
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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
      <div className="bg-white w-full h-full flex flex-col">
        {/* Viewer Header */}
        <div className="bg-gray-100 px-6 py-4 flex items-center justify-between border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">APS Viewer</h2>
            <span className="text-gray-600">- {fileName}</span>
          </div>
          <button
            onClick={onClose}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Close Viewer
          </button>
        </div>
        
        {/* Viewer Content */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading APS Viewer...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
              <div className="text-center">
                <div className="text-6xl mb-4">❌</div>
                <h3 className="text-xl font-medium mb-2 text-red-600">Viewer Error</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={onClose}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
          
          <div 
            ref={viewerRef} 
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
        </div>
      </div>
    </div>
  );
}
