"use client";

import React from "react";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";

export default function TestCategories() {
  const { 
    categories, 
    loading, 
    error, 
    createCategory, 
    updateCategory, 
    deleteCategory,
    getMainCategories 
  } = useMaterialCategories();

  const mainCategories = getMainCategories();

  // Test: Neue Kategorie erstellen
  const handleCreateTest = async () => {
    try {
      const newCategory = await createCategory({
        id: 'TEST.01',
        main_category: 'Test Kategorie',
        sub_category: 'Test Unterkategorie',
        label: 'Test Label'
      });
      console.log('Neue Kategorie erstellt:', newCategory);
    } catch (err) {
      console.error('Fehler beim Erstellen:', err);
    }
  };

  // Test: Kategorie aktualisieren
  const handleUpdateTest = async () => {
    if (categories.length > 0) {
      try {
        const updatedCategory = await updateCategory(categories[0].id, {
          label: 'Aktualisiert: ' + new Date().toLocaleTimeString()
        });
        console.log('Kategorie aktualisiert:', updatedCategory);
      } catch (err) {
        console.error('Fehler beim Aktualisieren:', err);
      }
    }
  };

  // Test: Kategorie löschen
  const handleDeleteTest = async () => {
    const testCategory = categories.find(cat => cat.id === 'TEST.01');
    if (testCategory) {
      try {
        const success = await deleteCategory('TEST.01');
        console.log('Kategorie gelöscht:', success);
      } catch (err) {
        console.error('Fehler beim Löschen:', err);
      }
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Material-Kategorien Test</h1>
      
      {/* Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Status:</h2>
        <p>Loading: {loading ? 'Ja' : 'Nein'}</p>
        <p>Error: {error || 'Kein Fehler'}</p>
        <p>Anzahl Kategorien: {categories.length}</p>
        <p>Hauptkategorien: {mainCategories.join(', ')}</p>
      </div>

      {/* Test Buttons */}
      <div className="mb-6 space-x-4">
        <button 
          onClick={handleCreateTest}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test: Neue Kategorie erstellen
        </button>
        <button 
          onClick={handleUpdateTest}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test: Erste Kategorie aktualisieren
        </button>
        <button 
          onClick={handleDeleteTest}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Test: TEST.01 Kategorie löschen
        </button>
      </div>

      {/* Kategorien Liste */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Alle Kategorien:</h2>
        {loading ? (
          <p>Lade Kategorien...</p>
        ) : error ? (
          <p className="text-red-500">Fehler: {error}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="p-4 border rounded">
                <h3 className="font-semibold">{category.id}</h3>
                <p className="text-sm text-gray-600">{category.main_category}</p>
                <p className="text-sm text-gray-600">{category.sub_category}</p>
                <p className="text-xs text-gray-500">{category.label}</p>
                <p className="text-xs text-gray-400">
                  Erstellt: {new Date(category.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hauptkategorien */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Hauptkategorien:</h2>
        <div className="flex flex-wrap gap-2">
          {mainCategories.map((mainCat) => (
            <span key={mainCat} className="px-3 py-1 bg-gray-200 rounded-full text-sm">
              {mainCat}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
} 