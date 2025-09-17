# Autodesk Viewer v7 - Entwickler-Dokumentation

## 📚 **WICHTIGE REFERENZ: APS Viewer v7**

**Quelle:** [Autodesk Viewer v7 Developer Guide](https://aps.autodesk.com/en/docs/viewer/v7/developers_guide/overview/)

## 🎯 **Übersicht**

Die Autodesk Viewer v7 Dokumentation ist **ESSENTIELL** für die APS-Integration in unserem BRAIN DB Products Projekt. Diese Dokumentation enthält alle wichtigen Informationen für:

- Viewer-Initialisierung
- Model-Loading
- 3D-Navigation
- Event-Handling
- Custom-Extensions

## 📋 **Kritische Abschnitte für unser Projekt**

### 1. **Viewer-Initialisierung**
```javascript
// Korrekte Initialisierung (wie in unserer aps-test/page.tsx)
Autodesk.Viewing.Initializer(options, () => {
  const viewer = new Autodesk.Viewing.GuiViewer3D(container);
  viewer.start();
});
```

### 2. **Model-Loading**
```javascript
// Dokument laden (wie in unserem Code)
Autodesk.Viewing.Document.load(documentId, (doc) => {
  const viewables = doc.getRoot().getDefaultGeometry();
  viewer.loadDocumentNode(doc, viewables);
});
```

### 3. **Token-Management**
```javascript
// Access Token für Viewer (wie in unserem viewer-token/route.ts)
getAccessToken: (onGetAccessToken) => {
  onGetAccessToken(access_token, 3599);
}
```

## 🔧 **Unsere Implementierung vs. Offizielle Docs**

### ✅ **Was wir korrekt implementiert haben:**

1. **Viewer SDK Loading**
   ```typescript
   // src/app/aps-test/page.tsx - Zeile 35-50
   script.src = "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js";
   ```

2. **Token-Management**
   ```typescript
   // src/app/api/aps/viewer-token/route.ts
   const token = await APSService.getToken();
   ```

3. **Model-Loading**
   ```typescript
   // src/app/aps-test/page.tsx - Zeile 75-85
   const documentId = 'urn:' + urn;
   Autodesk.Viewing.Document.load(documentId, (doc) => {
     const viewables = doc.getRoot().getDefaultGeometry();
     viewer.loadDocumentNode(doc, viewables);
   });
   ```

## 📖 **Wichtige Dokumentations-Abschnitte**

### **Für zukünftige Entwicklungen:**

1. **Event-Handling**
   - `GEOMETRY_LOADED_EVENT`
   - `GEOMETRY_LOAD_FAILED_EVENT`
   - `MODEL_ROOT_LOADED_EVENT`

2. **Viewer-Extensions**
   - Custom-Toolbar-Buttons
   - Measurement-Tools
   - Section-Planes

3. **Performance-Optimierung**
   - Level-of-Detail (LOD)
   - Frustum-Culling
   - Memory-Management

## 🎯 **Best Practices aus der Dokumentation**

### **1. Error-Handling**
```javascript
// Wie in unserem Code implementiert
Autodesk.Viewing.Document.load(documentId, 
  (doc) => { /* Success */ },
  (errorCode, errorMsg) => { /* Error */ }
);
```

### **2. Viewer-Lifecycle**
```javascript
// Wichtig für Memory-Management
viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
  // Model geladen
});

viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOAD_FAILED_EVENT, () => {
  // Fehler beim Laden
});
```

### **3. Token-Refresh**
```javascript
// Für lange Sessions
getAccessToken: (onGetAccessToken) => {
  // Token-Refresh-Logik hier
  onGetAccessToken(newToken, newExpireTime);
}
```

## 🔗 **Wichtige Links**

- **Hauptdokumentation:** [APS Viewer v7 Developer Guide](https://aps.autodesk.com/en/docs/viewer/v7/developers_guide/overview/)
- **API-Referenz:** [Viewer API Reference](https://aps.autodesk.com/en/docs/viewer/v7/reference/)
- **Beispiele:** [Viewer Examples](https://aps.autodesk.com/en/docs/viewer/v7/developers_guide/examples/)

## 💡 **Für unser Projekt wichtige Erkenntnisse**

### **1. Viewer-Version**
- **Aktuell verwenden wir:** Viewer v7.*
- **Stabile Version:** v7.0+
- **Neueste Features:** v7.1+

### **2. Browser-Kompatibilität**
- **Chrome:** ✅ Vollständig unterstützt
- **Firefox:** ✅ Vollständig unterstützt
- **Safari:** ✅ Vollständig unterstützt
- **Edge:** ✅ Vollständig unterstützt

### **3. Performance**
- **Große Modelle:** LOD-basiertes Rendering
- **Memory-Management:** Automatische Cleanup
- **Network:** Progressive Loading

## 🚀 **Nächste Schritte für unser Projekt**

### **1. Viewer-Integration in Hauptanwendung**
```typescript
// Integration in src/app/capture/page.tsx
// Für Produkt-Screenshots und CAD-Dateien
```

### **2. Custom-Extensions**
```typescript
// Measurement-Tools für Produkt-Dimensionen
// Annotation-Tools für Produkt-Notizen
```

### **3. Performance-Optimierung**
```typescript
// Lazy-Loading für Viewer
// Memory-Management für große Dateien
```

---

**Letzte Aktualisierung:** Dezember 2024  
**Quelle:** [Autodesk APS Viewer v7 Documentation](https://aps.autodesk.com/en/docs/viewer/v7/developers_guide/overview/)  
**Status:** Vollständig implementiert in `/aps-test`

## ⚠️ Wichtige Projekt-Spezifika (Next.js + ACC)

- SDK immer als CDN-Script im `<head>` laden (nicht importieren, nicht dynamisch injecten). In `app/layout.tsx` platzieren.
- Vor `Initializer` prüfen: `window.Autodesk && window.Autodesk.Viewing` (Retry bis vorhanden).
- ACC: Verwende `derivatives.data.id` direkt (bereits Base64). Bei `Document.load` mit `urn:`-Präfix aufrufen: `Document.load('urn:' + base64Urn, ...)`.
- Keine Proxy/Rewrite-Regeln für URNs in Next.js; sonst leitet der Viewer gegen `http://localhost:3000/<URN>`.
- Loader erst schließen, wenn `GEOMETRY_LOADED_EVENT` feuert; beim Umschalten auf Views (z. B. „Nachnutzung“) erneut auf Fertig-Event warten.