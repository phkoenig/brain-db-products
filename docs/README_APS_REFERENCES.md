# APS (Autodesk Platform Services) - Zentrale Referenzen

## 📚 **WICHTIGE DOKUMENTATIONEN & LINKS**

### 🎯 **Hauptdokumentationen**

#### **1. APS Viewer v7**
- **Hauptdokumentation:** [APS Viewer v7 Developer Guide](https://aps.autodesk.com/en/docs/viewer/v7/developers_guide/overview/)
- **API-Referenz:** [Viewer API Reference](https://aps.autodesk.com/en/docs/viewer/v7/reference/)
- **Beispiele:** [Viewer Examples](https://aps.autodesk.com/en/docs/viewer/v7/developers_guide/examples/)
- **Migration Guide:** [v6 to v7 Migration](https://aps.autodesk.com/en/docs/viewer/v7/developers_guide/migration/)

#### **2. APS Data Management API**
- **Buckets:** [Bucket Management](https://aps.autodesk.com/en/docs/data/v2/overview/)
- **Objects:** [Object Management](https://aps.autodesk.com/en/docs/data/v2/reference/buckets/)
- **Upload:** [File Upload](https://aps.autodesk.com/en/docs/data/v2/reference/objects/)

#### **3. APS Model Derivative API**
- **Translation:** [Model Translation](https://aps.autodesk.com/en/docs/model-derivative/v2/overview/)
- **Manifest:** [Manifest API](https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/manifest-GET/)
- **Formats:** [Supported Formats](https://aps.autodesk.com/en/docs/model-derivative/v2/overview/supported-translations/)

#### **4. APS Authentication**
- **OAuth2:** [Authentication Guide](https://aps.autodesk.com/en/docs/oauth/v2/overview/)
- **Scopes:** [Permission Scopes](https://aps.autodesk.com/en/docs/oauth/v2/overview/scopes/)
- **Tokens:** [Token Management](https://aps.autodesk.com/en/docs/oauth/v2/overview/token/)

### 🔧 **Entwickler-Ressourcen**

#### **1. SDKs & Libraries**
- **JavaScript SDK:** [Forge SDK](https://github.com/Autodesk-Forge/forge-api-nodejs-client)
- **Viewer SDK:** [Viewer Documentation](https://aps.autodesk.com/en/docs/viewer/v7/developers_guide/overview/)
- **REST API:** [REST API Reference](https://aps.autodesk.com/en/docs/)

#### **2. Code-Beispiele**
- **GitHub Samples:** [APS Samples](https://github.com/Autodesk-Platform-Services)
- **Viewer Samples:** [Viewer Examples](https://aps.autodesk.com/en/docs/viewer/v7/developers_guide/examples/)
- **Upload Samples:** [Upload Examples](https://aps.autodesk.com/en/docs/data/v2/overview/)

#### **3. Tools & Utilities**
- **Postman Collection:** [APS Postman](https://www.postman.com/autodesk-platform-services)
- **API Explorer:** [API Explorer](https://aps.autodesk.com/en/docs/)
- **Token Generator:** [Token Generator](https://aps.autodesk.com/en/docs/oauth/v2/overview/)

### 📋 **Unser Projekt - Implementierte Features**

#### **✅ Vollständig implementiert:**
1. **OAuth2 Two-Legged Authentication** - `src/lib/aps.ts`
2. **Bucket Management** - Create, List, Delete
3. **File Upload** - Signed S3 Upload
4. **Model Translation** - Translation Pipeline
5. **Viewer Integration** - 3D Viewer
6. **Test Interface** - `/aps-test` Seite

#### **🔧 API-Routen:**
- `POST /api/aps/upload` - File Upload
- `POST /api/aps/translate` - Translation Start
- `GET /api/aps/translate?urn=...` - Status Check
- `GET /api/aps/viewer-token` - Viewer Token

### 🎯 **Wichtige Erkenntnisse für unser Projekt**

#### **1. Kritische Header**
```typescript
// KRITISCH für moderne APS-API
'x-ads-region': 'EMEA'
'Authorization': `Bearer ${token}`
```

#### **2. Bucket-Naming**
```typescript
// Globally unique, nur lowercase, Zahlen, Bindestriche
const bucketKey = `test-upload-${Date.now()}`;
```

#### **3. URN-Generierung**
```typescript
// Base64-Encoding ohne Padding
const urn = Buffer.from(objectId).toString('base64').replace(/=/g, '');
```

#### **4. Translation-Formate**
```typescript
// Für CAD-Dateien
const outputFormats = [{
  type: 'svf2',
  views: ['2d', '3d']  // KRITISCH: views Parameter
}];
```

### 🚀 **Nächste Entwicklungsschritte**

#### **1. Viewer-Integration in Hauptanwendung**
- Integration in `src/app/capture/page.tsx`
- Für Produkt-Screenshots und CAD-Dateien
- Measurement-Tools für Produkt-Dimensionen

#### **2. Performance-Optimierung**
- Lazy-Loading für Viewer
- Memory-Management für große Dateien
- Progressive Loading

#### **3. Custom-Extensions**
- Annotation-Tools für Produkt-Notizen
- Section-Planes für Detail-Ansichten
- Custom-Toolbar für spezifische Funktionen

### 📖 **Lokale Dokumentation**

#### **Vollständige Implementierung:**
- `docs/README_APS_INTEGRATION.md` - Vollständige Integration
- `docs/README_APS_VIEWER_V7.md` - Viewer-spezifische Details
- `docs/README_APS_TROUBLESHOOTING.md` - Problembehebung

#### **Code-Referenz:**
- `src/lib/aps.ts` - APS Service Implementation
- `src/app/aps-test/page.tsx` - Test Interface
- `src/app/api/aps/` - API Routes

### 🔗 **Schnellzugriff**

#### **Für tägliche Entwicklung:**
1. **Testseite:** http://localhost:3000/aps-test
2. **APS Dashboard:** https://aps.autodesk.com/
3. **Viewer Docs:** https://aps.autodesk.com/en/docs/viewer/v7/developers_guide/overview/
4. **API Reference:** https://aps.autodesk.com/en/docs/

#### **Für Debugging:**
1. **Browser Console:** Viewer-Logs
2. **Network Tab:** API-Calls
3. **APS Logs:** Server-side Logs

---

**Letzte Aktualisierung:** Dezember 2024  
**Status:** Vollständig implementiert und funktional  
**Testseite:** http://localhost:3000/aps-test
