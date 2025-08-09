# APS File Indicators - Intelligente Datei-Status-Anzeige

## 🎯 **Übersicht**

Dieses Konzept beschreibt die Implementierung intelligenter Datei-Indikatoren in der Nextcloud-Integration, die Benutzern transparent anzeigen, ob eine Datei direkt angezeigt werden kann, bereits übersetzt ist, oder eine kostenpflichtige Translation benötigt.

## 🎨 **Visuelles Konzept**

### **Status-Indikatoren:**

```
📁 Projektordner/
├── 📄 dokumentation.pdf          🟢 (direkt anzeigbar)
├── 🏗️  hausplan.dwg             🔴 (Translation nötig ~2€)
├── 🏗️  hausplan.dwg             🟡 (bereits übersetzt)
├── 📊 statistik.xlsx             ⚪ (Format unbekannt)
├── 🖼️  foto.jpg                  🟢 (direkt anzeigbar)
└── 🏗️  komplexes_modell.rvt      🔴 (Translation nötig ~5€)
```

### **Icon-Legende:**

- **🟢 "Direkt anzeigbar"** - Datei kann ohne Translation angezeigt werden
- **🟡 "Bereits übersetzt"** - Translation vorhanden, kostenlos anzeigbar
- **🔴 "Translation nötig"** - Muss übersetzt werden, kostet Geld
- **⚪ "Format unbekannt"** - Dateityp nicht unterstützt/erkannt

## 🏗️ **Technische Architektur**

### **1. Dateityp-Klassifikation**

```typescript
// Dateityp-Kategorien
interface FileTypeCategory {
  extension: string;
  category: 'direct_view' | 'translation_required' | 'unknown';
  estimatedCostPerMB: number;
  description: string;
}

const FILE_TYPE_CATEGORIES: FileTypeCategory[] = [
  // Direkt anzeigbare Formate
  { extension: 'pdf', category: 'direct_view', estimatedCostPerMB: 0, description: 'PDF-Dokument' },
  { extension: 'jpg', category: 'direct_view', estimatedCostPerMB: 0, description: 'JPEG-Bild' },
  { extension: 'jpeg', category: 'direct_view', estimatedCostPerMB: 0, description: 'JPEG-Bild' },
  { extension: 'png', category: 'direct_view', estimatedCostPerMB: 0, description: 'PNG-Bild' },
  { extension: 'gif', category: 'direct_view', estimatedCostPerMB: 0, description: 'GIF-Bild' },
  { extension: 'svg', category: 'direct_view', estimatedCostPerMB: 0, description: 'SVG-Vektorgrafik' },
  { extension: 'txt', category: 'direct_view', estimatedCostPerMB: 0, description: 'Textdatei' },
  { extension: 'md', category: 'direct_view', estimatedCostPerMB: 0, description: 'Markdown-Datei' },
  { extension: 'html', category: 'direct_view', estimatedCostPerMB: 0, description: 'HTML-Datei' },
  { extension: 'htm', category: 'direct_view', estimatedCostPerMB: 0, description: 'HTML-Datei' },
  
  // Translation-required Formate
  { extension: 'dwg', category: 'translation_required', estimatedCostPerMB: 0.5, description: 'AutoCAD-Zeichnung' },
  { extension: 'rvt', category: 'translation_required', estimatedCostPerMB: 1.0, description: 'Revit-Modell' },
  { extension: 'ifc', category: 'translation_required', estimatedCostPerMB: 0.3, description: 'IFC-Bauwerksdatenmodell' },
  { extension: 'dgn', category: 'translation_required', estimatedCostPerMB: 0.4, description: 'MicroStation-Zeichnung' },
  { extension: 'nwd', category: 'translation_required', estimatedCostPerMB: 0.6, description: 'Navisworks-Modell' },
  { extension: '3ds', category: 'translation_required', estimatedCostPerMB: 0.7, description: '3D Studio-Modell' },
  { extension: 'obj', category: 'translation_required', estimatedCostPerMB: 0.2, description: 'Wavefront OBJ-Modell' },
  { extension: 'stl', category: 'translation_required', estimatedCostPerMB: 0.2, description: 'Stereolithographie-Modell' },
  { extension: 'step', category: 'translation_required', estimatedCostPerMB: 0.8, description: 'STEP-Austauschformat' },
  { extension: 'iges', category: 'translation_required', estimatedCostPerMB: 0.8, description: 'IGES-Austauschformat' },
  { extension: 'sat', category: 'translation_required', estimatedCostPerMB: 0.6, description: 'ACIS SAT-Format' },
  
  // Unbekannte Formate (werden als unknown kategorisiert)
];
```

### **2. File Status Service**

```typescript
// Hauptservice für Datei-Status-Bestimmung
class FileStatusService {
  
  // Datei-Hash generieren (für Cache-Lookup)
  static async generateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  // Dateityp kategorisieren
  static categorizeFileType(fileName: string): FileTypeCategory {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const category = FILE_TYPE_CATEGORIES.find(cat => cat.extension === extension);
    
    return category || {
      extension,
      category: 'unknown',
      estimatedCostPerMB: 0,
      description: 'Unbekanntes Format'
    };
  }
  
  // Translation-Kosten schätzen
  static estimateTranslationCost(fileSize: number, fileType: FileTypeCategory): number {
    if (fileType.category !== 'translation_required') return 0;
    
    const costPerMB = fileType.estimatedCostPerMB;
    const sizeInMB = fileSize / (1024 * 1024);
    const estimatedCost = sizeInMB * costPerMB;
    
    // Min/MMax Grenzen setzen
    return Math.max(0.5, Math.min(estimatedCost, 15));
  }
  
  // Vollständigen Datei-Status ermitteln
  static async getFileStatus(file: File, userId: string): Promise<FileStatus> {
    const fileType = this.categorizeFileType(file.name);
    const fileHash = await this.generateFileHash(file);
    
    // Status basierend auf Kategorie
    if (fileType.category === 'direct_view') {
      return {
        status: 'direct_view',
        icon: '🟢',
        cost: 0,
        description: `Kann direkt angezeigt werden (${fileType.description})`,
        tooltip: 'Klicken zum direkten Anzeigen',
        actions: ['view_direct']
      };
    }
    
    if (fileType.category === 'unknown') {
      return {
        status: 'unknown',
        icon: '⚪',
        cost: 0,
        description: 'Format nicht unterstützt',
        tooltip: 'Dieses Dateiformat wird nicht unterstützt',
        actions: []
      };
    }
    
    // Translation-required: Cache prüfen
    const cacheEntry = await this.findTranslationCache(fileHash);
    
    if (cacheEntry && cacheEntry.translation_status === 'success') {
      return {
        status: 'translated',
        icon: '🟡',
        cost: 0,
        description: 'Bereits übersetzt - kostenlos anzeigbar',
        tooltip: 'Translation vorhanden, klicken zum Anzeigen',
        actions: ['view_translated'],
        urn: cacheEntry.urn
      };
    }
    
    // Neue Translation nötig
    const estimatedCost = this.estimateTranslationCost(file.size, fileType);
    
    return {
      status: 'needs_translation',
      icon: '🔴',
      cost: estimatedCost,
      description: `Translation nötig - geschätzte Kosten: ${estimatedCost.toFixed(2)}€`,
      tooltip: `Klicken zum Übersetzen und Anzeigen (${estimatedCost.toFixed(2)}€)`,
      actions: ['translate_and_view', 'translate_only'],
      fileType: fileType
    };
  }
}
```

### **3. Cache-Integration**

```typescript
// Translation-Cache Service
class TranslationCacheService {
  
  // Cache-Eintrag finden
  static async findTranslationCache(fileHash: string): Promise<TranslationCacheEntry | null> {
    const { data, error } = await supabase
      .from('translation_cache')
      .select('*')
      .eq('original_file_hash', fileHash)
      .single();
    
    if (error || !data) return null;
    return data;
  }
  
  // Cache-Eintrag erstellen/aktualisieren
  static async upsertTranslationCache(entry: Partial<TranslationCacheEntry>): Promise<void> {
    const { error } = await supabase
      .from('translation_cache')
      .upsert(entry, { onConflict: 'original_file_hash' });
    
    if (error) throw error;
  }
  
  // Cache-Statistiken abrufen
  static async getCacheStats(userId: string): Promise<CacheStats> {
    const { data, error } = await supabase
      .from('translation_cache')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const totalFiles = data.length;
    const successfulTranslations = data.filter(d => d.translation_status === 'success').length;
    const estimatedSavings = successfulTranslations * 2; // Durchschnitt 2€ pro Translation
    
    return {
      totalFiles,
      successfulTranslations,
      estimatedSavings,
      cacheHitRate: totalFiles > 0 ? (successfulTranslations / totalFiles) * 100 : 0
    };
  }
}
```

## 🎨 **UI-Integration**

### **1. Nextcloud File List Enhancement**

```typescript
// Erweiterte Dateiliste mit Status-Indikatoren
const EnhancedFileList = ({ files, onFileAction }) => {
  const [fileStatuses, setFileStatuses] = useState({});
  const [loading, setLoading] = useState({});
  
  // Status für alle Dateien laden
  useEffect(() => {
    const loadFileStatuses = async () => {
      const statuses = {};
      
      for (const file of files) {
        try {
          setLoading(prev => ({ ...prev, [file.id]: true }));
          const status = await FileStatusService.getFileStatus(file, userId);
          statuses[file.id] = status;
        } catch (error) {
          console.error('Error loading file status:', error);
          statuses[file.id] = {
            status: 'error',
            icon: '❌',
            description: 'Fehler beim Laden des Status'
          };
        } finally {
          setLoading(prev => ({ ...prev, [file.id]: false }));
        }
      }
      
      setFileStatuses(statuses);
    };
    
    loadFileStatuses();
  }, [files]);
  
  return (
    <div className="file-list">
      {files.map(file => {
        const status = fileStatuses[file.id];
        const isLoading = loading[file.id];
        
        return (
          <div key={file.id} className="file-item">
            <div className="file-icon">
              {getFileIcon(file.name)}
            </div>
            
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{formatFileSize(file.size)}</span>
            </div>
            
            <div className="file-status">
              {isLoading ? (
                <div className="loading-spinner">⏳</div>
              ) : (
                <div 
                  className={`status-indicator ${status?.status}`}
                  title={status?.tooltip}
                >
                  {status?.icon}
                </div>
              )}
            </div>
            
            <div className="file-actions">
              {status?.actions?.map(action => (
                <button
                  key={action}
                  onClick={() => onFileAction(file, action)}
                  className={`action-button ${action}`}
                >
                  {getActionLabel(action)}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

### **2. Status-Indicator Komponente**

```typescript
// Wiederverwendbare Status-Indicator Komponente
const StatusIndicator = ({ status, size = 'medium' }) => {
  const getStatusConfig = (status) => {
    const configs = {
      direct_view: {
        icon: '🟢',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      translated: {
        icon: '🟡',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      needs_translation: {
        icon: '🔴',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      },
      unknown: {
        icon: '⚪',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      }
    };
    
    return configs[status] || configs.unknown;
  };
  
  const config = getStatusConfig(status.status);
  
  return (
    <div 
      className={`
        status-indicator 
        ${config.bgColor} 
        ${config.borderColor} 
        border rounded-full 
        flex items-center justify-center
        ${size === 'small' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'}
      `}
      title={status.tooltip}
    >
      <span className={config.color}>{status.icon}</span>
    </div>
  );
};
```

### **3. Tooltip und Kontext-Menü**

```typescript
// Erweiterte Tooltip-Komponente
const FileStatusTooltip = ({ status, file }) => {
  return (
    <div className="file-status-tooltip">
      <div className="tooltip-header">
        <span className="status-icon">{status.icon}</span>
        <span className="file-name">{file.name}</span>
      </div>
      
      <div className="tooltip-content">
        <p className="status-description">{status.description}</p>
        
        {status.cost > 0 && (
          <div className="cost-info">
            <span className="cost-label">Geschätzte Kosten:</span>
            <span className="cost-amount">{status.cost.toFixed(2)}€</span>
          </div>
        )}
        
        {status.actions?.length > 0 && (
          <div className="available-actions">
            <span className="actions-label">Verfügbare Aktionen:</span>
            <div className="action-buttons">
              {status.actions.map(action => (
                <button key={action} className="action-btn">
                  {getActionLabel(action)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

## 📊 **Cache-Statistiken und Analytics**

### **1. Dashboard-Widget**

```typescript
// Cache-Statistiken Widget
const CacheStatsWidget = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadStats = async () => {
      try {
        const cacheStats = await TranslationCacheService.getCacheStats(userId);
        setStats(cacheStats);
      } catch (error) {
        console.error('Error loading cache stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, []);
  
  if (loading) return <div className="loading">Lade Statistiken...</div>;
  
  return (
    <div className="cache-stats-widget">
      <h3 className="widget-title">💾 Translation-Cache</h3>
      
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Gespeicherte Dateien:</span>
          <span className="stat-value">{stats.totalFiles}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Erfolgreiche Übersetzungen:</span>
          <span className="stat-value">{stats.successfulTranslations}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Cache-Hit-Rate:</span>
          <span className="stat-value">{stats.cacheHitRate.toFixed(1)}%</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Geschätzte Ersparnis:</span>
          <span className="stat-value">{stats.estimatedSavings.toFixed(2)}€</span>
        </div>
      </div>
      
      <div className="widget-actions">
        <button onClick={clearOldCache}>🗑️ Alte Einträge löschen</button>
        <button onClick={exportStats}>📊 Statistiken exportieren</button>
      </div>
    </div>
  );
};
```

## 🔧 **Implementierungsplan**

### **Phase 1: Grundlegende Funktionalität**
1. ✅ Dateityp-Klassifikation implementieren
2. ✅ File Status Service erstellen
3. ✅ Basis-UI-Komponenten entwickeln
4. ✅ Integration in Nextcloud-File-List

### **Phase 2: Cache-Integration**
1. 🔄 Translation-Cache-Service implementieren
2. 🔄 Hash-basierte Duplikat-Erkennung
3. 🔄 Cache-Statistiken
4. 🔄 Performance-Optimierung

### **Phase 3: Erweiterte Features**
1. 🔄 Kosten-Schätzung verfeinern
2. 🔄 Batch-Operationen
3. 🔄 Benutzer-Einstellungen
4. 🔄 Analytics und Reporting

### **Phase 4: Optimierung**
1. 🔄 Performance-Tuning
2. 🔄 UI/UX-Verbesserungen
3. 🔄 Mobile-Optimierung
4. 🔄 A/B-Testing

## 🎯 **Erwartete Vorteile**

### **Für Benutzer:**
- ✅ **Transparenz** - Klare Kosteninformationen
- ✅ **Kontrolle** - Bewusste Entscheidungen über Translation-Kosten
- ✅ **Effizienz** - Schnelle Erkennung bereits übersetzter Dateien
- ✅ **Benutzerfreundlichkeit** - Intuitive visuelle Indikatoren

### **Für das System:**
- ✅ **Kostenkontrolle** - Vermeidung doppelter Translationen
- ✅ **Performance** - Schneller Zugriff auf bereits übersetzte Dateien
- ✅ **Skalierbarkeit** - Effiziente Cache-Verwaltung
- ✅ **Analytik** - Nutzungsmuster und Kosten-Tracking

## 🚀 **Nächste Schritte**

1. **Konzept-Review** - Feedback von Stakeholdern einholen
2. **Prototyp-Entwicklung** - Basis-Implementierung für Tests
3. **Benutzer-Tests** - Feedback zur UI/UX sammeln
4. **Iterative Entwicklung** - Schrittweise Implementierung der Features

---

**Status:** Konzept erstellt - Bereit für Review und Implementierung
**Priorität:** Hoch - Wichtige Benutzerfreundlichkeit und Kostenkontrolle
**Komplexität:** Mittel - Gut umsetzbar mit bestehender Infrastruktur
