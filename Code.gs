/**
 * RECOMPPRO — Google Apps Script backend
 * -------------------------------------------------
 * 1) Otwórz nowy arkusz Google Sheets (pusty).
 * 2) Rozszerzenia -> Apps Script.
 * 3) Wklej całą zawartość tego pliku, zastępując domyślny kod.
 * 4) Zapisz projekt (np. jako "RecompPro Backend").
 * 5) Wdróż -> Nowe wdrożenie -> typ: Aplikacja internetowa (Web app).
 *    - Wykonaj jako: Ja (Twoje konto)
 *    - Kto ma dostęp: Każda osoba (Anyone)
 * 6) Skopiuj wygenerowany adres URL (kończy się na /exec).
 * 7) Wklej ten adres w aplikacji RecompPro w zakładce Ustawienia.
 */

function doGet(e) {
  return ContentService.createTextOutput('RecompPro backend OK');
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.type === 'workout') {
      saveWorkout(data);
    } else if (data.type === 'report') {
      saveReport(data);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }
  return sh;
}

// UWAGA: pierwsze 7 kolumn musi zostać w tej kolejności — tak zapisywały się
// treningi z Fazy 1 i 2. Nowe kolumny (RIR itd.) dopisywane są NA KOŃCU,
// żeby stare wiersze w arkuszu pozostały poprawnie wyrównane.
const WORKOUT_HEADERS = ['Data', 'Trening', 'Ćwiczenie', 'Seria', 'Ciężar (kg)', 'Powtórzenia', 'Wykonano',
                         'RIR', 'RIR cel', 'Zakres powt.', 'Tydzień cyklu', 'Deload'];

function saveWorkout(data) {
  const sh = getSheet('Log Treningowy', WORKOUT_HEADERS);
  migrateWorkoutHeaders(sh);
  data.exercises.forEach(ex => {
    ex.sets.forEach(s => {
      sh.appendRow([
        data.date,
        data.workoutLabel,
        ex.name,
        s.set,
        ex.weight,
        s.reps,
        s.done ? 'TAK' : 'NIE',
        (ex.rir === null || ex.rir === undefined) ? '' : ex.rir,
        (ex.targetRir === null || ex.targetRir === undefined) ? '' : ex.targetRir,
        ex.repRange || '',
        data.cycleWeek || '',
        data.isDeload ? 'TAK' : ''
      ]);
    });
  });
}

/**
 * Arkusze utworzone przed Fazą 3 mają tylko 7 kolumn. Ta funkcja dopisuje
 * WYŁĄCZNIE brakujące nagłówki na końcu (od kolumny 8 w górę) — kolumn 1–7
 * nie rusza, więc historyczne wiersze zostają nienaruszone.
 * Uruchamia się automatycznie przy każdym zapisie.
 */
function migrateWorkoutHeaders(sh) {
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const current = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  if (lastCol >= WORKOUT_HEADERS.length) return;
  const missing = WORKOUT_HEADERS.slice(lastCol);
  sh.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
  sh.setFrozenRows(1);
}

function getOrCreateFolder(name) {
  const folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

function getOrCreateSubfolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}
