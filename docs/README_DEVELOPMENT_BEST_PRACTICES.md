# Development Best Practices

## Allgemeine Richtlinien

### Sichere Code-Bearbeitung
- **Immer Backup erstellen** vor größeren Änderungen
- **Kleine, testbare Commits** statt großer Änderungen
- **TypeScript-Typen** immer korrekt definieren
- **Kommentare** für komplexe Logik hinzufügen

## Häufige Probleme und Lösungen

### 1. Tailwind CSS Styling-Probleme

#### Problem: "The 'border-border' class does not exist"
**Symptome:**
- Build Error beim Development Server
- Fehlende Styles auf der Webseite
- CSS-Kompilierungsfehler

**Ursache:**
- Verwendung von nicht existierenden Tailwind-Klassen
- Falsche CSS-Konfiguration in `globals.css`
- Cache-Probleme zwischen Next.js und Tailwind

**Lösung:**
```bash
# 1. Development Server stoppen
taskkill /f /im node.exe

# 2. Next.js Cache löschen
rmdir /s /q .next

# 3. Server neu starten
npm run dev
```

**Prävention:**
- Nur Standard-Tailwind-Klassen verwenden
- Bei Subframe UI: Nur dokumentierte Klassen nutzen
- CSS-Änderungen in `@layer` Direktiven kapseln

#### Problem: Styling verschwindet nach Code-Änderungen
**Lösung:**
```bash
# Cache komplett löschen
rmdir /s /q .next
rmdir /s /q node_modules\.cache
npm run dev
```

### 2. Supabase-Verbindungsprobleme

#### Problem: "Cannot connect to Supabase"
**Lösung:**
1. `.env.local` Datei überprüfen
2. Supabase-Projekt-Status checken
3. Netzwerkverbindung testen

### 3. TypeScript-Fehler

#### Problem: "Type 'X' is not assignable to type 'Y'"
**Lösung:**
1. Interface-Definitionen überprüfen
2. Type Guards verwenden
3. Optional Chaining (`?.`) nutzen

## Dateistruktur

```
src/
├── app/                 # Next.js App Router
├── components/          # Wiederverwendbare Komponenten
├── hooks/              # Custom React Hooks
├── types/              # TypeScript Typdefinitionen
├── lib/                # Utility-Funktionen
└── ui/                 # Subframe UI Komponenten
```

## Development Workflow

### 1. Feature-Entwicklung
```bash
# 1. Neuen Branch erstellen
git checkout -b feature/neue-funktion

# 2. Entwicklung
npm run dev

# 3. Testen
npm run build
npm run lint

# 4. Commit
git add .
git commit -m "feat: neue Funktion hinzugefügt"
```

### 2. Debugging
```bash
# Development Server mit Debug-Info
npm run dev -- --debug

# TypeScript-Check
npx tsc --noEmit

# Linting
npm run lint
```

## Subframe UI Integration

### Wichtige Hinweise
- **Nicht Turbopack verwenden** (Inkompatibilität)
- **Tailwind CSS v3** verwenden
- **Manuelle Komponenten-Synchronisation** erforderlich

### Komponenten-Update
```bash
# Subframe CLI verwenden
npx subframe sync
```

## Deployment

### Vercel Deployment
1. **Automatisches Deployment** bei Git-Push
2. **Environment Variables** in Vercel Dashboard setzen
3. **Build-Logs** überwachen

### Lokales Testing
```bash
# Production Build testen
npm run build
npm run start
```

## Performance-Optimierung

### 1. Bundle-Größe
- **Code Splitting** verwenden
- **Lazy Loading** für Komponenten
- **Tree Shaking** aktivieren

### 2. Bilder-Optimierung
- **Next.js Image Component** verwenden
- **WebP-Format** bevorzugen
- **Responsive Images** implementieren

## Sicherheit

### 1. Environment Variables
- **Sensible Daten** nie im Code committen
- **`.env.local`** für lokale Entwicklung
- **Vercel Environment Variables** für Production

### 2. API-Sicherheit
- **Rate Limiting** implementieren
- **Input Validation** immer durchführen
- **CORS** korrekt konfigurieren

## Monitoring und Logging

### 1. Error Tracking
- **Console-Logs** für Development
- **Error Boundaries** implementieren
- **Analytics** für Production

### 2. Performance Monitoring
- **Core Web Vitals** überwachen
- **Bundle Analyzer** verwenden
- **Lighthouse** regelmäßig ausführen 