# Environment Variables Checkliste - BRAIN DB

## 🔑 Benötigte Environment Variables für Vercel Deployment

### ✅ Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://jpmhwyjiuodsvjowddsm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[DEIN_SUPABASE_ANON_KEY]
SUPABASE_SECRET_KEY=[DEIN_SUPABASE_SECRET_KEY]
```

**Wo finde ich diese Werte?**
1. Gehe zu https://supabase.com/dashboard
2. Wähle dein BRAIN DB Projekt
3. Gehe zu Settings → API
4. Kopiere die Werte aus dem "Project API keys" Bereich

### ✅ AI Services
```
OPENAI_KEY=[DEIN_OPENAI_API_KEY]
PERPLEXITY_API_KEY=[DEIN_PERPLEXITY_API_KEY]
```

**Wo finde ich diese Werte?**
1. **OpenAI**: https://platform.openai.com/api-keys
2. **Perplexity**: https://www.perplexity.ai/settings/api

### 🔧 Optional (Für erweiterte Features)
```
VERCEL_OIDC_TOKEN=[VERCEL_OIDC_TOKEN]
```

## 📋 Setup-Schritte in Vercel

### 1. Vercel Dashboard öffnen
- Gehe zu https://vercel.com/dashboard
- Wähle dein BRAIN DB Projekt

### 2. Environment Variables hinzufügen
- Klicke auf "Settings" Tab
- Wähle "Environment Variables" aus dem Menü
- Füge jede Variable einzeln hinzu:

#### Für Production Environment:
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://jpmhwyjiuodsvjowddsm.supabase.co
Environment: Production

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [DEIN_ANON_KEY]
Environment: Production

Name: SUPABASE_SECRET_KEY
Value: [DEIN_SECRET_KEY]
Environment: Production

Name: OPENAI_KEY
Value: [DEIN_OPENAI_KEY]
Environment: Production

Name: PERPLEXITY_API_KEY
Value: [DEIN_PERPLEXITY_KEY]
Environment: Production
```

#### Für Preview Environment (Optional):
- Wiederhole die gleichen Schritte für "Preview" Environment
- Dies ermöglicht Tests in Pull Requests

### 3. Deployment auslösen
- Nach dem Hinzufügen der Environment Variables
- Gehe zu "Deployments" Tab
- Klicke "Redeploy" für das neueste Deployment

## 🔍 Verifizierung

### 1. Deployment-Logs prüfen
- Gehe zu "Deployments" → Neuestes Deployment
- Prüfe die Build-Logs auf Fehler
- Suche nach "Environment Variables" in den Logs

### 2. Funktionstest
- Öffne die deployed URL
- Teste die Hauptfunktionen:
  - Produkt-Erfassung
  - Datenbank-Zugriff
  - AI-Analyse

### 3. API-Tests
- Teste `/api/extraction/simple-ai-analysis`
- Teste `/api/products/save`
- Prüfe Supabase-Verbindung

## 🚨 Häufige Probleme

### Problem: "Environment variable not found"
**Lösung:**
- Prüfe, ob die Variable korrekt gesetzt ist
- Stelle sicher, dass sie für die richtige Environment (Production/Preview) gesetzt ist
- Redeploy nach Änderungen

### Problem: "Supabase connection failed"
**Lösung:**
- Prüfe `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Stelle sicher, dass die Keys korrekt kopiert wurden
- Prüfe Supabase-Projekt-Status

### Problem: "OpenAI API error"
**Lösung:**
- Prüfe `OPENAI_KEY` Format (sollte mit `sk-` beginnen)
- Prüfe OpenAI API Quotas
- Stelle sicher, dass der Key aktiv ist

## 📊 Monitoring

### Environment Variables Status
- **Vercel Dashboard**: Settings → Environment Variables
- **Deployment Logs**: Prüfe auf Variable-Fehler
- **Runtime Logs**: Funktion-Logs in Vercel Dashboard

### API Health Checks
- **Supabase**: Prüfe Verbindung in Browser Console
- **OpenAI**: Teste mit einfacher API-Anfrage
- **Perplexity**: Teste mit einfacher API-Anfrage

---

**Status**: 📋 Checkliste bereit  
**Letzte Aktualisierung**: Dezember 2024  
<<<<<<< Current (Your changes)
**Nächster Schritt**: Vercel Dashboard Setup 
=======
**Nächster Schritt**: Vercel Dashboard Setup

## 🔒 Auth Allowlist

Zur Steuerung, wer sich registrieren darf, setze eine Allowlist:

```
ALLOWLIST_EMAILS=alice@example.com,bob@example.com
ALLOWLIST_DOMAINS=example.com,partner.org
```

- Wenn beide Listen leer sind, ist Signup standardmäßig deaktiviert (deny-by-default).
- `ALLOWLIST_DOMAINS` erlaubt auch Subdomains (z. B. `user@sub.example.com`). 
>>>>>>> Incoming (Background Agent changes)
