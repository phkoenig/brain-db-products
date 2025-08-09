# APS (Autodesk Platform Services) Integration - Vollständige Dokumentation

## Übersicht

Diese Dokumentation beschreibt die erfolgreiche Integration von Autodesk Platform Services (APS) für das Hochladen und Anzeigen von CAD-Dateien in der BRAIN DB Products A Anwendung. **WARNUNG: Diese Integration war eine Odyssee mit vielen kritischen Problemen. Alle hier dokumentierten Lösungen sind essentiell für eine funktionierende Implementierung.**

## Implementierte Features

- ✅ **OAuth2 Two-Legged Authentication** - Server-zu-Server Token-Generierung
- ✅ **Bucket Management** - Erstellen, Auflisten und Löschen von APS-Buckets
- ✅ **File Upload** - Hochladen von CAD-Dateien (DWG, RVT, IFC, PDF, etc.)
- ✅ **Model Translation** - Übersetzung von CAD-Dateien für den Viewer
- ✅ **APS Viewer** - 3D-Viewer für CAD-Modelle mit robuster Initialisierung
- ✅ **Testseite** - Vollständige Testumgebung unter `/aps-test`
- ✅ **Error Handling** - Umfassende Fehlerbehandlung und Logging
- ✅ **User Feedback** - Toast-Notifications und Fortschrittsanzeigen

## Kritische Implementierungsdetails

### 1. OAuth2 Two-Legged Authentication

```typescript
// KRITISCH: Korrekte Endpoint und Header
const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'x-ads-region': 'EMEA'  // KRITISCH für moderne APS-API
  },
  body: new URLSearchParams({
    client_id: process.env.APS_CLIENT_ID!,
    client_secret: process.env.APS_CLIENT_SECRET!,
    grant_type: 'client_credentials',
    scope: 'data:read data:write bucket:create bucket:read bucket:delete'
  })
});
```

**Wichtige Punkte:**
- Endpoint: `authentication/v2/token` (nicht `v1`)
- Header: `x-ads-region: EMEA` ist essentiell
- Scope: `bucket:delete` für Bucket-Löschung erforderlich

### 2. File Upload - signeds3upload Methode

```typescript
// 3-Schritt Prozess (korrekte, nicht-deprecated Methode)
// Schritt 1: Signed URL anfordern
const signedUrlResponse = await fetch(
  `${APS_BASE_URL}/oss/v2/buckets/${bucketKey}/objects/${objectKey}/signeds3upload`,
  { method: 'GET', headers: { 'x-ads-region': 'EMEA', 'Authorization': `Bearer ${token}` } }
);

// Schritt 2: Datei zu S3 hochladen
const uploadResponse = await fetch(signedUrlData.urls[0], {  // KRITISCH: urls[0] nicht uploadKey
  method: 'PUT',
  headers: { 'Content-Type': 'application/octet-stream' },
  body: file
});

// Schritt 3: Upload abschließen
const completeResponse = await fetch(
  `${APS_BASE_URL}/oss/v2/buckets/${bucketKey}/objects/${objectKey}/signeds3upload`,
  { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json', 'x-ads-region': 'EMEA', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ uploadKey: signedUrlData.uploadKey })
  }
);
```

**Kritischer Fix:** `signedUrlData.urls[0]` verwenden, nicht `signedUrlData.uploadKey`

### 3. Model Translation - Kritische Parameter

```typescript
// KRITISCH: Korrekte Output-Formate für verschiedene Dateitypen
const outputFormats = [{
  type: 'svf2',
  views: ['2d', '3d']  // KRITISCH: views Parameter ist erforderlich für svf2
}];

// Für PDF-Dateien (falls unterstützt):
const pdfOutputFormats = [{
  type: 'pdf'  // Keine views für PDF
}];

// Translation starten mit Force-Option für hängende Jobs
const response = await fetch(`${APS_BASE_URL}/modelderivative/v2/designdata/job`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-ads-force': force ? 'true' : undefined  // KRITISCH für hängende Translations
  },
  body: JSON.stringify({
    input: { urn: urn },
    output: { formats: outputFormats }
  })
});
```

**Kritische Erkenntnisse:**
- `views: ['2d', '3d']` ist **ERFORDERLICH** für `svf2` Output
- `x-ads-force: true` löst hängende `pending` Translations
- PDF zu SVF2 Translation ist **NICHT UNTERSTÜTZT**

### 4. APS Viewer SDK Integration - Robuste Implementierung

```typescript
// KRITISCH: Dynamisches Laden des SDKs
useEffect(() => {
  const loadViewerScript = () => {
    if (window.Autodesk) {
      setIsSdkLoaded(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js";
    script.async = true;
    script.onload = () => {
      console.log("APS Viewer SDK loaded.");
      setIsSdkLoaded(true);
    };
    script.onerror = () => {
      toast.error("Failed to load Autodesk Viewer SDK.");
    };
    document.body.appendChild(script);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.css';
    document.head.appendChild(link);
  };
  loadViewerScript();
}, []);

// KRITISCH: Robuste Viewer-Initialisierung
const initializeViewer = useCallback(async (urn: string) => {
  if (!isSdkLoaded || !viewerRef.current) {
    toast.error("Viewer SDK not loaded or container not ready.");
    return;
  }
  
  try {
    const tokenResponse = await fetch('/api/aps/viewer-token');
    if (!tokenResponse.ok) throw new Error("Failed to get viewer token");
    const { access_token } = await tokenResponse.json();

    const options = {
      env: 'AutodeskProduction',
      getAccessToken: (onGetAccessToken: (token: string, expire: number) => void) => {
        onGetAccessToken(access_token, 3599);
      },
    };

    window.Autodesk.Viewing.Initializer(options, () => {
      const viewer = new window.Autodesk.Viewing.GuiViewer3D(viewerRef.current!);
      viewer.start();
      const documentId = 'urn:' + urn;
      window.Autodesk.Viewing.Document.load(documentId, (doc) => {
        const viewables = doc.getRoot().getDefaultGeometry();
        viewer.loadDocumentNode(doc, viewables);
        setIsViewerInitialized(true);
        toast.success("Model loaded successfully!");
      }, (errorCode, errorMsg) => {
        console.error('Model Loading failed:', errorCode, errorMsg);
        toast.error(`Failed to load model: ${errorMsg} (${errorCode})`);
      });
    });
  } catch (error) {
    console.error("Viewer initialization failed:", error);
    toast.error("Viewer initialization failed.");
  }
}, [isSdkLoaded]);
```

**Kritische Best Practices:**
- SDK dynamisch laden mit Error-Handling
- `useCallback` für `initializeViewer` verwenden
- Token-Management über separate API-Route
- Umfassende Error-Behandlung mit User-Feedback

### 5. Translation Status Monitoring

```typescript
// KRITISCH: Serverseitige Translation-Überwachung
const monitorTranslationStatus = async (urn: string) => {
  const intervalId = setInterval(async () => {
    const statusResponse = await fetch(`/api/aps/translate?urn=${urn}`);
    const { status, progress } = await statusResponse.json();

    setUploadedFiles([{ ...fileState, status: 'translating', urn: urn, progress: parseInt(progress) || 0 }]);

    if (status === 'success') {
      clearInterval(intervalId);
      toast.success('Translation successful!');
      setUploadedFiles([{ ...fileState, status: 'success', urn: urn, progress: 100 }]);
    } else if (status === 'failed') {
      clearInterval(intervalId);
      toast.error('Translation failed.');
      setUploadedFiles([{ ...fileState, status: 'failed', urn, error: 'Translation failed' }]);
    }
  }, 5000); // Poll alle 5 Sekunden
};
```

## Dateistruktur

```
src/
├── lib/
│   └── aps.ts                    # APS Service (Token, Buckets, Upload, Translation)
├── app/
│   ├── api/aps/
│   │   ├── test/route.ts         # APS API Tests
│   │   ├── upload/route.ts       # File Upload Handler
│   │   ├── translate/route.ts    # Model Translation & Status
│   │   ├── viewer-token/route.ts # Viewer Token Generator
│   │   └── oss-ext/v2/acmsessions/route.ts # ACM Session Handler
│   └── aps-test/
│       └── page.tsx              # Testseite mit robuster Viewer-Integration
```

## Umgebungsvariablen

```env
APS_CLIENT_ID=your_aps_client_id
APS_CLIENT_SECRET=your_aps_client_secret
```

## Unterstützte Dateiformate

- **CAD:** DWG, RVT, IFC, DGN, NWD
- **3D:** 3DS, OBJ, STL
- **Austausch:** STEP, IGES
- **Dokumente:** PDF (begrenzte Unterstützung)

## Workflow

1. **Upload:** Datei → APS Bucket → URN generieren
2. **Translation:** URN → Model Derivative API → Viewer-ready
3. **Status Monitoring:** Polling bis Translation abgeschlossen
4. **Viewer:** Token → APS Viewer SDK → 3D-Anzeige

## Testen

1. Navigiere zu `http://localhost:3000/aps-test`
2. Datei hochladen (Drag & Drop oder Button)
3. Warten auf "Bereit" Status
4. "Anzeigen" klicken für 3D-Viewer

## Bekannte Probleme & Lösungen

### "Legacy endpoint is deprecated"
- **Ursache:** Direkte PUT-Requests sind deprecated
- **Lösung:** `signeds3upload` 3-Schritt Prozess verwenden

### "Failed to parse URL"
- **Ursache:** `uploadKey` statt `urls[0]` verwendet
- **Lösung:** `signedUrlData.urls[0]` für PUT-Request verwenden

### "The parameter 'output::formats::views'(type=svf|svf2) is required"
- **Ursache:** `views` Parameter fehlt für `svf2` Output
- **Lösung:** `views: ['2d', '3d']` hinzufügen

### "ReferenceError: initializeViewer is not defined"
- **Ursache:** Scope-Probleme mit React-Hooks
- **Lösung:** `useCallback` verwenden und saubere Komponenten-Struktur

### Translation hängt im "pending" Status
- **Ursache:** APS-Server-Probleme oder falsche Parameter
- **Lösung:** `x-ads-force: true` Header verwenden

### Viewer lädt nicht (Spinning Wheel)
- **Ursache:** SDK nicht geladen oder falsch initialisiert
- **Lösung:** Dynamisches Laden und robuste Initialisierung implementieren

### "The file extension loaded into the Viewer is not supported"
- **Ursache:** Falsche URN oder nicht unterstütztes Format
- **Lösung:** Korrekte URN-Generierung und Format-Validierung

### 500 Internal Server Error bei Translation
- **Ursache:** `objectKey` ist `null` oder falsche Parameter
- **Lösung:** `file.name` für `objectKey` verwenden und Parameter validieren

## Kritische Best Practices

### 1. React/Next.js Integration
- **Verwende `useCallback`** für Viewer-Initialisierung
- **Dynamisches SDK-Loading** mit Error-Handling
- **Sauberes State-Management** für Upload/Translation/Viewer-Status
- **Toast-Notifications** für User-Feedback

### 2. Error Handling
- **Umfassende Logging** auf Server- und Client-Seite
- **Graceful Degradation** bei Fehlern
- **User-Feedback** für alle Operationen
- **Retry-Mechanismen** für fehlgeschlagene Requests

### 3. Performance
- **Polling-Intervalle** für Translation-Status (5-10 Sekunden)
- **Token-Caching** für Viewer-Sessions
- **Lazy Loading** für große Dateien
- **Progress-Indikatoren** für lange Operationen

### 4. Security
- **Server-seitige Token-Generierung** für Viewer
- **Validierung** aller User-Inputs
- **HTTPS** für alle API-Calls
- **Environment Variables** für sensitive Daten

## Nächste Schritte

- [ ] Integration in Hauptanwendung
- [ ] Batch-Upload für mehrere Dateien
- [ ] Erweiterte Viewer-Features (Messungen, Anmerkungen)
- [ ] Caching für häufig verwendete Modelle
- [ ] Benutzerdefinierte Viewer-Konfiguration
- [ ] PDF-Viewer Integration (falls benötigt)

## Ressourcen

- [APS Developer Portal](https://developer.autodesk.com/)
- [APS Viewer Documentation](https://developer.autodesk.com/en/docs/viewer/v7/overview/)
- [APS API Reference](https://developer.autodesk.com/en/docs/data/v2/overview/)
- [APS Model Derivative API](https://developer.autodesk.com/en/docs/model-derivative/v2/overview/)

## Wichtige Notizen

**Diese Integration war eine komplexe Odyssee mit vielen kritischen Problemen. Alle hier dokumentierten Lösungen sind essentiell für eine funktionierende Implementierung. Bei Problemen immer zuerst diese Dokumentation konsultieren.**

**Die wichtigsten Erkenntnisse:**
1. `views: ['2d', '3d']` ist **ERFORDERLICH** für `svf2` Translation
2. `x-ads-force: true` löst hängende Translations
3. Robuste Viewer-Initialisierung mit `useCallback` ist kritisch
4. Umfassendes Error-Handling und User-Feedback sind unerlässlich
5. PDF zu SVF2 Translation wird **NICHT UNTERSTÜTZT**
