# README: Robuste WFS GetCapabilities-Verarbeitung

Dieses Dokument beschreibt die etablierte Methode zur Verarbeitung von WFS (Web Feature Service) `GetCapabilities`-XML-Dokumenten im Projekt. Der Prozess ist darauf ausgelegt, mit der Vielfalt und den Inkonsistenzen realer Geodienste robust umzugehen.

## Kernstrategie: Vom XML-String zum JavaScript-Objekt

Der Schlüssel zum Erfolg liegt darin, nicht zu versuchen, den rohen XML-Text mit regulären Ausdrücken zu analysieren. Stattdessen wird ein zweistufiger Prozess verfolgt:

1.  **Vollständiges Parsen:** Das gesamte XML-Dokument wird mithilfe der Bibliothek `fast-xml-parser` in ein natives JavaScript-Objekt umgewandelt. Dies löst sofort alle Herausforderungen bezüglich Syntax, Namespaces und Verschachtelung.
2.  **Dynamische Navigation:** Anstatt nach festen Pfaden zu suchen, wird das resultierende Objekt flexibel durchsucht, um die benötigten Informationsblöcke (Service-Metadaten, Layer-Listen) zu finden.

Dieser Ansatz hat sich als extrem widerstandsfähig gegenüber den Unterschieden zwischen WFS-Versionen (z.B. 1.1.0 vs. 2.0.0) und herstellerspezifischen XML-Strukturen erwiesen.

## Implementierungsdetails

### 1. Der HTTP-Client (`/tests/wfs-http-client-test.js`)

-   **Intelligente Versionsaushandlung:** Der `WFSHTTPClient` versucht automatisch, die `GetCapabilities` mit mehreren gängigen WFS-Versionen (`2.0.0`, `1.1.0`, `1.0.0`) sowie ohne explizite Versionsangabe abzurufen. Er akzeptiert den ersten erfolgreichen XML-Response, was die Kompatibilität massiv erhöht.

### 2. Der Parser (`/src/lib/wfs-parser.js`)

-   **Zentrales Modul:** Die `WFSCapabilitiesParser`-Klasse ist das Herzstück der Verarbeitung.
-   **Namespace-Entfernung:** Bei der Konfiguration von `fast-xml-parser` wird die Option `removeNSPrefix: true` genutzt. Das vereinfacht den Zugriff auf die Daten erheblich, da wir nicht zwischen `wfs:Title` und `Title` unterscheiden müssen.
-   **Flexible Extraktionslogik:** Die Methoden zur Extraktion von Service- und Layer-Daten suchen an mehreren möglichen Stellen im Objektbaum nach den Informationen.

**Beispiel: Layer-Extraktion**

```javascript
// (Vereinfachter Auszug aus dem Parser)

_extractLayers(parsedObj) {
    // Finde den FeatureTypeList, egal ob er auf der obersten Ebene oder innerhalb von WFS_Capabilities liegt
    const featureTypeList = parsedObj?.WFS_Capabilities?.FeatureTypeList || parsedObj?.FeatureTypeList || null;

    if (!featureTypeList || !featureTypeList.FeatureType) {
        return [];
    }
    
    // Stelle sicher, dass wir immer ein Array haben
    let featureTypes = featureTypeList.FeatureType;
    if (!Array.isArray(featureTypes)) {
        featureTypes = [featureTypes];
    }

    // Mappe die Layer-Daten in ein sauberes Format
    return featureTypes.map(ft => ({
        name: ft.Name,
        title: ft.Title,
        abstract: ft.Abstract,
        // ... weitere Felder
    }));
}
```

### 3. Skripte zur Automatisierung

-   **Test-Skript (`/temp/test-parser-with-real-data.js`):** Dient zur schnellen Überprüfung des Parsers gegen eine Liste von URLs.
-   **Population-Skript (`/temp/populate-layers-and-update-streams.js`):** Nutzt den Parser, um die Ergebnisse der erfolgreichen Abfragen zu verarbeiten und die Tabellen `wfs_streams` (Metadaten-Update) und `wfs_layers` (neue Einträge) zu befüllen.

## Fazit

Dieser Ansatz stellt sicher, dass der WFS-Katalog zuverlässig mit einer Vielzahl von externen Diensten interagieren kann. Zukünftige Anpassungen sollten diesem Muster folgen: Immer zuerst das XML in ein Objekt umwandeln und dann strukturiert darauf zugreifen.
