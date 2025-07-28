1. Übertragen der Daten aus der Supabase Tabelle "capture" (bereits implementiert)
2. Vorschlagen des Initialwertes für den "Capture for Country" Dropdown aufgrund der Endung der Primär-URL
3. User verändert ggf. Land, und clickt auf "Manufactuer" oder "Retailer"

4. HTML-Parsing der Webseite der Primär-URL, ausfüllen aller Felder in der Capture Seite, für die Information extrahierbar ist

5. Screenshot-Analyse mit OpenAI GPT 4o
   - Gegenprüfen der bisher Extrahierten Informationen, bei Konflikt und hoher Konfidenz: ersetzen
   - Ergänzen, falls zusätzliche Information gefunden werden konnte

6a. Falls "Retailer"
    -> Perplexity API: Ermittlung / Überprüfung von Name und URL des "Manufacturers"
    -> Perplexity API: Ermittlung ob beim Hersteller eine spezifische URL für das Produkt existiert (wenn ja, dann sind die Daten mit Hoher Konfidenz einzustufen)
    -> Perplexity API: Suche von weiteren "Retailern" mit Preisinformation, speichern in "Alternative Retailer" Feld mit Preisinfo (Name des Retailers als Link)

6b. Falls "Manufacturer"
    -> Ermittlung der Webseite des Manufacturers durch Extraktion aus der Primär-URL
    -> Perplexity API: Suche nach "Retailern" mit Preisinformation, speichern des wichtigsten Retailers mit allen Infos im Retailer-Block, und weitere Retailer im "Alternative Retailer" Feld mit Preisinfo (Name des Retailers als Link)``
