"use client";

import React, { useState } from 'react';
import { useCaptureForm } from '@/hooks/useCaptureForm';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/ui/components/Button';
import { TextField } from '@/ui/components/TextField';
import { useRouter } from 'next/navigation';

export default function CaptureForm() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const {
    formData,
    isDirty,
    isSaving,
    updateField,
    updateFields,
    resetForm,
    validateForm,
    toProductData,
    setIsSaving,
  } = useCaptureForm();

  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      alert('Bitte füllen Sie die erforderlichen Felder aus:\n' + validation.errors.join('\n'));
      return;
    }

    setIsSaving(true);
    try {
      const productData = toProductData();
      
      // Save to database via API
      const response = await fetch('/api/products/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern');
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
      }, 3000);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Fehler beim Speichern des Produkts');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-800 mb-2">Produkt erfolgreich gespeichert!</h1>
          <p className="text-green-600">Das Produkt wurde in der Datenbank gespeichert.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">BRAIN DB - Produkt Erfassung</h1>
              <p className="text-sm text-gray-600">
                Angemeldet als: {user?.name || user?.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
                size="small"
              >
                Admin
              </Button>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="small"
              >
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Produkt Informationen</h2>
            
            {/* Basic Product Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <TextField
                label="Hersteller *"
                value={formData.produkt_hersteller}
                onChange={(e) => updateField('produkt_hersteller', e.target.value)}
              >
                <TextField.Input
                  placeholder="z.B. Knauf, Saint-Gobain"
                />
              </TextField>
              
              <TextField
                label="Produktname/Modell *"
                value={formData.produkt_name_modell}
                onChange={(e) => updateField('produkt_name_modell', e.target.value)}
              >
                <TextField.Input
                  placeholder="z.B. Diamant, Rigips"
                />
              </TextField>
              
              <TextField
                label="Produktlinie/Serie"
                value={formData.produkt_produktlinie_serie}
                onChange={(e) => updateField('produkt_produktlinie_serie', e.target.value)}
              >
                <TextField.Input
                  placeholder="z.B. A-Mark, Plafond"
                />
              </TextField>
              
              <TextField
                label="Code/ID"
                value={formData.produkt_code_id}
                onChange={(e) => updateField('produkt_code_id', e.target.value)}
              >
                <TextField.Input
                  placeholder="z.B. 123456, ABC-001"
                />
              </TextField>
            </div>

            {/* Description */}
            <div className="mb-6">
              <TextField
                label="Beschreibung"
                value={formData.produkt_beschreibung}
                onChange={(e) => updateField('produkt_beschreibung', e.target.value)}
              >
                <TextField.TextArea
                  placeholder="Detaillierte Produktbeschreibung..."
                  rows={3}
                />
              </TextField>
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <TextField
                label="Hersteller Website"
                value={formData.produkt_hersteller_webseite}
                onChange={(e) => updateField('produkt_hersteller_webseite', e.target.value)}
              >
                <TextField.Input
                  type="url"
                  placeholder="https://www.hersteller.de"
                />
              </TextField>
              
              <TextField
                label="Produkt URL"
                value={formData.produkt_hersteller_produkt_url}
                onChange={(e) => updateField('produkt_hersteller_produkt_url', e.target.value)}
              >
                <TextField.Input
                  type="url"
                  placeholder="https://www.hersteller.de/produkt"
                />
              </TextField>
            </div>

            {/* Parameters */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Parameter</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextField
                  label="Maße"
                  value={formData.parameter_masse}
                  onChange={(e) => updateField('parameter_masse', e.target.value)}
                >
                  <TextField.Input
                    placeholder="z.B. 1200x600mm"
                  />
                </TextField>
                
                <TextField
                  label="Farbe"
                  value={formData.parameter_farbe}
                  onChange={(e) => updateField('parameter_farbe', e.target.value)}
                >
                  <TextField.Input
                    placeholder="z.B. Weiß, Grau"
                  />
                </TextField>
                
                <TextField
                  label="Hauptmaterial"
                  value={formData.parameter_hauptmaterial}
                  onChange={(e) => updateField('parameter_hauptmaterial', e.target.value)}
                >
                  <TextField.Input
                    placeholder="z.B. Gips, Holz"
                  />
                </TextField>
              </div>
            </div>

            {/* Retailer Info */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Händler Informationen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField
                  label="Händlername"
                  value={formData.haendler_haendlername}
                  onChange={(e) => updateField('haendler_haendlername', e.target.value)}
                >
                  <TextField.Input
                    placeholder="z.B. Bauhaus, Hornbach"
                  />
                </TextField>
                
                <TextField
                  label="Preis"
                  value={formData.haendler_preis}
                  onChange={(e) => updateField('haendler_preis', e.target.value)}
                >
                  <TextField.Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                  />
                </TextField>
                
                <TextField
                  label="Einheit"
                  value={formData.haendler_einheit}
                  onChange={(e) => updateField('haendler_einheit', e.target.value)}
                >
                  <TextField.Input
                    placeholder="z.B. m², Stück"
                  />
                </TextField>
                
                <TextField
                  label="Verfügbarkeit"
                  value={formData.haendler_verfuegbarkeit}
                  onChange={(e) => updateField('haendler_verfuegbarkeit', e.target.value)}
                >
                  <TextField.Input
                    placeholder="z.B. Verfügbar, Lieferbar"
                  />
                </TextField>
              </div>
            </div>

            {/* Source URL */}
            <div className="mb-6">
              <TextField
                label="Quell-URL"
                value={formData.erfassung_quell_url}
                onChange={(e) => updateField('erfassung_quell_url', e.target.value)}
              >
                <TextField.Input
                  type="url"
                  placeholder="https://www.example.com/produkt"
                />
              </TextField>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="flex space-x-4">
              <Button
                onClick={resetForm}
                variant="outline"
                disabled={isSaving}
              >
                Zurücksetzen
              </Button>
            </div>
            
            <div className="flex space-x-4">
              <Button
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className="min-w-[120px]"
              >
                {isSaving ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
