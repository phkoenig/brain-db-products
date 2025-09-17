"use client";

import React, { useEffect, useState } from 'react';
import { F16Sidebar } from '@/components/f16/F16Sidebar';
import APSViewer from '@/components/APSViewer';

interface ViewerPageProps {
  searchParams: {
    urn?: string;
    token?: string;
    view?: string;
  };
}

export default function F16ViewerPage({ searchParams }: ViewerPageProps) {
  const [viewerData, setViewerData] = useState<{
    urn: string;
    token: string;
    view?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { urn, token, view } = searchParams;
    
    if (!urn || !token) {
      setError('Missing URN or token parameters');
      setLoading(false);
      return;
    }
    
    console.log('🔍 F16 Viewer: Initializing with:', { urn, token, view });
    
    setViewerData({
      urn: decodeURIComponent(urn),
      token: decodeURIComponent(token),
      view: view ? decodeURIComponent(view) : 'KP-AXO-ZZ'
    });
    
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center">
        <F16Sidebar currentPage="3d" />
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 self-stretch overflow-y-auto bg-default-background">
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <div className="text-heading-2 font-heading-2 text-default-font mb-4">
                Lade 3D-Modell...
              </div>
              <div className="text-body font-body text-subtext-color">
                Bitte warten Sie, während das BIM-Modell geladen wird.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !viewerData) {
    return (
      <div className="flex h-screen w-full items-center">
        <F16Sidebar currentPage="3d" />
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 self-stretch overflow-y-auto bg-default-background">
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <div className="text-heading-2 font-heading-2 text-red-600 mb-4">
                Fehler beim Laden des 3D-Modells
              </div>
              <div className="text-body font-body text-subtext-color mb-4">
                {error || 'Unbekannter Fehler'}
              </div>
              <button 
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90"
              >
                Zurück
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center">
      <F16Sidebar currentPage="3d" />
      <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 self-stretch overflow-y-auto bg-default-background">
        <div className="flex h-full w-full flex-col">
          <div className="flex items-center justify-between p-4 border-b border-neutral-border">
            <div>
              <h1 className="text-heading-2 font-heading-2 text-default-font">
                F16 3D-Modell
              </h1>
              <p className="text-body font-body text-subtext-color">
                {viewerData.view && `View: ${viewerData.view}`}
              </p>
            </div>
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-md hover:bg-neutral-200"
            >
              Zurück zum Logbuch
            </button>
          </div>
          
          <div className="flex-1">
            <APSViewer
              urn={viewerData.urn}
              token={viewerData.token}
              viewName={viewerData.view}
              fileName="F16 BIM Model"
              onClose={() => window.history.back()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
