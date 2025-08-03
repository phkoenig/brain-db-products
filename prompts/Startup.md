0. Prüfe zunächst, ob das Context7 MCP und das Supabase MCP verfügbar ist. Wenn nicht, unterbreche hier und sag mir bescheid. Nur wenn beide MCP's laufen, insbesondere das Supabase MCP, dann fahre mit punkt 1. fort.

1. Gehe durch die Codebase und insbesondere alle Dateien im Docs-Ordner, und mache dich mit der Codebase und dem Projekt vertraut.

2. Benutze das Supabase MCP, um dich mit dem Backend vertraut zu machen.

3. Suche im Ordner Logbuch in der Datei logbuch.md. Hier kannst du unsere letzten Arbeitsschritte nachvollziehen.

4. Ändere niemals das Frontend-UI-Design ohne explizite Anweisung von mir.

5. Benutze immer das Context7 MCP wenn Schwierigkeiten beim Coden auftreten.

6. Beende den Dev-Server, bevor du wichtige Änderungen am Code machst. Wache darüber, dass nie parallel mehrere Dev-Server laufen. Falls du den Dev-Server startest, stelle sicher, dass er auf http://localhost:3000 läuft. Wenn der Port belegt ist, deutet das darauf hin, dass ein weiterer Dev-Server im Hintergrund läuft. Den musst du dann bitte beenden.

7. Führe ein Commit aller Dateien zu GitHub durch wenn ich "gh" prompte

8. Wenn ich "log" prompte, schreibe was wir gemacht haben, welche Schwierigkeiten aufgetreten sind, wie wir sie gelöst haben, und erkannte Best Practices in das Logbuch. Fasse Dich dabei sehr kurz, damit das Kontextfenster nicht zu schnell voll wird. Füge dazu jeweils zuoberst einen neuen Abschnitt hinzu, nach folgendem Schema

# 31.07.2025 - 05:35 - Weiterarbeit an der Extraction Pipeline.

Änderungswunsch der Extraction-Logik: perplexity API spielt die Hauptrolle, alle anderen Extraktions-Algorithmen sind untergeordnet. 

Bei der Änderung des Codes ist Tailwind in CSS verloren gegangen und wurde wiederhergestellt, mittels ...

Das kaputte Dropdown-Menü zu den Kategorisierungen wurde repariert.

---

9. Wenn größer Mengen Code bearbeitet werden sollen, dann Teile das in kleinere Stücke auf, damit das Kontext-Fenster nicht zu voll wird.


Generelle Schlussbemerkung:
Ich möchte immer gerne in kleinen kontrollierten Schritten vorgehen, die wie vorher besprechen. 
Insbesondere bitte keine Änderungen am UI ohne konkreten Wunsch meinerseits.
