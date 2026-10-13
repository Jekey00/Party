/**
 * Empfänger für die Weihnachtsfeier-Formulare.
 * Schreibt jede Einsendung als neue Zeile in dein Google Sheet
 * (Tabellenblätter "Teilnehmer" und "Vorschlaege" werden automatisch angelegt).
 * Das Sheet bleibt privat – nur du hast Zugriff. Als Excel: Datei → Herunterladen → .xlsx
 */
const TOKEN = "weihnachten-2026"; // gleicher Wert wie in scripts/config.js (bitte ändern)

const SHEETS = {
  Teilnehmer: {
    head: ["Zeit", "Vorname", "Nachname", "Status", "Tag", "Auswahl", "Notiz"],
    keys: ["vorname", "nachname", "status", "tag", "auswahl", "notiz"],
  },
  Vorschlaege: {
    head: ["Zeit", "Vorname", "Nachname", "Link", "Name", "Straße", "Stadt", "Vorteile", "Event"],
    keys: ["vorname", "nachname", "link", "adressname", "strasse", "stadt", "vorteile", "event"],
  },
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.token !== TOKEN) return out("forbidden");
    const def = SHEETS[d.sheet];
    if (!def) return out("unknown sheet");
    if (!String(d.vorname || "").trim()) return out("invalid");

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(d.sheet);
    if (!sh) {
      sh = ss.insertSheet(d.sheet);
      sh.appendRow(def.head);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, def.head.length).setFontWeight("bold");
    }
    const zeit = Utilities.formatDate(new Date(), "Europe/Berlin", "yyyy-MM-dd HH:mm");
    const row = [zeit].concat(def.keys.map((k) => String(d[k] == null ? "" : d[k]).slice(0, 800)));
    const r = sh.getLastRow() + 1;
    const range = sh.getRange(r, 1, 1, row.length);
    range.setNumberFormat("@"); // reiner Text: verhindert Formel-Einschleusung (=, +, -, @)
    range.setValues([row]);
    return out("ok");
  } catch (err) {
    return out("error");
  } finally {
    lock.releaseLock();
  }
}

function out(text) {
  return ContentService.createTextOutput(text);
}
