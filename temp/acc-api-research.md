# ACC API Research - Perplexity Query

## Problem:
- ACC Projects API funktioniert: `GET /construction/admin/v1/accounts/{accountId}/projects`
- ACC Project Contents API funktioniert NICHT: Alle Endpoints geben 404 zurück

## Versuchte Endpoints:
1. ❌ `GET /data/v2/projects/{projectId}/folders/{folderId}/contents` (APS Data Management)
2. ❌ `GET /construction/admin/v1/accounts/{accountId}/projects/{projectId}/folders/{folderId}/contents` (ACC Admin)
3. ❌ `GET /bim360/docs/v1/projects/{projectId}/folders/{folderId}/contents` (BIM 360)

## Perplexity Query:
```
Autodesk Construction Cloud (ACC) API: Wie greife ich auf Projekt-Inhalte (Dateien/Ordner) zu?

Ich habe bereits erfolgreich:
- OAuth2 3-legged Authentication ✅
- ACC Projects API: GET /construction/admin/v1/accounts/{accountId}/projects ✅
- Account ID: 969ae436-36e7-4a4b-8744-298cf384974a ✅

Problem: Alle Versuche für Projekt-Inhalte geben 404 zurück:
- Data Management API v2: /data/v2/projects/{projectId}/folders/{folderId}/contents ❌
- ACC Admin API: /construction/admin/v1/accounts/{accountId}/projects/{projectId}/folders/{folderId}/contents ❌  
- BIM 360 API: /bim360/docs/v1/projects/{projectId}/folders/{folderId}/contents ❌

Welche sind die KORREKTEN API-Endpoints für ACC Projekt-Inhalte?
- Welche API-Version?
- Welche URL-Struktur?
- Welche Headers?
- Gibt es spezielle ACC-spezifische Endpoints?

Bitte gib mir die exakten Endpoints und Beispiele.
```

## Ziel:
Finde die korrekten ACC API-Endpoints für Projekt-Inhalte (Dateien/Ordner).
