# Tree-Menü-System Dokumentation

## Übersicht

Das Tree-Menü-System besteht aus zwei Hauptkomponenten:
1. **CustomTreeView** - Die wiederverwendbare Tree-Komponente
2. **Tree-Menü-Integration** - Die Integration in Seiten mit Suchfunktion

## Komponenten

### 1. CustomTreeView Component

**Datei:** `src/components/CustomTreeView.tsx`

#### Features:
- ✅ **Expand/Collapse** für Hauptkategorien
- ✅ **Globale Expand/Collapse** für alle Kategorien
- ✅ **Klickbare gesamte Zeile** (nicht nur Chevron)
- ✅ **Hervorhebung** ausgewählter Subkategorien
- ✅ **Konsistente Schriftart** mit Subframe
- ✅ **Lighter Text** für Subkategorien
- ✅ **Brand Color** für ausgewählte Items

#### Props Interface:
```typescript
interface CustomTreeViewProps {
  items: TreeItem[];
  expandedItems: Record<string, boolean>;
  onItemSelect: (itemId: string) => void;
  onExpandedChange: (itemId: string, expanded: boolean) => void;
}

interface TreeItem {
  id: string;
  label: string;
  children?: TreeItem[];
}
```

#### Verwendung:
```tsx
import { CustomTreeView } from "@/components/CustomTreeView";

// State für expandierte Items
const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

// Tree-Daten strukturieren
const treeItems = [
  {
    id: "hauptkategorie1",
    label: "Hauptkategorie 1",
    children: [
      { id: "sub1", label: "Subkategorie 1" },
      { id: "sub2", label: "Subkategorie 2" }
    ]
  }
];

// Event Handler
const handleItemSelect = (itemId: string) => {
  // Nur Subkategorien auswählen
  const isMainCategory = treeItems.some(item => item.id === itemId);
  if (!isMainCategory) {
    setSelectedCategory(itemId);
  }
};

const handleExpandedChange = (itemId: string, expanded: boolean) => {
  setExpandedItems(prev => ({
    ...prev,
    [itemId]: expanded
  }));
};

// Component rendern
<CustomTreeView
  items={treeItems}
  expandedItems={expandedItems}
  onItemSelect={handleItemSelect}
  onExpandedChange={handleExpandedChange}
/>
```

### 2. Tree-Menü-Integration

**Datei:** `src/app/database/page.tsx` (Beispiel)

#### Vollständige Integration:

```tsx
"use client";

import React, { useState } from "react";
import { CustomTreeView } from "@/components/CustomTreeView";
import { TextField } from "@/ui/components/TextField";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherSearch } from "@subframe/core";
import { FeatherChevronDown } from "@subframe/core";
import { FeatherChevronUp } from "@subframe/core";

function YourPage() {
  // 1. State Management
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // 2. Daten laden (Beispiel)
  const { categories, loading, error } = useYourData();

  // 3. Suchfunktion
  const filteredCategories = categories.filter(category =>
    category.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.main_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.sub_category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 4. Tree-Struktur erstellen
  const groupedCategories = filteredCategories.reduce((acc, category) => {
    if (!acc[category.main_category]) {
      acc[category.main_category] = [];
    }
    acc[category.main_category].push(category);
    return acc;
  }, {} as Record<string, typeof categories>);

  const treeItems = Object.entries(groupedCategories).map(([mainCategory, subCategories]) => ({
    id: mainCategory,
    label: mainCategory,
    children: subCategories.map(category => ({
      id: category.id,
      label: category.label,
    }))
  }));

  // 5. Event Handler
  const handleItemSelect = (itemId: string) => {
    const isMainCategory = treeItems.some(item => item.id === itemId);
    if (!isMainCategory) {
      setSelectedCategory(itemId);
    }
  };

  const handleExpandedChange = (itemId: string, expanded: boolean) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: expanded
    }));
  };

  const toggleAllFolders = () => {
    const allMainCategories = [...new Set(categories.map(cat => cat.main_category))];
    const currentStates = allMainCategories.map(cat => expandedItems[cat] || false);
    const allExpanded = currentStates.every(state => state);
    
    const newStates: Record<string, boolean> = {};
    allMainCategories.forEach(cat => {
      newStates[cat] = !allExpanded;
    });
    
    setExpandedItems(newStates);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  // 6. UI Rendering
  return (
    <div className="flex w-80 flex-none flex-col items-start gap-2 self-stretch px-4 py-4 shadow-lg overflow-auto">
      {/* Header */}
      <div className="flex w-full items-center gap-2 pl-2 py-2">
        <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">
          Kategorie
        </span>
      </div>

      {/* Suchfeld mit Clear-Button */}
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
        
        {/* Clear-Button */}
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="flex items-center justify-center w-8 h-8 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-800 text-sm font-medium"
            title="Suche löschen"
          >
            ×
          </button>
        )}

        {/* Expand/Collapse All Button */}
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

      {/* Tree View */}
      <CustomTreeView
        items={treeItems}
        expandedItems={expandedItems}
        onItemSelect={handleItemSelect}
        onExpandedChange={handleExpandedChange}
      />

      {/* Loading/Error States */}
      {loading && (
        <div className="text-caption text-subtext-color mt-2">Lade Kategorien...</div>
      )}
      {error && (
        <div className="text-caption text-red-500 mt-2">Fehler beim Laden der Kategorien</div>
      )}
    </div>
  );
}
```

## Datenstruktur

### Erwartete Kategorie-Daten:
```typescript
interface Category {
  id: string;
  label: string;
  main_category: string;
  sub_category: string;
}
```

### Tree-Struktur:
```typescript
interface TreeItem {
  id: string;           // Eindeutige ID
  label: string;        // Anzeigename
  children?: TreeItem[]; // Subkategorien (optional)
}
```

## Styling

### CustomTreeView verwendet:
- **Schriftart:** `text-body font-body text-default-font` (Subframe-kompatibel)
- **Subkategorien:** `text-subtext-color` (heller Text)
- **Ausgewählt:** `bg-brand-500 text-white` (Brand Color)
- **Hover:** Standard Subframe Hover-Effekte

### Responsive Design:
- **Breite:** `w-80` (320px) - anpassbar
- **Scroll:** `overflow-auto` für lange Listen
- **Shadow:** `shadow-lg` für Tiefe

## Best Practices

### 1. State Management:
- ✅ Verwende `useState` für lokalen State
- ✅ Trenne `expandedItems` und `selectedCategory`
- ✅ Verwende `Record<string, boolean>` für expandierte Items

### 2. Performance:
- ✅ Filtere Daten vor der Tree-Erstellung
- ✅ Verwende `useMemo` für komplexe Berechnungen
- ✅ Vermeide unnötige Re-Renders

### 3. UX:
- ✅ Zeige Loading/Error States
- ✅ Bedingte Clear-Button Anzeige
- ✅ Tooltips für bessere Accessibility
- ✅ Konsistente Icon-Verwendung

### 4. Datenstruktur:
- ✅ Eindeutige IDs für alle Items
- ✅ Hierarchische Struktur (main → sub)
- ✅ Konsistente Label-Namen

## Anpassungen

### Andere Icon-Sets:
```tsx
// Statt Feather Icons
import { Search, ChevronDown, ChevronUp, X } from "lucide-react";

// Oder einfache Text-Symbole
const ClearIcon = () => <span>×</span>;
```

### Andere Styling-Frameworks:
```tsx
// Statt Tailwind
const treeItemStyle = {
  fontFamily: 'Inter, sans-serif',
  color: '#374151',
  backgroundColor: selected ? '#3B82F6' : 'transparent'
};
```

### Andere Datenquellen:
```tsx
// API Call
const { data: categories } = useQuery('categories', fetchCategories);

// Local Storage
const [categories, setCategories] = useState(() => {
  const saved = localStorage.getItem('categories');
  return saved ? JSON.parse(saved) : [];
});
```

## Troubleshooting

### Häufige Probleme:

1. **Icons werden nicht angezeigt:**
   - Subframe Icon-Import-Probleme sind bekannt
   - Verwende Text-Symbole als Fallback
   - Dokumentiert in `README_SUBFRAME_NEXTJS.md`

2. **Expand/Collapse funktioniert nicht:**
   - Prüfe `expandedItems` State
   - Stelle sicher, dass `onExpandedChange` korrekt aufgerufen wird
   - Debugge mit `console.log`

3. **Auswahl funktioniert nicht:**
   - Prüfe `handleItemSelect` Logik
   - Stelle sicher, dass nur Subkategorien auswählbar sind
   - Prüfe `selectedCategory` State

4. **Styling-Probleme:**
   - Prüfe Tailwind-Klassen
   - Stelle sicher, dass Subframe CSS geladen ist
   - Verwende Browser DevTools für Debugging

## Migration Guide

### Von anderen Tree-Komponenten:

1. **Ersetze TreeView-Komponente:**
   ```tsx
   // Alt
   <TreeView>
     <TreeView.Folder label="...">
       <TreeView.Item label="..." />
     </TreeView.Folder>
   </TreeView>

   // Neu
   <CustomTreeView
     items={treeItems}
     expandedItems={expandedItems}
     onItemSelect={handleItemSelect}
     onExpandedChange={handleExpandedChange}
   />
   ```

2. **Passe State Management an:**
   ```tsx
   // Alt
   const [folderStates, setFolderStates] = useState({});

   // Neu
   const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
   ```

3. **Aktualisiere Event Handler:**
   ```tsx
   // Alt
   const toggleFolder = (folderId: string) => {
     setFolderStates(prev => ({ ...prev, [folderId]: !prev[folderId] }));
   };

   // Neu
   const handleExpandedChange = (itemId: string, expanded: boolean) => {
     setExpandedItems(prev => ({ ...prev, [itemId]: expanded }));
   };
   ```

## Beispiele

### Einfache Integration:
```tsx
// Minimal Setup
const [expandedItems, setExpandedItems] = useState({});
const [selectedCategory, setSelectedCategory] = useState(null);

<CustomTreeView
  items={[{ id: "1", label: "Test", children: [{ id: "2", label: "Sub" }] }]}
  expandedItems={expandedItems}
  onItemSelect={setSelectedCategory}
  onExpandedChange={(id, expanded) => setExpandedItems(prev => ({ ...prev, [id]: expanded }))}
/>
```

### Schnelle Integration mit Template:
```tsx
import { TreeMenuTemplate } from "@/components/TreeMenuTemplate";

function YourPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Deine Kategorien-Daten
  const categories = [
    { id: "1", label: "Fliesen", main_category: "Fußbodenbeläge", sub_category: "Fliesen" },
    { id: "2", label: "Teppiche", main_category: "Fußbodenbeläge", sub_category: "Teppiche" }
  ];

  return (
    <div className="flex w-full items-start gap-4">
      <TreeMenuTemplate
        title="Produktkategorien"
        categories={categories}
        onCategorySelect={setSelectedCategory}
        selectedCategoryId={selectedCategory}
        loading={false}
        error={null}
      />
      
      {/* Dein Content hier */}
      <div className="flex grow">
        {selectedCategory ? `Ausgewählt: ${selectedCategory}` : "Keine Kategorie ausgewählt"}
      </div>
    </div>
  );
}
```

### Erweiterte Integration:
Siehe `src/app/database/page.tsx` für vollständiges Beispiel mit:
- Suchfunktion
- Loading States
- Error Handling
- Breadcrumbs
- Product Cards

---

**Erstellt:** $(date)
**Version:** 1.0
**Kompatibilität:** Next.js 15, Subframe UI, Tailwind CSS 