# Perplexity-Recherche: Aktuelle WFS-URLs für Berlin und NRW Flurstück-Daten

## Problemstellung
Wir haben eine WFS-Datenbank mit deutschen Geodiensten und stellen fest, dass Berlin und Nordrhein-Westfalen (NRW) - zwei der fortschrittlichsten Bundesländer bei Open Data - als "nicht verfügbar" markiert sind. Das widerspricht unserem Wissen über deren Open Data-Politik.

## Aktuelle Situation in unserer Datenbank

### Berlin - Alle Services inaktiv:
- `https://gdi.berlin.de/services/wfs/alkis` - "Dienst ist laut Analyse nicht mehr verfügbar"
- `https://gdi.berlin.de/services/wfs/alkis_gebaeude` - "Dienst ist laut Analyse nicht mehr verfügbar"

### NRW - Service funktioniert nicht richtig:
- `https://www.wfs.nrw.de/geobasis/wfs_nw_alkis_vereinfacht` - HTTP 200 aber 0 Layer gefunden

## Fragestellung für Perplexity

**"Berlin und Nordrhein-Westfalen sind bekannt für ihre fortschrittliche Open Data-Politik und sollten definitiv funktionierende WFS-Services für Flurstück-Daten (ALKIS) haben. Ich suche nach den aktuellen, funktionierenden WFS-GetCapabilities-URLs für:**

### Berlin:
- Aktuelle WFS-Services für ALKIS/Flurstück-Daten
- Neue URLs falls die alten `gdi.berlin.de` Services eingestellt wurden
- Alternative Endpunkte oder Portale

### Nordrhein-Westfalen:
- Funktionierende WFS-URLs für ALKIS-Daten
- Warum `https://www.wfs.nrw.de/geobasis/wfs_nw_alkis_vereinfacht` keine Layer zurückgibt
- Alternative Services oder korrekte Parameter

**Bitte suche nach:**
1. **Offiziellen WFS-Services** der Landesvermessungsämter
2. **Open Data-Portalen** mit WFS-Endpunkten
3. **Aktuellen GetCapabilities-URLs** die funktionieren
4. **Möglichen URL-Änderungen** oder Migrationen
5. **Spezifischen Parametern** die für diese Services benötigt werden

**Ziel:** Die korrekten, aktuellen WFS-URLs finden, damit wir die Flurstück-Daten für Berlin und NRW in unserer Datenbank verfügbar machen können."**

## Erwartetes Ergebnis
- Aktuelle, funktionierende WFS-URLs für Berlin und NRW
- Erklärung warum die alten URLs nicht mehr funktionieren
- Spezifische Parameter oder URL-Strukturen die benötigt werden
- Links zu offiziellen Dokumentationen oder Portalen

## Verwendung
Die gefundenen URLs werden in unsere WFS-Datenbank eingetragen und getestet, um die Flurstück-Verfügbarkeit für diese wichtigen Bundesländer wiederherzustellen.