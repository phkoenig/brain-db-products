# Vercel Deployment Guide - BRAIN DB

## 🚀 Deployment-Schritte

### 1. Projekt-Vorbereitung ✅
- [x] `vercel.json` Konfiguration erstellt
- [x] Next.js Konfiguration geprüft
- [x] `.gitignore` korrekt konfiguriert
- [x] **Build erfolgreich getestet** ✅

### 2. Vercel Account Setup
1. **Vercel Account erstellen**: https://vercel.com/signup
2. **GitHub Integration**: Vercel mit GitHub-Account verbinden
3. **Projekt importieren**: BRAIN DB Repository auswählen

### 3. Environment Variables in Vercel setzen

**WICHTIG**: Diese Variablen müssen im Vercel Dashboard unter Settings → Environment Variables gesetzt werden:

#### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://jpmhwyjiuodsvjowddsm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[DEIN_SUPABASE_ANON_KEY]
SUPABASE_SECRET_KEY=[DEIN_SUPABASE_SECRET_KEY]
```

#### AI Services
```
OPENAI_KEY=[DEIN_OPENAI_API_KEY]
PERPLEXITY_API_KEY=[DEIN_PERPLEXITY_API_KEY]
```

#### Vercel OIDC (Optional)
```
VERCEL_OIDC_TOKEN=[VERCEL_OIDC_TOKEN_FALLS_ERFORDERLICH]
```

### 4. Build-Konfiguration

**Framework Preset**: Next.js
**Build Command**: `npm run build`
**Output Directory**: `.next`
**Install Command**: `npm install`

### 5. Deployment-Region
- **Empfohlen**: `fra1` (Frankfurt) für bessere Performance in Deutschland

### 6. Funktionen-Konfiguration
- **API Routes**: 30 Sekunden Timeout für AI-Analyse
- **CORS Headers**: Für API-Zugriff konfiguriert

## 🔧 Deployment-Test

### Lokaler Test vor Deployment ✅
```bash
# Production Build testen
npm run build

# Lokalen Production Server starten
npm run start
```

**Status**: ✅ Build erfolgreich - Bereit für Deployment

### Deployment-Logs überwachen
- **Build Logs**: In Vercel Dashboard unter Deployments
- **Function Logs**: Unter Functions Tab
- **Error Monitoring**: Vercel Analytics aktivieren

## 🚨 Wichtige Hinweise

### 1. Environment Variables
- **NIE** in Git committen
- **Immer** in Vercel Dashboard setzen
- **Produktion** und **Preview** separat konfigurieren

### 2. API Limits
- **OpenAI**: Rate Limits beachten
- **Perplexity**: API Quotas überwachen
- **Supabase**: Row Limits prüfen

### 3. Performance
- **Bild-Optimierung**: Next.js Image Component verwenden
- **Bundle-Größe**: Subframe-Komponenten optimiert
- **Caching**: Vercel Edge Caching aktiviert

## 📊 Monitoring

### Vercel Analytics
- **Performance**: Core Web Vitals
- **Errors**: Error Tracking
- **Usage**: Function Invocations

### Custom Monitoring
- **Supabase**: Database Performance
- **AI Services**: API Response Times
- **User Experience**: Form Completion Rates

## 🔄 Continuous Deployment

### Automatisches Deployment
- **Git Push**: Automatisches Deployment bei Push auf main
- **Preview Deployments**: Automatisch für Pull Requests
- **Branch Deployments**: Separate URLs für Feature Branches

### Deployment-Strategien
1. **Staging**: Preview Deployments für Tests
2. **Production**: Main Branch → Production
3. **Rollback**: Einfacher Rollback über Vercel Dashboard

## 🎯 Nächste Schritte nach Deployment

1. **Domain konfigurieren** (Optional)
2. **SSL-Zertifikat** (Automatisch von Vercel)
3. **Performance optimieren** basierend auf Analytics
4. **Error Monitoring** einrichten
5. **Backup-Strategie** für Supabase implementieren

## 🚀 Sofortige Deployment-Schritte

### Option 1: Vercel Dashboard (Empfohlen für Anfänger)
1. Gehe zu https://vercel.com
2. Klicke "New Project"
3. Verbinde dein GitHub Repository
4. Wähle das BRAIN DB Repository aus
5. Konfiguriere Environment Variables
6. Klicke "Deploy"

### Option 2: Vercel CLI (Für Fortgeschrittene)
```bash
# Vercel CLI installieren
npm i -g vercel

# Login
vercel login

# Projekt deployen
vercel

# Für Production
vercel --prod
```

---

**Status**: ✅ Bereit für Deployment  
**Letzte Aktualisierung**: Dezember 2024  
**Nächster Schritt**: Vercel Account Setup und Repository-Verbindung 