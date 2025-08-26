# WFS-Katalog Tests

## Übersicht

Dieser Ordner enthält umfassende Tests für die WFS-Katalog-Funktionalität des BRAIN DB Products A Projekts.

## Verfügbare Tests

### 1. `wfs-parser-test.js` - WFS-GetCapabilities Parser Tests
**Status: ✅ Alle Tests erfolgreich (7/7)**

**Getestete Funktionalitäten:**
- XML-Parser Initialisierung
- WFS 2.0.0 Service-Metadaten Extraktion
- WFS 1.1.0 Service-Metadaten Extraktion
- WFS 2.0.0 Layer-Metadaten Extraktion
- WFS 1.1.0 Layer-Metadaten Extraktion
- Fehlerbehandlung für ungültiges XML
- Supabase-Integration

**Test-Daten:**
- WFS 2.0.0 GetCapabilities XML (Brandenburg ALKIS)
- WFS 1.1.0 GetCapabilities XML (Berlin ALKIS)
- Ungültiges XML für Fehlerbehandlung

### 2. `wfs-http-client-test.js` - WFS HTTP Client Tests
**Status: ✅ Alle Tests erfolgreich (7/7)**

**Getestete Funktionalitäten:**
- URL-Validierung
- GetCapabilities URL-Konstruktion
- HTTP-Request Funktionalität
- Einzelne GetCapabilities Requests
- Batch-Requests
- Fehlerbehandlung (Network Errors)
- Supabase-Integration

**Test-URLs:**
- https://www.wfs.nrw.de/geobasis/wfs_nw_inspire-flurstuecke_alkis
- https://www.geoportal.rlp.de/registry/wfs/519
- Ungültige URLs für Fehlerbehandlung

### 3. `wfs-integration-test.js` - WFS Integration Tests
**Status: ⚠️ 5/7 Tests erfolgreich**

**Getestete Funktionalitäten:**
- Integration Service Initialisierung
- Vollständige WFS-Verarbeitung
- Datenbank-Speicherung
- Vollständige Pipeline
- Batch-Verarbeitung
- Fehlerbehandlung
- Supabase-Integration

**Bekannte Probleme:**
- Datenbank-Speicherung: `land_name` Feld Constraint-Verletzung
- HTTP 400 Fehler bei einigen WFS-Services (normal bei echten Services)

## Ausführung

### Einzelne Tests ausführen:

```bash
# WFS Parser Tests
node tests/wfs-parser-test.js

# WFS HTTP Client Tests
node tests/wfs-http-client-test.js

# WFS Integration Tests
node tests/wfs-integration-test.js
```

### Alle Tests ausführen:

```bash
# Alle WFS-Tests in Reihenfolge
node tests/wfs-parser-test.js && node tests/wfs-http-client-test.js && node tests/wfs-integration-test.js
```

## Datenbank-Struktur

Die Tests interagieren mit folgenden Supabase-Tabellen:

### `wfs_streams` Tabelle
- `id` (UUID, Primary Key)
- `land_name` (TEXT, NOT NULL) - Bundesland
- `data_type` (TEXT) - Datentyp
- `service_name` (TEXT) - Dienstbezeichnung
- `wfs_url` (TEXT, NOT NULL) - WFS GetCapabilities URL
- `license` (TEXT) - Lizenz
- `remarks` (TEXT) - Bemerkungen
- `created_at` (TIMESTAMP) - Erstellungsdatum
- `updated_at` (TIMESTAMP) - Aktualisierungsdatum

### `wfs_layers` Tabelle
- `id` (UUID, Primary Key)
- `stream_id` (UUID, Foreign Key) - Referenz auf wfs_streams
- `layer_name` (TEXT) - Layer-Name
- `layer_title` (TEXT) - Layer-Titel
- `layer_abstract` (TEXT) - Layer-Beschreibung
- `default_crs` (TEXT) - Standard-Koordinatensystem
- `other_crs` (JSONB) - Weitere Koordinatensysteme
- `output_formats` (JSONB) - Unterstützte Ausgabeformate
- `bbox` (JSONB) - Bounding Box
- `created_at` (TIMESTAMP) - Erstellungsdatum
- `updated_at` (TIMESTAMP) - Aktualisierungsdatum

## Letzter Test-Lauf

**Datum:** 2025-08-26T20:50:40
**Gesamtergebnis:** 19/21 Tests erfolgreich (90.5%)

### Detaillierte Ergebnisse:
- **WFS Parser Tests:** 7/7 ✅
- **WFS HTTP Client Tests:** 7/7 ✅  
- **WFS Integration Tests:** 5/7 ⚠️

## Troubleshooting

### Häufige Probleme:

1. **"Invalid API key" Fehler:**
   - Überprüfe die Supabase-Credentials in den Test-Dateien
   - Stelle sicher, dass die `.env.local` Datei korrekte Werte enthält

2. **"Network Error" bei WFS-Requests:**
   - Normales Verhalten bei ungültigen URLs
   - Einige WFS-Services sind nicht erreichbar oder antworten mit Fehlern

3. **"Database Constraint Violation":**
   - `land_name` Feld muss einen Wert haben
   - WFS-Service-Metadaten müssen vollständig sein

4. **"HTTP 400/500" Fehler:**
   - Normales Verhalten bei echten WFS-Services
   - Services können temporär nicht verfügbar sein

### Debugging:

```bash
# Debug-Ausgabe aktivieren
DEBUG=true node tests/wfs-parser-test.js

# Einzelne Test-Methoden debuggen
node -e "const { WFSCapabilitiesParser } = require('./tests/wfs-parser-test.js'); const parser = new WFSCapabilitiesParser(); console.log(parser.extractServiceTitle(TEST_XML));"
```

## Nächste Schritte

1. **Datenbank-Speicherung reparieren:** `land_name` Feld korrekt setzen
2. **Robuste Fehlerbehandlung:** Bessere Behandlung von HTTP-Fehlern
3. **Performance-Optimierung:** Batch-Processing verbessern
4. **Echte WFS-Services:** Mehr echte WFS-Endpunkte testen
