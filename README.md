# Weihnachtsfeier-Website

Statische Seite (kein Server) – läuft auf **GitHub Pages**. Die Formulare schreiben direkt in eine Tabelle.

## 1. Tabelle anbinden (einmalig, ca. 5 Minuten)

Eine GitHub-Seite kann nicht selbst in eine `.xlsx`-Datei schreiben. Deshalb nimmt ein kostenloses Google Sheet die Daten an
(Excel-kompatibel: *Datei → Herunterladen → Microsoft Excel (.xlsx)*).

1. Neues Google Sheet anlegen → **Erweiterungen → Apps Script**.
2. Inhalt von `apps-script/Code.gs` einfügen, `TOKEN` ändern, speichern.
3. **Bereitstellen → Neue Bereitstellung → Typ „Web-App“** → *Ausführen als: Ich*, *Zugriff: Jeder* → Bereitstellen und Berechtigungen bestätigen.
4. Die **Web-App-URL** in `scripts/config.js` bei `ENDPOINT` eintragen, `TOKEN` identisch setzen.

Tabellenblätter `Teilnehmer` und `Vorschlaege` entstehen automatisch. Das Sheet bleibt privat – nur du (und wen du einlädst) siehst die Daten.
So ist die Vorschläge-Tabelle geschützt, ohne dass die Website ein Passwort braucht.

*Alternative für Microsoft 365 (Excel Online/Teams):* Power-Automate-Flow „Beim Empfang einer HTTP-Anfrage“ → „Zeile zu Tabelle hinzufügen“;
die Flow-URL kommt in `ENDPOINT`. Die Felder entsprechen den Namen in `Code.gs`. Der HTTP-Trigger ist ein Premium-Connector.

## 2. Auf GitHub veröffentlichen

1. Neues Repository anlegen, alle Dateien hochladen (`index.html` im Hauptverzeichnis).
2. **Settings → Pages → Branch: `main`, Ordner `/ (root)`** → Speichern.
3. Nach ca. einer Minute erreichbar unter `https://<name>.github.io/<repo>/`.

## 3. Anpassen

- Bilder in `assets/`: `hintergrund.jpg`, `restaurant1-3.jpg`, `event1-3.jpg` (ohne Bild greift ein Farbverlauf)
- Restaurants/Events (Name, Adresse, Links) in `verlinkung/`, passende Namen im Dropdown in `index.html`
- E-Mail und Teams-Link in den Footern
