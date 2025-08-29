# WFS-Link Intelligent Validator

## 🎯 Ziel
Ein intelligentes System zur Validierung von WFS-Links mit Echtzeit-Feedback und automatischer Fehlerdiagnose.

## 📋 Problemstellung
Aktuell müssen Benutzer WFS-Links manuell hinzufügen und erfahren erst später (beim nächsten Batch-Update) ob die Links funktionieren. Das führt zu:
- Frustration bei fehlerhaften Links
- Zeitverlust durch manuelle Fehlersuche
- Inkonsistente Datenqualität

## 🚀 Lösungskonzept

### 1. API-Endpoint für Validierung
**Pfad:** `/api/wfs/validate-link`
**Methode:** POST
**Input:** `{ "url": "https://example.com/wfs" }`
**Output:** 
```json
{
  "valid": true,
  "status": "success",
  "message": "WFS-Service erfolgreich validiert",
  "metadata": {
    "wfs_version": ["2.0.0", "1.1.0"],
    "layer_count": 15,
    "provider": "Beispiel GmbH",
    "inspire_conform": true
  },
  "suggestions": []
}
```

### 2. Validierungs-Pipeline

#### Phase 1: URL-Syntax-Check
- ✅ Gültige URL-Format
- ✅ Duplikat-Prüfung in Datenbank
- ✅ DNS-Auflösung testen

#### Phase 2: GetCapabilities-Test
- 🔄 Automatisches Version-Probing (2.0.0, 1.1.0, 1.0.0)
- 🔄 User-Agent-Rotation
- 🔄 Timeout-Handling (15s)

#### Phase 3: Intelligente Fehlerdiagnose
- **HTTP 400:** "Fehlende Parameter, versuche mit ?version=2.0.0"
- **HTTP 401:** "Authentifizierung erforderlich"
- **HTTP 403:** "Zugriff verweigert, möglicherweise IP-beschränkt"
- **HTTP 404:** "URL nicht gefunden, überprüfe Pfad"
- **Redirect:** "URL leitet um, versuche direkten WFS-Endpunkt"

#### Phase 4: Auto-Korrektur-Vorschläge
- 🔧 ArcGIS-URLs automatisch korrigieren
- 🔧 Fehlende Parameter hinzufügen
- 🔧 Alternative URLs vorschlagen

### 3. Subframe-UI Integration

#### Formular-Komponente
```typescript
interface WFSLinkValidatorProps {
  onValidationComplete: (result: ValidationResult) => void;
  onError: (error: string) => void;
}
```

#### Echtzeit-Feedback
- **Grüner Haken** ✅ bei erfolgreicher Validierung
- **Gelbe Warnung** ⚠️ bei Problemen mit Lösungsvorschlägen
- **Roter Fehler** ❌ bei nicht behebbaren Problemen
- **Loading-Spinner** 🔄 während Validierung

#### Auto-Vervollständigung
- Bekannte WFS-Server vorschlagen
- Häufige URL-Patterns erkennen
- Bundesland-spezifische Vorschläge

## 🛠️ Technische Umsetzung

### API-Endpoint: `/api/wfs/validate-link`
```typescript
// src/app/api/wfs/validate-link/route.ts
export async function POST(request: Request) {
  const { url } = await request.json();
  
  // 1. URL-Syntax validieren
  const syntaxCheck = validateUrlSyntax(url);
  if (!syntaxCheck.valid) {
    return Response.json({ valid: false, error: syntaxCheck.error });
  }
  
  // 2. Duplikat prüfen
  const duplicateCheck = await checkDuplicate(url);
  if (duplicateCheck.exists) {
    return Response.json({ 
      valid: false, 
      error: "Link bereits in Datenbank vorhanden",
      existingRecord: duplicateCheck.record 
    });
  }
  
  // 3. GetCapabilities testen
  const capabilitiesTest = await testGetCapabilities(url);
  
  // 4. Metadaten extrahieren
  const metadata = await extractMetadata(capabilitiesTest.xml);
  
  return Response.json({
    valid: true,
    metadata,
    suggestions: capabilitiesTest.suggestions
  });
}
```

### Validierungs-Funktionen
```typescript
// src/lib/wfs-validator.ts
export class WFSLinkValidator {
  async validateUrl(url: string): Promise<ValidationResult> {
    // Implementierung der Validierungs-Pipeline
  }
  
  async testGetCapabilities(url: string): Promise<CapabilitiesTest> {
    // Version-Probing und Fehlerdiagnose
  }
  
  generateSuggestions(error: WFSError): string[] {
    // Intelligente Lösungsvorschläge
  }
}
```

## 📊 Benutzerfreundlichkeit

### Erfolgs-Szenario
1. Benutzer gibt WFS-URL ein
2. Sofortige Validierung im Hintergrund
3. Grüner Haken + Metadaten-Anzeige
4. "Link hinzufügen" Button aktiviert

### Fehler-Szenario
1. Benutzer gibt fehlerhafte URL ein
2. Sofortige Fehlerdiagnose
3. Konkrete Lösungsvorschläge
4. Auto-Korrektur-Optionen

### Warnung-Szenario
1. URL funktioniert, aber mit Einschränkungen
2. Gelbe Warnung mit Details
3. Option zum trotzdem hinzufügen
4. Hinweise für zukünftige Verwendung

## 🎯 Vorteile

### Für Benutzer
- **Sofortiges Feedback** statt späterer Enttäuschung
- **Konkrete Lösungsvorschläge** statt Rätselraten
- **Zeitersparnis** durch automatische Fehlerdiagnose
- **Bessere Datenqualität** durch Validierung

### Für Entwickler
- **Wiederverwendbare Validierungs-Logik**
- **Erweiterbare Fehlerdiagnose**
- **Testbare API-Endpoints**
- **Konsistente Fehlerbehandlung**

## 🚀 Nächste Schritte

1. **API-Endpoint implementieren** (`/api/wfs/validate-link`)
2. **Validierungs-Logik entwickeln** (WFSLinkValidator Klasse)
3. **Fehlerdiagnose-System** (intelligente Lösungsvorschläge)
4. **Subframe-UI Integration** (Formular mit Echtzeit-Feedback)
5. **Testing & Optimierung** (Performance, Fehlerbehandlung)

## 📝 Priorität
**Hoch** - Direkte Verbesserung der Benutzerfreundlichkeit und Datenqualität