"use client";

import React, { useState } from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { TextField } from "@/ui/components/TextField";
import { FeatherSearch } from "@subframe/core";
import { FeatherChevronDown } from "@subframe/core";
import { FeatherChevronUp } from "@subframe/core";
import { IconButton } from "@/ui/components/IconButton";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { MatCard } from "@/ui/components/MatCard";
import ProductDetailDrawer from "@/components/ProductDetailDrawer";
import { CustomTreeView } from "@/components/CustomTreeView";

import { useMaterialCategories } from "@/hooks/useMaterialCategories";
import { useDatabaseProducts } from "@/hooks/useDatabaseProducts";
import { Product } from "@/types/products";

function Database() {
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const { categories, loading: categoriesLoading, error: categoriesError } = useMaterialCategories();
  const { products, loading: productsLoading, error: productsError } = useDatabaseProducts(selectedCategory);

  const handleProductClick = (product: Product) => {
    // Open detail drawer instead of navigating to capture page
    setSelectedProductId(product.id);
    setShowDetailDrawer(true);
  };

  const toggleAllFolders = () => {
    const allMainCategories = [...new Set(categories.map(cat => cat.main_category))];
    const currentStates = allMainCategories.map(cat => expandedItems[cat] || false);
    const allExpanded = currentStates.every(state => state);
    
    // If all are expanded, collapse all. Otherwise, expand all.
    const newStates: Record<string, boolean> = {};
    allMainCategories.forEach(cat => {
      newStates[cat] = !allExpanded;
    });
    
    setExpandedItems(newStates);
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.main_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.sub_category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group categories by main_category and convert to tree structure
  const groupedCategories = filteredCategories.reduce((acc, category) => {
    if (!acc[category.main_category]) {
      acc[category.main_category] = [];
    }
    acc[category.main_category].push(category);
    return acc;
  }, {} as Record<string, typeof categories>);

  // Convert to tree structure for CustomTreeView
  const treeItems = Object.entries(groupedCategories).map(([mainCategory, subCategories]) => ({
    id: mainCategory,
    label: mainCategory,
    children: subCategories.map(category => ({
      id: category.id,
      label: category.label,
    }))
  }));

  const handleItemSelect = (itemId: string) => {
    // Check if it's a subcategory (has children) or main category
    const isMainCategory = treeItems.some(item => item.id === itemId);
    if (!isMainCategory) {
      // Only select if it's a subcategory (leaf node)
      setSelectedCategory(itemId);
    }
  };

  const handleExpandedChange = (itemId: string, expanded: boolean) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: expanded
    }));
  };

  // Get selected category info for breadcrumbs
  const getSelectedCategoryInfo = () => {
    if (!selectedCategory) return null;
    const category = categories.find(c => c.id === selectedCategory);
    return category;
  };

  const selectedCategoryInfo = getSelectedCategoryInfo();

  // Render product card using MatCard
  const renderProductCard = (product: Product) => {
    const productName = product.produkt_name_modell || "Unbekanntes Produkt";
    const manufacturer = product.produkt_hersteller || "Unbekannter Hersteller";
    const series = product.produkt_produktlinie_serie || "";
    const description = product.produkt_beschreibung || "Keine Beschreibung verfügbar";

    // Verbesserte Preis-Logik: Prüfe zuerst haendler_preis, dann alternative_retailer_price
    let price = "Preis auf Anfrage";
    let unit = "Stück";

    if (product.haendler_preis && product.haendler_preis > 0) {
      price = `${product.haendler_preis.toLocaleString('de-DE')} €`;
      unit = product.haendler_einheit || "Stück";
    } else if (product.alternative_retailer_price && product.alternative_retailer_price > 0) {
      price = `${product.alternative_retailer_price.toLocaleString('de-DE')} €`;
      unit = product.alternative_retailer_unit || "Stück";
    }

    const dimensions = product.parameter_masse || "Maße nicht angegeben";

    // Priorisiere Thumbnail über Screenshots für bessere Bildqualität
    const imageUrl = product.thumbnail_path || product.screenshot_path || "https://res.cloudinary.com/subframe/image/upload/v1753602826/uploads/15448/odurlxtkjmlugltznr4z.png";

    return (
      <div key={product.id} onClick={() => handleProductClick(product)}>
        <MatCard
          image={imageUrl}
          text={productName}
          text2={manufacturer}
          text3={series}
          text4={description}
          text5={`${price} / ${unit}`}
          text6={product.haendler_haendler_produkt_url || product.produkt_hersteller_produkt_url || ""}
          produktbild={
            <img
              className="w-full grow shrink-0 basis-0 rounded-l-lg object-cover"
              src={imageUrl}
              alt={productName}
              onError={(e) => {
                e.currentTarget.src = "https://res.cloudinary.com/subframe/image/upload/v1753602826/uploads/15448/odurlxtkjmlugltznr4z.png";
              }}
            />
          }
          maE={`Maße: ${dimensions}`}
        />
      </div>
    );
  };

  return (
    <DefaultPageLayout>
      <div className="flex w-full items-start gap-4">
        <div className="flex w-80 flex-none flex-col items-start gap-2 self-stretch px-4 py-4 shadow-lg overflow-auto">
          <div className="flex w-full items-center gap-2 pl-2 py-2">
            <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">
              Kategorie
            </span>
          </div>
          <div className="flex w-full items-center gap-2">
            <TextField
              className="h-auto grow shrink-0 basis-0"
              variant="filled"
              label=""
              helpText=""
              icon={<FeatherSearch />}
            >
              <TextField.Input
                placeholder="Search"
                value={searchTerm}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
              />
            </TextField>
            <IconButton
              variant="neutral-primary"
              onClick={toggleAllFolders}
              icon={(() => {
                const allMainCategories = [...new Set(categories.map(cat => cat.main_category))];
                const currentStates = allMainCategories.map(cat => expandedItems[cat] || false);
                const allExpanded = currentStates.every(state => state);
                return allExpanded ? <FeatherChevronUp /> : <FeatherChevronDown />;
              })()}
            />
          </div>
          <CustomTreeView
            items={treeItems}
            expandedItems={expandedItems}
            onItemSelect={handleItemSelect}
            onExpandedChange={handleExpandedChange}
          />
          {categoriesLoading && (
            <div className="text-caption text-subtext-color mt-2">Lade Kategorien...</div>
          )}
          {categoriesError && (
            <div className="text-caption text-red-500 mt-2">Fehler beim Laden der Kategorien</div>
          )}
        </div>
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch">
          <div className="flex w-full flex-col items-start justify-end px-4 pt-7 pb-1">
            <Breadcrumbs>
              <Breadcrumbs.Item>Kategorie</Breadcrumbs.Item>
              <Breadcrumbs.Divider />
              {selectedCategoryInfo ? (
                <>
                  <Breadcrumbs.Item>{selectedCategoryInfo.main_category}</Breadcrumbs.Item>
                  <Breadcrumbs.Divider />
                  <Breadcrumbs.Item active={true}>{selectedCategoryInfo.label}</Breadcrumbs.Item>
                </>
              ) : (
                <Breadcrumbs.Item active={true}>Alle Produkte</Breadcrumbs.Item>
              )}
            </Breadcrumbs>
          </div>
          <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-4 px-4 py-4">
            {productsLoading ? (
              <div className="flex w-full items-center justify-center py-8">
                <span className="text-body text-subtext-color">Lade Produkte...</span>
              </div>
            ) : productsError ? (
              <div className="flex w-full items-center justify-center py-8">
                <span className="text-body text-red-500">Fehler beim Laden der Produkte</span>
              </div>
            ) : products.length === 0 ? (
              <div className="flex w-full items-center justify-center py-8">
                <span className="text-body text-subtext-color">
                  {selectedCategory
                    ? `Keine Produkte in "${categories.find(c => c.id === selectedCategory)?.label}" gefunden`
                    : "Keine Produkte verfügbar"
                  }
                </span>
              </div>
            ) : (
              <div className="flex w-full flex-col gap-4">
                {products.map(renderProductCard)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Detail Drawer */}
      <ProductDetailDrawer
        open={showDetailDrawer}
        onOpenChange={setShowDetailDrawer}
        productId={selectedProductId}
      />
    </DefaultPageLayout>
  );
}

export default Database; 