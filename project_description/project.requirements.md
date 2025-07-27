# 📁 Project Requirements: AI Material Capture Tool

## 🧠 Projektziel

Ein intelligentes Tool zur schnellen, KI-gestützten Erfassung von Baumaterialien, die im Alltag (z. B. beim Browsen) entdeckt werden. Die Materialien sollen automatisiert analysiert, mit Screenshots gespeichert und in einer **Supabase-Datenbank** organisiert werden. Das Frontend wird mit **Next.js + Subframe** entwickelt, **Vercel** übernimmt das Deployment.

**Begründung Next.js vs. Vite:** Obwohl Subframe standardmäßig Vite empfiehlt, wurde Next.js gewählt, da es eine integrierte Lösung für Frontend- und Backend-Logik bietet. Die KI-Analyse-Funktion (Serverless Function) und serverseitiger Datenabruf von Supabase sind mit Next.js nahtlos integrierbar. Die von Subframe generierten React-Komponenten sind vollständig kompatibel.

Die zugehörige **Chrome Extension ist bereits programmiert** und **nicht Teil dieses Projekts**. Sie ist in einem separaten Repository organisiert und öffnet beim Klick auf „Capture“ die hier beschriebene `Capture Page` inklusive Übergabe der Screenshots und URL.

Das komplette **UI wurde bereits mit [Subframe.com](https://subframe.com)** entworfen. Subframe generiert auf Basis der Design-Komponenten einen **React-Code-Prompt**, der in **Cursor AI** eingefügt werden kann. Der generierte Code ist direkt einsetzbar und bildet die Grundlage für die Implementation der App-Komponenten.

### 🔧 Subframe Initialisierung

```bash
npx @subframe/cli@latest init \
  --auth-token e04c9fce9ea361bbe7f869141bcefa3d9ff27b2025c768a495f5048e7134ec1e \
  -p 269cf10fcebb \
  --dir ./src/ui \
  --alias '@/ui/*' \
  --install \
  --tailwind \
  --sync \
  --template vite \
  --name subframe-cursor-app
```

### 🧩 Fonts (Einfügen in `<head>`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=monospace:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
```

### ▶️ Dev-Server starten

```bash
npm run dev
```

---

## 📸 1. AI Capture Page

### 🎯 Zweck

Nach dem Klick auf „Capture“ in der Chrome Sidebar wird die `Capture Page` aufgerufen. Hier erfolgt die automatische Analyse des Screenshots und der Zielseite via **BeautifulSoup / Cheerio** + **OpenAI Omni-Modell**.

### 🔽 Eingabedaten

* `full_screenshot_path` (URL oder Supabase-Pfad)
* `thumbnail_path`
* `source_url` (Webseite, die analysiert wird)

### ⚙️ Automatisierte Analyse

* Produktname, Hersteller
* Kategorie (2-stufig)
* Beschreibung, technische Eigenschaften
* Preis, Maße, Farbe, Materialien
* URL, Screenshot, Keywords

### ✅ Aufgaben

* Analyse-Logik in einem Serverless Function (Edge/Vercel Function)
* Nutzung des Omni-Modells via OpenAI API
* DOM-Parsing über BeautifulSoup / Cheerio für strukturelle Infos (Fallback)
* Vorschau der extrahierten Werte zur manuellen Korrektur
* Button zum "Speichern in Supabase"

---

## 📊 2. Table View

### 🎯 Zweck

Zentrale Verwaltungsansicht aller erfassten Produkte, gefiltert nach Kategorien.

### 🧱 UI-Aufbau

* **Baumstruktur (2-stufig)** zur Auswahl der Produktkategorie
* **Tabellarische Liste** der zugehörigen Produkte (mit Such- & Sortierfunktion)
* **Drawer** mit Detailansicht (bearbeitbar)

### 📝 Anzeige-Felder in der Tabelle

* Produktname
* Hersteller
* Kategorie (Stufe 1 + 2)
* Preis
* Bild (Thumbnail)
* Datum der Erfassung

### 🔄 Interaktionen

* Klick auf Produkt öffnet **Drawer mit allen Details**
* Bearbeitung direkt im Drawer (Live-Binding mit Supabase Update)
* Hinzufügen / Duplizieren / Löschen

---

## ⚙️ 3. Settings – Produktkategorien

### 🎯 Zweck

Bearbeitung der hierarchischen Kategorien, die in einer Supabase-Tabelle gespeichert werden sollen. Die Tabelle existiert noch **nicht** und wird im Rahmen dieses Projekts als JSON-Definition vorbereitet. Die Umsetzung erfolgt später über das Supabase **MCP**.

### 🧱 UI-Aufbau

* Liste aller **Hauptkategorien**, expandierbar zu Unterkategorien
* Bearbeiten, Hinzufügen, Löschen
* Drag & Drop Sortierung (optional)

### 📃 Kategorie-Definition (JSON)

* Liegt in gesondertem JSON-File vor

---

## 🔒 4. User-Management

### 🔐 Login via

* Google SSO
* Zusätzlich manuelle Benutzerverwaltung in Supabase (Tabelle `users` mit Hash-Passwords, Admin-Flag etc.)

---

## 📆 Supabase Storage Buckets

### 📅 Verwendung

Da im Projekt mit umfangreichen Dateien (z. B. PDFs, Datenblättern, technischen Zeichnungen) gerechnet wird, werden folgende Buckets vorbereitet:

* **`screenshots`** für Bilder (voll & thumbnail)
* **`documents`** für PDFs und andere Dateianhänge

Die Integration erfolgt über das **Supabase MCP (Media Content Pipeline)** zur standardisierten Verwaltung inkl. Metadaten und Thumbnails.

---

## 🚀 Vercel Deployment

### 🌍 Ziel

Die Anwendung soll über [Vercel](https://vercel.com) deployed werden, um schnelles Hosting, CI/CD und Edge Functions zu nutzen.

### ✅ Voraussetzungen

* GitHub-Repository mit Projektcode (z. B. `vite`-Template aus Subframe)
* Verknüpfung mit Vercel-Konto (z. B. via GitHub OAuth)
* `vercel.json` optional für Routing/Function-Konfiguration

### 🧾 Build Settings (für Vite + React + TypeScript)

* **Framework Preset:** `Vite`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`

### 🌐 Domains & Preview

* Jede GitHub-Push generiert automatisch eine Preview-URL
* Custom Domain kann über Vercel Dashboard konfiguriert werden

### 💡 Hinweis

Vercel unterstützt **Edge Functions**, was ideal ist für serverseitige Verarbeitung der KI-Auswertung. Die geplanten Analysefunktionen (BeautifulSoup + GPT‑Modell) können direkt darüber realisiert werden.

---

## 🛆 Tech Stack

| Bereich    | Technologie                 |
| ---------- | --------------------------- |
| Frontend   | Next.js + Subframe + Tailwind |
| Backend    | Supabase + Edge Functions   |
| Parsing    | BeautifulSoup / Cheerio     |
| KI-Analyse | OpenAI GPT-4o (Omni-Modell) |
| Deployment | Vercel                      |
| Auth       | Supabase + Google SSO       |

---

## 📂 Projektstruktur (Vorschlag)

```
src/
├── pages/
│   ├── capture.tsx
│   ├── table.tsx
│   └── settings.tsx
├── components/
│   ├── MaterialCard.tsx
│   ├── Drawer.tsx
│   ├── CategoryTree.tsx
│   └── EditableField.tsx
├── lib/
│   ├── scrape.ts
│   ├── openai.ts
│   └── supabase.ts
└── types/
    └── material.d.ts
```

---

## 📌 Nächste Schritte

1. [ ] OpenAI Prompt-Template für Materialanalyse definieren
2. [ ] Supabase Tabellen-Validierung (Schema & Defaults) via MCP
3. [ ] Capture-Flow mit Screenshot + URL in Page übergeben
4. [ ] KI-Auswertung & Vorschau aufbauen
5. [ ] Table-View & Category-Drawer bauen (Subframe/Cursor)
6. [ ] Settings für Kategorien editierbar machen
7. [ ] Bucket-Struktur und MCP-Integration vorbereiten
