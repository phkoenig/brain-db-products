# Subframe + Next.js Integration Guide

## 🎯 Übersicht

Dieser Guide dokumentiert die **korrekte Integration** von Subframe UI Components mit Next.js 15. Die Integration ist **komplex** und erfordert spezifische Konfigurationen.

## ⚠️ Wichtige Warnungen

### ❌ Was NICHT funktioniert:
- **Subframe CLI `init`** mit Next.js (erstellt separate Vite-Projekte)
- **Turbopack** mit Subframe (Tailwind-Klassen werden nicht erkannt)
- **Tailwind CSS v4** mit Subframe (incompatible API)
- **Automatische Komponenten-Synchronisation** mit Next.js

### ✅ Was funktioniert:
- **Manuelle Integration** von Subframe-Komponenten
- **Tailwind CSS v3** mit Subframe
- **Standard Next.js Dev Server** (ohne Turbopack)

## 🚀 Setup-Prozess

### 1. Projekt-Vorbereitung

```bash
# Next.js 15 Projekt erstellen
npx create-next-app@latest my-subframe-project
cd my-subframe-project
```

### 2. Subframe-Komponenten synchronisieren

```bash
# Subframe CLI installieren
npm install -g @subframe/cli

# Komponenten synchronisieren (OHNE init!)
npx @subframe/cli@latest sync --all -p YOUR_PROJECT_ID
```

**WICHTIG:** Verwende NICHT `npx @subframe/cli@latest init` - das erstellt ein separates Vite-Projekt!

### 3. Tailwind CSS v3 installieren

```bash
# Tailwind v4 entfernen (falls vorhanden)
npm uninstall tailwindcss @tailwindcss/postcss

# Tailwind v3 installieren
npm install -D tailwindcss@^3.4.0 postcss autoprefixer

# Tailwind konfigurieren
npx tailwindcss init -p
```

### 4. Tailwind-Konfiguration

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/ui/**/*.{tsx,ts,js,jsx}', // Subframe-Komponenten
  ],
  presets: [require("./src/ui/tailwind.config.js")], // Subframe-Preset
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
```

### 5. CSS-Konfiguration

**src/app/globals.css:**
```css
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
  font-family: Arial, Helvetica, sans-serif;
}
```

### 6. Layout-Konfiguration

**src/app/layout.tsx:**
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Your App",
  description: "Your description",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        {/* Google Fonts für Subframe */}
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=monospace:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

### 7. Package.json anpassen

**package.json:**
```json
{
  "scripts": {
    "dev": "next dev", // OHNE --turbopack!
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@subframe/core": "^1.145.0",
    "next": "15.4.4",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

## 📝 Komponenten-Verwendung

### Beispiel: Settings-Page mit Subframe

```tsx
"use client";

import React from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { Table } from "@/ui/components/Table";
import { Badge } from "@/ui/components/Badge";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherStar, FeatherPlus, FeatherEdit2, FeatherTrash, FeatherMoreHorizontal } from "@subframe/core";
import * as SubframeCore from "@subframe/core";

function Settings() {
  return (
    <DefaultPageLayout>
      <div className="flex w-full flex-col items-start gap-4 px-12 py-12">
        <div className="flex flex-col items-start gap-4">
          <span className="whitespace-pre-wrap text-heading-2 font-heading-2 text-default-font">
            {"Kategorien\n"}
          </span>
          <Table
            className="h-auto w-auto flex-none"
            header={
              <Table.HeaderRow>
                <Table.HeaderCell>ID</Table.HeaderCell>
                <Table.HeaderCell>Main</Table.HeaderCell>
                <Table.HeaderCell>Sub</Table.HeaderCell>
              </Table.HeaderRow>
            }
          >
            <Table.Row>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  FB.FL
                </span>
              </Table.Cell>
              <Table.Cell>
                <Badge variant="neutral">Fußbodenbeläge</Badge>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  Fliesen
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex grow shrink-0 basis-0 items-center justify-end">
                  <SubframeCore.DropdownMenu.Root>
                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                      <IconButton
                        size="medium"
                        icon={<FeatherMoreHorizontal />}
                        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                      />
                    </SubframeCore.DropdownMenu.Trigger>
                    <SubframeCore.DropdownMenu.Portal>
                      <SubframeCore.DropdownMenu.Content
                        side="bottom"
                        align="end"
                        sideOffset={8}
                        asChild={true}
                      >
                        <DropdownMenu>
                          <DropdownMenu.DropdownItem icon={<FeatherStar />}>
                            Favorite
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherPlus />}>
                            Add
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherEdit2 />}>
                            Edit
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherTrash />}>
                            Delete
                          </DropdownMenu.DropdownItem>
                        </DropdownMenu>
                      </SubframeCore.DropdownMenu.Content>
                    </SubframeCore.DropdownMenu.Portal>
                  </SubframeCore.DropdownMenu.Root>
                </div>
              </Table.Cell>
            </Table.Row>
          </Table>
        </div>
      </div>
    </DefaultPageLayout>
  );
}

export default Settings;
```

## 🔧 Troubleshooting

### Problem: Feather Icons werden nicht erkannt (Linter-Fehler)
**Symptome:**
- TypeScript-Fehler: `Module '"@subframe/core"' has no exported member 'FeatherDatabase'`
- Icons funktionieren im Browser, aber Linter zeigt Fehler
- Icons verschwinden nach `sync`-Befehlen wieder

**Lösung:**
1. **Icons trotz Linter-Fehler verwenden** - sie funktionieren im Browser
2. **Nach jedem `sync`-Befehl Icons neu hinzufügen**:
   ```typescript
   import { FeatherDatabase } from "@subframe/core";
   import { FeatherPlus } from "@subframe/core";
   import { FeatherSettings } from "@subframe/core";
   import { FeatherUserCircle } from "@subframe/core";
   ```
3. **Button-Größe explizit setzen** für konsistente Darstellung:
   ```typescript
   <SidebarRailWithLabels.NavItem 
     icon={<FeatherDatabase />}
     selected={isDatabasePage}
     className="w-16 h-16" // Quadratische Buttons
   >
     DB
   </SidebarRailWithLabels.NavItem>
   ```

**Wichtige Erkenntnisse:**
- **Linter-Fehler sind bekanntes Subframe-Problem** - beeinträchtigen nicht die Funktionalität
- **Icons müssen nach jedem `sync` neu importiert werden** - Subframe überschreibt manuelle Änderungen
- **Button-Größe sollte explizit gesetzt werden** - Standard-Größe kann zu klein sein
- **Untertitel bleiben automatisch sichtbar** - NavItem-Komponente zeigt sie an

### Problem: Komponenten werden gerendert, aber ohne Styling
**Symptome:**
- Badges erscheinen als einfache Textboxen
- Icons erscheinen als "..." Text
- Keine Subframe-Farben oder Typography

**Lösung:**
1. Prüfe, ob **Tailwind v3** installiert ist (nicht v4)
2. Prüfe, ob **Turbopack deaktiviert** ist
3. Prüfe, ob **Subframe-Preset** in tailwind.config.js korrekt ist
4. **Server neu starten** nach Konfigurationsänderungen

### Problem: Subframe CLI erstellt separate Vite-Projekte
**Symptome:**
- Neuer Ordner `subframe-cursor-app` wird erstellt
- Komponenten sind nicht im Next.js-Projekt

**Lösung:**
- Verwende **NUR** `npx @subframe/cli@latest sync --all -p PROJECT_ID`
- Verwende **NIEMALS** `npx @subframe/cli@latest init`

### Problem: Turbopack-Kompatibilität
**Symptome:**
- Tailwind-Klassen werden nicht erkannt
- Styling funktioniert nicht im Dev-Modus

**Lösung:**
- Verwende **standard Next.js dev server** ohne `--turbopack`
- Ändere `"dev": "next dev"` in package.json

## 📁 Projektstruktur

```
my-subframe-project/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── ui/                    # Subframe-Komponenten
│       ├── components/
│       ├── layouts/
│       ├── tailwind.config.js # Subframe-Preset
│       └── utils.ts
├── tailwind.config.js         # Haupt-Konfiguration
├── postcss.config.js
└── package.json
```

## 🎯 Best Practices

1. **Immer Tailwind v3** mit Subframe verwenden
2. **Kein Turbopack** im Development
3. **Manuelle Komponenten-Integration** statt CLI init
4. **Google Fonts** (Inter + Monospace) immer einbinden
5. **Subframe-Preset** in tailwind.config.js verwenden
6. **Server neu starten** nach Konfigurationsänderungen

## 🚀 Deployment

### Vercel
- Funktioniert **out-of-the-box**
- **Build-Prozess** kompiliert Subframe-Klassen korrekt
- **Keine zusätzliche Konfiguration** nötig

### Andere Hosting-Provider
- Stelle sicher, dass **PostCSS** korrekt konfiguriert ist
- **Tailwind v3** muss im Build-Prozess verwendet werden

## 📚 Ressourcen

- [Subframe Documentation](https://subframe.com/docs)
- [Tailwind CSS v3 Documentation](https://tailwindcss.com/docs)
- [Next.js 15 Documentation](https://nextjs.org/docs)

---

**Letzte Aktualisierung:** Dezember 2024  
**Getestet mit:** Next.js 15.4.4, Subframe 1.145.0, Tailwind CSS 3.4.0 