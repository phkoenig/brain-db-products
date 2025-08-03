# Tests für BRAIN DB Products A

## Übersicht

Dieser Ordner enthält Tests für die Supabase-Datenbank-Integration des BRAIN DB Products A Projekts.

## Verfügbare Tests

### `supabase-products-test.js`

Ein umfassender Test für die `products` Tabelle in Supabase.

**Getestete Funktionalitäten:**
- ✅ **Datenbank-Verbindung** - Prüft die Verbindung zur Supabase-Datenbank
- ✅ **Daten lesen** - Zeigt aktuelle Produkte in der Datenbank an
- ✅ **Produkt erstellen** - Erstellt ein neues Test-Produkt mit allen Feldern
- ✅ **Produkt lesen** - Liest das erstellte Produkt wieder aus
- ✅ **Produkt aktualisieren** - Aktualisiert Felder des Produkts
- ✅ **Produkt löschen** - Löscht das Test-Produkt und verifiziert die Löschung
- ✅ **Spalten-Validierung** - Testet ungültige und gültige Spalten

**Test-Daten:**
- Vollständiges Produkt mit allen verfügbaren Feldern
- Realistische Test-Werte für alle Kategorien (PRODUKT_, PARAMETER_, DOKUMENTE_, HAENDLER_, ERFAHRUNG_, ERFASSUNG_)
- Automatische Bereinigung nach Tests

## Ausführung

```bash
# Test ausführen
node tests/supabase-products-test.js
```

## Datenbank-Struktur

Die `products` Tabelle hat folgende Hauptkategorien:

### PRODUKT_ Felder
- `produkt_kategorie` (Array)
- `produkt_hersteller`
- `produkt_name_modell`
- `produkt_produktlinie_serie`
- `produkt_code_id`
- `produkt_anwendungsbereich`
- `produkt_beschreibung`
- `produkt_hersteller_webseite`
- `produkt_hersteller_produkt_url`

### PARAMETER_ Felder
- `parameter_masse`
- `parameter_farbe`
- `parameter_hauptmaterial`
- `parameter_oberflaeche`
- `parameter_gewicht_pro_einheit`
- `parameter_feuerwiderstand`
- `parameter_waermeleitfaehigkeit`
- `parameter_u_wert`
- `parameter_schalldaemmung`
- `parameter_wasserbestaendigkeit`
- `parameter_dampfdiffusion`
- `parameter_einbauart`
- `parameter_wartung`
- `parameter_umweltzertifikat`

### DOKUMENTE_ Felder
- `dokumente_datenblatt`
- `dokumente_technisches_merkblatt`
- `dokumente_produktkatalog`
- `dokumente_weitere_dokumente`
- `dokumente_bim_cad_technische_zeichnungen`

### HAENDLER_ Felder
- `haendler_haendlername`
- `haendler_haendler_webseite`
- `haendler_haendler_produkt_url`
- `haendler_verfuegbarkeit`
- `haendler_einheit`
- `haendler_preis` (numeric)
- `haendler_preis_pro_einheit` (numeric)

### ERFAHRUNG_ Felder
- `erfahrung_einsatz_in_projekt`
- `erfahrung_muster_bestellt`
- `erfahrung_muster_abgelegt`
- `erfahrung_bewertung`
- `erfahrung_bemerkungen_notizen`

### ERFASSUNG_ Felder
- `erfassung_quell_url`
- `erfassung_erfassungsdatum` (timestamp)
- `erfassung_erfassung_fuer`
- `erfassung_extraktions_log`

## Testergebnisse

**Letzter Testlauf:** ✅ **ERFOLGREICH**

```
🧪 Starte Supabase Products Table Tests...

🔧 Test 1: Datenbank-Verbindung...
✅ Verbindung erfolgreich

➕ Test 3: Produkt erstellen...
✅ Produkt erfolgreich erstellt: Test-Produkt XYZ-1000 (ID: b13000ab-c75d-4d65-a2ce-406f769065fb)

📖 Test 4: Produkt lesen...
✅ Produkt erfolgreich gelesen: Test-Produkt XYZ-1000
   Hersteller: Test-Hersteller GmbH
   Preis: 29.99 €

✏️ Test 5: Produkt aktualisieren...
✅ Produkt erfolgreich aktualisiert: Test-Produkt XYZ-1000 (Aktualisiert)
   Neuer Preis: 39.99 €
   Neue Bewertung: Ausgezeichnet

🗑️ Test 6: Produkt löschen...
✅ Produkt erfolgreich gelöscht: b13000ab-c75d-4d65-a2ce-406f769065fb
✅ Löschung verifiziert

🔍 Test 7: Spalten-Validierung...
✅ Ungültige Spalte korrekt abgelehnt: Could not find the 'ungültige_spalte' column
✅ Gültige Spalten akzeptiert: Valid-Produkt
✅ Test-Produkt wieder gelöscht

✅ Alle Tests erfolgreich abgeschlossen!
```

## Hinweise

- **Keine echten Daten:** Alle Tests verwenden Test-Daten und werden automatisch bereinigt
- **Sichere Ausführung:** Tests können beliebig oft ausgeführt werden
- **Vollständige Abdeckung:** Testet alle CRUD-Operationen (Create, Read, Update, Delete)
- **Spalten-Validierung:** Prüft, dass ungültige Spalten korrekt abgelehnt werden

## Troubleshooting

Falls Tests fehlschlagen:

1. **Verbindung prüfen:** Sind die Supabase-Credentials korrekt?
2. **Datenbank prüfen:** Ist die `products` Tabelle verfügbar?
3. **Berechtigungen prüfen:** Hat der anonyme Key Schreibrechte?
4. **RLS prüfen:** Sind Row Level Security Policies korrekt konfiguriert? 