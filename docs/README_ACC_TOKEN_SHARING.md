# ACC Token-Sharing System

## 🚨 WICHTIGER HINWEIS: 2-LEGGED OAUTH FUNKTIONIERT NICHT FÜR ACC! 🚨

**Diese Erkenntnis ist kritisch und muss beachtet werden!**

## Problem

- **2-legged OAuth** funktioniert **NICHT** für Autodesk Construction Cloud (ACC) Projekte
- **3-legged OAuth** ist **erforderlich** für ACC-Zugriff
- **Jeder Benutzer** müsste sich bei Autodesk anmelden (nicht praktikabel für Kunden)

## Lösung: Token-Sharing

### Konzept
- **Admin authentifiziert sich einmal** bei Autodesk (3-legged OAuth)
- **Token wird in Supabase gespeichert** (`acc_shared_tokens` Tabelle)
- **Alle Kunden nutzen den Admin-Token** ohne eigene Authentifizierung

### Technische Implementierung

#### 1. Supabase-Tabelle
```sql
CREATE TABLE acc_shared_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 2. Token-Management
- **`getSharedToken()`**: Lädt gültigen Token aus der Datenbank
- **`storeSharedToken()`**: Speichert neuen Token in der Datenbank
- **Automatische Erneuerung**: Token wird bei Ablauf erneuert

#### 3. OAuth-Flow
1. **Admin klickt "Admin-Authentifizierung"**
2. **3-legged OAuth** wird durchgeführt
3. **Token wird automatisch gespeichert** in `acc_shared_tokens`
4. **Alle Kunden** können das System nutzen

### Vorteile

✅ **Kundenfreundlichkeit**: Keine Autodesk-Anmeldung für Endkunden
✅ **Skalierbarkeit**: Unbegrenzte Anzahl von Kunden
✅ **Wartungsfreundlichkeit**: Nur Admin muss sich authentifizieren
✅ **Token-Persistenz**: Token bleibt nach Server-Neustart verfügbar

### Sicherheit

- **RLS-Policies**: Nur authentifizierte Benutzer können Tokens lesen
- **Token-Rotation**: Tokens werden regelmäßig erneuert
- **Admin-Only-Management**: Nur Administrator kann Tokens verwalten

## Verwendung

### Für Administratoren
1. Gehe zu `/zepta/f16/settings`
2. Klicke auf "Admin-Authentifizierung"
3. Melde dich bei Autodesk an
4. Token wird automatisch gespeichert

### Für Kunden
1. Gehe zu `/zepta/f16/settings`
2. Siehe "Admin-Token aktiv (für alle Benutzer)"
3. Klicke auf "Ordner durchsuchen"
4. Nutze das System ohne weitere Authentifizierung

## Fehlerbehebung

### "Admin-Token nicht verfügbar"
- **Ursache**: Kein gültiger Token in der Datenbank
- **Lösung**: Admin muss sich erneut authentifizieren

### "Token expired"
- **Ursache**: Token ist abgelaufen
- **Lösung**: System versucht automatische Erneuerung, falls das fehlschlägt: Admin-Authentifizierung

## Wichtige Erkenntnisse

❌ **2-legged OAuth funktioniert NICHT für ACC-Projekte**
✅ **3-legged OAuth ist erforderlich für ACC-Zugriff**
✅ **Token-Sharing ermöglicht kundenfreundliche Lösung**
✅ **Supabase bietet sichere Token-Speicherung**

---

**Letzte Aktualisierung**: 2025-09-17 00:35
**Status**: Vollständig implementiert und getestet
