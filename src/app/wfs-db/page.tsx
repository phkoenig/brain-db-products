"use client";
import React, { useState, useEffect } from "react";
import { WFSLayer, fetchBundeslaender, fetchFeatureTypen } from "@/lib/supabase-client";
import { Badge } from "@/ui/components/Badge";
import { IconButton } from "@/ui/components/IconButton";
import { Select } from "@/ui/components/Select";
import { Table } from "@/ui/components/Table";
import { TextField } from "@/ui/components/TextField";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";

export default function WFSLayerPage() {
  // State für Filter
  const [selectedBundesland, setSelectedBundesland] = useState<string>("");
  const [selectedFeatureTyp, setSelectedFeatureTyp] = useState<string>("");
  const [inspireFilter, setInspireFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // State für Daten
  const [wfsLayers, setWfsLayers] = useState<WFSLayer[]>([]);
  const [bundeslaender, setBundeslaender] = useState<string[]>([]);
  const [featureTypen, setFeatureTypen] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lade Daten beim Start
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Lade alle Daten parallel
        const [layers, bundeslaenderData, featureTypenData] = await Promise.all([
          fetch('/api/wfs-layers').then(res => res.json()),
          fetchBundeslaender(),
          fetchFeatureTypen()
        ]);
        
        setWfsLayers(layers);
        setBundeslaender(bundeslaenderData);
        setFeatureTypen(featureTypenData);
      } catch (err) {
        setError('Fehler beim Laden der Daten');
        console.error('Fehler beim Laden der Daten:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter-Logik
  const filteredLayers = wfsLayers.filter(layer => {
    // Bundesland-Filter
    if (selectedBundesland && layer.bundesland_oder_region !== selectedBundesland) {
      return false;
    }
    
    // Feature-Typ-Filter
    if (selectedFeatureTyp && layer.feature_typ !== selectedFeatureTyp) {
      return false;
    }
    
    // INSPIRE-Filter
    if (inspireFilter === "inspire" && !layer.inspire_konform) {
      return false;
    }
    if (inspireFilter === "nicht_inspire" && layer.inspire_konform) {
      return false;
    }
    
    // Such-Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = layer.title?.toLowerCase().includes(query);
      const matchesKeywords = layer.schluesselwoerter?.some(keyword => 
        keyword.toLowerCase().includes(query)
      );
      const matchesAbstract = layer.abstract?.toLowerCase().includes(query);
      
      if (!matchesTitle && !matchesKeywords && !matchesAbstract) {
        return false;
      }
    }
    
    return true;
  });

  // Reset-Filter
  const resetFilters = () => {
    setSelectedBundesland("");
    setSelectedFeatureTyp("");
    setInspireFilter("all");
    setSearchQuery("");
  };

  if (loading) {
    return (
      <DefaultPageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade WFS-Layer...</div>
        </div>
      </DefaultPageLayout>
    );
  }

  if (error) {
    return (
      <DefaultPageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">{error}</div>
        </div>
      </DefaultPageLayout>
    );
  }

  return (
    <DefaultPageLayout>
      <div className="p-6 space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WFS-Layer Datenbank</h1>
            <p className="text-gray-600 mt-1">
              {filteredLayers.length} von {wfsLayers.length} Layern angezeigt
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <IconButton icon={"🗂️"} variant="neutral-secondary" size="small" />
            <IconButton icon={"📋"} variant="neutral-secondary" size="small" />
          </div>
        </div>

        {/* Filter-Bereich */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <TextField icon={"🔍"}>
                <TextField.Input
                  placeholder="Suche nach Layern..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </TextField>
            </div>
            <IconButton icon={"❌"} variant="neutral-secondary" size="small" onClick={resetFilters} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bundesland-Filter */}
            <Select placeholder="Bundesland auswählen" value={selectedBundesland} onValueChange={(v) => setSelectedBundesland(v)}>
              {bundeslaender.map((b) => (
                // @ts-ignore: Select.Item value prop is supported by wrapper, typing mismatch
                <Select.Item key={b} value={b}>{b}</Select.Item>
              ))}
            </Select>

            {/* Feature-Typ-Filter */}
            <Select placeholder="Feature-Typ auswählen" value={selectedFeatureTyp} onValueChange={(v) => setSelectedFeatureTyp(v)}>
              {featureTypen.map((t) => (
                // @ts-ignore: Select.Item value prop is supported by wrapper, typing mismatch
                <Select.Item key={t} value={t}>{t}</Select.Item>
              ))}
            </Select>

            {/* INSPIRE-Filter */}
            <Select placeholder="INSPIRE-Filter" value={inspireFilter} onValueChange={(v) => setInspireFilter(v)}>
              <Select.Item value="all">Alle</Select.Item>
              <Select.Item value="inspire">✅ INSPIRE</Select.Item>
              <Select.Item value="nicht_inspire">🚩 Nicht INSPIRE</Select.Item>
            </Select>
          </div>
        </div>

        {/* Tabelle */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <Table
            header={
              <Table.HeaderRow>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Bundesland</Table.HeaderCell>
                <Table.HeaderCell>Feature-Typ</Table.HeaderCell>
                <Table.HeaderCell>INSPIRE</Table.HeaderCell>
                <Table.HeaderCell>Geometrie</Table.HeaderCell>
                <Table.HeaderCell>Schlüsselwörter</Table.HeaderCell>
                <Table.HeaderCell>Aktionen</Table.HeaderCell>
              </Table.HeaderRow>
            }
          >
            {filteredLayers.map((layer) => (
              <Table.Row key={layer.id}>
                <Table.Cell>
                  <div>
                    <div className="font-medium text-gray-900">{layer.title}</div>
                    <div className="text-sm text-gray-500">{layer.name}</div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="neutral">{layer.bundesland_oder_region || "Unbekannt"}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="neutral">{layer.feature_typ || "Unbekannt"}</Badge>
                </Table.Cell>
                <Table.Cell>
                  {layer.inspire_konform ? (
                    <Badge variant="success">Konform</Badge>
                  ) : (
                    <Badge variant="neutral">Nicht konform</Badge>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="neutral">{layer.geometrietyp || "Unbekannt"}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex flex-wrap gap-1">
                    {layer.schluesselwoerter?.slice(0, 3).map((keyword, index) => (
                      <Badge key={index} variant="neutral">{keyword}</Badge>
                    ))}
                    {layer.schluesselwoerter && layer.schluesselwoerter.length > 3 && (
                      <Badge variant="neutral">+{layer.schluesselwoerter.length - 3}</Badge>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center space-x-2">
                    <IconButton icon={"📍"} variant="neutral-secondary" size="small" />
                    <IconButton icon={"⬇️"} variant="neutral-secondary" size="small" />
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table>
        </div>
      </div>
    </DefaultPageLayout>
  );
}
