# ACC (Autodesk Construction Cloud) Integration

## 🎯 Übersicht

Die ACC-Integration ermöglicht es, direkt auf ACC-Projekte und deren Dateien zuzugreifen. Alle Dateien sind bereits für den APS Viewer übersetzt und können sofort angezeigt werden.

## ✅ Vorteile der ACC-Integration

- **Kostenlos**: Alle Dateien sind bereits übersetzt
- **Schnell**: Keine Wartezeit auf Translation
- **Organisiert**: Projekte und Ordner strukturiert
- **Kollaborativ**: Teile Projekte mit Kunden

## 🚀 Features

### 1. Projekt-Auswahl
- Dropdown-Menü zur Auswahl des ACC-Projekts
- Anzeige von Projekt-Status und -Typ
- Automatisches Laden der Projekt-Inhalte

### 2. File Browser
- Tabellarische Ansicht aller Ordner und Dateien
- Suchfunktion für Dateien und Ordner
- Breadcrumb-Navigation
- Datei-Status-Anzeige (🟢🔴⚪)

### 3. APS Viewer Integration
- Direkte Öffnung kompatibler Dateien im APS Viewer
- Status-Anzeige für Viewer-Kompatibilität
- Automatische URN-Generierung

## 📁 Projektstruktur

```
src/
├── app/
│   ├── acc-browser/
│   │   └── page.tsx              # ACC Browser Hauptseite
│   └── api/acc/
│       ├── projects/
│       │   ├── route.ts          # Projekte auflisten
│       │   └── [projectId]/
│       │       ├── contents/
│       │       │   └── route.ts  # Projekt-Inhalte
│       │       └── folders/
│       │           └── [folderId]/
│       │               └── contents/
│       │                   └── route.ts  # Ordner-Inhalte
├── hooks/
│   └── useACC.ts                 # ACC Hook für State Management
├── lib/
│   ├── acc.ts                    # ACC Service
│   └── acc-oauth.ts              # ACC OAuth Service
└── ui/layouts/
    └── DefaultPageLayout.tsx     # Navigation mit ACC-Button
```

## 🔧 Technische Implementierung

### ACC Hook (`useACC.ts`)

```typescript
export function useACC(): UseACCReturn {
  // State Management für Projekte, Inhalte, Navigation
  // API-Calls für Projekte und Inhalte
  // Breadcrumb-Navigation
  // Error Handling
}
```

### ACC Service (`acc.ts`)

```typescript
export class ACCService {
  // OAuth2 3-legged Authentication
  // Projekt-Auflistung
  // Projekt-Inhalte abrufen
  // URN-Generierung für APS Viewer
}
```

### API-Routen

- `GET /api/acc/projects` - Alle ACC-Projekte auflisten
- `GET /api/acc/projects/[projectId]/contents` - Projekt-Root-Inhalte
- `GET /api/acc/projects/[projectId]/folders/[folderId]/contents` - Ordner-Inhalte

## 🎨 UI-Komponenten

### Navigation
- **ACC-Button** in der Sidebar mit Cloud-Icon
- Automatische Hervorhebung der aktiven Seite

### ACC Browser
- **Projekt-Dropdown** über der Suchleiste
- **Suchleiste** für Dateien und Ordner
- **Breadcrumb-Navigation** für Ordner-Pfad
- **Tabellarische Ansicht** mit:
  - Name und Icon (Ordner/Datei)
  - Typ (Ordner/Datei-Format)
  - Größe (nur bei Dateien)
  - Status (🟢🔴⚪)
  - Aktionen (Öffnen, Download, etc.)

## 📊 Datei-Status-System

### 🟢 Viewer-Ready
- Dateien können direkt im APS Viewer geöffnet werden
- Unterstützte Formate: PDF, JPG, PNG, etc.

### 🔴 Translation nötig
- CAD-Dateien die übersetzt werden müssen
- Kosten: ~2€ pro Datei
- Formate: DWG, RVT, IFC, etc.

### ⚪ Unbekannt
- Nicht unterstützte Formate
- Keine Viewer-Integration möglich

## 🔐 Authentifizierung

### OAuth2 3-legged Flow
1. Benutzer authentifiziert sich bei Autodesk
2. ACC Custom Integration erhält Zugriff
3. Token wird für API-Calls verwendet

### Account ID
- **ACC Account ID**: `969ae436-36e7-4a4b-8744-298cf384974a`
- Konfiguriert in `acc.ts`

## 🚀 Verwendung

### 1. Navigation
- Klicke auf den **ACC-Button** in der Sidebar
- Browser öffnet sich mit Projekt-Auswahl

### 2. Projekt auswählen
- Wähle ein Projekt aus dem Dropdown
- Projekt-Inhalte werden automatisch geladen

### 3. Durchsuchen
- Verwende die Suchleiste für Dateien/Ordner
- Klicke auf Ordner um hinein zu navigieren
- Verwende Breadcrumbs für Navigation

### 4. Dateien öffnen
- Klicke auf das Auge-Icon bei kompatiblen Dateien
- Datei öffnet sich im APS Viewer in neuem Tab

## 🔧 Troubleshooting

### Problem: Projekte werden nicht geladen
**Lösung:**
1. OAuth-Token prüfen
2. ACC Account ID überprüfen
3. Netzwerkverbindung testen

### Problem: Dateien können nicht geöffnet werden
**Lösung:**
1. Datei-Status prüfen (🟢🔴⚪)
2. APS Viewer-URL testen
3. URN-Format überprüfen

### Problem: Suchfunktion funktioniert nicht
**Lösung:**
1. Suchbegriff überprüfen
2. Datei/Ordner-Namen prüfen
3. Browser-Cache leeren

## 📚 API-Referenz

### ACC Projects API
```typescript
// Projekte auflisten
GET /api/acc/projects
Response: { success: boolean, projects: ACCProject[] }
```

### ACC Contents API
```typescript
// Projekt-Inhalte
GET /api/acc/projects/{projectId}/contents
Response: { success: boolean, folders: ACCFolder[], items: ACCItem[] }

// Ordner-Inhalte
GET /api/acc/projects/{projectId}/folders/{folderId}/contents
Response: { success: boolean, folders: ACCFolder[], items: ACCItem[] }
```

## 🎯 Best Practices

1. **Projekt-Auswahl**: Immer zuerst ein Projekt auswählen
2. **Navigation**: Breadcrumbs für schnelle Navigation verwenden
3. **Suche**: Suchbegriffe für große Projekte nutzen
4. **Datei-Status**: Status-Icons für Viewer-Kompatibilität beachten
5. **Performance**: Große Projekte schrittweise durchsuchen

## 🔄 Updates und Wartung

### Regelmäßige Checks
- OAuth-Token-Validität
- ACC API-Verfügbarkeit
- APS Viewer-Integration

### Monitoring
- API-Response-Zeiten
- Error-Rates
- User-Feedback

---

**Letzte Aktualisierung:** Dezember 2024  
**Status:** ✅ Vollständig funktional  
**Version:** 1.0.0
