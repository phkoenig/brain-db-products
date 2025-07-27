"use client";

import React, { useState } from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { IconButton } from "@/ui/components/IconButton";
import { TextField } from "@/ui/components/TextField";
import { FeatherSearch } from "@subframe/core";
import { TreeView } from "@/ui/components/TreeView";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import ProductEditor from "@/components/ProductEditor";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";

function Database() {
  const [showEditor, setShowEditor] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { categories, loading, error } = useMaterialCategories();

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setShowEditor(true);
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.main_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.sub_category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group categories by main_category
  const groupedCategories = filteredCategories.reduce((acc, category) => {
    if (!acc[category.main_category]) {
      acc[category.main_category] = [];
    }
    acc[category.main_category].push(category);
    return acc;
  }, {} as Record<string, typeof categories>);

  // Create TreeView structure from categories
  const renderTreeView = () => {
    if (loading) {
      return <div className="text-caption text-subtext-color">Lade Kategorien...</div>;
    }

    if (error) {
      return <div className="text-caption text-red-500">Fehler beim Laden der Kategorien</div>;
    }

    return Object.entries(groupedCategories).map(([mainCategory, subCategories]) => (
      <TreeView.Folder key={mainCategory} label={mainCategory} icon={null}>
        {subCategories.map((category) => (
          <TreeView.Item 
            key={category.id}
            label={category.label}
            icon={null}
            selected={selectedCategory === category.id}
            onClick={() => setSelectedCategory(category.id)}
          />
        ))}
      </TreeView.Folder>
    ));
  };

  return (
    <DefaultPageLayout>
      <div className="flex w-full items-start gap-4">
        <div className="flex w-80 flex-none flex-col items-start gap-2 self-stretch px-4 py-4 shadow-lg overflow-auto">
          <div className="flex w-full items-center gap-2 pl-2 py-2">
            <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">
              Kategorie
            </span>
            <IconButton
              variant="brand-secondary"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            />
          </div>
          <TextField
            className="h-auto w-full flex-none"
            variant="filled"
            label=""
            helpText=""
            icon={<FeatherSearch />}
          >
            <TextField.Input
              placeholder="Kategorien durchsuchen..."
              value={searchTerm}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
            />
          </TextField>
          <TreeView>
            {renderTreeView()}
          </TreeView>
        </div>
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch">
          <div className="flex w-full flex-col items-start justify-end px-4 pt-7 pb-1">
            <Breadcrumbs>
              <Breadcrumbs.Item>Produktdatenbank</Breadcrumbs.Item>
              <Breadcrumbs.Divider />
              <Breadcrumbs.Item active={true}>
                {selectedCategory 
                  ? categories.find(c => c.id === selectedCategory)?.label || "Alle Produkte"
                  : "Alle Produkte"
                }
              </Breadcrumbs.Item>
            </Breadcrumbs>
          </div>
          <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-4 px-4 py-4">
            {loading ? (
              <div className="flex w-full items-center justify-center py-8">
                <span className="text-body text-subtext-color">Lade Produkte...</span>
              </div>
            ) : error ? (
              <div className="flex w-full items-center justify-center py-8">
                <span className="text-body text-red-500">Fehler beim Laden der Produkte</span>
              </div>
            ) : (
              <div className="flex w-full items-center justify-center py-8">
                <span className="text-body text-subtext-color">
                  {selectedCategory 
                    ? `Keine Produkte in "${categories.find(c => c.id === selectedCategory)?.label}" gefunden`
                    : "Keine Produkte verfügbar"
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Product Editor Drawer */}
      <ProductEditor 
        open={showEditor} 
        onOpenChange={setShowEditor}
        product={selectedProduct}
      />
    </DefaultPageLayout>
  );
}

export default Database; 