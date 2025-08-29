# WFS-Bundesländer-Analyse 2025: Flurstücke und Gebäudeumrisse

## 📊 Übersicht: Verfügbarkeit von Flurstücken und Gebäudeumrissen

### 🚫 **PRIORITÄT 1: Beide Daten fehlend (4 Bundesländer)**

#### Bayern
- **Status:** Keine Open Data WFS verfügbar
- **Flurstücke:** Nur kostenpflichtig nach Registrierung über LDBV
- **Gebäudeumrisse:** Nur kostenpflichtig nach Registrierung über LDBV
- **Beispiel:** ALKIS Flurkarte (kostenpflichtig, WMS, kein WFS für freien Zugriff)
- **URL:** https://geoservices.bayern.de/pro/wms/alkis/v1/flurkarte?
- **Hinweis:** Restriktive Datenpolitik - keine Open Data!

#### Rheinland-Pfalz
- **Status:** Teilweise verfügbar
- **Flurstücke:** Vereinfachter ALKIS-WFS verfügbar
- **Gebäudeumrisse:** Fehlen vereinzelt laut Meta-Daten
- **URL:** https://www.geoportal.rlp.de/spatial-objects/519?service=WFS&request=GetCapabilities
- **Hinweis:** Monatlich aktualisiert, direktes XML/GeoJSON

#### Sachsen-Anhalt
- **Status:** WFS verfügbar
- **Flurstücke:** Amtlicher WFS für Flurstücke
- **Gebäudeumrisse:** Hausumringe als gesonderte Daten
- **URLs:**
  - Amtlicher WFS: https://metaver.de/trefferanzeige?docuuid=410EFCD9-37D9-4D6D-B7A3-09FCCEC9321C
  - INSPIRE-WFS Flurstücke: https://metaver.de/trefferanzeige?docuuid=DE9B25EE-8D28-4D54-9E2C-DB4493F3A5AA
- **Hinweis:** Landesweit verfügbar über Landesamt

#### Thüringen
- **Status:** Kein offener WFS verfügbar
- **Flurstücke:** Nicht auffindbar
- **Gebäudeumrisse:** Nicht auffindbar
- **Hinweis:** Restriktiv wie Bayern - keine Open Data!

### 🚫 **PRIORITÄT 2: Nur Flurstücke fehlen (1 Bundesland)**

#### Bremen
- **Status:** Gebäudeumrisse verfügbar, Flurstücke fehlen
- **Flurstücke:** KEIN offener WFS verfügbar
- **Gebäudeumrisse:** Über OpenData oder amtliche Katasterdienste
- **Hinweis:** Keine INSPIRE/ALKIS WFS für Flurstücke auffindbar

### 🚫 **PRIORITÄT 3: Nur Gebäudeumrisse fehlen (5 Bundesländer)**

#### Hessen
- **Status:** Flurstücke verfügbar, Gebäudeumrisse fehlen
- **Flurstücke:** INSPIRE-WFS verfügbar
- **URL:** https://gds.hessen.de/INSPIRE/Katasterparzellen
- **Standard-Request:** ?service=WFS&request=GetCapabilities
- **Gebäudeumrisse:** Laut Metadaten nur Flurstücke als Open Data

#### Niedersachsen
- **Status:** Flurstücke verfügbar, Gebäudeumrisse fehlen
- **Flurstücke:** INSPIRE-WFS verfügbar
- **URL:** https://advmis.geodatenzentrum.de/trefferanzeige?docuuid=3b3de974-8d68-4ae6-836c-7e4f4f66559e
- **Gebäudeumrisse:** Fehlen

#### Nordrhein-Westfalen
- **Status:** Flurstücke verfügbar, Gebäudeumrisse fehlen
- **Flurstücke:** Open Data via INSPIRE
- **URL:** https://www.wfs.nrw.de/geobasis/wfs_nw_inspire-flurstuecke_alkis?REQUEST=GetCapabilities&SERVICE=WFS
- **Gebäudeumrisse:** Fehlen

#### Sachsen
- **Status:** Flurstücke verfügbar, Gebäudeumrisse fehlen
- **Flurstücke:** Open Data (WFS)
- **URL:** https://www.geodaten.sachsen.de/alkis-wfs-4968.html
- **Gebäudeumrisse:** Fehlen laut Geoportal

#### Schleswig-Holstein
- **Status:** Flurstücke verfügbar, Gebäudeumrisse fehlen
- **Flurstücke:** Open Data via INSPIRE vorhanden
- **Hinweis:** Über Landesdienst und AdV-MIS/Geoportal (URL je nach Abfrage)
- **Gebäudeumrisse:** Fehlen

### ✅ **VOLLSTÄNDIG VERFÜGBAR (6 Bundesländer)**

#### Baden-Württemberg, Berlin, Brandenburg, Hamburg, Mecklenburg-Vorpommern, Saarland
- **Status:** Flurstücke und Gebäudeumrisse als Open Data verfügbar
- **Typ:** INSPIRE/ALKIS-WFS, auch Portal-Verlinkungen
- **Hinweis:** Im Einzelfall Nutzungsbedingungen prüfen, besonders für Gebäudeumrisse

## 🎯 **ZUSAMMENFASSUNG**

### **Restriktive Bundesländer (keine Open Data):**
- **Bayern** - Nur kostenpflichtige Dienste
- **Thüringen** - Keine Open Data WFS

### **Flurstücke meist verfügbar:**
- In den meisten Bundesländern über INSPIRE/ALKIS-WFS
- Gebäudeumrisse sind deutlich seltener verfügbar

### **Gebäudeumrisse nur in wenigen Bundesländern:**
- Berlin, Brandenburg, Hamburg, Mecklenburg-Vorpommern
- Sachsen-Anhalt und Rheinland-Pfalz (teilweise)

### **Empfehlung für Integration:**
Die gesuchten URLs und Dienste sind für automatisierte Workflows geeignet und bieten in vielen Bundesländern Flurstücksdaten. Gebäudeumrisse sind meist nur in den "starken Open Data-Ländern" verfügbar.

## 📅 **Stand der Analyse: August 2025**
