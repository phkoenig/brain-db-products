/**
 * WFS URL Validator - Dreistufige Validierung
 * 
 * 1. URL-Syntax prüfen
 * 2. Server-Erreichbarkeit prüfen
 * 3. XML-Antwort validieren
 */

const { URL } = require('url');
const https = require('https');
const http = require('http');

class WFSURLValidator {
  constructor() {
    this.validationResults = {
      url_syntax_valid: false,
      server_reachable: false,
      xml_response_valid: false,
      validation_notes: [],
      last_validation_check: new Date().toISOString()
    };
  }

  /**
   * Stufe 1: Vollständige GetCapabilities-URL validieren
   */
  validateGetCapabilitiesURL(url) {
    try {
      const urlObj = new URL(url);
      
      // Prüfe, ob es sich um HTTP/HTTPS handelt
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        this.validationResults.validation_notes.push('Protokoll muss HTTP oder HTTPS sein');
        return false;
      }

      // Prüfe, ob Hostname vorhanden ist
      if (!urlObj.hostname) {
        this.validationResults.validation_notes.push('Kein gültiger Hostname');
        return false;
      }

      // Prüfe, ob WFS-spezifische Parameter vorhanden sind (Groß-/Kleinschreibung ignorieren)
      const params = urlObj.searchParams;
      const hasService = params.has('service') && params.get('service').toUpperCase() === 'WFS';
      const hasRequest = params.has('request') && params.get('request').toUpperCase() === 'GETCAPABILITIES';

      if (!hasService || !hasRequest) {
        this.validationResults.validation_notes.push('URL muss service=WFS und request=GetCapabilities enthalten');
        return false;
      }

      this.validationResults.url_syntax_valid = true;
      this.validationResults.validation_notes.push('URL-Syntax ist gültig');
      return true;

    } catch (error) {
      this.validationResults.validation_notes.push(`URL-Syntax-Fehler: ${error.message}`);
      return false;
    }
  }

  /**
   * Erstellt die vollständige GetCapabilities-URL aus der Stamm-URL.
   */
  buildGetCapabilitiesURL(baseUrl) {
    try {
        // Normalisiere die URL, um sicherzustellen, dass sie keine Query-Parameter hat
        const urlObj = new URL(baseUrl);
        let cleanUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
        
        // Entferne eventuelle Trailing Slashes
        if (cleanUrl.endsWith('/')) {
            cleanUrl = cleanUrl.slice(0, -1);
        }
        
        // Füge die Standard-WFS-Parameter hinzu
        return `${cleanUrl}?service=WFS&request=GetCapabilities`;
    } catch (error) {
        return null;
    }
  }

  /**
   * Stufe 2: Server-Erreichbarkeit prüfen
   */
  async validateServerReachability(url) {
    if (!this.validationResults.url_syntax_valid) {
      this.validationResults.validation_notes.push('Server-Erreichbarkeit kann nicht geprüft werden (URL-Syntax ungültig)');
      return false;
    }

    try {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      
      return new Promise((resolve) => {
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || (isHttps ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: 'HEAD', // Nur Header abfragen, nicht den kompletten Body
          timeout: 10000, // 10 Sekunden Timeout
          headers: {
            'User-Agent': 'WFS-URL-Validator/1.0'
          }
        };

        const client = isHttps ? https : http;
        const req = client.request(options, (res) => {
          // Server ist erreichbar, wenn wir eine Antwort bekommen
          this.validationResults.server_reachable = true;
          this.validationResults.validation_notes.push(`Server erreichbar (HTTP ${res.statusCode})`);
          resolve(true);
        });

        req.on('error', (error) => {
          this.validationResults.server_reachable = false;
          this.validationResults.validation_notes.push(`Server nicht erreichbar: ${error.message}`);
          resolve(false);
        });

        req.on('timeout', () => {
          req.destroy();
          this.validationResults.server_reachable = false;
          this.validationResults.validation_notes.push('Server-Timeout (10s)');
          resolve(false);
        });

        req.end();
      });

    } catch (error) {
      this.validationResults.server_reachable = false;
      this.validationResults.validation_notes.push(`Server-Erreichbarkeit-Fehler: ${error.message}`);
      return false;
    }
  }

  /**
   * Stufe 3: XML-Antwort validieren
   */
  async validateXMLResponse(url) {
    if (!this.validationResults.server_reachable) {
      this.validationResults.validation_notes.push('XML-Validierung kann nicht durchgeführt werden (Server nicht erreichbar)');
      return false;
    }

    try {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      
      return new Promise((resolve) => {
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || (isHttps ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: 'GET',
          timeout: 15000, // 15 Sekunden für XML-Download
          headers: {
            'User-Agent': 'WFS-URL-Validator/1.0',
            'Accept': 'application/xml, text/xml, */*'
          }
        };

        const client = isHttps ? https : http;
        const req = client.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
            // Begrenze die Datenmenge (max 1MB)
            if (data.length > 1024 * 1024) {
              req.destroy();
              this.validationResults.xml_response_valid = false;
              this.validationResults.validation_notes.push('XML-Response zu groß (>1MB)');
              resolve(false);
            }
          });

          res.on('end', () => {
            if (res.statusCode !== 200) {
              this.validationResults.xml_response_valid = false;
              this.validationResults.validation_notes.push(`HTTP ${res.statusCode}: Keine erfolgreiche Antwort`);
              resolve(false);
              return;
            }

            // Prüfe Content-Type
            const contentType = res.headers['content-type'] || '';
            if (!contentType.includes('xml') && !contentType.includes('text')) {
              this.validationResults.validation_notes.push(`Warnung: Content-Type ist nicht XML (${contentType})`);
            }

            // Prüfe, ob es sich um gültiges XML handelt
            if (this.isValidXML(data)) {
              this.validationResults.xml_response_valid = true;
              this.validationResults.validation_notes.push('XML-Response ist gültig');
              resolve(true);
            } else {
              this.validationResults.xml_response_valid = false;
              this.validationResults.validation_notes.push('XML-Response ist ungültig');
              resolve(false);
            }
          });
        });

        req.on('error', (error) => {
          this.validationResults.xml_response_valid = false;
          this.validationResults.validation_notes.push(`XML-Validierung-Fehler: ${error.message}`);
          resolve(false);
        });

        req.on('timeout', () => {
          req.destroy();
          this.validationResults.xml_response_valid = false;
          this.validationResults.validation_notes.push('XML-Validierung-Timeout (15s)');
          resolve(false);
        });

        req.end();
      });

    } catch (error) {
      this.validationResults.xml_response_valid = false;
      this.validationResults.validation_notes.push(`XML-Validierung-Exception: ${error.message}`);
      return false;
    }
  }

  /**
   * Einfache XML-Validierung
   */
  isValidXML(xmlString) {
    try {
      // Prüfe, ob der String mit XML-Deklaration oder Root-Element beginnt
      const trimmed = xmlString.trim();
      
      // Prüfe auf XML-Deklaration
      if (trimmed.startsWith('<?xml')) {
        return true;
      }
      
      // Prüfe auf WFS-spezifische Root-Elemente
      const wfsRoots = ['<wfs:WFS_Capabilities', '<WFS_Capabilities', '<wfs:FeatureType', '<FeatureType'];
      for (const root of wfsRoots) {
        if (trimmed.includes(root)) {
          return true;
        }
      }
      
      // Prüfe auf generische XML-Struktur
      if (trimmed.startsWith('<') && trimmed.includes('>')) {
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Führe alle drei Validierungsschritte durch
   */
  async validateWFSURL(baseUrl) {
    console.log(`🔍 Validiere Stamm-URL: ${baseUrl}`);

    // Erstelle die vollständige URL für die Tests
    const getCapabilitiesUrl = this.buildGetCapabilitiesURL(baseUrl);
    if (!getCapabilitiesUrl) {
      this.validationResults.validation_notes.push('Konnte keine gültige GetCapabilities-URL aus der Stamm-URL erstellen.');
      console.log('   ❌ Fehler beim Erstellen der GetCapabilities-URL');
      this.validationResults.url_syntax_valid = false;
      return this.getValidationResults();
    }
    console.log(`   --> Test-URL: ${getCapabilitiesUrl}`);
    
    // Stufe 1: Vollständige URL-Syntax prüfen
    console.log('   📋 Stufe 1: GetCapabilities-URL-Syntax prüfen...');
    const syntaxValid = this.validateGetCapabilitiesURL(getCapabilitiesUrl);
    
    if (!syntaxValid) {
      console.log('   ❌ GetCapabilities-URL-Syntax ungültig');
      return this.getValidationResults();
    }
    console.log('   ✅ GetCapabilities-URL-Syntax gültig');

    // Stufe 2: Server-Erreichbarkeit
    console.log('   📋 Stufe 2: Server-Erreichbarkeit prüfen...');
    const serverReachable = await this.validateServerReachability(getCapabilitiesUrl);
    
    if (!serverReachable) {
      console.log('   ❌ Server nicht erreichbar');
      return this.getValidationResults();
    }
    console.log('   ✅ Server erreichbar');

    // Stufe 3: XML-Response
    console.log('   📋 Stufe 3: XML-Response validieren...');
    const xmlValid = await this.validateXMLResponse(getCapabilitiesUrl);
    
    if (xmlValid) {
      console.log('   ✅ XML-Response gültig');
    } else {
      console.log('   ❌ XML-Response ungültig');
    }

    return this.getValidationResults();
  }

  /**
   * Gibt die Validierungsergebnisse zurück
   */
  getValidationResults() {
    return {
      ...this.validationResults,
      overall_valid: this.validationResults.url_syntax_valid && 
                    this.validationResults.server_reachable && 
                    this.validationResults.xml_response_valid
    };
  }

  /**
   * Setzt die Validierungsergebnisse zurück
   */
  reset() {
    this.validationResults = {
      url_syntax_valid: false,
      server_reachable: false,
      xml_response_valid: false,
      validation_notes: [],
      last_validation_check: new Date().toISOString()
    };
  }
}

module.exports = WFSURLValidator;
