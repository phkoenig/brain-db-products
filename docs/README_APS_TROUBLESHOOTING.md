# APS Integration Troubleshooting Guide

## Übersicht

Dieser Guide dokumentiert alle Probleme, die während der APS-Integration aufgetreten sind, und deren Lösungen. **Diese Probleme sind kritisch und können die gesamte Integration zum Scheitern bringen.**

## Kritische Probleme & Lösungen

### 1. Translation-Probleme

#### Problem: "The parameter 'output::formats::views'(type=svf|svf2) is required"
**Symptom:** 400 Bad Request von APS API
**Ursache:** `views` Parameter fehlt für `svf2` Output-Format
**Lösung:**
```typescript
// FALSCH:
const outputFormats = [{ type: 'svf2' }];

// RICHTIG:
const outputFormats = [{ 
  type: 'svf2', 
  views: ['2d', '3d']  // KRITISCH!
}];
```

#### Problem: Translation hängt im "pending" Status
**Symptom:** Translation bleibt stundenlang im `pending` oder `inprogress` Status
**Ursache:** APS-Server-Probleme oder falsche Parameter
**Lösung:**
```typescript
// Force-Header hinzufügen
const response = await fetch(`${APS_BASE_URL}/modelderivative/v2/designdata/job`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-ads-force': 'true'  // KRITISCH!
  },
  body: JSON.stringify({
    input: { urn: urn },
    output: { formats: outputFormats }
  })
});
```

#### Problem: 500 Internal Server Error bei Translation
**Symptom:** Server-Fehler beim Starten der Translation
**Ursache:** `objectKey` ist `null` oder falsche Parameter
**Lösung:**
```typescript
// In upload/route.ts - objectKey korrekt setzen
const objectKey = file.name;  // Nicht null verwenden!
```

### 2. Viewer-Probleme

#### Problem: "ReferenceError: initializeViewer is not defined"
**Symptom:** JavaScript-Fehler beim Klicken auf "Anzeigen"
**Ursache:** Scope-Probleme mit React-Hooks
**Lösung:**
```typescript
// KRITISCH: useCallback verwenden
const initializeViewer = useCallback(async (urn: string) => {
  // Viewer-Initialisierung hier
}, [isSdkLoaded]);

// UND: Saubere Komponenten-Struktur
export default function APSTestPage() {
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  
  // ... rest der Komponente
}
```

#### Problem: Viewer lädt nicht (Spinning Wheel)
**Symptom:** Viewer zeigt nur Lade-Animation, nie das Modell
**Ursache:** SDK nicht geladen oder falsch initialisiert
**Lösung:**
```typescript
// Dynamisches SDK-Loading mit Error-Handling
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
```

#### Problem: "The file extension loaded into the Viewer is not supported"
**Symptom:** Viewer kann Datei nicht laden trotz erfolgreicher Translation
**Ursache:** Falsche URN oder nicht unterstütztes Format
**Lösung:**
```typescript
// Korrekte URN-Generierung
const urn = Buffer.from(objectId).toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');

// UND: Format-Validierung vor Upload
const supportedFormats = ['.dwg', '.rvt', '.ifc', '.pdf', '.3ds', '.obj', '.stl'];
const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
if (!supportedFormats.includes(fileExtension)) {
  throw new Error(`Unsupported file format: ${fileExtension}`);
}
```

### 3. Upload-Probleme

#### Problem: "Legacy endpoint is deprecated"
**Symptom:** 403 Forbidden beim Upload
**Ursache:** Direkte PUT-Requests sind deprecated
**Lösung:**
```typescript
// 3-Schritt signeds3upload Prozess verwenden
// 1. Signed URL anfordern
const signedUrlResponse = await fetch(
  `${APS_BASE_URL}/oss/v2/buckets/${bucketKey}/objects/${objectKey}/signeds3upload`,
  { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }
);

// 2. Datei zu S3 hochladen
const uploadResponse = await fetch(signedUrlData.urls[0], {  // KRITISCH: urls[0]
  method: 'PUT',
  headers: { 'Content-Type': 'application/octet-stream' },
  body: file
});

// 3. Upload abschließen
const completeResponse = await fetch(
  `${APS_BASE_URL}/oss/v2/buckets/${bucketKey}/objects/${objectKey}/signeds3upload`,
  { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ uploadKey: signedUrlData.uploadKey })
  }
);
```

#### Problem: "Failed to parse URL"
**Symptom:** TypeError beim Upload
**Ursache:** `uploadKey` statt `urls[0]` verwendet
**Lösung:**
```typescript
// RICHTIG:
const uploadResponse = await fetch(signedUrlData.urls[0], {
  method: 'PUT',
  body: file
});

// FALSCH:
const uploadResponse = await fetch(signedUrlData.uploadKey, {
  method: 'PUT',
  body: file
});
```

### 4. Authentication-Probleme

#### Problem: "The requested resource does not exist"
**Symptom:** 404 beim Token-Request
**Ursache:** Falscher Endpoint
**Lösung:**
```typescript
// RICHTIG:
const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'x-ads-region': 'EMEA'  // KRITISCH!
  },
  body: new URLSearchParams({
    client_id: process.env.APS_CLIENT_ID!,
    client_secret: process.env.APS_CLIENT_SECRET!,
    grant_type: 'client_credentials',
    scope: 'data:read data:write bucket:create bucket:read bucket:delete'
  })
});

// FALSCH:
const response = await fetch('https://developer.api.autodesk.com/authentication/v1/token', {
  // v1 ist deprecated
});
```

### 5. React/Next.js Integration-Probleme

#### Problem: "Module not found: Can't resolve 'react-dropzone'"
**Symptom:** Build-Fehler nach Refactoring
**Ursache:** Fehlende Dependencies
**Lösung:**
```bash
npm install react-dropzone react-hot-toast
```

#### Problem: "Element type is invalid: expected a string... but got: undefined"
**Symptom:** React-Rendering-Fehler
**Ursache:** Falsche Import-Statements
**Lösung:**
```typescript
// RICHTIG:
import { DefaultPageLayout } from '@/ui/layouts/DefaultPageLayout';

// FALSCH:
import DefaultPageLayout from '@/ui/layouts/DefaultPageLayout';
```

## Debugging-Strategien

### 1. Umfassendes Logging
```typescript
// Server-seitig
console.log('🔍 APS:', 'Getting token...');
console.log('🔍 APS:', 'Token received successfully');
console.log('🔍 APS:', `Starting translation for URN: ${urn}`);

// Client-seitig
console.log('🔍 APS Test:', 'Checking translation status...');
console.log('🔍 APS Test:', `Translation response status: ${response.status}`);
```

### 2. Toast-Notifications für User-Feedback
```typescript
import { toast } from 'react-hot-toast';

// Erfolg
toast.success('Translation successful!');

// Fehler
toast.error('Translation failed.');

// Loading
const toastId = toast.loading('Uploading file...');
toast.success('Upload complete!', { id: toastId });
```

### 3. Status-Monitoring
```typescript
// Polling für Translation-Status
const intervalId = setInterval(async () => {
  const statusResponse = await fetch(`/api/aps/translate?urn=${urn}`);
  const { status, progress } = await statusResponse.json();
  
  if (status === 'success') {
    clearInterval(intervalId);
    toast.success('Translation successful!');
  } else if (status === 'failed') {
    clearInterval(intervalId);
    toast.error('Translation failed.');
  }
}, 5000);
```

## Präventive Maßnahmen

### 1. Environment Variables validieren
```typescript
if (!process.env.APS_CLIENT_ID || !process.env.APS_CLIENT_SECRET) {
  throw new Error('APS credentials not configured');
}
```

### 2. File-Format-Validierung
```typescript
const supportedFormats = ['.dwg', '.rvt', '.ifc', '.pdf'];
const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
if (!supportedFormats.includes(fileExtension)) {
  throw new Error(`Unsupported file format: ${fileExtension}`);
}
```

### 3. URN-Validierung
```typescript
// URL-safe Base64 ohne Padding
const urn = Buffer.from(objectId).toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');
```

## Häufige Fehlermeldungen & Lösungen

| Fehlermeldung | Ursache | Lösung |
|---------------|---------|--------|
| "The parameter 'output::formats::views'(type=svf\|svf2) is required" | `views` Parameter fehlt | `views: ['2d', '3d']` hinzufügen |
| "ReferenceError: initializeViewer is not defined" | Scope-Probleme | `useCallback` verwenden |
| "Legacy endpoint is deprecated" | Direkte PUT-Requests | `signeds3upload` verwenden |
| "Failed to parse URL" | `uploadKey` statt `urls[0]` | `signedUrlData.urls[0]` verwenden |
| "The requested resource does not exist" | Falscher Endpoint | `authentication/v2/token` verwenden |
| "Module not found" | Fehlende Dependencies | `npm install` ausführen |

## Wichtige Notizen

**Diese Probleme sind kritisch und können die gesamte Integration zum Scheitern bringen. Bei Problemen immer zuerst diese Dokumentation konsultieren.**

**Die wichtigsten Erkenntnisse:**
1. `views: ['2d', '3d']` ist **ERFORDERLICH** für `svf2` Translation
2. `x-ads-force: true` löst hängende Translations
3. `useCallback` ist kritisch für Viewer-Initialisierung
4. `signedUrlData.urls[0]` für Upload verwenden
5. Umfassendes Error-Handling ist unerlässlich
