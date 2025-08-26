const { XMLParser } = require('fast-xml-parser');

/**
 * Ein robuster WFS-GetCapabilities Parser, der XML in ein JavaScript-Objekt umwandelt
 * und die Daten strukturiert extrahiert, anstatt Regex zu verwenden.
 * 
 * Basiert auf dem empfohlenen Vorgehen, zuerst vollständig zu parsen und dann
 * das resultierende Objekt zu durchsuchen.
 */
class WFSCapabilitiesParser {
    constructor() {
        // Konfiguriert den Parser, um Namespaces zu ignorieren und Attribute zu erfassen
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            removeNSPrefix: true, // Vereinfacht den Zugriff, indem es Präfixe wie 'wfs:' entfernt
        });
    }

    /**
     * Parst einen XML-String und extrahiert Layer- und Service-Informationen.
     * @param {string} xml - Der rohe GetCapabilities XML-String.
     * @returns {object} Ein Objekt mit den extrahierten Daten oder einem Fehler.
     */
    parse(xml) {
        try {
            const parsedObj = this.parser.parse(xml);
            const serviceIdentification = this._extractServiceIdentification(parsedObj);
            const serviceProvider = this._extractServiceProvider(parsedObj);
            const layers = this._extractLayers(parsedObj);

            return {
                success: true,
                service: {
                    ...serviceIdentification,
                    ...serviceProvider
                },
                layers: layers,
                layerCount: layers.length,
            };
        } catch (error) {
            return {
                success: false,
                error: `XML-Parsing fehlgeschlagen: ${error.message}`,
            };
        }
    }

    /**
     * Extrahiert die ServiceIdentification-Informationen (Titel, Abstract, Version).
     * @private
     */
    _extractServiceIdentification(parsedObj) {
        const serviceId = parsedObj?.WFS_Capabilities?.ServiceIdentification || parsedObj?.ServiceIdentification || {};
        return {
            title: serviceId.Title,
            abstract: serviceId.Abstract,
            version: serviceId.ServiceTypeVersion
        };
    }

    /**
     * Extrahiert die ServiceProvider-Informationen (Anbieter).
     * @private
     */
    _extractServiceProvider(parsedObj) {
        const provider = parsedObj?.WFS_Capabilities?.ServiceProvider || parsedObj?.ServiceProvider || {};
        return {
            providerName: provider.ProviderName,
            providerSite: provider.ProviderSite ? (provider.ProviderSite['@_href'] || provider.ProviderSite) : null
        };
    }

    /**
     * Extrahiert die Layer-Informationen aus dem geparsten Objekt.
     * Diese Funktion sucht flexibel nach dem FeatureTypeList.
     * @private
     */
    _extractLayers(parsedObj) {
        // Finde den FeatureTypeList, egal ob er auf der obersten Ebene oder innerhalb von WFS_Capabilities liegt
        const featureTypeList = parsedObj?.WFS_Capabilities?.FeatureTypeList || parsedObj?.FeatureTypeList || null;

        if (!featureTypeList) {
            return [];
        }
        
        // Hole die FeatureType-Einträge
        let featureTypes = featureTypeList.FeatureType;

        if (!featureTypes) {
            return [];
        }

        // Stelle sicher, dass wir immer ein Array haben, auch wenn nur ein Layer vorhanden ist
        if (!Array.isArray(featureTypes)) {
            featureTypes = [featureTypes];
        }

        // Mappe die Layer-Daten in ein sauberes Format
        return featureTypes.map(ft => ({
            name: ft.Name,
            title: ft.Title,
            abstract: ft.Abstract,
            defaultCRS: ft.DefaultCRS || ft.SRS,
            bbox: this._extractLayerBBox(ft),
            // NEU: Extrahiere auch weitere CRS und Output-Formate pro Layer
            otherCRS: this._extractCRSList(ft.OtherCRS),
            outputFormats: this._extractFormatList(ft.OutputFormat),
        })).filter(layer => layer.name); // Gib nur Layer mit einem Namen zurück
    }

    /**
     * Hilfsfunktion zum Extrahieren von CRS-Listen
     * @private
     */
    _extractCRSList(crsData) {
        if (!crsData) return [];
        if (Array.isArray(crsData)) return crsData;
        return [crsData];
    }

    /**
     * Hilfsfunktion zum Extrahieren von Format-Listen
     * @private
     */
    _extractFormatList(formatData) {
        if (!formatData) return [];
        if (Array.isArray(formatData)) return formatData;
        return [formatData];
    }

    /**
     * Extrahiert die BoundingBox für einen einzelnen Layer.
     * @private
     */
    _extractLayerBBox(featureType) {
        if (featureType.WGS84BoundingBox) {
            return {
                lower: featureType.WGS84BoundingBox.LowerCorner,
                upper: featureType.WGS84BoundingBox.UpperCorner,
                crs: 'EPSG:4326'
            };
        }
        if (featureType["@_minx"]) { // ArcGIS-Format mit LatLongBoundingBox als Attribute
             return {
                lower: [featureType["@_minx"], featureType["@_miny"]],
                upper: [featureType["@_maxx"], featureType["@_maxy"]],
                crs: 'EPSG:4326'
             }
        }
        return null;
    }
}

module.exports = { WFSCapabilitiesParser };
