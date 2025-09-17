"use client";

import React, { useState } from 'react';
import { SidebarRailWithLabels } from '@/ui/components/SidebarRailWithLabels';
import { FeatherArmchair } from "@subframe/core";
import { FeatherBox } from "@subframe/core";
import { FeatherCalendarDays } from "@subframe/core";
import { FeatherCamera } from "@subframe/core";
import { FeatherDoorClosed } from "@subframe/core";
import { FeatherImage } from "@subframe/core";
import { FeatherMap } from "@subframe/core";
import { FeatherSettings } from "@subframe/core";
import { FeatherStamp } from "@subframe/core";
import { FeatherUsers } from "@subframe/core";
import F16Viewer from './F16Viewer';

interface F16SidebarProps {
  currentPage: 'logbuch' | '3d' | 'plaene' | 'bemusterung' | 'raumbuch' | 'fotos' | 'visualisierung' | 'beteiligte' | 'dokumente' | 'settings';
}

export function F16Sidebar({ currentPage }: F16SidebarProps) {
  const [showViewer, setShowViewer] = useState(false);
  const [modelPath, setModelPath] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handle3DClick = async () => {
    console.log('🔍 F16 Sidebar: 3D button clicked');
    
    try {
      setLoading(true);
      
      // Get the model path from settings
      const settingsResponse = await fetch('/api/f16/settings');
      if (!settingsResponse.ok) {
        throw new Error('Failed to load settings');
      }
      
      const settings = await settingsResponse.json();
      if (!settings.model_path) {
        alert('Kein 3D-Modell-Pfad konfiguriert. Bitte gehen Sie zu den Einstellungen und wählen Sie ein Modell aus.');
        return;
      }
      
      console.log('🔍 F16 Sidebar: Model path found:', settings.model_path);
      
      // Check if we have a valid token by testing the projects API
      const projectsResponse = await fetch('/api/acc/projects');
      if (!projectsResponse.ok) {
        throw new Error('No valid ACC token available. Please authenticate first.');
      }
      
      console.log('🔍 F16 Sidebar: Token validated, opening viewer...');
      
      // Set model path and open viewer
      setModelPath(settings.model_path);
      setShowViewer(true);
      
    } catch (err) {
      console.error('🔍 F16 Sidebar: Error opening 3D viewer:', err);
      
      // If authentication is required, redirect to auth
      if (err instanceof Error && err.message.includes('No valid ACC token')) {
        console.log('🔍 F16 Sidebar: Redirecting to ACC authorization...');
        window.location.href = '/auth/acc-authorize';
        return;
      }
      
      alert(`Fehler beim Öffnen des 3D-Viewers: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarRailWithLabels
      className="h-auto w-28 flex-none self-stretch"
      header={
        <div className="flex flex-col items-center justify-center gap-2 px-1 py-1">
          <span className="text-heading-1 font-heading-1 text-default-font">
            F16
          </span>
        </div>
      }
      footer={
        <SidebarRailWithLabels.NavItem 
          icon={<FeatherSettings />}
          selected={currentPage === 'settings'}
          onClick={() => window.location.href = '/zepta/f16/settings'}
        >
          Einstellungen
        </SidebarRailWithLabels.NavItem>
      }
    >
      <div className="flex w-full grow shrink-0 basis-0 flex-col items-start">
        <SidebarRailWithLabels.NavItem
          icon={<FeatherCalendarDays />}
          selected={currentPage === 'logbuch'}
          onClick={() => window.location.href = '/zepta/f16'}
        >
          Logbuch
        </SidebarRailWithLabels.NavItem>
        
        <SidebarRailWithLabels.NavItem 
          icon={<FeatherBox />}
          selected={currentPage === '3d'}
          onClick={handle3DClick}
          disabled={loading}
        >
          {loading ? 'Lädt...' : '3D'}
        </SidebarRailWithLabels.NavItem>
        
        <SidebarRailWithLabels.NavItem 
          icon={<FeatherMap />}
          onClick={() => window.location.href = '/zepta/f16/plaene'}
        >
          Pläne
        </SidebarRailWithLabels.NavItem>
        
        <SidebarRailWithLabels.NavItem 
          icon={<FeatherArmchair />}
          onClick={() => window.location.href = '/zepta/f16/bemusterung'}
        >
          Bemusterung
        </SidebarRailWithLabels.NavItem>
        
        <SidebarRailWithLabels.NavItem 
          icon={<FeatherDoorClosed />}
          onClick={() => window.location.href = '/zepta/f16/raumbuch'}
        >
          Raumbuch
        </SidebarRailWithLabels.NavItem>
        
        <SidebarRailWithLabels.NavItem 
          icon={<FeatherCamera />}
          onClick={() => window.location.href = '/zepta/f16/fotos'}
        >
          Fotos
        </SidebarRailWithLabels.NavItem>
        
        <SidebarRailWithLabels.NavItem 
          icon={<FeatherImage />}
          onClick={() => window.location.href = '/zepta/f16/visualisierung'}
        >
          Visualisierung
        </SidebarRailWithLabels.NavItem>
        
        <SidebarRailWithLabels.NavItem 
          icon={<FeatherUsers />}
          onClick={() => window.location.href = '/zepta/f16/beteiligte'}
        >
          Beteiligte
        </SidebarRailWithLabels.NavItem>
        
        <SidebarRailWithLabels.NavItem 
          icon={<FeatherStamp />}
          onClick={() => window.location.href = '/zepta/f16/dokumente'}
        >
          Dokumente
        </SidebarRailWithLabels.NavItem>
      </div>
      
      {/* F16 Viewer Modal */}
      {showViewer && modelPath && (
        <F16Viewer
          onClose={() => setShowViewer(false)}
          modelPath={modelPath}
          viewName="KP-AXO-ZZ"
        />
      )}
    </SidebarRailWithLabels>
  );
}
