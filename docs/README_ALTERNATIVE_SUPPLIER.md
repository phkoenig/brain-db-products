# Alternative Supplier Funktionalität - BRAIN DB

## 🎯 Übersicht

Die **Alternative Supplier Funktionalität** ermöglicht es, alternative Händler für Produkte zu finden und zu speichern. Diese Funktion ist besonders nützlich für Preisvergleiche und die Suche nach besseren Angeboten.

## ✅ Implementierte Features

### 1. **Datenbank-Erweiterung**
- **Neue Felder** in der `products` Tabelle hinzugefügt:
  - `alternative_retailer_name` - Name des alternativen Händlers
  - `alternative_retailer_url` - URL des alternativen Händlers
  - `alternative_retailer_price` - Preis beim alternativen Händler
  - `alternative_retailer_unit` - Einheit beim alternativen Händler
  - `alternative_retailer_price_per_unit` - Preis pro Einheit
  - `alternative_retailer_availability` - Verfügbarkeit
  - `alternative_retailer_ai_research_status` - Status der KI-Recherche
  - `alternative_retailer_ai_research_progress` - Fortschritt der KI-Recherche

### 2. **TypeScript-Typen**
- **Product Interface** erweitert um alle neuen Felder
- **ProductFormData** Typ aktualisiert für Formular-Handling
- Vollständige Typsicherheit für alle neuen Felder

### 3. **Formular-Integration**
- **useCaptureForm Hook** erweitert um Alternative Retailer Felder
- **Formular-State-Management** für alle neuen Felder
- **Datenvalidierung** und -transformation
- **Speicherfunktion** in die Datenbank

### 4. **UI-Integration**
- **Capture-Seite** erweitert um Alternative Retailer Sektion
- **Alle Felder** mit Formular-State verbunden
- **AI-Research Button** vorbereitet für zukünftige KI-Integration
- **Action Buttons** (Reset/Save) hinzugefügt

## 🔧 Technische Details

### Datenbank-Migration
```sql
ALTER TABLE products 
ADD COLUMN alternative_retailer_name TEXT,
ADD COLUMN alternative_retailer_url TEXT,
ADD COLUMN alternative_retailer_price NUMERIC,
ADD COLUMN alternative_retailer_unit TEXT,
ADD COLUMN alternative_retailer_price_per_unit NUMERIC,
ADD COLUMN alternative_retailer_availability TEXT,
ADD COLUMN alternative_retailer_ai_research_status TEXT DEFAULT 'pending',
ADD COLUMN alternative_retailer_ai_research_progress INTEGER DEFAULT 0;
```

### TypeScript Interface
```typescript
// Alternative Retailer (NEW)
alternative_retailer_name?: string;
alternative_retailer_url?: string;
alternative_retailer_price?: number;
alternative_retailer_unit?: string;
alternative_retailer_price_per_unit?: number;
alternative_retailer_availability?: string;
alternative_retailer_ai_research_status?: string;
alternative_retailer_ai_research_progress?: number;
```

### Formular-State
```typescript
// Alternative Retailer (NEW)
alternative_retailer_name: '',
alternative_retailer_url: '',
alternative_retailer_price: '',
alternative_retailer_unit: '',
alternative_retailer_price_per_unit: '',
alternative_retailer_availability: '',
alternative_retailer_ai_research_status: 'pending',
```

## 🎨 UI-Komponenten

### Alternative Retailer Sektion
- **AI-Research Button** mit Play-Icon
- **Status-Feld** für KI-Recherche-Status
- **Progress Bar** für Recherche-Fortschritt
- **Alle Händler-Felder** mit Placeholder-Texten

### Felder im Detail
1. **Alternative Retailer - AI-Research**
   - Button zum Starten der KI-Recherche
   - Status-Anzeige
   - Fortschrittsbalken

2. **Alternative Retailer - Retailer Name**
   - Textfeld für Händlername

3. **Alternative Retailer - URL**
   - Textfeld für Händler-URL

4. **Alternative Retailer - Price**
   - Numerisches Feld für Preis

5. **Alternative Retailer - Unit**
   - Textfeld für Einheit

6. **Alternative Retailer - Price per Unit**
   - Numerisches Feld für Preis pro Einheit

7. **Alternative Retailer - Availability**
   - Textfeld für Verfügbarkeit

## 🚀 Nächste Schritte

### 1. **KI-Integration**
- **AI-Research Button** implementieren
- **Automatische Händler-Suche** basierend auf Produktdaten
- **Preisvergleich** zwischen verschiedenen Händlern
- **Verfügbarkeits-Check** automatisch durchführen

### 2. **Erweiterte Features**
- **Mehrere alternative Händler** pro Produkt
- **Händler-Bewertungen** und -Reviews
- **Lieferzeit-Vergleich**
- **Rabatt-Codes** und -Angebote

### 3. **UI-Verbesserungen**
- **Händler-Vergleichstabelle** anzeigen
- **Preis-Historie** visualisieren
- **Best-Price-Alerts** implementieren
- **Favoriten-Händler** markieren

## 📊 Aktueller Status

### ✅ Vollständig implementiert:
- Datenbank-Schema erweitert
- TypeScript-Typen aktualisiert
- Formular-State-Management
- UI-Integration
- Speicherfunktion

### 🔄 Ausstehend:
- KI-Research-Integration
- Automatische Händler-Suche
- Preisvergleich-Logik
- Erweiterte UI-Features

## 🧪 Testing

### Manueller Test:
1. **Capture-Seite öffnen** (`/capture?capture_id=20`)
2. **Alternative Retailer Felder** ausfüllen
3. **Save Button** klicken
4. **Datenbank prüfen** - neue Felder sollten gespeichert sein

### Automatisierte Tests:
- Unit Tests für `useCaptureForm` Hook
- Integration Tests für Datenbank-Operationen
- E2E Tests für UI-Flows

---

**Erstellt:** Dezember 2024  
**Status:** ✅ Vollständig implementiert  
**Nächster Meilenstein:** KI-Research-Integration 