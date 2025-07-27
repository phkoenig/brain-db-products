"use client";

import React, { useState } from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { Table } from "@/ui/components/Table";
import { Badge } from "@/ui/components/Badge";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import { FeatherStar, FeatherPlus, FeatherEdit2, FeatherTrash, FeatherMoreHorizontal } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { IconButton } from "@/ui/components/IconButton";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";
import { MaterialCategory } from "@/types/material-categories";

function Settings() {
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MaterialCategory | null>(null);

  // Form state for Add modal
  const [addForm, setAddForm] = useState({
    id: '',
    main_category: '',
    sub_category: '',
    label: ''
  });

  // Form state for Edit modal
  const [editForm, setEditForm] = useState({
    main_category: '',
    sub_category: '',
    label: ''
  });

  const { categories, loading, error, deleteCategory, createCategory, updateCategory } = useMaterialCategories();

  console.log("6. [UI] Rendering Settings page. State:", { loading, error, categories_count: categories.length });

  // Loading state
  if (loading) {
    return (
      <DefaultPageLayout>
        <div className="flex w-full flex-col items-start gap-4 px-12 py-12">
          <div className="flex flex-col items-start gap-4">
            <span className="whitespace-pre-wrap text-heading-2 font-heading-2 text-default-font">
              {"Kategorien\n"}
            </span>
            <div className="text-body font-body text-neutral-500">
              Lade Kategorien...
            </div>
          </div>
        </div>
      </DefaultPageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DefaultPageLayout>
        <div className="flex w-full flex-col items-start gap-4 px-12 py-12">
          <div className="flex flex-col items-start gap-4">
            <span className="whitespace-pre-wrap text-heading-2 font-heading-2 text-default-font">
              {"Kategorien\n"}
            </span>
            <div className="text-body font-body text-error-500">
              Fehler beim Laden der Kategorien: {error}
            </div>
          </div>
        </div>
      </DefaultPageLayout>
    );
  }

  // Handle delete category
  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      console.log(`Kategorie ${id} erfolgreich gelöscht`);
    } catch (err) {
      console.error('Fehler beim Löschen der Kategorie:', err);
    }
  };

  // Handle add new category
  const handleAddCategory = () => {
    console.log('Add category clicked');
    setShowAddModal(true);
  };

  // Handle edit category
  const handleEditCategory = (category: MaterialCategory) => {
    console.log('Edit category clicked:', category);
    setEditingCategory(category);
    setEditForm({
      main_category: category.main_category,
      sub_category: category.sub_category,
      label: category.label
    });
    setShowEditModal(true);
  };

  // Handle save new category
  const handleSaveAdd = async () => {
    try {
      if (!addForm.id || !addForm.main_category || !addForm.sub_category || !addForm.label) {
        alert('Bitte alle Felder ausfüllen');
        return;
      }
      
      await createCategory({
        id: addForm.id,
        main_category: addForm.main_category,
        sub_category: addForm.sub_category,
        label: addForm.label
      });
      
      setAddForm({ id: '', main_category: '', sub_category: '', label: '' });
      setShowAddModal(false);
      console.log('Kategorie erfolgreich hinzugefügt');
    } catch (err) {
      console.error('Fehler beim Hinzufügen der Kategorie:', err);
      alert('Fehler beim Hinzufügen der Kategorie');
    }
  };

  // Handle save edited category
  const handleSaveEdit = async () => {
    try {
      if (!editingCategory || !editForm.main_category || !editForm.sub_category || !editForm.label) {
        alert('Bitte alle Felder ausfüllen');
        return;
      }
      
      await updateCategory(editingCategory.id, {
        main_category: editForm.main_category,
        sub_category: editForm.sub_category,
        label: editForm.label
      });
      
      setShowEditModal(false);
      setEditingCategory(null);
      setEditForm({ main_category: '', sub_category: '', label: '' });
      console.log('Kategorie erfolgreich aktualisiert');
    } catch (err) {
      console.error('Fehler beim Aktualisieren der Kategorie:', err);
      alert('Fehler beim Aktualisieren der Kategorie');
    }
  };

  return (
    <DefaultPageLayout>
      <div className="flex w-full flex-col items-start gap-4 px-12 py-12">
        <div className="flex flex-col items-start gap-4">
          <span className="whitespace-pre-wrap text-heading-2 font-heading-2 text-default-font">
            {"Kategorien\n"}
          </span>
          <Table
            className="h-auto w-auto flex-none"
            header={
              <Table.HeaderRow>
                <Table.HeaderCell>ID</Table.HeaderCell>
                <Table.HeaderCell>Main</Table.HeaderCell>
                <Table.HeaderCell>Sub</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
              </Table.HeaderRow>
            }
          >
            {categories.map((category) => (
              <Table.Row key={category.id}>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500">
                    {category.id}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="neutral">{category.main_category}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500">
                    {category.sub_category}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex grow shrink-0 basis-0 items-center justify-end">
                    <SubframeCore.DropdownMenu.Root>
                      <SubframeCore.DropdownMenu.Trigger asChild={true}>
                        <IconButton
                          size="medium"
                          icon={<FeatherMoreHorizontal />}
                          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                        />
                      </SubframeCore.DropdownMenu.Trigger>
                      <SubframeCore.DropdownMenu.Portal>
                        <SubframeCore.DropdownMenu.Content
                          side="bottom"
                          align="end"
                          sideOffset={8}
                          asChild={true}
                        >
                          <DropdownMenu>
                            <DropdownMenu.DropdownItem 
                              icon={<FeatherPlus />}
                              onClick={handleAddCategory}
                            >
                              Add
                            </DropdownMenu.DropdownItem>
                            <DropdownMenu.DropdownItem 
                              icon={<FeatherEdit2 />}
                              onClick={() => handleEditCategory(category)}
                            >
                              Edit
                            </DropdownMenu.DropdownItem>
                            <DropdownMenu.DropdownItem 
                              icon={<FeatherTrash />}
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              Delete
                            </DropdownMenu.DropdownItem>
                          </DropdownMenu>
                        </SubframeCore.DropdownMenu.Content>
                      </SubframeCore.DropdownMenu.Portal>
                    </SubframeCore.DropdownMenu.Root>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Neue Kategorie hinzufügen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">ID:</label>
                <input 
                  type="text" 
                  value={addForm.id}
                  onChange={(e) => setAddForm({...addForm, id: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="z.B. FB.NE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hauptkategorie:</label>
                <input 
                  type="text" 
                  value={addForm.main_category}
                  onChange={(e) => setAddForm({...addForm, main_category: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="z.B. Fußbodenbeläge"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unterkategorie:</label>
                <input 
                  type="text" 
                  value={addForm.sub_category}
                  onChange={(e) => setAddForm({...addForm, sub_category: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="z.B. Neue Beläge"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Label:</label>
                <input 
                  type="text" 
                  value={addForm.label}
                  onChange={(e) => setAddForm({...addForm, label: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="z.B. Neue Beläge"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button 
                onClick={handleSaveAdd}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Kategorie bearbeiten</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">ID:</label>
                <input 
                  type="text" 
                  value={editingCategory.id}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hauptkategorie:</label>
                <input 
                  type="text" 
                  value={editForm.main_category}
                  onChange={(e) => setEditForm({...editForm, main_category: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unterkategorie:</label>
                <input 
                  type="text" 
                  value={editForm.sub_category}
                  onChange={(e) => setEditForm({...editForm, sub_category: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Label:</label>
                <input 
                  type="text" 
                  value={editForm.label}
                  onChange={(e) => setEditForm({...editForm, label: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCategory(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </DefaultPageLayout>
  );
}

export default Settings; 