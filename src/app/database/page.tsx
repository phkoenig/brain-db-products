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
import { useDatabaseProducts } from "@/hooks/useDatabaseProducts";
import { Product } from "@/types/products";
import { useRouter } from "next/navigation";

function Database() {
  const router = useRouter();
  const [showEditor, setShowEditor] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { categories, loading: categoriesLoading, error: categoriesError } = useMaterialCategories();
  const { products, loading: productsLoading, error: productsError } = useDatabaseProducts(selectedCategory);

  const handleProductClick = (product: Product) => {
    // Navigate to capture page with product ID
    router.push(`/capture?id=${product.id}`);
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
    if (categoriesLoading) {
      return <div className="text-caption text-subtext-color">Lade Kategorien...</div>;
    }

    if (categoriesError) {
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

  // Render product card
  const renderProductCard = (product: Product) => {
    const productName = product.produkt_name_modell || "Unbekanntes Produkt";
    const manufacturer = product.produkt_hersteller || "Unbekannter Hersteller";
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
    
    // Debug: Logge Bild-Informationen
    console.log(`🖼️ Bild-Debug für ${productName}:`, {
      thumbnail_path: product.thumbnail_path,
      screenshot_path: product.screenshot_path,
      product_id: product.id
    });
    
    // Priorisiere Thumbnail über Screenshots für bessere Bildqualität
    const imageUrl = product.thumbnail_path || product.screenshot_path || "https://res.cloudinary.com/subframe/image/upload/v1753602826/uploads/15448/odurlxtkjmlugltznr4z.png";

    return (
      <div 
        key={product.id}
        className="flex h-28 w-full flex-none items-center gap-2 rounded-lg bg-default-background shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => handleProductClick(product)}
      >
        <div className="flex flex-col items-start justify-center gap-6">
          <img
            className="h-28 w-44 flex-none rounded-l-lg object-cover"
            src={imageUrl}
            alt={productName}
            onError={(e) => {
              e.currentTarget.src = "https://res.cloudinary.com/subframe/image/upload/v1753602826/uploads/15448/odurlxtkjmlugltznr4z.png";
            }}
          />
        </div>
        <div className="flex w-112 flex-none flex-col items-start gap-2 self-stretch px-2 py-2">
          <div className="flex w-full flex-col items-start gap-2">
            <span className="text-heading-2 font-heading-2 text-default-font">
              {productName}
            </span>
          </div>
          <div className="flex w-full items-center gap-2">
            <span className="text-body font-body text-default-font">
              {manufacturer}
            </span>
            {product.produkt_produktlinie_serie && (
              <span className="grow shrink-0 basis-0 text-caption font-caption text-default-font">
                {product.produkt_produktlinie_serie}
              </span>
            )}
          </div>
          <span className="w-full grow shrink-0 basis-0 text-caption font-caption text-subtext-color line-clamp-2">
            {description}
          </span>
        </div>
        <div className="flex w-60 flex-none flex-col items-end gap-2 self-stretch px-2 py-2">
          <span className="text-heading-2 font-heading-2 text-default-font">
            {price} / {unit}
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Maße: {dimensions}
          </span>
        </div>
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
            <IconButton
              variant="brand-secondary"
              onClick={() => setSelectedCategory(null)}
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