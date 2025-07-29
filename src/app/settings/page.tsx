'use client';

import { useState, useEffect } from 'react';
import { DefaultPageLayout } from '@/ui/layouts/DefaultPageLayout';
import { Button } from '@/ui/components/Button';
import { TextField } from '@/ui/components/TextField';
import { Select } from '@/ui/components/Select';
import { Table } from '@/ui/components/Table';
import { Tabs } from '@/ui/components/Tabs';
import { Badge } from '@/ui/components/Badge';
import { supabase } from '@/lib/supabase';
import { ProductFieldDefinition, loadProductFieldDefinitions, clearFieldDefinitionsCache } from '@/lib/schemas/product-fields';

export default function SettingsPage() {
  const [fields, setFields] = useState<ProductFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<ProductFieldDefinition | null>(null);
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

  const handleEditField = (field: ProductFieldDefinition) => {
    setEditingField(field);
    setActiveTab('edit');
  };

  const handleSaveField = async (updatedField: ProductFieldDefinition) => {
    try {
      const { error } = await supabase
        .from('product_field_definitions')
        .update({
          label: updatedField.label,
          description: updatedField.description,
          examples: updatedField.examples,
          extraction_hints: updatedField.extraction_hints,
          is_active: updatedField.is_active,
          sort_order: updatedField.sort_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedField.id);

      if (error) throw error;

      // Clear cache and reload
      clearFieldDefinitionsCache();
      await loadFields();
      setEditingField(null);
      setActiveTab('overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update field');
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

  if (loading) {
    return (
      <DefaultPageLayout>
        <div className="flex h-full w-full items-center justify-center">
          Loading field definitions...
        </div>
      </DefaultPageLayout>
    );
  }

  if (error) {
    return (
      <DefaultPageLayout>
        <div className="flex h-full w-full items-center justify-center text-red-500">
          Error: {error}
        </div>
      </DefaultPageLayout>
    );
  }

  const categoryStats = getCategoryStats();

  return (
    <DefaultPageLayout>
      <div className="flex h-full w-full flex-col items-start gap-4 bg-default-background px-4 py-4">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Product Field Definitions</h1>
          <Button onClick={loadFields} variant="outline">
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
            <Tabs.Trigger value="fields">All Fields</Tabs.Trigger>
            <Tabs.Trigger value="edit">Edit Field</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(categoryStats).map(([category, stats]) => (
                <div key={category} className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg capitalize">{category.replace('_', ' ')}</h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Total Fields:</span>
                      <Badge variant="outline">{stats.total}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Active:</span>
                      <Badge variant={stats.active === stats.total ? "default" : "secondary"}>
                        {stats.active}/{stats.total}
                      </Badge>
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
          </Tabs.Content>

          <Tabs.Content value="fields" className="mt-4">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Field Name</Table.Head>
                  <Table.Head>Label</Table.Head>
                  <Table.Head>Category</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {fields.map((field) => (
                  <Table.Row key={field.id}>
                    <Table.Cell className="font-mono text-sm">{field.field_name}</Table.Cell>
                    <Table.Cell>{field.label}</Table.Cell>
                    <Table.Cell>
                      <Badge variant="outline" className="capitalize">
                        {field.category.replace('_', ' ')}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant="secondary">{field.data_type}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={field.is_active ? "default" : "destructive"}>
                        {field.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditField(field)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={field.is_active ? "destructive" : "default"}
                          onClick={() => handleToggleActive(field)}
                        >
                          {field.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Tabs.Content>

          <Tabs.Content value="edit" className="mt-4">
            {editingField ? (
              <EditFieldForm
                field={editingField}
                onSave={handleSaveField}
                onCancel={() => {
                  setEditingField(null);
                  setActiveTab('overview');
                }}
              />
            ) : (
              <div className="text-center text-gray-500">
                Select a field to edit from the "All Fields" tab
              </div>
            )}
          </Tabs.Content>
        </Tabs>
      </div>
    </DefaultPageLayout>
  );
}

interface EditFieldFormProps {
  field: ProductFieldDefinition;
  onSave: (field: ProductFieldDefinition) => void;
  onCancel: () => void;
}

function EditFieldForm({ field, onSave, onCancel }: EditFieldFormProps) {
  const [formData, setFormData] = useState({
    label: field.label,
    description: field.description || '',
    examples: field.examples ? field.examples.join(', ') : '',
    extraction_hints: field.extraction_hints ? field.extraction_hints.join(', ') : '',
    is_active: field.is_active,
    sort_order: field.sort_order
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedField: ProductFieldDefinition = {
      ...field,
      label: formData.label,
      description: formData.description || null,
      examples: formData.examples ? formData.examples.split(',').map(s => s.trim()) : null,
      extraction_hints: formData.extraction_hints ? formData.extraction_hints.split(',').map(s => s.trim()) : null,
      is_active: formData.is_active,
      sort_order: formData.sort_order
    };

    onSave(updatedField);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="font-semibold mb-2">Field Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Field Name:</span>
            <span className="ml-2 font-mono">{field.field_name}</span>
          </div>
          <div>
            <span className="font-medium">Category:</span>
            <span className="ml-2 capitalize">{field.category.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="font-medium">Data Type:</span>
            <span className="ml-2">{field.data_type}</span>
          </div>
          <div>
            <span className="font-medium">Created:</span>
            <span className="ml-2">{new Date(field.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <TextField
        label="Label"
        value={formData.label}
        onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
        required
      />

      <TextField
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        multiline
        rows={3}
      />

      <TextField
        label="Examples (comma-separated)"
        value={formData.examples}
        onChange={(e) => setFormData(prev => ({ ...prev, examples: e.target.value }))}
        placeholder="Example1, Example2, Example3"
      />

      <TextField
        label="Extraction Hints (comma-separated)"
        value={formData.extraction_hints}
        onChange={(e) => setFormData(prev => ({ ...prev, extraction_hints: e.target.value }))}
        placeholder="hint1, hint2, hint3"
        helperText="Keywords and selectors to help extraction algorithms find this field"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Active Status</label>
          <Select
            value={formData.is_active ? 'true' : 'false'}
            onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'true' }))}
          >
            <Select.Option value="true">Active</Select.Option>
            <Select.Option value="false">Inactive</Select.Option>
          </Select>
        </div>

        <TextField
          label="Sort Order"
          type="number"
          value={formData.sort_order.toString()}
          onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" variant="default">
          Save Changes
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
} 