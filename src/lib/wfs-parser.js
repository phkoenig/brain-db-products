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
            // Schritt 1: Frühzeitige Prüfung auf INSPIRE-Konformität anhand des Roh-XML
            const isInspire = this._checkForInspireCompliance(xml);

            const parsedObj = this.parser.parse(xml);
            const serviceIdentification = this._extractServiceIdentification(parsedObj);
            const serviceProvider = this._extractServiceProvider(parsedObj);
            const operationsMetadata = this._extractOperationsMetadata(parsedObj);
            const layers = this._extractLayers(parsedObj);

            return {
                success: true,
                service: {
                    ...serviceIdentification,
                    ...serviceProvider,
                    ...operationsMetadata,
                    isInspire: isInspire // Das Ergebnis der Prüfung hinzufügen
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
     * Prüft das rohe XML auf Schlüsselindikatoren für INSPIRE-Konformität.
     * Dies ist oft zuverlässiger als das geparste Objekt, da es Namespaces direkt prüft.
     * @private
     */
    _checkForInspireCompliance(xmlString) {
        if (!xmlString || typeof xmlString !== 'string') {
            return false;
        }
        
        // ERWEITERTE INSPIRE-Erkennung
        const inspireIndicators = [
            'inspire.ec.europa.eu',
            'inspire.jrc.ec.europa.eu',
            'inspire-directive',
            'INSPIRE',
            'xmlns:inspire',
            'inspire:',
            'inspire_common',
            'inspire_vs',
            'inspire_dls'
        ];
        
        return inspireIndicators.some(indicator => 
            xmlString.includes(indicator)
        );
    }

    /**
     * Extrahiert die ServiceIdentification-Informationen (Titel, Abstract, Version).
     * @private
     */
    _extractServiceIdentification(parsedObj) {
        const serviceIdPath = this._findPath(parsedObj, 'ServiceIdentification');
        if (!serviceIdPath) return {};

        // Umgang mit multiplen Versionsnummern (z.B. "1.1.0, 2.0.0")
        let versions = serviceIdPath.ServiceTypeVersion || '';
        if (versions && typeof versions === 'string' && versions.includes(',')) {
            versions = versions.split(',').map(v => v.trim()); // Alle Versionen als Array zurückgeben
        } else if (versions) {
            versions = [versions]; // Einzelne Version in ein Array packen
        } else {
            versions = []; // Leeres Array, wenn nichts gefunden wird
        }

        return {
            title: serviceIdPath.Title || '',
            abstract: serviceIdPath.Abstract || '',
            versions: versions, // Umbenannt von version zu versions
        };
    }

    /**
     * Extrahiert die OperationsMetadata-Informationen (verfügbare Formate etc.).
     * @private
     */
    _extractOperationsMetadata(parsedObj) {
        const operationsPath = this._findPath(parsedObj, 'OperationsMetadata');
        if (!operationsPath) return { outputFormats: [] };

        // Absicherung für den Fall, dass 'Operation' kein Array ist
        const operations = Array.isArray(operationsPath.Operation) 
            ? operationsPath.Operation 
            : [operationsPath.Operation].filter(Boolean);

        const getFeatureOp = operations.find(op => op && op['@_name'] === 'GetFeature');
        if (!getFeatureOp) return { outputFormats: [] };
        
        // Absicherung für den Fall, dass 'Parameter' nicht existiert oder kein Array ist
        const parameters = getFeatureOp.Parameter ? (Array.isArray(getFeatureOp.Parameter) 
            ? getFeatureOp.Parameter 
            : [getFeatureOp.Parameter]) : [];

        const outputFormatParam = parameters.find(p => p && p['@_name'] === 'outputFormat');
        if (!outputFormatParam) return { outputFormats: [] };

        const formats = outputFormatParam.AllowedValues?.Value || outputFormatParam.Value || [];
        return {
            outputFormats: Array.isArray(formats) ? formats : [formats]
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
            // ERWEITERT: Keywords und INSPIRE-Metadaten extrahieren
            keywords: this._extractKeywords(ft),
            inspireThemeCodes: this._extractInspireThemeCodes(ft),
            geometryType: this._extractGeometryType(ft),
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
     * Extrahiert Keywords/Schlüsselwörter aus verschiedenen XML-Elementen
     * @private
     */
    _extractKeywords(featureType) {
        const keywords = [];
        
        // Standard Keywords-Element
        if (featureType.Keywords) {
            if (Array.isArray(featureType.Keywords)) {
                keywords.push(...featureType.Keywords);
            } else if (typeof featureType.Keywords === 'string') {
                keywords.push(featureType.Keywords);
            } else if (featureType.Keywords.Keyword) {
                const keywordData = featureType.Keywords.Keyword;
                if (Array.isArray(keywordData)) {
                    keywords.push(...keywordData);
                } else {
                    keywords.push(keywordData);
                }
            }
        }
        
        // INSPIRE Keywords (oft in MetadataURL oder ExtendedCapabilities)
        if (featureType.MetadataURL) {
            const metadataUrls = Array.isArray(featureType.MetadataURL) 
                ? featureType.MetadataURL 
                : [featureType.MetadataURL];
            
            metadataUrls.forEach(url => {
                if (url && typeof url === 'string' && url.includes('inspire')) {
                    keywords.push('INSPIRE');
                }
            });
        }
        
        return keywords.filter(k => k && typeof k === 'string' && k.trim().length > 0);
    }

    /**
     * Extrahiert INSPIRE Theme Codes aus verschiedenen Quellen
     * @private
     */
    _extractInspireThemeCodes(featureType) {
        const themeCodes = [];
        
        // Suche nach INSPIRE Theme Codes in verschiedenen Elementen
        const searchPaths = [
            'inspire_theme',
            'InspireTheme',
            'ThemeCode',
            'inspire:theme',
            'inspire_theme_code'
        ];
        
        searchPaths.forEach(path => {
            const value = this._findValueInObject(featureType, path);
            if (value) {
                if (Array.isArray(value)) {
                    themeCodes.push(...value);
                } else {
                    themeCodes.push(value);
                }
            }
        });
        
        // INSPIRE Standard Theme Codes basierend auf Name/Title ableiten
        const nameTitle = `${featureType.Name || ''} ${featureType.Title || ''}`.toLowerCase();
        
        if (nameTitle.includes('cadastral') || nameTitle.includes('flur')) {
            themeCodes.push('cp'); // Cadastral Parcels
        }
        if (nameTitle.includes('building') || nameTitle.includes('gebäude')) {
            themeCodes.push('bu'); // Buildings
        }
        if (nameTitle.includes('hydr') || nameTitle.includes('wasser') || nameTitle.includes('gewässer')) {
            themeCodes.push('hy'); // Hydrography
        }
        if (nameTitle.includes('transport') || nameTitle.includes('verkehr') || nameTitle.includes('straß')) {
            themeCodes.push('tn'); // Transport Networks
        }
        if (nameTitle.includes('address') || nameTitle.includes('adresse')) {
            themeCodes.push('ad'); // Addresses
        }
        
        return [...new Set(themeCodes)]; // Duplikate entfernen
    }

    /**
     * Extrahiert Geometrietyp aus verschiedenen Quellen
     * @private
     */
    _extractGeometryType(featureType) {
        // Direkte Geometry-Type Angaben
        if (featureType.GeometryType) return featureType.GeometryType;
        if (featureType.geometryType) return featureType.geometryType;
        
        // Aus Name/Title ableiten
        const nameTitle = `${featureType.Name || ''} ${featureType.Title || ''}`.toLowerCase();
        
        if (nameTitle.includes('point') || nameTitle.includes('punkt')) return 'Point';
        if (nameTitle.includes('line') || nameTitle.includes('linie') || nameTitle.includes('straß')) return 'LineString';
        if (nameTitle.includes('polygon') || nameTitle.includes('fläche') || nameTitle.includes('gebäude') || nameTitle.includes('flur')) return 'Polygon';
        if (nameTitle.includes('multi')) return 'MultiGeometry';
        
        return null;
    }

    /**
     * Hilfsfunktion zum Finden von Werten in verschachtelten Objekten
     * @private
     */
    _findValueInObject(obj, searchKey) {
        if (!obj || typeof obj !== 'object') return null;
        
        // Direkte Suche
        if (obj[searchKey]) return obj[searchKey];
        
        // Rekursive Suche
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (key.toLowerCase().includes(searchKey.toLowerCase())) {
                    return obj[key];
                }
                
                if (typeof obj[key] === 'object') {
                    const result = this._findValueInObject(obj[key], searchKey);
                    if (result) return result;
                }
            }
        }
        
        return null;
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

    /**
     * Hilfsfunktion zum Finden eines Pfads in einem geparsten XML-Objekt.
     * @private
     */
    _findPath(obj, path) {
        if (typeof obj === 'object' && obj !== null) {
            if (obj[path]) {
                return obj[path];
            }
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const result = this._findPath(obj[key], path);
                    if (result) {
                        return result;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Intelligente Kategorisierung basierend auf Name, Title und Abstract
     * @param {object} layer - Layer-Objekt mit name, title, abstract
     * @returns {string|null} - Kategorisierung
     */
    categorizeLayer(layer) {
        const { name = '', title = '', abstract = '' } = layer;
        const searchText = `${name} ${title} ${abstract}`.toLowerCase();
        
        // Flurstücke / Cadastral Parcels
        if (this._matchesCategory(searchText, [
            'flur', 'cadastral', 'parcel', 'grundstück', 'parzell', 
            'kataster', 'liegenschaft', 'ax_flurstueck'
        ])) {
            return 'Flurstücke';
        }
        
        // Gebäudeumrisse / Buildings
        if (this._matchesCategory(searchText, [
            'gebäude', 'building', 'bauwerk', 'bau_', 'house', 
            'construction', 'ax_gebaeude', 'bu_building'
        ])) {
            return 'Gebäudeumrisse';
        }
        
        // Adressen / Addresses
        if (this._matchesCategory(searchText, [
            'address', 'adresse', 'anschrift', 'hausnummer', 
            'straße', 'street', 'ad_address'
        ])) {
            return 'Adressen';
        }
        
        // Straßennetz / Transport Networks
        if (this._matchesCategory(searchText, [
            'straße', 'street', 'road', 'weg', 'verkehr', 'transport', 
            'autobahn', 'highway', 'tn_', 'verkehrsnetz'
        ])) {
            return 'Straßennetz';
        }
        
        // Gewässernetz / Hydrography
        if (this._matchesCategory(searchText, [
            'wasser', 'gewässer', 'fluss', 'bach', 'see', 'teich', 
            'hydro', 'water', 'river', 'lake', 'hy_'
        ])) {
            return 'Gewässernetz';
        }
        
        // Verwaltungsgrenzen / Administrative Units
        if (this._matchesCategory(searchText, [
            'grenze', 'boundary', 'verwaltung', 'gemeinde', 'kreis', 
            'bezirk', 'administrative', 'au_'
        ])) {
            return 'Verwaltungsgrenzen';
        }
        
        // Schutzgebiete / Protected Sites
        if (this._matchesCategory(searchText, [
            'schutz', 'protected', 'natura', 'naturschutz', 'landschaftsschutz', 
            'ps_', 'conservation'
        ])) {
            return 'Schutzgebiete';
        }
        
        // Bodennutzung / Land Use
        if (this._matchesCategory(searchText, [
            'nutzung', 'landuse', 'boden', 'fläche', 'usage', 
            'lu_', 'corine'
        ])) {
            return 'Bodennutzung';
        }
        
        return null; // Keine Kategorisierung gefunden
    }
    
    /**
     * Hilfsfunktion für Kategorie-Matching
     * @private
     */
    _matchesCategory(searchText, keywords) {
        return keywords.some(keyword => 
            searchText.includes(keyword.toLowerCase())
        );
    }
}

module.exports = { WFSCapabilitiesParser };
