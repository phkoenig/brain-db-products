# Nextcloud REST API Authentifizierung Tests

Diese Test-Scripts helfen dabei, die Nextcloud REST-API-Authentifizierung zu testen und zu debuggen.

## 📁 Dateien

- `test-nextcloud-rest-auth.js` - Umfassender Test aller Authentifizierungsmethoden
- `test-nextcloud-simple.js` - Einfacher Schnelltest für grundlegende Funktionalität

## 🚀 Verwendung

### Voraussetzungen

1. **Node.js** installiert
2. **Dependencies** installiert:
   ```bash
   npm install dotenv node-fetch
   ```

3. **Environment-Variablen** in `.env.local` konfiguriert:
   ```env
   NEXTCLOUD_URL=https://your-nextcloud.com
   NEXTCLOUD_USERNAME=your-username
   NEXTCLOUD_PASSWORD=your-password
   ```

### Schnelltest ausführen

```bash
node temp/test-nextcloud-simple.js
```

### Umfassender Test ausführen

```bash
node temp/test-nextcloud-rest-auth.js
```

## 🔍 Getestete Endpoints

### OCS API Endpoints
- `/ocs/v1.php/cloud/users/current` - Benutzerinformationen
- `/ocs/v1.php/cloud/capabilities` - Server-Capabilities
- `/ocs/v2.php/cloud/users/current` - V2 API Benutzerinfo

### WebDAV Endpoints
- `/remote.php/dav/files/` - Root WebDAV
- `/remote.php/dav/files/{username}/` - Benutzer-Root
- `/remote.php/dav/files/{username}/ARCH` - Spezifischer Ordner

### Authentifizierungsmethoden
- HTTP Basic Auth mit normalem Passwort
- HTTP Basic Auth mit App-spezifischem Passwort
- Verschiedene Header-Kombinationen

## 📊 Erwartete Ergebnisse

### Erfolgreiche Authentifizierung
```
✅ Success! User info retrieved
✅ Success! Found 30 items in root folder
✅ Success! Found 15 items in ARCH folder
```

### Fehlgeschlagene Authentifizierung
```
❌ Failed: 401 Unauthorized
❌ Failed: 403 Forbidden
```

## 🔧 Troubleshooting

### Problem: 401 Unauthorized
**Lösung:**
- Überprüfe Benutzername und Passwort
- Verwende App-spezifisches Passwort statt Hauptpasswort
- Stelle sicher, dass 2FA deaktiviert ist oder App-Passwort verwendet wird

### Problem: 403 Forbidden
**Lösung:**
- Überprüfe Benutzerrechte in Nextcloud
- Stelle sicher, dass der Benutzer Zugriff auf die Ordner hat
- Überprüfe Nextcloud-App-Einstellungen

### Problem: HTML-Response statt XML
**Lösung:**
- Überprüfe die URL (sollte nicht zur Login-Seite weiterleiten)
- Stelle sicher, dass die Authentifizierung korrekt ist
- Überprüfe Nextcloud-Konfiguration

## 🛠️ App-spezifische Passwörter

Für bessere Sicherheit empfiehlt es sich, App-spezifische Passwörter zu verwenden:

1. **Nextcloud öffnen** → Profil → Sicherheit
2. **"App-Passwort erstellen"** klicken
3. **Name eingeben** (z.B. "BRAIN DB Products API")
4. **Passwort kopieren** und in `.env.local` verwenden

## 📝 Logs interpretieren

### Erfolgreiche OCS API Response
```xml
<?xml version="1.0"?>
<ocs>
  <meta>
    <status>ok</status>
    <statuscode>100</statuscode>
    <message>OK</message>
  </meta>
  <data>
    <id>username</id>
    <display-name>User Name</display-name>
    <email>user@example.com</email>
  </data>
</ocs>
```

### Erfolgreiche WebDAV Response
```xml
<?xml version="1.0"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/remote.php/dav/files/username/</d:href>
    <d:propstat>
      <d:prop>
        <d:resourcetype><d:collection/></d:resourcetype>
        <d:getlastmodified>Mon, 05 Aug 2025 10:00:00 GMT</d:getlastmodified>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>
```

## 🔄 Integration in das Hauptprojekt

Nach erfolgreichen Tests können die gewonnenen Erkenntnisse in die Hauptimplementierung integriert werden:

1. **Authentifizierungsmethode** in `NextcloudRestService` anpassen
2. **Header-Konfiguration** optimieren
3. **Error-Handling** basierend auf Test-Ergebnissen verbessern
4. **Performance-Optimierungen** implementieren

## 📞 Support

Bei Problemen:
1. Test-Scripts ausführen und Logs analysieren
2. Nextcloud-Logs überprüfen
3. Network-Tab im Browser für weitere Details nutzen
4. Nextcloud-Admin für Berechtigungen kontaktieren 