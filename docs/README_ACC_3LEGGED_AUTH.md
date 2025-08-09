# ACC 3-legged OAuth & Dual API Integration

## Übersicht

Die Autodesk Construction Cloud (ACC) Integration verwendet **zwei verschiedene APIs** und **3-legged OAuth** für den Zugriff auf Projekt-Inhalte.

## 🔐 3-legged OAuth Flow

### Warum 3-legged OAuth?
- **MANDATORISCH** für ACC Data Management API
- Ermöglicht Zugriff auf **user-spezifische Daten**
- 2-legged OAuth funktioniert nur für Admin-Operationen

### Implementierung

#### 1. OAuth Service (`src/lib/acc-oauth.ts`)
```typescript
export class ACCOAuthService {
  private static readonly CLIENT_ID = process.env.APS_WEB_APP_CLIENT_ID;
  private static readonly CLIENT_SECRET = process.env.APS_WEB_APP_CLIENT_SECRET;
  private static readonly REDIRECT_URI = 'http://localhost:3000/auth/callback';
  
  // Token-Persistierung über global storage
  static storeTokens(accessToken: string, refreshToken: string): void
  static loadTokens(): { accessToken: string; refreshToken: string } | null
  static clearTokens(): void
}
```

#### 2. Authorization Flow
1. **Frontend:** `/auth/acc-authorize` - Startet OAuth Flow
2. **Backend:** `/api/auth/acc-authorize-url` - Generiert Auth URL
3. **Autodesk:** User autorisiert die App
4. **Callback:** `/auth/callback` - Empfängt Authorization Code
5. **Token Exchange:** Code wird gegen Access/Refresh Token getauscht

#### 3. Token Management
- **Persistierung:** Tokens werden in global storage gespeichert
- **Refresh:** Automatische Token-Erneuerung bei Ablauf
- **Fallback:** 2-legged OAuth für Admin-Operationen

## 🔄 Dual API Architecture

### API 1: Project API v1
**Zweck:** Projekt-Metadaten und Hub-Informationen

**Endpoints:**
```
GET /project/v1/hubs                    # Alle Hubs auflisten
GET /project/v1/hubs/{hub_id}/projects  # Projekte in Hub auflisten
GET /project/v1/hubs/{hub_id}/projects/{project_id}  # Projekt-Details
```

**Verwendung:**
```typescript
// 1. Hubs auflisten
const hubs = await fetch('/project/v1/hubs');

// 2. Projekte in Hub auflisten
const projects = await fetch(`/project/v1/hubs/${hubId}/projects`);

// 3. Projekt-Details abrufen (enthält Root-Folder-ID!)
const projectDetails = await fetch(`/project/v1/hubs/${hubId}/projects/${projectId}`);
```

### API 2: Data Management API v1
**Zweck:** Projekt-Inhalte (Dateien/Ordner) abrufen

**Endpoints:**
```
GET /data/v1/projects/{project_id}/folders/{folder_id}/contents
```

**WICHTIG:** `project_id` muss das "b."-Präfix haben!

**Verwendung:**
```typescript
// Root-Folder-ID aus Project API extrahieren
const rootFolderId = projectDetails.data.relationships.rootFolder.data.id;

// Projekt-Inhalte abrufen
const contents = await fetch(`/data/v1/projects/b.${projectId}/folders/${rootFolderId}/contents`);
```

## 🏗️ Implementierung

### 1. ACC Service (`src/lib/acc.ts`)
```typescript
export class ACCService {
  static async getToken(): Promise<string> {
    try {
      // 3-legged OAuth für Data Management API
      return await ACCOAuthService.getAccessToken();
    } catch (error) {
      // Fallback zu 2-legged OAuth
      return await this.get2LeggedToken();
    }
  }

  static async getProjectContents(projectId: string, folderId?: string) {
    const token = await this.getToken();
    
    // Automatische Root-Folder-ID-Erkennung
    let targetFolderId = folderId || 'root';
    if (targetFolderId === 'root') {
      // Hub-spezifische Suche nach Projekt
      const rootFolderId = await this.findRootFolderId(projectId, token);
      targetFolderId = rootFolderId;
    }
    
    // Data Management API aufrufen
    const url = `/data/v1/projects/b.${projectId}/folders/${targetFolderId}/contents`;
    return await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  }
}
```

### 2. Root-Folder-ID Erkennung
```typescript
private static async findRootFolderId(projectId: string, token: string): Promise<string> {
  // 1. Alle Hubs durchgehen
  const hubs = await fetch('/project/v1/hubs');
  
  // 2. In jedem Hub nach Projekt suchen
  for (const hub of hubs.data) {
    const projectUrl = `/project/v1/hubs/${hub.id}/projects/${projectId}`;
    const projectResponse = await fetch(projectUrl);
    
    if (projectResponse.ok) {
      // 3. Root-Folder-ID extrahieren
      const projectData = await projectResponse.json();
      return projectData.data.relationships.rootFolder.data.id;
    }
  }
  
  return 'root'; // Fallback
}
```

## 🎯 Best Practices

### 1. Projekt-ID Formatierung
- **Korrekt:** `b.e4a2d0c3-1ca2-4a10-b381-f184c303a1c1`
- **Falsch:** `e4a2d0c3-1ca2-4a10-b381-f184c303a1c1` (ohne "b.")
- **Falsch:** `urn:adsk.wipprod:dm.lineage:...` (nur für Items, nicht Projekte)

### 2. Folder-ID Verwendung
- **NICHT verwenden:** `folders/root/contents` (generisch)
- **VERWENDEN:** `folders/urn:adsk.wipemea:fs.folder:co.XJgmcGPgTAGx46sa-bGoEA/contents` (spezifisch)

### 3. Error Handling
```typescript
if (response.status === 400) {
  // "The provided urn is invalid" - Falsches Projekt-ID-Format
  // "project id is invalid" - Projekt-ID nicht korrekt
}
if (response.status === 404) {
  // Projekt nicht gefunden oder kein Zugriff auf "Docs"-Modul
}
```

### 4. Token Management
- **3-legged OAuth:** Für Data Management API (user-spezifisch)
- **2-legged OAuth:** Für Admin-Operationen (fallback)
- **Token-Caching:** 50 Minuten (Tokens laufen nach 1 Stunde ab)

## 🚀 Nächste Schritte

1. **ACC-Viewer Integration:** 3D-Modelle anzeigen
2. **Translation Caching:** Übersetzte Modelle speichern
3. **Intelligente Indikatoren:** Datei-Status anzeigen (🟢🔴⚪)
4. **Vollständiger Browser:** Ordner-Navigation implementieren

## 📚 Referenzen

- [Autodesk Data Management API v1](https://aps.autodesk.com/en/docs/data/v2/reference/http/projects-project_id-folders-folder_id-contents-GET)
- [Autodesk Project API v1](https://aps.autodesk.com/en/docs/project/v1/reference/http/hubs-hub_id-projects-GET)
- [ACC OAuth2 Guide](https://aps.autodesk.com/en/docs/oauth/v2/developers_guide/overview/)
