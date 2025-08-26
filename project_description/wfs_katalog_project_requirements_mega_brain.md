$1
> **Leitplanken (verbindlich):** Es dürfen **keine bestehenden Code‑Bestandteile** des Projekts geändert werden. Der WFS‑Katalog wird ausschließlich **additiv** implementiert (neue Module/Ordner, neue Tabellen, neue Routen/Jobs; keine Modifikationen an bestehendem Code).

## 0) Vorgehensplan (strikt sequenziell)
1. **Tabellenanlage in Supabase via MCP**  
   - Tabellen `wfs_streams` und `wfs_layers` werden **mittels MCP‑Protokoll** (automatisierte SQL‑Migrationen) erstellt.  
   - Keine manuelle DB‑Änderung außerhalb des MCP‑Flows.  
   - Constraints/Indizes wie in den Requirements beschrieben (u. a. Unique auf `url`, Unique `(wfs_id, name)`).
2. **Befüllung mit 5–6 Test‑WFS‑URLs**  
   - Mindestens je **DE**, **AT**, **CH** und **FR** (z. B. DE: Berlin ALKIS `https://gdi.berlin.de/services/wfs/alkis_flurstuecke`).  
   - Nach jedem Import: Sichtprüfung der Service‑ und Layer‑Einträge (Land/Region, CRS, Layer‑Anzahl, BBOX/INSPIRE, Diagnostikfelder).
3. **Tests für Parser & Persistenz**  
   - Unit/Integration‑Tests für **WFS 2.0.0** und **1.1.0**; Namespace‑Varianten, verschachtelte `FeatureTypeList`, globale vs. Layer‑CRS, BBOX vorhanden/fehlend.  
   - Tests für Idempotenz (erneuter Import derselben URL überschreibt konsistent), Fehlerbehandlung (HTTP‑Status, Timeouts), und Datenmodell‑Konformität (z. B. Pflichtfelder, Unique‑Constraints).  
   - Erst wenn alle Tests **grün** sind (inkl. verschachtelter Layer‑Logik), wird mit nachfolgenden Phasen (DescribeFeatureType, UI‑Erweiterungen, etc.) fortgefahren.


## 1) Kurzbeschreibung
Ein Modul, das **WFS‑Dienste (URLs)** erfasst, deren **GetCapabilities** automatisiert lädt, daraus **Service‑Metadaten** und **Layer‑Informationen** extrahiert und in **Supabase** speichert. Ziel ist ein international nutzbarer **Katalog**, aus dem später schnell passende Layer (v. a. Flurstücke/Grundstücke und Gebäudeumrisse) für Projekte ausgewählt und abgefragt werden können.

---

## 2) Ziele (MVP)
- WFS‑URL aufnehmen, **GetCapabilities** abrufen und **Version erkennen** (WFS 2.0.0 / 1.1.0).
- **Service‑Metadaten** persistieren (Titel, Abstract, Anbieter, unterstützte CRS, optionale BBOX, Operations, Diagnostik).
- **Layer** je Dienst **normalisiert** speichern (Name, Titel, CRS, BBOX, Keywords, INSPIRE‑Infos, Grundschema optional).
- **International**: Felder für **Land** (ISO‑Code + Name) und **Bundesland/Region**.
- **INSPIRE**: Dienst‑/Layer‑weite Kennzeichnung + Kernmetadaten (Themen, Metadaten‑URL, Konformitätsstatus).
- **Read‑API** zur Suche/Browse (für Subframe‑UI); **Refresh** zum Re‑Import.

## 3) Nicht‑Ziele (MVP)
- Kein Download/Caching von Feature‑Geometrien (PostGIS ggf. später).
- Keine reprojizierten BBOX‑Berechnungen (Anzeige der gelieferten BBOX genügt).
- Kein Auth‑Flow für geschützte WFS (nur Kennzeichnung „auth_erforderlich“ als Platzhalter).

---

## 4) Nutzer‑Stories (Auszug)
- *Als Architekt* möchte ich eine WFS‑URL hinzufügen und sofort sehen, **welche Layer** verfügbar sind.
- *Als Planer* möchte ich nach **Land**, **Bundesland/Region**, **Anbieter** und **Inhalt** filtern.
- *Als Nutzer* möchte ich **unterstützte CRS** und **BBOX** pro Layer sehen, um Abfragen korrekt zu parametrieren.
- *Als Admin* möchte ich bei Fehlern **HTTP‑Status, Latenz, Größe, Content‑Type** und eine **Fehlermeldung** sehen.

---

## 5) Architektur & Stack
- **Datenbank**: Supabase (PostgreSQL). PostGIS wird **nicht** benötigt, solange nur Metadaten katalogisiert werden (kann später aktiviert werden).
- **Server/Jobs**: Node.js + TypeScript (gleich wie übriger Mega‑Brain‑Stack).
- **UI**: Subframe konzipiert; UI konsumiert Read‑API‑Endpunkte (z. B. `/api/wfs/services`, `/api/wfs/layers`).
- **Parsing**: robuster XML‑Parser, Namespace‑tolerant; Timeouts/Retry; Fallback 2.0.0 ⇄ 1.1.0.

---

## 6) Parsing‑Strategie (GetCapabilities)
- **Versionserkennung**: zunächst als WFS 2.0.0 interpretieren; falls nicht kompatibel, Fallback auf 1.1.0.
- **Namespaces**: tolerant handhaben (z. B. `wfs:`, `ows:`, unpräfixierte Knoten). Attribute berücksichtigen.
- **Service‑Infos**: `Title`, `Abstract`, Provider/Contact (optional), globale `Operations/Constraints`.
- **CRS**: global (2.0.0: `OperationsMetadata/Constraint=ImplementedCRS`) und pro Layer (`DefaultCRS`/`SupportedCRS` bzw. `DefaultSRS`/`OtherSRS`).
- **BBOX**: bevorzugt **WGS84** (`ows:WGS84BoundingBox` in 2.0.0 bzw. `LatLongBoundingBox` in 1.1.0).
- **Layerliste**: `Name`, `Title`, `Abstract`, Keywords, BBOX, CRS.
- **DescribeFeatureType (optional Phase 2)**: feldgenaue Schemas (`properties`) on‑demand laden und cachen.
- **Diagnostik**: HTTP‑Status, Latenz, Response‑Größe, Content‑Type, ETag/Last‑Modified, Fehlertext speichern.

---

## 7) Terminologie & Internationalisierung
- **Land**:
  - `land_code` = ISO‑3166‑1 Alpha‑2 (z. B. `DE`, `AT`, `CH`, `FR`).
  - `land_name` = deutscher Langname (z. B. „Deutschland“, „Österreich“, „Schweiz“, „Frankreich“).
- **Bundesland_oder_Region** (Freitext mit UI‑Hinweis je Land):
  - DE/AT: „Bundesland“, CH: „Kanton“, FR: „Région/Département“.
- **INSPIRE**: EU‑Rahmen (CH nicht Mitglied → i. d. R. nicht konform; trotzdem thematische Zuordnung möglich). Layer können eigenen Konformitätsstatus besitzen, der die Dienst‑Ebene übersteuert.

---

## 8) Datenmodell (Supabase)

### 8.1 Tabelle `wfs_streams` — WFS‑Dienste (Service‑Katalog)
**MVP‑Felder**
- `id` (uuid, PK)
- `url` (text, unique) — Basis‑URL des WFS (ohne Query‑Parameter)
- `land_name` (text) — Ländername
- `land_code` (text) — ISO‑Code (z. B. DE/AT/CH/FR)
- `bundesland_oder_region` (text) — Bundesland/Kanton/Région
- `anbieter` (text) — Behörde/Organisation
- `inhalt` (text) — Kurzbeschreibung (z. B. „ALKIS Flurstücke“)
- `service_title` (text)
- `service_abstract` (text)
- `wfs_version` (text) — z. B. 2.0.0, 1.1.0
- `unterstuetzte_crs` (text[]) — global unterstützte CRS (sofern vorhanden)
- `layer_anzahl` (int) — abgeleitete Zählung
- `zuletzt_geprueft` (timestamptz)
- `ist_aktiv` (boolean, default true)

**INSPIRE (Dienst‑Ebene)**
- `inspire_konform` (boolean) — Dienst konform?
- `inspire_diensttyp` (text) — z. B. „Download Service (WFS)“
- `inspire_themen_codes` (text[]) — z. B. {"CP","BU"}
- `inspire_metadaten_url` (text) — Link zu offiziellen Metadaten

**Optionale technische/diagnostische Felder**
- `provider_name` (text), `provider_site` (text), `kontakt` (jsonb)
- `ows_update_sequence` (text)
- `operationen` (jsonb) — Operations/Bindings (GET/POST)
- `standard_outputformate` (text[])
- `bbox_wgs84` (jsonb) — Gesamt‑BBOX (falls vorhanden)
- `auth_erforderlich` (boolean)
- `http_status` (int), `latenz_ms` (int), `response_bytes` (int), `content_type` (text)
- `etag` (text), `last_modified_http` (text)
- `zuletzt_fehler` (text)
- `aktualisierungsintervall` (interval, default „7 days“)
- `tags` (text[]), `meta` (jsonb)
- `capabilities_rohxml` (text) — optionales Debug/Archiv

**Indizes (Empfehlung)**
- Unique auf `url`.
- BTree auf `(land_code, bundesland_oder_region)`.
- GIN auf `tags` (falls genutzt).

### 8.2 Tabelle `wfs_layers` — Layer je Dienst
**MVP‑Felder**
- `id` (uuid, PK)
- `wfs_id` (uuid, FK → `wfs_streams.id`, on delete cascade)
- `name` (text) — technischer Layer‑Name (`typeName`)
- `titel` (text) — lesbarer Name
- `abstract` (text)
- `schluesselwoerter` (text[]) — Keywords/GEMET (optional)
- `default_crs` (text)
- `weitere_crs` (text[])
- `bbox_wgs84` (jsonb) — `{ lower:[lon,lat], upper:[lon,lat], crs:"EPSG:4326" }`
- `geometrietyp` (text) — Polygon/MultiPolygon/LineString/Point/Unknown

**INSPIRE (Layer‑Ebene)**
- `inspire_thema_codes` (text[]) — z. B. {"CP"}
- `inspire_konformitaet` (text) — „konform“ | „nicht_konform“ | „nicht_geprueft“
- `inspire_identifikator` (text) — Ressourcen‑ID/URI
- `inspire_metadaten_url` (text) — Layer‑Metadatenlink

**Optionale Schemafelder (Phase 2)**
- `outputformate` (text[])
- `eigenschaften_schema` (jsonb) — DescribeFeatureType (Feld→{type,nillable})
- `geometrie_property_name` (text)
- `ist_abfragbar` (boolean)
- `sample_feature` (jsonb)
- `zuletzt_describe_geprueft` (timestamptz)
- `zuletzt_describe_fehler` (text)

**Indizes/Constraints**
- Unique auf `(wfs_id, name)`.
- BTree auf `wfs_id`, `name`.

### 8.3 (Optional) `project_wfs_map` — Zuordnung Projekt ↔ Dienst/Layer
- Zweck: bestimmte Streams/Layers Projekten zuweisen; Notizen je Einsatzfall.

---

## 9) Validierung & Konventionen
- **Land**:
  - `land_code` immer als ISO‑3166‑1 Alpha‑2.
  - `land_name` deutschsprachig (z. B. „Frankreich“).
- **Bundesland/Region**: Freitext; UI zeigt landesspezifische Bezeichnung (Bundesland/Kanton/Région).
- **INSPIRE**: Dienst kann `inspire_konform = true` haben; Layer kann abweichen (über `inspire_konformitaet`). Für CH typ. `nicht_geprueft`/`nicht_konform`.
- **CRS**: als `EPSG:xxxx` speichern; Mehrfachwerte als Array.
- **BBOX**: WGS84 bevorzugt; keine Reprojektion im MVP.

---

## 10) API (read‑only, für UI)
- **GET** `/api/wfs/services` — Filter: `q`, `land_code`, `bundesland_oder_region`, `anbieter`, `inhalt`, `inspire_konform`.
- **GET** `/api/wfs/layers` — Parameter: `wfs_id` (UUID). Liefert Layerliste (Name, Titel, CRS, BBOX, INSPIRE‑Infos).

---

## 11) UI (Subframe) — Screens & Aktionen
**Screens**
1) **Services Liste**: Suche/Filter (Land, Bundesland/Region, Anbieter, Inhalt, INSPIRE). Tabelle: URL, Titel, Version, Land, Region, Anbieter, `zuletzt_geprueft`, Status.
2) **Service Detail**: Kopf mit Titel/Abstract/URL/Version; Badges für CRS/INSPIRE; Liste der Layer (Name, Titel, Default‑CRS, BBOX, INSPIRE‑Thema).
3) **Layer Detail (optional)**: INSPIRE‑Infos, BBOX als Text, Keywords; „Felder laden“ (DescribeFeatureType) optional Phase 2.

**Aktionen**
- **„WFS hinzufügen“** (Modal): URL, Land (Code+Name), Bundesland/Region, Anbieter, Inhalt, Tags → Import anstoßen.
- **„Refresh Capabilities“**: erneutes Einlesen (zeigt Diagnostik/Fehler).
- **„GetFeature‑Vorlage kopieren“** (Komfort): generiert Query‑Schablonen (ohne Abruf im MVP).

---

## 12) Import‑/Refresh‑Verhalten
- Idempotent: Duplikat‑Import per `url` überschreibt konsistent.
- Vor neuem Layer‑Insert alte Layer des Dienstes löschen (einfach/robust) oder differenziert aktualisieren (später).
- Diagnostikfelder immer aktualisieren (HTTP‑Status, Latenz, Bytes, Fehler).

---

## 13) Akzeptanzkriterien (MVP)
- Beim Hinzufügen einer gültigen WFS‑URL werden mindestens **Service‑Titel**, **Version**, **Land/Region**, **unterstützte CRS (falls vorhanden)** und die **Layerliste** (Name/Titel/Default‑CRS/BBOX sofern verfügbar) gespeichert.
- **INSPIRE‑Felder** werden gesetzt, wenn aus Capabilities/Metadaten eindeutig ableitbar (sonst leer/nicht_geprueft).
- **Filter** nach `land_code` und `inspire_konform` liefern korrekte Ergebnisse.
- **Refresh** aktualisiert deterministisch; `layer_anzahl` entspricht der gespeicherten Layerzahl.
- Fehlerhafte/unerreichbare URLs führen nicht zum Abbruch: `http_status` und `zuletzt_fehler` sind gesetzt.

---

## 14) Offene Fragen
- Sollen **Roh‑XML** dauerhaft gespeichert oder nach erfolgreichem Import reduziert (z. B. persistente Hashes) werden?
- **Rechtliches**: Felder für Nutzungsbedingungen/Lizenzen/Fees/AccessConstraints aufnehmen?
- **Komfort**: Flag `supports_geojson` aus Output‑Formaten ableiten?
- **Auth**: Wie sollen zukünftig geschützte Dienste konfiguriert werden (API‑Keys/Basic Auth/Token)?

---

## 15) Phasenplan (Empfehlung)
- **Phase 1 (MVP)**: Tabellen, Import (GetCapabilities), Read‑API, Subframe‑UI (Liste/Detail), INSPIRE‑Basis.
- **Phase 2**: DescribeFeatureType‑Fetch on‑demand; Properties‑Schema cachen; Layer‑Keywords/Outputformate; ggf. simple Health‑Checks.
- **Phase 3**: PostGIS‑Erweiterung, GetFeature‑Fetcher (Batch), Projekt‑Zuordnung (`project_wfs_map`), BBOX‑Reprojektion.

