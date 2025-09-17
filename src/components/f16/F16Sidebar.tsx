"use client";

import React from 'react';
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
import { useF16ACC } from '@/hooks/useF16ACC';

interface F16SidebarProps {
  currentPage: 'logbuch' | '3d' | 'plaene' | 'bemusterung' | 'raumbuch' | 'fotos' | 'visualisierung' | 'beteiligte' | 'dokumente' | 'settings';
}

export function F16Sidebar({ currentPage }: F16SidebarProps) {
  const { loadBIMModel, openViewer, loading, error } = useF16ACC();

  const handle3DClick = async () => {
    console.log('🔍 F16 Sidebar: 3D button clicked');
    
    try {
      // Load BIM model first
      const success = await loadBIMModel();
      
      if (success) {
        // Open viewer with specific view
        openViewer('KP-AXO-ZZ');
      } else {
        console.error('🔍 F16 Sidebar: Failed to load BIM model');
        alert('Fehler beim Laden des 3D-Modells. Bitte versuchen Sie es erneut.');
      }
    } catch (err) {
      console.error('🔍 F16 Sidebar: Error opening 3D viewer:', err);
      
      // If 3-legged OAuth is required, redirect to auth
      if (err instanceof Error && err.message.includes('3-legged OAuth required')) {
        console.log('🔍 F16 Sidebar: Redirecting to ACC authorization...');
        window.location.href = '/auth/acc-authorize';
        return;
      }
      
      alert('Fehler beim Öffnen des 3D-Viewers. Bitte versuchen Sie es erneut.');
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
    </SidebarRailWithLabels>
  );
}
