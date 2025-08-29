# Perplexity-Antwort: Aktuelle WFS-URLs für Berlin und NRW

## Berlin – ALKIS/Flurstück WFS-Services

### Offizielle WFS-Endpunkte:
- **ALKIS Flurstücke:** `https://gdi.berlin.de/services/wfs/alkis?REQUEST=GetCapabilities&SERVICE=WFS`
- **Gebäudedaten:** `https://gdi.berlin.de/services/wfs/alkis_gebaeude?REQUEST=GetCapabilities&SERVICE=WFS`
- **Ortsteile:** `https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_alkis_ortsteile?REQUEST=GetCapabilities&SERVICE=WFS`

### Status:
- **Migration nicht erfolgt** - gdi.berlin.de Services sind weiterhin in Betrieb
- **Regelmäßige Updates** - URLs werden aktualisiert
- **Open Data Portal** - Daten.Berlin-Portal verfügbar

## Nordrhein-Westfalen – ALKIS/Flurstück WFS-Services

### Aktuelle WFS-Endpunkte:
- **INSPIRE Flurstücke/ALKIS:** `https://www.wfs.nrw.de/geobasis/wfs_nw_inspire-flurstuecke_alkis?REQUEST=GetCapabilities&SERVICE=WFS`
- **Vereinfachtes ALKIS (mit Registrierung):** `https://lv.geosec.nrw.de/wss/service/wfs_nw_alkis_vereinfacht_eig_csv/httpauth?REQUEST=GetCapabilities&SERVICE=WFS`

### Problem-Analyse:
- **Alte URL funktioniert nicht:** `wfs_nw_alkis_vereinfacht` gibt keine Layer zurück
- **Grund:** Service umgestellt oder abgeschaltet
- **Lösung:** INSPIRE-URL verwenden

## Spezifische Parameter

### Basis-Parameter:
```
?REQUEST=GetCapabilities&SERVICE=WFS
```

### INSPIRE-Services:
- **Keine Authentifizierung** erforderlich
- **Flurstücke, Fluren, Gemarkungen** verfügbar
- **Vierteljährliche Updates**

### Authentifizierung:
- **Vereinfachte ALKIS-Dienste:** Registrierung für CSV-Export nötig
- **INSPIRE-Dienste:** Offen nutzbar

## Nächste Schritte
1. Neue URLs in Datenbank eintragen
2. GetCapabilities-Tests durchführen
3. Layer-Extraktion testen
4. Status auf "aktiv" setzen