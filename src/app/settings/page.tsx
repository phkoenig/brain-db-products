'use client';

import { useState, useEffect } from 'react';
import { DefaultPageLayout } from '@/ui/layouts/DefaultPageLayout';
import { Button } from '@/ui/components/Button';
import { Tabs } from '@/ui/components/Tabs';
import { supabase } from '@/lib/supabase';
import { ProductFieldDefinition, loadProductFieldDefinitions, clearFieldDefinitionsCache } from '@/lib/schemas/product-fields';

export default function SettingsPage() {
  const [fields, setFields] = useState<ProductFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Load field definitions
  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setLoading(true);
      const schema = await loadProductFieldDefinitions();
      setFields(schema.fields);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load field definitions');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (field: ProductFieldDefinition) => {
    try {
      const { error } = await supabase
        .from('product_field_definitions')
        .update({
          is_active: !field.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', field.id);

      if (error) throw error;

      clearFieldDefinitionsCache();
      await loadFields();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle field status');
    }
  };

  const getCategoryStats = () => {
    const stats: Record<string, { total: number; active: number }> = {};
    
    fields.forEach(field => {
      if (!stats[field.category]) {
        stats[field.category] = { total: 0, active: 0 };
      }
      stats[field.category].total++;
      if (field.is_active) {
        stats[field.category].active++;
      }
    });
    
    return stats;
  };

  const categoryStats = getCategoryStats();

  if (loading) {
    return (
      <DefaultPageLayout>
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-lg">Loading field definitions...</div>
        </div>
      </DefaultPageLayout>
    );
  }

  if (error) {
    return (
      <DefaultPageLayout>
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      </DefaultPageLayout>
    );
  }

  return (
    <DefaultPageLayout>
      <div className="flex h-full w-full flex-col items-start gap-4 bg-default-background px-4 py-4">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Product Field Definitions</h1>
          <Button onClick={loadFields} variant="neutral-secondary">
            Refresh
          </Button>
        </div>

        <Tabs className="w-full">
          <Tabs.Item 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </Tabs.Item>
          <Tabs.Item 
            active={activeTab === 'fields'} 
            onClick={() => setActiveTab('fields')}
          >
            All Fields
          </Tabs.Item>
        </Tabs>

        {activeTab === 'overview' && (
          <div className="mt-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(categoryStats).map(([category, stats]) => (
                <div key={category} className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg capitalize">{category.replace('_', ' ')}</h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Total Fields:</span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm">{stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active:</span>
                      <span className={`px-2 py-1 rounded text-sm ${stats.active === stats.total ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                        {stats.active}/{stats.total}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{fields.length}</div>
                  <div className="text-sm text-gray-600">Total Fields</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {fields.filter(f => f.is_active).length}
                  </div>
                  <div className="text-sm text-gray-600">Active Fields</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.keys(categoryStats).length}
                  </div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {fields.filter(f => f.extraction_hints && f.extraction_hints.length > 0).length}
                  </div>
                  <div className="text-sm text-gray-600">With Hints</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fields' && (
          <div className="mt-4 w-full">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-2 text-left">Field Name</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Label</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Category</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Type</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Status</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2 font-mono text-sm">{field.field_name}</td>
                      <td className="border border-gray-300 px-3 py-2">{field.label}</td>
                      <td className="border border-gray-300 px-3 py-2">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm capitalize">
                          {field.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm">{field.data_type}</span>
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${field.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {field.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <div className="flex gap-2">
                          <Button
                            size="small"
                            variant="neutral-secondary"
                            onClick={() => handleToggleActive(field)}
                          >
                            {field.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DefaultPageLayout>
  );
} 