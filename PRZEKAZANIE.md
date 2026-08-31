# RecompPro — przekazanie kontekstu projektu

Ten dokument podsumowuje wszystko, co powstało w poprzedniej rozmowie, żeby nowy czat mógł od razu kontynuować pracę bez odtwarzania historii od zera. Wklej ten plik (albo jego treść) na początku nowej rozmowy razem z resztą plików z archiwum.

## Co to za projekt

PWA (Progressive Web App) — dziennik treningowy na siłownię. Aplikacja ma dwie główne funkcje:
1. **Zapis treningów** — 4 warianty (A/B/C/D), bez przypisania do konkretnych dni tygodnia (mimo że w oryginalnym planie od trenera/dietetyka były przypisane do dni).
2. **Raport sylwetki** — zdjęcia (przód/tył/bok) + obwody (biceps, klatka, pas, udo).

## Kluczowe decyzje projektowe (ważne, żeby ich nie cofać bez wiedzy użytkownika)

- **Ciężar wpisywany w jednym polu na wszystkie serie danego ćwiczenia.** Powtórzenia też zbiorczo, ale z opcją "inny wynik" dla pojedynczej serii (opcjonalny override) — użytkownik zawsze robi tym samym ciężarem wszystkie serie, ale czasem inna liczba powtórzeń w konkretnej serii.
- **Dwupoziomowy zapis:** zawsze najpierw lokalnie na urządzeniu (localStorage dla treningów, IndexedDB dla zdjęć raportu — zdjęcia NIE mogą iść do localStorage, bo ma limit ~5MB i nie nadaje się do binarnych danych), dopiero potem próba wysyłki do Google (Sheets dla treningów, Drive dla zdjęć raportu) przez webhook Google Apps Script.
- **Zdjęcia raportu są kompresowane w przeglądarce** (canvas, max 1280px, JPEG ~82%) przed zapisem, żeby nie zapychać telefonu.
- **Adres webhooka Google Apps Script nigdy nie trafia do kodu źródłowego** — jest trzymany tylko lokalnie w przeglądarce użytkownika (localStorage), więc repozytorium może być bezpiecznie publiczne.
- **Autozapis co 30 sekund** (plus natychmiastowy zapis przy każdej zmianie pola i przy chowaniu/zamykaniu aplikacji) — wprowadzony po tym, jak użytkownikowi skasowały się niezapisane jeszcze dane treningu. Dotyczy zarówno ekranu treningu, jak i ekranu raportu. Szkic wraca automatycznie po ponownym otwarciu tego samego treningu tego samego dnia.
- **Faza 2 planu** — ćwiczenia zaktualizowane wg dokumentu z lipca 2026 (rotacja akcesoriów, 2400 kcal). ID z prefiksem `p2`.
- **Faza 3 planu (sierpień 2026, aktualna)** — plan przebudowany po audycie. ID mają prefiks `p3`, więc ciężary z Faz 1–2 nie podpowiadają się przy innych ćwiczeniach; cała historia zostaje w zakładce Historia. `CURRENT_PHASE = 3`. Zmiany merytoryczne: wiosłowanie sztangą zamiast ściągania drążka w A, wznosy bokiem w A i C (8 serii/tydz. zamiast 3), uginanie podudzi na ławeczce w B i D, odwodzenie w opadzie zamiast pulloveru, Pallof press zamiast dead buga, zniesione AMRAP-y.
- **RIR** — każde ćwiczenie ma `rirTarget` w `data.js`, a karta ćwiczenia trzecie pole wpisu („RIR"). Wartość idzie do szkicu, historii i arkusza.
- **Progresja podwójna** — po ukończonej sesji `recomppro_last[id]` trzyma też RIR. Przy następnym otwarciu treningu `progressionHint()` sprawdza, czy WSZYSTKIE serie trafiły w górną granicę zakresu przy RIR ≥ celu; jeśli tak, pokazuje przycisk „Dołóż → X kg" (`step`: 2,5 kg góra / 5 kg dół, pole w `data.js`). Przy ćwiczeniach z masą własną (ciężar 0) zamiast przycisku pojawia się komunikat o dołożeniu obciążenia.
- **Cykl 6+1 i deload** — data startu cyklu w `localStorage` (`recomppro_cycle_start`), ustawiana przyciskiem w Ustawieniach. `getCycleInfo()` liczy tydzień 1–7; w 7. tygodniu appka **sama skraca liczbę serii do 2** i podnosi cel RIR do 4, oraz pokazuje żółty baner. Po 7. tygodniu licznik wraca do tygodnia 1 (kolejny cykl). Stałe `CYCLE_WEEKS`, `DELOAD_WEEK`, `DELOAD_SETS`, `DELOAD_RIR` w `data.js`.
- **Uwaga na `effSets()`** — pętle po seriach (render, `saveDraft`, `bulkRepsChanged`, `collectWorkoutData`) muszą używać `effSets(ex)`, nie `ex.sets`, inaczej w tygodniu deloadu kod sięgnie po nieistniejące pola DOM.
- **`Code.gs` — kolumny dopisywane NA KOŃCU.** Arkusz z Faz 1–2 ma 7 kolumn; `migrateWorkoutHeaders()` dopisuje RIR / RIR cel / Zakres powt. / Tydzień cyklu / Deload jako kolumny 8–12 i **nie rusza kolumn 1–7**, żeby historyczne wiersze zostały wyrównane. Nie zmieniaj kolejności pierwszych siedmiu nagłówków.
- **Stoper przerw** — czasy siedzą w polu `rest` (sekundy) każdego ćwiczenia w `data.js`, `DEFAULT_REST = 120` jako zapas. `ssNext: true` oznacza pierwsze ćwiczenie superserii (krótkie przejście 20–30 s zamiast pełnej przerwy). Odliczanie startuje z `toggleCheck()` przy zaznaczeniu serii, kasuje się przy odznaczeniu, i nie startuje po ostatniej serii ostatniego ćwiczenia. Stan liczony z `Date.now()`, nie z tykania `setInterval` — dzięki temu przejście w tło nie rozjeżdża czasu.
- **Dźwięk bez plików audio** — `beep()` generuje ton przez WebAudio (`OscillatorNode`), więc nic nie trzeba hostować ani cache'ować. `AudioContext` MUSI powstać w reakcji na dotknięcie ekranu (przeglądarki blokują autostart) — dlatego `ensureAudio()` jest wołane z `toggleCheck()`/`restStart()`, a nie przy starcie aplikacji. Nie przenosić tego do `DOMContentLoaded`.
- **Wake Lock** — `navigator.wakeLock.request('screen')` przy wejściu w trening, zwalniany przy `goHome`/`switchTab`/`finishWorkout`. System sam zwalnia blokadę przy przejściu w tło, więc jest `visibilitychange`, który ją odzyskuje. Wymaga HTTPS (Netlify/GitHub Pages spełniają). Brak wsparcia = ciche pominięcie, nic się nie wywala.
- **Serie startują NIEodhaczone**, gdy stoper jest włączony (flaga `recomppro_flag_timer`) — bo to odhaczenie uruchamia przerwę. Przy wyłączonym stoperze wraca stare zachowanie (wszystko zaznaczone z góry). Kolumna „Wykonano" w arkuszu wreszcie niesie prawdziwą informację.
- **Przełączniki** (`stoper`, `dźwięk`, `wibracja`, `wygaszanie`) w `localStorage` pod `recomppro_flag_*`, obsługa przez `getFlag/setFlag/toggleFlag/renderFlags`.
- **`CACHE_NAME` w `sw.js`** podbijane przy każdym wydaniu (obecnie `recomppro-v4`) — bez tego telefon serwuje stare pliki z cache.
- **Naprawiony bug UI:** przycisk „Zakończ trening" nachodził wcześniej na dolny pasek zakładek (oba były `position:fixed; bottom:0`) — poprawione przez podniesienie paska nad tabbar i zwiększenie `padding-bottom` z uwzględnieniem `safe-area-inset-bottom` (żeby nic nie chowało się za „grzywką"/paskiem gestów telefonu). Warto, żeby użytkownik potwierdził, że po tej poprawce wszystko jest już w pełni widoczne na jego telefonie.

## Stan wdrożenia

- Aplikacja była wcześniej wdrażana ręcznie na **Netlify** (drag & drop ZIP-a) — działający adres już istnieje.
- Przygotowano też wersję pod **GitHub**: folder z już zainicjowanym lokalnym repozytorium Git (gałąź `main`, jeden commit), gotowy do `git remote add` + `git push`. Nie wiadomo z tej rozmowy, czy użytkownik już wykonał ten push.
- W repozytorium NIE ma na stałe `Code.gs` jako hostowanej części strony — to osobny plik wklejany ręcznie do Google Apps Script (choć w archiwum jest dołączony jako plik referencyjny/do wklejenia).
- Backend Google (arkusz + Dysk) — użytkownik miał przejść proces: nowy arkusz Sheets → Rozszerzenia → Apps Script → wklejenie `Code.gs` → Wdróż jako Web App ("Wykonaj jako: Ja", "Dostęp: Każda osoba") → wklejenie adresu `/exec` w zakładce Ustawienia w appce. Nie wiadomo z tej rozmowy, czy ten krok został już wykonany.

## Struktura plików (w załączonym archiwum)

```
index.html       — struktura HTML + style (CSS w <style> w środku)
app.js            — cała logika: nawigacja, treningi, autozapis, IndexedDB, wysyłka do Google
data.js           — dane ćwiczeń (4 treningi A/B/C/D, Faza 2)
manifest.json      — manifest PWA (instalacja na telefonie)
sw.js             — service worker (działanie offline)
icon-192.png / icon-512.png — ikony aplikacji
netlify.toml       — konfiguracja nagłówków cache dla Netlify
Code.gs           — backend Google Apps Script (wklejany osobno do script.google.com)
README.md          — pełna instrukcja wdrożenia (GitHub Pages / Netlify + Google Apps Script)
.gitignore
.git/             — zainicjowane lokalne repozytorium (gałąź main, 1 commit)
```

## Możliwe następne kroki (do potwierdzenia z użytkownikiem, nie zakładać automatycznie)

- Sprawdzenie, czy backend Google (`Code.gs`) został już wdrożony i podłączony w Ustawieniach appki.
- Faktyczne wypchnięcie repo na GitHub i/lub podłączenie do Netlify przez Git (zamiast ręcznych ZIP-ów).
- Test na realnym telefonie użytkownika po ostatniej poprawce UI (nakładające się przyciski) — jeszcze niepotwierdzony przez użytkownika.
- Po pierwszym treningu w Fazie 3: wejść w Ustawienia → „Rozpocznij nowy cykl", żeby licznik tygodni i deload ruszyły.
- Sprawdzić na telefonie, czy trzy pola w wierszu (Ciężar / Powtórzenia / RIR) mieszczą się czytelnie — przy bardzo wąskich ekranach może być potrzebne zawinięcie do drugiej linii.
- Ewentualne dalsze zmiany w planie treningowym (Faza 4) w miarę postępów.

---
*Ten plik jest tylko dokumentem kontekstowym na potrzeby przekazania między rozmowami — nie jest częścią samej aplikacji i nie musi trafiać do repozytorium/hostingu.*
