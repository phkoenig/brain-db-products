APS Viewer v7 ACC Integration (Next.js/React)
Voraussetzungen
ACC (BIM 360) Projekt mit Revit/DWG/IFC Cloud Modellen

3-legged OAuth mit mindestens data:read und viewables:read Scopes

Autodesk Viewer SDK v7+ immer als CDN-Script einbinden, nie als NPM Package

Quick Facts – Was funktioniert (und was nicht)?
ACC übersetzt Modelle automatisch – ein manueller Übersetzungsjob via Model Derivative API ist für Cloud-Dateien nicht erlaubt und schlägt fehl

Die viewer-ready URN ist direkt derivatives.data.id aus der ACC API (sie ist schon base64-codiert!)

Kein manifest-query, keine lineage+version+region+base64 Eigenverarbeitung nötig – ACC liefert alles fertig

Document.load benötigt die base64-URN (Prefix „urn:“ ggf. anfügen, wenn noch nicht enthalten)

Viewer-SDK sendet Requests nur, wenn es korrekt konfiguriert ist, direkt an Autodesk-Cloud (niemals an localhost!)

Typische Fehlerquellen & Lösungen
Problem	Lösung
Viewer macht Requests an localhost	Lade den Viewer ausschließlich aus dem CDN, keine eigenen Routing-Regeln für /URN
Falscher URN-Typ (lineage, version)	Immer derivatives.data.id aus ACC verwenden
Model Derivative „missing design“	Keine manuelle Übersetzung von ACC-Modellen – nicht unterstützt
404 beim Laden	Prüfe, ob URN tatsächlich mit vorhandener Version und aus „derivatives.data.id“
401/403 Manifest/API-Error	OAuth-Token, Scopes, Dateiberechtigungen kontrollieren
Viewer bleibt weiß	Netzwerk-Tab: Nur Calls zu developer.api.autodesk.com dürfen ausgeführt werden
Minimalbeispiel APS Viewer v7 Integration
typescript
// In _document.js/_app.js Head:
<script src="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js"></script>

// Im Code:
const options = {
  env: 'AutodeskProduction2',    // Für SVF2
  api: 'streamingV2',
  getAccessToken: (onSuccess) => { onSuccess(accessToken, 3600); }
};

window.Autodesk.Viewing.Initializer(options, () => {
  const viewer = new window.Autodesk.Viewing.GuiViewer3D(viewerRef.current);
  viewer.start();
  window.Autodesk.Viewing.Document.load(
    derivativesUrn, // base64-URN aus ACC derivatives.data.id!
    { env: 'AutodeskProduction2', api: 'streamingV2' },
    onSuccess,
    onError
  );
});
Hinweise & Best Practices
Viewer SDK nie als statischen Import/NPM machen – immer CDN!

Keine Proxy/API/...-Route für /URN auf dem eigenen Server bereitstellen

Vercel ist kompatibel – solange keine eigenen Rewrite-Rules Requests auf /base64-URN intercepten

Fehleranalyse immer über DevTools-Netzwerk: Calls müssen nach https://developer.api.autodesk.com/modelderivative/... laufen

Zusammenfassung
Niemals lineage/version-URN eigen base64-encoden

Immer derivatives.data.id (bereits base64)

Viewer-Konfiguration ausschließlich „AutodeskProduction2“ + „streamingV2“ für ACC SVF2

SDK aus CDN, Frontend muss keine eigenen Handler/Proxies bieten

Bei Problemen: Netzwerk-Requests und URN im Log checken

## Zusätzliche Learnings aus der Praxis (Wichtig)

- Externe SDK-Einbindung ist kritisch:
  - Das Viewer-SDK MUSS als echtes externes `<script>` im `<head>` geladen werden (CDN) – nicht dynamisch per `document.createElement` und nicht via `import`/`require`/NPM.
  - In Next.js das Script im `app/layout.tsx` (Head) platzieren; kein SSR-Bundling. Optional `crossOrigin="anonymous"` und `defer` setzen.
  - Wenn das SDK versehentlich gebundled/umgeschrieben wird, schickt der Viewer Requests an `http://localhost:3000/<URN>` statt zur Autodesk Cloud.

- Initialisierung nur im Browser und mit Timing-Check:
  - Vor `Initializer` und `Document.load` prüfen: `typeof window !== 'undefined' && window.Autodesk && window.Autodesk.Viewing`.
  - Bei Bedarf eine kurze Retry-Schleife (100ms) bis `window.Autodesk.Viewing` vorhanden ist.

- Document.load korrekte documentId:
  - Übergib die Base64-URN aus ACC (`derivatives.data.id`).
  - Wenn erforderlich, mit Präfix `"urn:"` aufrufen: `Document.load('urn:' + base64Urn, ...)`.
  - Keine lokale Proxy-/Rewrite-Route für URNs – niemals `/{base64Urn}` über eigene Next.js-API bedienen.

- Events und Loader-Handling:
  - Spinner erst beenden, wenn Geometrie fertig: auf `GEOMETRY_LOADED_EVENT` bzw. `MODEL_COMPLETED_EVENT` hören.
  - Beim Laden einer bestimmten View (z. B. "KP-AXO-ZZ") anschließend – falls vorhanden – automatisch auf eine Phasen-View (z. B. "Nachnutzung") umschalten.

- Revit-Phasen im Viewer:
  - Der Viewer hat kein API, um Revit-Phasen zu togglen. Phasen kommen aus der in Revit gespeicherten Ansicht.
  - Lösung: Entweder in Revit die Ziel-Ansicht mit gewünschter Phase veröffentlichen oder im Viewer auf eine eigene Ansicht "Nachnutzung" umschalten.

- Häufige Stolpersteine und Quick-Fixes:
  - "Viewer lädt von localhost": CDN-Script verifizieren (DevTools > Sources). Es muss von `developer.api.autodesk.com` kommen.
  - 404/400 bei Manifest/Translate: Für ACC-Cloud-Modelle niemals manuell übersetzen; stattdessen `ACCDerivativeFinder`/`/api/acc/derivatives` nutzen und direkt `derivatives.data.id` verwenden.
  - 401 bei Manifest: Token-Scopes prüfen (`data:read`, `viewables:read`) und Region-Header nur da nutzen, wo erforderlich.

- Minimal-Checkliste vor dem Deploy:
  1) `<script src="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js">` im `<head>` vorhanden?
  2) Keine Next.js Rewrites/Proxies, die Base64-URNs intercepten?
  3) `Initializer({ env: 'AutodeskProduction2', api: 'streamingV2' })` verwendet?
  4) `Document.load('urn:' + base64Urn, onSuccess, onError)`?
  5) Loader schließt auf `GEOMETRY_LOADED_EVENT`?
  6) Bei Bedarf Auto-Umschalten auf View "Nachnutzung" implementiert?