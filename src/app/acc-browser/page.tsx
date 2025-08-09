'use client';

import React, { useState, useEffect } from 'react';
import { DefaultPageLayout } from '@/ui/layouts/DefaultPageLayout';
import { Select } from '@/ui/components/Select';
import { TextField } from '@/ui/components/TextField';
import { Button } from '@/ui/components/Button';
import { Table } from '@/ui/components/Table';
import { Badge } from '@/ui/components/Badge';
import { IconButton } from '@/ui/components/IconButton';
import { Breadcrumbs } from '@/ui/components/Breadcrumbs';
import { 
  FeatherSearch, 
  FeatherFolder, 
  FeatherDatabase,
  FeatherPlus,
  FeatherSettings,
  FeatherUserCircle,
  FeatherCloud
} from '@subframe/core';

interface ACCProject {
  id: string;
  name: string;
  status: string;
  projectType?: string;
}

export default function ACCBrowserPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ACCProject[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 ACC Browser: Loading projects...');
      
      const response = await fetch('/api/acc/projects');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setProjects(result.projects || []);
        console.log(`✅ ACC Browser: Successfully loaded ${result.projects?.length || 0} projects`);
      } else {
        throw new Error(result.error?.message || 'Failed to load projects');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ ACC Browser: Error loading projects:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = async (projectId: string) => {
    setSelectedProjectId(projectId);
    const project = projects.find(p => p.id === projectId);
    if (project) {
      console.log(`🔍 ACC Browser: Selected project: ${project.name} (${project.id})`);
      // TODO: Load project contents when we implement the second API
    }
  };

  const handleRefresh = async () => {
    await loadProjects();
  };

  return (
    <DefaultPageLayout>
      <div className="flex w-full flex-col items-start gap-4 px-12 py-12">
        {/* Header */}
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col items-start gap-2">
            <span className="text-heading-1 font-heading-1 text-default-font">
              ACC Cloud Browser
            </span>
            <span className="text-body font-body text-subtext-color">
              Durchsuchen Sie ACC-Projekte und Dateien
            </span>
          </div>
          <Button
            size="medium"
            variant="neutral-primary"
            icon={<FeatherPlus />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Aktualisieren
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex w-full items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md">
            <span className="text-body font-body text-red-600">
              Fehler: {error}
            </span>
          </div>
        )}

        {/* Project Selection Dropdown */}
        <div className="flex w-full items-center gap-4">
          <div className="flex flex-col items-start gap-2">
            <span className="text-body-bold font-body-bold text-default-font">
              Projekt auswählen:
            </span>
            <Select
              placeholder={loading ? "Lade Projekte..." : "Projekt wählen..."}
              value={selectedProjectId}
              onValueChange={handleProjectSelect}
              disabled={loading}
            >
              {projects.map((project) => (
                <Select.Item key={project.id} value={project.id}>
                  {project.name} ({project.status})
                </Select.Item>
              ))}
            </Select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex w-full items-center gap-4">
          <div className="flex flex-col items-start gap-2 flex-1">
            <span className="text-body-bold font-body-bold text-default-font">
              Suche:
            </span>
            <TextField
              size="medium"
              placeholder="Dateien und Ordner durchsuchen..."
              icon={<FeatherSearch />}
              value={searchTerm}
              onChange={(e) => {
                console.log('🔍 ACC Browser: Search term changed:', e.target.value);
                setSearchTerm(e.target.value);
              }}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex w-full items-center justify-center p-8">
            <span className="text-body font-body text-subtext-color">
              Lade Projekte...
            </span>
          </div>
        )}

        {/* No Projects Selected */}
        {!selectedProjectId && !loading && projects.length > 0 && (
          <div className="flex w-full items-center justify-center p-8">
            <span className="text-body font-body text-subtext-color">
              Bitte wählen Sie ein Projekt aus, um zu beginnen
            </span>
          </div>
        )}

        {/* No Projects Available */}
        {!loading && projects.length === 0 && !error && (
          <div className="flex w-full items-center justify-center p-8">
            <span className="text-body font-body text-subtext-color">
              Keine Projekte verfügbar. Bitte überprüfen Sie Ihre ACC-Berechtigungen.
            </span>
          </div>
        )}

        {/* Content Table - Will be implemented with second API */}
        {selectedProjectId && (
          <div className="flex w-full items-center justify-center p-8">
            <span className="text-body font-body text-subtext-color">
              Projekt ausgewählt: {projects.find(p => p.id === selectedProjectId)?.name}
              <br />
              Dateimanagement-API wird als nächstes implementiert...
            </span>
          </div>
        )}
      </div>
    </DefaultPageLayout>
  );
}
