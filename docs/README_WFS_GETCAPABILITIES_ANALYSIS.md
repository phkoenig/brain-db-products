# WFS GetCapabilities Problem-Analyse

## Problemstellung
Wir haben ein WFS-Metadaten-Extraktions-Skript, das GetCapabilities-Abfragen an deutsche WFS-Services durchführt. Die Erfolgsquote liegt bei nur 51% (24 von 47 Services), obwohl GetCapabilities normalerweise ohne Authentifizierung möglich sein sollte.

## Fehler-Kategorien

### 1. HTTP 400 (Bad Request) - 11 Services
**Problem:** Server antwortet mit "Bad Request" auf GetCapabilities-Abfrage

**Betroffene Services:**
- ALKIS Berlin Gebäude: `https://gdi.berlin.de/services/wfs/alkis_gebaeude`
- WFS ALKIS Berlin: `https://gdi.berlin.de/services/wfs/alkis`
- INSPIRE-WFS HE Flurstücke/Grundstücke ALKIS: `https://inspire-hessen.de/ows/services/org.2.753259a3-2469-4a16-a8a6-f1a02b897b0d_wfs`
- INSPIRE-WFS HE Adressen Hauskoordinaten: `https://inspire-hessen.de/ows/services/org.2.2d55ae0b-b221-4f74-bd9d-fe957aa4df37_wfs`
- INSPIRE-WFS Hydro - Phys. Gew. ATKIS Basis-DLM BB: `https://inspire.brandenburg.de/services/hy-p_bdlm_wfs`
- INSPIRE-WFS Verkehrsnetze ATKIS Basis-DLM BB: `https://inspire.brandenburg.de/services/strassennetz_wfs`
- INSPIRE-WFS Adressen ALKIS BB: `https://inspire.brandenburg.de/services/ad_alkis_wfs`
- WFS BB 3D-Gebäude LoD2: `https://isk.geobasis-bb.de/ows/gebaeudelod2_wfs`
- WFS BB ALKIS Vereinfacht: `https://isk.geobasis-bb.de/ows/alkis_vereinf_wfs`
- WFS (Bodendaten): `https://www.geodatenportal.sachsen-anhalt.de/arcgis/services/LAGB/LAGB_Bodendaten_B1_OpenData/MapServer/WFSServer`
- WFS (Gewässerstrukturkartierung): `https://rips-gdi.lubw.baden-wuerttemberg.de/arcgis/services/wfs/Gewaesserstrukturkartierung_nach_dem_Feinverfahren/MapServer/WFSServer`

**Frage:** Warum geben diese WFS-Services HTTP 400 zurück? Fehlt ein Query-Parameter oder ist die URL-Struktur falsch?

### 2. HTTP 401 (Unauthorized) - 2 Services
**Problem:** Server verlangt Authentifizierung für GetCapabilities

**Betroffene Services:**
- INSPIRE-WFS BY Hydro-Physische Gewässer ATKIS Basis-DLM: `https://geoservices.bayern.de/inspire-ows/v1/atkis-bdlm/hy-p/dls/wfs`
- INSPIRE-WFS BY Verkehrsnetze ATKIS Basis-DLM: `https://geoservices.bayern.de/inspire-ows/v1/atkis-bdlm/tn/dls/wfs`

**Frage:** Sind diese Services wirklich authentifizierungspflichtig oder gibt es eine alternative URL für öffentlichen Zugriff?

### 3. HTTP 403 (Forbidden) - 1 Service
**Problem:** Server verweigert Zugriff

**Betroffener Service:**
- Geokodierungsdienst der AdV: `https://sg.geodatenzentrum.de/wfs_geokodierung`

**Frage:** Ist dieser Service nur für bestimmte IP-Bereiche oder Organisationen zugänglich?

### 4. HTTP 404 (Not Found) - 1 Service
**Problem:** Service-Endpunkt nicht gefunden

**Betroffener Service:**
- INSPIRE-WFS Saarland Gebäude: `https://geoportal.saarland.de/gdi-sl/inspirewfs_Gebaeude_2D_ALKIS?service=WFS&request=GetCapabilities`

**Frage:** Ist die URL veraltet oder falsch? Gibt es eine aktuelle URL für diesen Service?

### 5. HTTP 307/303 (Redirect) - 4 Services
**Problem:** Server leitet um, aber unser Client folgt der Umleitung nicht korrekt

**Betroffene Services:**
- INSPIRE NI Flurstücke/Grundstücke: `https://www.inspire.niedersachsen.de/doorman/noauth/alkis-vs-cp`
- INSPIRE-WFS BW Gebäude ALKIS: `https://www.geoportal-bw.de/geonetwork/srv/ger/catalog.search`
- INSPIRE-WFS BW Flurstücke ALKIS: `https://www.geoportal-bw.de/geonetwork/srv/ger/catalog.search#/metadata/b8f71e71-a02b-9f8d-31da-4ba949729567`
- INSPIRE-WFS BW Adressen Hauskoordinaten ALKIS: `https://www.geoportal-bw.de/geonetwork/srv/ger/catalog.search#/metadata/894ce9b8-682b-4932-9d90-fbf2403a0a24`

**Frage:** Wohin leiten diese URLs um? Sind es Metadaten-Kataloge statt direkte WFS-Endpunkte?

### 6. DNS-Probleme - 2 Services
**Problem:** Hostname kann nicht aufgelöst werden

**Betroffene Services:**
- INSPIRE-WFS Schleswig-Holstein Flurstücke/Grundstücke: `https://sgx.geodaten-sh.de/sgx_dienste/wfs/inspire_cp_alkis?service=WFS&request=GetCapabilities`
- INSPIRE-WFS Schleswig-Holstein Gebäude: `https://sgx.geodaten-sh.de/sgx_dienste/wfs/inspire_bu_2d_alkis?service=WFS&request=GetCapabilities`

**Frage:** Ist der Hostname `sgx.geodaten-sh.de` korrekt? Gibt es eine alternative URL?

### 7. HTTP 302 (Redirect) - 1 Service
**Problem:** Weiterleitung, möglicherweise zu Login-Seite

**Betroffener Service:**
- ALKIS-WFS: `https://geodienste.sachsen.de/aaa/public_alkis/vereinf/wfs`

**Frage:** Leitet dieser Service zu einer Login-Seite um oder zu einem anderen WFS-Endpunkt?

## Technische Details

**Unser HTTP-Client:**
- User-Agent: `WFS-Catalog-Scanner/1.0`
- Timeout: 15 Sekunden
- Folgt Redirects: Ja (automatisch)
- GetCapabilities-Request: `GET {url}?service=WFS&request=GetCapabilities`

**Erfolgreiche Services (zum Vergleich):**
- WFS MV ALKIS SimpleFeature: `https://www.geodaten-mv.de/dienste/alkis_wfs_sf`
- INSPIRE-WFS Baden-Württemberg: `https://owsproxy.lgl-bw.de/owsproxy/wfs/WFS_INSP_BW_Flst_ALKIS?service=WFS&request=GetCapabilities`

## Hauptfragen für Perplexity

1. **Sind HTTP 400-Fehler bei WFS GetCapabilities normal?** Oder fehlt ein spezifischer Query-Parameter?

2. **Warum verlangen manche WFS-Services Authentifizierung für GetCapabilities?** Das widerspricht dem WFS-Standard.

3. **Sind die URLs korrekt formatiert?** Besonders bei ArcGIS-basierten Services.

4. **Gibt es alternative URLs oder Endpunkte** für die fehlgeschlagenen Services?

5. **Wie sollten wir mit Redirects umgehen?** Besonders bei Metadaten-Katalogen.

6. **Sind die DNS-Probleme temporär oder permanent?** Gibt es alternative Hostnamen?

7. **Welche HTTP-Header oder Query-Parameter** könnten die Erfolgsrate verbessern?

## Erwartetes Ergebnis
Wir suchen nach:
- Korrekte URLs für die fehlgeschlagenen Services
- Alternative Endpunkte oder Metadaten-Quellen
- Best Practices für WFS GetCapabilities-Abfragen
- Mögliche Verbesserungen unseres HTTP-Clients

## Lösung und Ergebnisse

**Externe Analyse durch Perplexity:** Die Analyse führte zu konkreten Lösungen für 19 problematische URLs.

**Implementierte Korrekturen:**
- URL-Korrekturen für ArcGIS-basierte Services
- Hinzufügung fehlender `version` Parameter
- Status-Updates für nicht verfügbare Services
- Verbesserung der Erfolgsquote von 51% auf 81%

**Nächste Schritte:**
- HTTP-Client mit User-Agent-Rotation und Version-Probing verbessern
- Langfristige Lösung: OGC Catalog Service for the Web (CSW) für dynamische Service-Entdeckung
