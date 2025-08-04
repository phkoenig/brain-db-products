"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Progress } from "@/ui/components/Progress";
import { Select } from "@/ui/components/Select";
import { FeatherSearch } from "@subframe/core";
import { TextField } from "@/ui/components/TextField";
import { FeatherPenLine } from "@subframe/core";
import { TextArea } from "@/ui/components/TextArea";
import { Table } from "@/ui/components/Table";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { Button } from "@/ui/components/Button";
import { FeatherFactory } from "@subframe/core";
import { FeatherShoppingCart } from "@subframe/core";
import { FeatherGlobe } from "@subframe/core";
import { FeatherLock } from "@subframe/core";
import { FeatherX } from "@subframe/core";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";
import { useProducts } from "@/hooks/useProducts";
import { useProjects } from "@/hooks/useProjects";
import { Product } from "@/types/products";
import { SPALTEN_FELDER } from "@/lib/extraction/constants";

// Hilfsfunktion für deutsche Preisformatierung
const formatGermanPrice = (price: string | number): string => {
  if (!price) return '';
  let numPrice: number;
  if (typeof price === 'string') {
    const cleaned = price.replace(/[^\d.,]/g, '');
    if (cleaned.includes(',')) {
      const parts = cleaned.split(',');
      const wholePart = parts[0].replace(/\./g, '');
      const decimalPart = parts[1] || '00';
      numPrice = parseFloat(`${wholePart}.${decimalPart}`);
    } else {
      numPrice = parseFloat(cleaned);
    }
  } else {
    numPrice = price;
  }
  if (isNaN(numPrice)) return price as string;
  return numPrice.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Hilfsfunktion für Preis-Parsing
const parsePriceInput = (input: string): string => {
  if (!input) return '';
  const cleaned = input.replace(/[€\s]/g, '');
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    const wholePart = parts[0].replace(/\./g, '');
    const decimalPart = parts[1] || '00';
    return `${wholePart}.${decimalPart}`;
  }
  return cleaned;
};

interface ProductDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
}

export default function ProductDetailDrawer({ open, onOpenChange, productId }: ProductDetailDrawerProps) {
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [lockedFields, setLockedFields] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { categories, loading: categoriesLoading } = useMaterialCategories();
  const { getProduct, updateProduct } = useProducts();
  const { projects, loading: projectsLoading } = useProjects();

  // Load product data when drawer opens
  useEffect(() => {
    if (open && productId) {
      loadProductData();
    }
  }, [open, productId]);

  const loadProductData = async () => {
    if (!productId) return;
    
    setLoading(true);
    try {
      console.log('🔍 Loading product with ID:', productId);
      const product = await getProduct(productId);
      console.log('🔍 Loaded product data:', product);
      if (product) {
        setFormData(product);
        console.log('🔍 Form data set:', product);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFieldBlur = async (field: string, value: any) => {
    if (!productId) return;
    
    try {
      await updateProduct(productId, { [field]: value });
    } catch (error) {
      console.error(`Error updating field ${field}:`, error);
    }
  };

  const createTextFieldProps = (fieldName: string) => {
    const value = formData[fieldName as keyof Product] || '';
    console.log(`🔍 createTextFieldProps for ${fieldName}:`, value);
    return {
      value: value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleFormChange(fieldName, e.target.value),
      onBlur: () => handleFieldBlur(fieldName, formData[fieldName as keyof Product])
    };
  };

  const createTextAreaProps = (fieldName: string) => ({
    value: formData[fieldName as keyof Product] || '',
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => handleFormChange(fieldName, e.target.value),
    onBlur: () => handleFieldBlur(fieldName, formData[fieldName as keyof Product])
  });

  const createPriceFieldProps = (fieldName: string) => ({
    value: formData[fieldName as keyof Product] ? formatGermanPrice(formData[fieldName as keyof Product] as string | number) : '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsedValue = parsePriceInput(e.target.value);
      handleFormChange(fieldName, parsedValue);
    },
    onBlur: () => handleFieldBlur(fieldName, formData[fieldName as keyof Product])
  });

  const openUrl = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const toggleFieldLock = (fieldName: string) => {
    setLockedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldName)) {
        newSet.delete(fieldName);
      } else {
        newSet.add(fieldName);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!productId) return;
    
    setSaving(true);
    try {
      await updateProduct(productId, formData);
      console.log('Product updated successfully');
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={handleClose}
      />
      
             {/* Drawer */}
       <div className={`
         fixed right-0 top-0 h-full w-[60%] bg-white z-50 transform transition-transform duration-300 ease-in-out
         ${open ? 'translate-x-0' : 'translate-x-full'}
       `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Produkt Details</h2>
          <Button
            variant="neutral-primary"
            icon={<FeatherX />}
            onClick={handleClose}
          />
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <span className="text-subtext-color">Lade Produkt...</span>
            </div>
          ) : (
                         <div className="flex h-full w-full flex-col items-start gap-4 bg-default-background px-4 py-4">
               <div className="flex w-full grow shrink-0 basis-0 items-start gap-2">
                                 {/* PRODUKT */}
                 <div className="flex w-1/6 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
                  <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
                    <span className="w-full whitespace-pre-wrap text-heading-3 font-heading-3 text-default-font text-center bg-neutral-50 rounded-md py-2 px-4 border border-neutral-200">
                      {"PRODUKT"}
                    </span>
                    <Progress value={0}/>
                    <div className="flex w-full flex-col items-start gap-1">
                      <div className="flex flex-col items-start gap-1 pt-4">
                        <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                          {"Produktbild\n"}
                        </span>
                        <img
                          className="w-full grow shrink-0 basis-0 rounded-md border border-solid border-neutral-border object-cover shadow-md"
                          src={formData.thumbnail_path || formData.screenshot_path || "https://res.cloudinary.com/subframe/image/upload/v1753745144/uploads/15448/eec2lucgs06zsgxjfdgb.png"}
                          alt="Produkt Thumbnail"
                          onError={(e) => {
                            e.currentTarget.src = "https://res.cloudinary.com/subframe/image/upload/v1753745144/uploads/15448/eec2lucgs06zsgxjfdgb.png";
                          }}
                        />
                      </div>
                    </div>
                                         <div className="flex w-full flex-col items-start gap-1 pt-4">
                       <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                         {"Kategorie"}
                       </span>
                       <Select
                         className="w-full"
                         variant="filled"
                         value={formData.produkt_kategorie?.[0] || ''}
                         onValueChange={(value) => {
                           console.log('🔍 Kategorie selected:', value);
                           handleFormChange('produkt_kategorie', [value]);
                         }}
                         disabled={categoriesLoading}
                         placeholder="Kategorie auswählen..."
                       >
                         {categories.map((category) => (
                           <Select.Item key={category.id} value={category.id}>
                             {category.label}
                           </Select.Item>
                         ))}
                       </Select>
                     </div>
                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Hersteller\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('produkt_hersteller') ? 
                            <FeatherLock onClick={() => toggleFieldLock('produkt_hersteller')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('produkt_hersteller')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('produkt_hersteller')}
                        />
                      </TextField>
                    </div>
                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Name / Modell\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('produkt_name_modell') ? 
                            <FeatherLock onClick={() => toggleFieldLock('produkt_name_modell')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('produkt_name_modell')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('produkt_name_modell')}
                        />
                      </TextField>
                    </div>
                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Produktlinie, Serie\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('produkt_produktlinie_serie') ? 
                            <FeatherLock onClick={() => toggleFieldLock('produkt_produktlinie_serie')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('produkt_produktlinie_serie')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('produkt_produktlinie_serie')}
                        />
                      </TextField>
                    </div>
                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Code / ID\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('produkt_code_id') ? 
                            <FeatherLock onClick={() => toggleFieldLock('produkt_code_id')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('produkt_code_id')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('produkt_code_id')}
                        />
                      </TextField>
                    </div>
                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Anwendungsbereich\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('produkt_anwendungsbereich') ? 
                            <FeatherLock onClick={() => toggleFieldLock('produkt_anwendungsbereich')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('produkt_anwendungsbereich')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('produkt_anwendungsbereich')}
                        />
                      </TextField>
                    </div>
                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Beschreibung\n"}
                      </span>
                      <TextArea
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                      >
                        <TextArea.Input
                          placeholder=""
                          {...createTextAreaProps('produkt_beschreibung')}
                        />
                      </TextArea>
                    </div>
                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Hersteller Webseite\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        icon={<FeatherGlobe />}
                        iconRight={
                          lockedFields.has('produkt_hersteller_webseite') ? 
                            <FeatherLock onClick={() => toggleFieldLock('produkt_hersteller_webseite')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('produkt_hersteller_webseite')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('produkt_hersteller_webseite')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              openUrl(formData.produkt_hersteller_webseite || '');
                            }
                          }}
                        />
                      </TextField>
                    </div>
                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Hersteller Produkt URL\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        icon={<FeatherGlobe />}
                        iconRight={
                          lockedFields.has('produkt_hersteller_produkt_url') ? 
                            <FeatherLock onClick={() => toggleFieldLock('produkt_hersteller_produkt_url')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('produkt_hersteller_produkt_url')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('produkt_hersteller_produkt_url')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              openUrl(formData.produkt_hersteller_produkt_url || '');
                            }
                          }}
                        />
                      </TextField>
                    </div>
                  </div>
                </div>

                                 {/* PARAMETER */}
                 <div className="flex w-1/6 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
                  <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
                    <span className="w-full whitespace-pre-wrap text-heading-3 font-heading-3 text-default-font text-center bg-neutral-50 rounded-md py-2 px-4 border border-neutral-200">
                      {"PARAMETER"}
                    </span>
                    <Progress value={0}/>
                    
                    {/* Parameter Fields */}
                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Maße\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('parameter_masse') ? 
                            <FeatherLock onClick={() => toggleFieldLock('parameter_masse')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('parameter_masse')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('parameter_masse')}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Farbe\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('parameter_farbe') ? 
                            <FeatherLock onClick={() => toggleFieldLock('parameter_farbe')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('parameter_farbe')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('parameter_farbe')}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Hauptmaterial\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('parameter_hauptmaterial') ? 
                            <FeatherLock onClick={() => toggleFieldLock('parameter_hauptmaterial')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('parameter_hauptmaterial')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('parameter_hauptmaterial')}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Oberfläche\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('parameter_oberflaeche') ? 
                            <FeatherLock onClick={() => toggleFieldLock('parameter_oberflaeche')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('parameter_oberflaeche')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('parameter_oberflaeche')}
                        />
                      </TextField>
                    </div>

                                         <div className="flex w-full flex-col items-start gap-1 pt-4">
                       <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                         {"Gewicht pro Einheit\n"}
                       </span>
                       <TextField
                         className="h-auto w-full flex-none"
                         variant="filled"
                         label=""
                         helpText=""
                         iconRight={
                           lockedFields.has('parameter_gewicht_pro_einheit') ? 
                             <FeatherLock onClick={() => toggleFieldLock('parameter_gewicht_pro_einheit')} style={{cursor: 'pointer'}} /> : 
                             <FeatherPenLine onClick={() => toggleFieldLock('parameter_gewicht_pro_einheit')} style={{cursor: 'pointer'}} />
                         }
                       >
                         <TextField.Input
                           placeholder=""
                           {...createTextFieldProps('parameter_gewicht_pro_einheit')}
                         />
                       </TextField>
                     </div>

                     <div className="flex w-full flex-col items-start gap-1 pt-4">
                       <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                         {"Feuerwiderstand\n"}
                       </span>
                       <TextField
                         className="h-auto w-full flex-none"
                         variant="filled"
                         label=""
                         helpText=""
                         iconRight={
                           lockedFields.has('parameter_feuerwiderstand') ? 
                             <FeatherLock onClick={() => toggleFieldLock('parameter_feuerwiderstand')} style={{cursor: 'pointer'}} /> : 
                             <FeatherPenLine onClick={() => toggleFieldLock('parameter_feuerwiderstand')} style={{cursor: 'pointer'}} />
                         }
                       >
                         <TextField.Input
                           placeholder=""
                           {...createTextFieldProps('parameter_feuerwiderstand')}
                         />
                       </TextField>
                     </div>

                     <div className="flex w-full flex-col items-start gap-1 pt-4">
                       <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                         {"Wärmeleitfähigkeit\n"}
                       </span>
                       <TextField
                         className="h-auto w-full flex-none"
                         variant="filled"
                         label=""
                         helpText=""
                         iconRight={
                           lockedFields.has('parameter_waermeleitfaehigkeit') ? 
                             <FeatherLock onClick={() => toggleFieldLock('parameter_waermeleitfaehigkeit')} style={{cursor: 'pointer'}} /> : 
                             <FeatherPenLine onClick={() => toggleFieldLock('parameter_waermeleitfaehigkeit')} style={{cursor: 'pointer'}} />
                         }
                       >
                         <TextField.Input
                           placeholder=""
                           {...createTextFieldProps('parameter_waermeleitfaehigkeit')}
                         />
                       </TextField>
                     </div>

                     <div className="flex w-full flex-col items-start gap-1 pt-4">
                       <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                         {"U-Wert\n"}
                       </span>
                       <TextField
                         className="h-auto w-full flex-none"
                         variant="filled"
                         label=""
                         helpText=""
                         iconRight={
                           lockedFields.has('parameter_u_wert') ? 
                             <FeatherLock onClick={() => toggleFieldLock('parameter_u_wert')} style={{cursor: 'pointer'}} /> : 
                             <FeatherPenLine onClick={() => toggleFieldLock('parameter_u_wert')} style={{cursor: 'pointer'}} />
                         }
                       >
                         <TextField.Input
                           placeholder=""
                           {...createTextFieldProps('parameter_u_wert')}
                         />
                       </TextField>
                     </div>

                     <div className="flex w-full flex-col items-start gap-1 pt-4">
                       <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                         {"Schalldämmung\n"}
                       </span>
                       <TextField
                         className="h-auto w-full flex-none"
                         variant="filled"
                         label=""
                         helpText=""
                         iconRight={
                           lockedFields.has('parameter_schalldaemmung') ? 
                             <FeatherLock onClick={() => toggleFieldLock('parameter_schalldaemmung')} style={{cursor: 'pointer'}} /> : 
                             <FeatherPenLine onClick={() => toggleFieldLock('parameter_schalldaemmung')} style={{cursor: 'pointer'}} />
                         }
                       >
                         <TextField.Input
                           placeholder=""
                           {...createTextFieldProps('parameter_schalldaemmung')}
                         />
                       </TextField>
                     </div>

                     <div className="flex w-full flex-col items-start gap-1 pt-4">
                       <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                         {"Wasserbeständigkeit\n"}
                       </span>
                       <TextField
                         className="h-auto w-full flex-none"
                         variant="filled"
                         label=""
                         helpText=""
                         iconRight={
                           lockedFields.has('parameter_wasserbestaendigkeit') ? 
                             <FeatherLock onClick={() => toggleFieldLock('parameter_wasserbestaendigkeit')} style={{cursor: 'pointer'}} /> : 
                             <FeatherPenLine onClick={() => toggleFieldLock('parameter_wasserbestaendigkeit')} style={{cursor: 'pointer'}} />
                         }
                       >
                         <TextField.Input
                           placeholder=""
                           {...createTextFieldProps('parameter_wasserbestaendigkeit')}
                         />
                       </TextField>
                     </div>

                     <div className="flex w-full flex-col items-start gap-1 pt-4">
                       <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                         {"Dampfdiffusion\n"}
                       </span>
                       <TextField
                         className="h-auto w-full flex-none"
                         variant="filled"
                         label=""
                         helpText=""
                         iconRight={
                           lockedFields.has('parameter_dampfdiffusion') ? 
                             <FeatherLock onClick={() => toggleFieldLock('parameter_dampfdiffusion')} style={{cursor: 'pointer'}} /> : 
                             <FeatherPenLine onClick={() => toggleFieldLock('parameter_dampfdiffusion')} style={{cursor: 'pointer'}} />
                         }
                       >
                         <TextField.Input
                           placeholder=""
                           {...createTextFieldProps('parameter_dampfdiffusion')}
                         />
                       </TextField>
                     </div>

                     <div className="flex w-full flex-col items-start gap-1 pt-4">
                       <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                         {"Einbauart\n"}
                       </span>
                       <TextField
                         className="h-auto w-full flex-none"
                         variant="filled"
                         label=""
                         helpText=""
                         iconRight={
                           lockedFields.has('parameter_einbauart') ? 
                             <FeatherLock onClick={() => toggleFieldLock('parameter_einbauart')} style={{cursor: 'pointer'}} /> : 
                             <FeatherPenLine onClick={() => toggleFieldLock('parameter_einbauart')} style={{cursor: 'pointer'}} />
                         }
                       >
                         <TextField.Input
                           placeholder=""
                           {...createTextFieldProps('parameter_einbauart')}
                         />
                       </TextField>
                     </div>

                     <div className="flex w-full flex-col items-start gap-1 pt-4">
                       <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                         {"Wartung\n"}
                       </span>
                       <TextField
                         className="h-auto w-full flex-none"
                         variant="filled"
                         label=""
                         helpText=""
                         iconRight={
                           lockedFields.has('parameter_wartung') ? 
                             <FeatherLock onClick={() => toggleFieldLock('parameter_wartung')} style={{cursor: 'pointer'}} /> : 
                             <FeatherPenLine onClick={() => toggleFieldLock('parameter_wartung')} style={{cursor: 'pointer'}} />
                         }
                       >
                         <TextField.Input
                           placeholder=""
                           {...createTextFieldProps('parameter_wartung')}
                         />
                       </TextField>
                     </div>

                     <div className="flex w-full flex-col items-start gap-1 pt-4">
                       <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                         {"Umweltzertifikat\n"}
                       </span>
                       <TextField
                         className="h-auto w-full flex-none"
                         variant="filled"
                         label=""
                         helpText=""
                         iconRight={
                           lockedFields.has('parameter_umweltzertifikat') ? 
                             <FeatherLock onClick={() => toggleFieldLock('parameter_umweltzertifikat')} style={{cursor: 'pointer'}} /> : 
                             <FeatherPenLine onClick={() => toggleFieldLock('parameter_umweltzertifikat')} style={{cursor: 'pointer'}} />
                         }
                       >
                         <TextField.Input
                           placeholder=""
                           {...createTextFieldProps('parameter_umweltzertifikat')}
                         />
                       </TextField>
                     </div>
                   </div>
                 </div>

                                 {/* HÄNDLER */}
                 <div className="flex w-1/6 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
                  <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
                    <span className="w-full whitespace-pre-wrap text-heading-3 font-heading-3 text-default-font text-center bg-neutral-50 rounded-md py-2 px-4 border border-neutral-200">
                      {"HÄNDLER"}
                    </span>
                    <Progress value={0}/>
                    
                    {/* Händler Fields */}
                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Händlername\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        icon={<FeatherShoppingCart />}
                        iconRight={
                          lockedFields.has('haendler_haendlername') ? 
                            <FeatherLock onClick={() => toggleFieldLock('haendler_haendlername')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('haendler_haendlername')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('haendler_haendlername')}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Händler Webseite\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        icon={<FeatherGlobe />}
                        iconRight={
                          lockedFields.has('haendler_haendler_webseite') ? 
                            <FeatherLock onClick={() => toggleFieldLock('haendler_haendler_webseite')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('haendler_haendler_webseite')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('haendler_haendler_webseite')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              openUrl(formData.haendler_haendler_webseite || '');
                            }
                          }}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Händler Produkt URL\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        icon={<FeatherGlobe />}
                        iconRight={
                          lockedFields.has('haendler_haendler_produkt_url') ? 
                            <FeatherLock onClick={() => toggleFieldLock('haendler_haendler_produkt_url')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('haendler_haendler_produkt_url')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('haendler_haendler_produkt_url')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              openUrl(formData.haendler_haendler_produkt_url || '');
                            }
                          }}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Verfügbarkeit\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('haendler_verfuegbarkeit') ? 
                            <FeatherLock onClick={() => toggleFieldLock('haendler_verfuegbarkeit')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('haendler_verfuegbarkeit')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('haendler_verfuegbarkeit')}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Einheit\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('haendler_einheit') ? 
                            <FeatherLock onClick={() => toggleFieldLock('haendler_einheit')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('haendler_einheit')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('haendler_einheit')}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Preis\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('haendler_preis') ? 
                            <FeatherLock onClick={() => toggleFieldLock('haendler_preis')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('haendler_preis')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createPriceFieldProps('haendler_preis')}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Preis pro Einheit\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('haendler_preis_pro_einheit') ? 
                            <FeatherLock onClick={() => toggleFieldLock('haendler_preis_pro_einheit')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('haendler_preis_pro_einheit')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createPriceFieldProps('haendler_preis_pro_einheit')}
                        />
                      </TextField>
                    </div>
                  </div>
                </div>

                                 {/* DOKUMENTE */}
                 <div className="flex w-1/6 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
                  <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
                    <span className="w-full whitespace-pre-wrap text-heading-3 font-heading-3 text-default-font text-center bg-neutral-50 rounded-md py-2 px-4 border border-neutral-200">
                      {"DOKUMENTE"}
                    </span>
                    <Progress value={0}/>
                    
                    {/* Dokumente Fields */}
                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Datenblatt\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        icon={<FeatherGlobe />}
                        iconRight={
                          lockedFields.has('dokumente_datenblatt') ? 
                            <FeatherLock onClick={() => toggleFieldLock('dokumente_datenblatt')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('dokumente_datenblatt')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('dokumente_datenblatt')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              openUrl(formData.dokumente_datenblatt || '');
                            }
                          }}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Technisches Merkblatt\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        icon={<FeatherGlobe />}
                        iconRight={
                          lockedFields.has('dokumente_technisches_merkblatt') ? 
                            <FeatherLock onClick={() => toggleFieldLock('dokumente_technisches_merkblatt')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('dokumente_technisches_merkblatt')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('dokumente_technisches_merkblatt')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              openUrl(formData.dokumente_technisches_merkblatt || '');
                            }
                          }}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Produktkatalog\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        icon={<FeatherGlobe />}
                        iconRight={
                          lockedFields.has('dokumente_produktkatalog') ? 
                            <FeatherLock onClick={() => toggleFieldLock('dokumente_produktkatalog')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('dokumente_produktkatalog')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('dokumente_produktkatalog')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              openUrl(formData.dokumente_produktkatalog || '');
                            }
                          }}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Weitere Dokumente\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('dokumente_weitere_dokumente') ? 
                            <FeatherLock onClick={() => toggleFieldLock('dokumente_weitere_dokumente')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('dokumente_weitere_dokumente')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('dokumente_weitere_dokumente')}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"BIM/CAD Technische Zeichnungen\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        icon={<FeatherGlobe />}
                        iconRight={
                          lockedFields.has('dokumente_bim_cad_technische_zeichnungen') ? 
                            <FeatherLock onClick={() => toggleFieldLock('dokumente_bim_cad_technische_zeichnungen')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('dokumente_bim_cad_technische_zeichnungen')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('dokumente_bim_cad_technische_zeichnungen')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              openUrl(formData.dokumente_bim_cad_technische_zeichnungen || '');
                            }
                          }}
                        />
                      </TextField>
                    </div>
                  </div>
                </div>

                                 {/* ERFAHRUNG */}
                 <div className="flex w-1/6 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
                  <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
                    <span className="w-full whitespace-pre-wrap text-heading-3 font-heading-3 text-default-font text-center bg-neutral-50 rounded-md py-2 px-4 border border-neutral-200">
                      {"ERFAHRUNG"}
                    </span>
                    <Progress value={0}/>
                    
                    {/* Erfahrung Fields */}
                                         <div className="flex w-full flex-col items-start gap-1 pt-4">
                       <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                         {"Einsatz in Projekt\n"}
                       </span>
                       <Select
                         className="w-full"
                         variant="filled"
                         value={formData.erfahrung_einsatz_in_projekt || ''}
                         onValueChange={(value) => handleFormChange('erfahrung_einsatz_in_projekt', value)}
                         disabled={projectsLoading}
                         placeholder="Projekt auswählen..."
                       >
                         {projects.map((project) => (
                           <Select.Item key={project.id} value={project.xyz}>
                             {project.xyz} - {project.description}
                           </Select.Item>
                         ))}
                       </Select>
                     </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Muster bestellt\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('erfahrung_muster_bestellt') ? 
                            <FeatherLock onClick={() => toggleFieldLock('erfahrung_muster_bestellt')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('erfahrung_muster_bestellt')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('erfahrung_muster_bestellt')}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Muster abgelegt\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('erfahrung_muster_abgelegt') ? 
                            <FeatherLock onClick={() => toggleFieldLock('erfahrung_muster_abgelegt')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('erfahrung_muster_abgelegt')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('erfahrung_muster_abgelegt')}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Bewertung\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('erfahrung_bewertung') ? 
                            <FeatherLock onClick={() => toggleFieldLock('erfahrung_bewertung')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('erfahrung_bewertung')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('erfahrung_bewertung')}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Bemerkungen / Notizen\n"}
                      </span>
                      <TextArea
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                      >
                        <TextArea.Input
                          className="h-28 w-full flex-none"
                          placeholder="..."
                          {...createTextAreaProps('erfahrung_bemerkungen_notizen')}
                        />
                      </TextArea>
                    </div>
                  </div>
                </div>

                                 {/* ERFASSUNG */}
                 <div className="flex w-1/6 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
                  <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
                    <span className="w-full whitespace-pre-wrap text-heading-3 font-heading-3 text-default-font text-center bg-neutral-50 rounded-md py-2 px-4 border border-neutral-200">
                      {"ERFASSUNG"}
                    </span>
                    <Progress value={0}/>
                    
                    {/* Erfassung Fields */}
                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Quell URL\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        icon={<FeatherGlobe />}
                        iconRight={
                          lockedFields.has('erfassung_quell_url') ? 
                            <FeatherLock onClick={() => toggleFieldLock('erfassung_quell_url')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('erfassung_quell_url')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('erfassung_quell_url')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              openUrl(formData.erfassung_quell_url || '');
                            }
                          }}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Erfassungsdatum\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('erfassung_erfassungsdatum') ? 
                            <FeatherLock onClick={() => toggleFieldLock('erfassung_erfassungsdatum')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('erfassung_erfassungsdatum')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('erfassung_erfassungsdatum')}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Erfassung für\n"}
                      </span>
                      <TextField
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                        iconRight={
                          lockedFields.has('erfassung_erfassung_fuer') ? 
                            <FeatherLock onClick={() => toggleFieldLock('erfassung_erfassung_fuer')} style={{cursor: 'pointer'}} /> : 
                            <FeatherPenLine onClick={() => toggleFieldLock('erfassung_erfassung_fuer')} style={{cursor: 'pointer'}} />
                        }
                      >
                        <TextField.Input
                          placeholder=""
                          {...createTextFieldProps('erfassung_erfassung_fuer')}
                        />
                      </TextField>
                    </div>

                    <div className="flex w-full flex-col items-start gap-1 pt-4">
                      <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                        {"Extraktions Log\n"}
                      </span>
                      <TextArea
                        className="h-auto w-full flex-none"
                        variant="filled"
                        label=""
                        helpText=""
                      >
                        <TextArea.Input
                          className="h-28 w-full flex-none"
                          placeholder="..."
                          {...createTextAreaProps('erfassung_extraktions_log')}
                        />
                      </TextArea>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex w-full justify-end gap-2 pt-4 border-t border-gray-200">
                <Button
                  variant="neutral-primary"
                  onClick={handleClose}
                >
                  Abbrechen
                </Button>
                <Button
                  variant="brand-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Speichern...' : 'Speichern'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 