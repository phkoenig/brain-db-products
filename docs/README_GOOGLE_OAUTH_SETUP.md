# Google OAuth Setup für BRAIN DB

Diese Anleitung erklärt, wie du Google OAuth für die BRAIN DB Authentifizierung einrichtest.

## 1. Google Cloud Console Setup

### 1.1 Google Cloud Projekt erstellen
1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Notiere die **Projekt-ID**

### 1.2 Google OAuth 2.0 Credentials erstellen
1. Gehe zu **APIs & Services** > **Credentials**
2. Klicke auf **+ CREATE CREDENTIALS** > **OAuth 2.0 Client IDs**
3. Wähle **Web application** als Application type
4. Gib einen Namen ein (z.B. "BRAIN DB OAuth")
5. Füge die **Authorized redirect URIs** hinzu:
   ```
   https://jpmhwyjiuodsvjowddsm.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```
6. Klicke auf **Create**
7. **Wichtig**: Kopiere die **Client ID** und **Client Secret**

## 2. Supabase OAuth Konfiguration

### 2.1 Google Provider aktivieren
1. Gehe zu deinem [Supabase Dashboard](https://supabase.com/dashboard)
2. Wähle dein Projekt: `jpmhwyjiuodsvjowddsm`
3. Gehe zu **Authentication** > **Providers**
4. Finde **Google** und klicke auf **Enable**
5. Gib die Google Credentials ein:
   - **Client ID**: Deine Google Client ID
   - **Client Secret**: Dein Google Client Secret
6. Klicke auf **Save**

### 2.2 Redirect URLs konfigurieren
1. Gehe zu **Authentication** > **URL Configuration**
2. Stelle sicher, dass diese URLs in der **Redirect URLs** Liste stehen:
   ```
   https://megabrain.cloud/auth/callback
   http://localhost:3000/auth/callback
   ```

## 3. Lokale Entwicklung

### 3.1 Environment Variables
Erstelle eine `.env.local` Datei im Root-Verzeichnis:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://jpmhwyjiuodsvjowddsm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E

# Google OAuth (optional für lokale Entwicklung)
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 3.2 Dev-Server starten
```bash
npm run dev
```

## 4. Allowlist Management

### 4.1 Benutzer zur Allowlist hinzufügen
Die Allowlist wird in der `auth_allowlist` Tabelle verwaltet. Du kannst Benutzer über das Supabase Dashboard hinzufügen:

1. Gehe zu **Table Editor**
2. Wähle die `auth_allowlist` Tabelle
3. Klicke auf **Insert** und füge einen neuen Eintrag hinzu:
   ```sql
   INSERT INTO auth_allowlist (email, name, role) 
   VALUES ('user@example.com', 'User Name', 'user');
   ```

### 4.2 Admin-Benutzer erstellen
```sql
INSERT INTO auth_allowlist (email, name, role) 
VALUES ('admin@megabrain.cloud', 'Admin User', 'admin');
```

## 5. Testen der Authentifizierung

### 5.1 Google OAuth Test
1. Öffne die Anwendung im Browser
2. Klicke auf **"Anmelden mit Google"**
3. Du wirst zu Google weitergeleitet
4. Nach erfolgreicher Anmeldung wirst du zur `/capture` Seite weitergeleitet

### 5.2 Email/Password Test
1. Verwende eine E-Mail-Adresse, die in der Allowlist steht
2. Registriere dich mit E-Mail/Passwort
3. Bestätige deine E-Mail-Adresse
4. Melde dich an

## 6. Troubleshooting

### 6.1 Häufige Probleme

**"Zugriff verweigert" Fehler**
- Prüfe, ob die E-Mail-Adresse in der `auth_allowlist` Tabelle steht
- Prüfe, ob `is_active = true` ist

**Google OAuth funktioniert nicht**
- Prüfe die Redirect URLs in Google Cloud Console
- Prüfe die Supabase OAuth-Konfiguration
- Stelle sicher, dass die Domain in Google Cloud Console autorisiert ist

**Email-Bestätigung funktioniert nicht**
- Prüfe die SMTP-Einstellungen in Supabase
- Prüfe die Email-Templates

### 6.2 Debugging
1. Öffne die Browser-Entwicklertools
2. Schaue in die Console für Fehlermeldungen
3. Prüfe die Network-Tab für fehlgeschlagene Requests
4. Schaue in die Supabase Logs

## 7. Produktions-Deployment

### 7.1 Vercel Environment Variables
Füge diese Environment Variables in Vercel hinzu:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 7.2 Domain-Konfiguration
Stelle sicher, dass `https://megabrain.cloud` in den Google OAuth Redirect URLs steht.

## 8. Sicherheit

### 8.1 Best Practices
- Verwende immer HTTPS in Produktion
- Halte die Allowlist aktuell
- Überwache die Auth-Logs regelmäßig
- Verwende starke Passwörter für Email/Password-Authentifizierung

### 8.2 Monitoring
- Überwache fehlgeschlagene Login-Versuche
- Prüfe regelmäßig die Allowlist
- Überwache die Supabase Auth-Logs

## 9. Nächste Schritte

Nach der Einrichtung kannst du:
1. Weitere OAuth-Provider hinzufügen (Apple, GitHub, etc.)
2. Multi-Factor Authentication (MFA) aktivieren
3. Custom Email-Templates erstellen
4. Erweiterte Auth-Policies implementieren
