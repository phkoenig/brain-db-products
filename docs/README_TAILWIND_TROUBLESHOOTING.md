# Tailwind CSS Troubleshooting Guide

## 🚨 KRITISCH: Styling verschwindet komplett

### Problem-Beschreibung
Das häufigste und kritischste Problem: **Alle Styles verschwinden plötzlich** - die Seite wird komplett unstyled angezeigt.

#### Symptome
- ✅ Seite lädt normal
- ❌ **Alle Tailwind-Klassen funktionieren nicht**
- ❌ **Subframe UI Komponenten sind unstyled**
- ❌ **Keine Farben, keine Layouts, keine Spacing**
- ❌ **Seite sieht aus wie HTML ohne CSS**

#### Häufige Ursachen
1. **Cache-Konflikte** zwischen Next.js und Tailwind
2. **CSS-Dateien werden nicht geladen** (404 Fehler)
3. **Webpack-Kompilierungsfehler** bei CSS
4. **Subframe UI Preset-Probleme**
5. **Port-Konflikte** beim Development Server
6. **Datei-Watching-Probleme** unter Windows

#### Sofortige Lösung (Schritt-für-Schritt)
```bash
# 1. ALLE Node-Prozesse stoppen
taskkill /f /im node.exe

# 2. Port 3000 freigeben (falls belegt)
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# 3. Next.js Cache komplett löschen
rmdir /s /q .next

# 4. Node Modules Cache löschen
rmdir /s /q node_modules\.cache

# 5. Browser-Cache leeren (manuell)
# Chrome: Ctrl+Shift+Delete

# 6. Server neu starten
npm run dev
```

#### Wenn das nicht hilft - Erweiterte Lösung
```bash
# 1. Dependencies neu installieren
rmdir /s /q node_modules
npm install

# 2. Tailwind neu initialisieren
npx tailwindcss init -p

# 3. Server starten
npm run dev
```

#### Browser-spezifische Lösungen
```bash
# Hard Refresh erzwingen
# Chrome/Edge: Ctrl+Shift+R
# Firefox: Ctrl+F5

# Developer Tools öffnen und prüfen:
# 1. Network Tab → CSS-Dateien laden?
# 2. Console → CSS-Fehler?
# 3. Sources → globals.css vorhanden?
```

### Prävention des Styling-Verlusts

#### 1. Regelmäßige Wartung
```bash
# Wöchentlich ausführen:
rmdir /s /q .next
npm run dev
```

#### 2. Korrekte Datei-Struktur
```
src/
├── app/
│   ├── globals.css          # ✅ Muss existieren
│   └── layout.tsx           # ✅ Muss globals.css importieren
├── ui/
│   └── tailwind.config.js   # ✅ Subframe Preset
└── tailwind.config.ts       # ✅ Haupt-Konfiguration
```

#### 3. Korrekte Imports
```typescript
// src/app/layout.tsx
import "./globals.css";  // ✅ Muss als erstes importiert werden
```

#### 4. Environment-Variablen prüfen
```bash
# .env.local überprüfen
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Debugging-Checkliste

#### 1. Server-Logs prüfen
```bash
# Terminal-Ausgabe analysieren:
# ✅ "Ready in Xms" = Server läuft
# ❌ "Error" oder "Failed" = Problem
# ❌ "404" für CSS-Dateien = Cache-Problem
```

#### 2. Browser-Developer-Tools
```bash
# 1. F12 → Network Tab
# 2. Seite neu laden
# 3. Nach CSS-Dateien suchen:
#    - layout.css
#    - globals.css
# 4. Status-Codes prüfen (200 = OK, 404 = Fehler)
```

#### 3. Datei-Existenz prüfen
```bash
# Wichtige Dateien überprüfen:
dir src\app\globals.css
dir tailwind.config.ts
dir src\ui\tailwind.config.js
```

### Häufige Fehlerquellen

#### 1. Port-Konflikte
```bash
# Problem: Port 3000 ist belegt
# Lösung: Anderen Port verwenden
npm run dev -- -p 3001
```

#### 2. Windows-spezifische Probleme
```bash
# Problem: Datei-Watching funktioniert nicht
# Lösung: WSL oder Linux-Subsystem verwenden
# Alternative: Manueller Reload nach Änderungen
```

#### 3. Subframe UI Probleme
```bash
# Problem: Subframe Preset wird nicht geladen
# Lösung: Preset-Pfad überprüfen
# tailwind.config.ts:
presets: [require("./src/ui/tailwind.config.js")]
```

### Notfall-Wiederherstellung

#### Wenn NICHTS mehr funktioniert:
```bash
# 1. Git-Status prüfen
git status

# 2. Letzten funktionierenden Stand wiederherstellen
git checkout HEAD -- src/app/globals.css
git checkout HEAD -- tailwind.config.ts
git checkout HEAD -- src/app/layout.tsx

# 3. Kompletter Reset
rmdir /s /q .next
rmdir /s /q node_modules
npm install
npm run dev
```

## Häufige Probleme und Lösungen

### 1. "The 'border-border' class does not exist" Fehler

#### Problem-Beschreibung
Dieser Fehler tritt auf, wenn in der CSS-Konfiguration Tailwind-Klassen verwendet werden, die nicht in der Standard-Konfiguration existieren.

#### Fehler-Symptome
```
⨯ ./src/app/globals.css:1:1
Syntax error: The `border-border` class does not exist. 
If `border-border` is a custom class, make sure it is defined within a `@layer` directive.
```

#### Ursache
- Verwendung von nicht existierenden Tailwind-Klassen wie `border-border`, `bg-background`, `text-foreground`
- Falsche CSS-Konfiguration in `src/app/globals.css`
- Cache-Probleme zwischen Next.js und Tailwind CSS

#### Sofortige Lösung
```bash
# 1. Development Server stoppen
taskkill /f /im node.exe

# 2. Next.js Cache löschen
rmdir /s /q .next

# 3. Server neu starten
npm run dev
```

#### Langfristige Lösung
1. **CSS-Datei überprüfen**: `src/app/globals.css`
2. **Nur Standard-Tailwind-Klassen verwenden**:
   ```css
   /* ✅ Korrekt */
   @apply border-gray-200;
   @apply bg-white;
   @apply text-gray-900;
   
   /* ❌ Falsch */
   @apply border-border;
   @apply bg-background;
   @apply text-foreground;
   ```

3. **Bei Subframe UI**: Nur dokumentierte Klassen verwenden

### 2. Styling verschwindet nach Code-Änderungen

#### Problem-Beschreibung
Nach Änderungen an CSS oder Komponenten verschwindet das Styling komplett.

#### Lösung
```bash
# Kompletter Cache-Reset
rmdir /s /q .next
rmdir /s /q node_modules\.cache
npm run dev
```

### 3. Subframe UI Styling-Probleme

#### Problem-Beschreibung
Subframe UI Komponenten werden nicht korrekt gerendert oder haben falsche Styles.

#### Lösung
1. **Tailwind-Konfiguration überprüfen**:
   ```typescript
   // tailwind.config.ts
   const config: Config = {
     content: [
       './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
       './src/components/**/*.{js,ts,jsx,tsx,mdx}',
       './src/app/**/*.{js,ts,jsx,tsx,mdx}',
       './src/ui/**/*.{tsx,ts,js,jsx}', // Wichtig für Subframe
     ],
     presets: [require("./src/ui/tailwind.config.js")], // Wichtig für Subframe
   }
   ```

2. **Subframe Preset überprüfen**:
   ```javascript
   // src/ui/tailwind.config.js
   module.exports = {
     theme: {
       extend: {
         colors: {
           brand: { /* ... */ },
           neutral: { /* ... */ },
           // ... weitere Farben
         }
       }
     }
   }
   ```

### 4. CSS-Kompilierungsfehler

#### Problem-Beschreibung
Webpack kann CSS-Dateien nicht kompilieren.

#### Lösung
```bash
# 1. Dependencies neu installieren
rmdir /s /q node_modules
npm install

# 2. Cache löschen
rmdir /s /q .next

# 3. Server neu starten
npm run dev
```

## Präventive Maßnahmen

### 1. Korrekte CSS-Struktur
```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #171717;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: 'Inter', Arial, Helvetica, sans-serif;
}

/* Nur Standard-Tailwind-Klassen verwenden */
@layer components {
  .form-input {
    @apply text-sm text-gray-600;
  }
}
```

### 2. TypeScript-Konfiguration
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  }
}
```

### 3. Next.js Konfiguration
```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@subframe/ui'],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
};

export default nextConfig;
```

## Debugging-Tools

### 1. Tailwind CSS IntelliSense
- VS Code Extension installieren
- Automatische Vervollständigung für Tailwind-Klassen

### 2. Browser Developer Tools
- CSS-Inspector verwenden
- Computed Styles überprüfen
- Network Tab für CSS-Loading prüfen

### 3. Next.js Debug-Modus
```bash
npm run dev -- --debug
```

## Häufige Fehlerquellen

### 1. Falsche Tailwind-Klassen
```css
/* ❌ Häufige Fehler */
@apply border-border;     /* Existiert nicht */
@apply bg-background;     /* Existiert nicht */
@apply text-foreground;   /* Existiert nicht */

/* ✅ Korrekte Alternativen */
@apply border-gray-200;   /* Standard Tailwind */
@apply bg-white;          /* Standard Tailwind */
@apply text-gray-900;     /* Standard Tailwind */
```

### 2. CSS-Spezifitätsprobleme
```css
/* ❌ Zu spezifisch */
body div.container .form-input {
  @apply text-red-500;
}

/* ✅ Besser */
.form-input {
  @apply text-red-500;
}
```

### 3. Cache-Probleme
- `.next` Ordner regelmäßig löschen
- Browser-Cache leeren
- Hard Refresh (Ctrl+F5)

## Notfall-Wiederherstellung

### Wenn alles kaputt ist:
```bash
# 1. Alle Prozesse stoppen
taskkill /f /im node.exe

# 2. Git-Status prüfen
git status

# 3. Letzten funktionierenden Stand wiederherstellen
git checkout HEAD -- src/app/globals.css
git checkout HEAD -- tailwind.config.ts

# 4. Cache löschen
rmdir /s /q .next

# 5. Server neu starten
npm run dev
```

## Best Practices

### 1. CSS-Änderungen
- Immer in `@layer` Direktiven kapseln
- Nur Standard-Tailwind-Klassen verwenden
- CSS-Spezifität minimieren

### 2. Entwicklung
- Häufig testen
- Kleine, inkrementelle Änderungen
- Git-Commits nach funktionierenden Änderungen

### 3. Wartung
- Regelmäßig Dependencies updaten
- Cache regelmäßig löschen
- Performance überwachen 