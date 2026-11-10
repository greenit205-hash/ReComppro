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
- **Pary antagonistyczne** — pole `pair` (wzajemne ID partnera) w `data.js`. Partnerzy MUSZĄ sąsiadować na liście `exercises`, bo stoper rozpoznaje przejście po porównaniu indeksów. Pierwszy z pary ma dodatkowo `transition: true` i krótki `rest` (25–50 s = przejście do partnera); drugi trzyma pełną przerwę rundy. Kolejność w A i C została pod to przestawiona.
- **`transition: true` znosi ANCHOR_FLOOR.** To nie kosmetyka: bez tego 50-sekundowe przejście przy `anchor:true` puchło do 120 s i parowanie nic nie dawało. Jeśli kiedyś dodasz nową parę z ciężkim bojem, pamiętaj o tej fladze.
- **Tryby tempa** — `REST_MODES` w `data.js` (standard 1,00 / szybki 0,75 / ekspres 0,55), wybór w `localStorage` pod `recomppro_rest_mode`, wyliczanie w `restFor(ex)`. Ciężkie boje (`anchor: true`, bez `transition`) mają podłogę `ANCHOR_FLOOR = 120 s` niezależnie od trybu — świadoma decyzja, bo skracanie przerwy na przysiadzie odbiera powtórzenia, czyli objętość.
- **`estimateWorkout(key)`** liczy szacowany czas sesji (przerwy + 40 s pracy na serię + 5 min rozgrzewki) i zasila podgląd w Ustawieniach. To zgrubny szacunek, nie pomiar.
- **`CACHE_NAME` w `sw.js`** podbijane przy każdym wydaniu (obecnie `recomppro-v5`) — bez tego telefon serwuje stare pliki z cache.
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


## Wariant 3-dniowy (dodany 5.10.2026)

Aplikacja ma teraz dwa plany do wyboru, przełączane na ekranie głównym:

- **4 dni** (klucze treningów `A`–`D`) — dotychczasowy podział góra/dół, 90 serii/tydz.
- **3 dni** (klucze `1`–`3`) — trzy sesje całego ciała, 70 serii/tydz.

Mechanika:

- `data.js` eksportuje `PLAN_4`, `PLAN_3` oraz `PLANS` (metadane: `days`, `label`,
  `short`, `desc`, `workouts`). Wybór siedzi w `localStorage` pod `recomppro_plan`,
  domyślnie `"4"`.
- `WORKOUTS` jest teraz **`let`, nie `const`** — `setPlanKey()` w `app.js` podmienia
  je w locie, a reszta kodu czyta globalną nazwę w momencie wywołania, więc działa
  bez zmian.
- **Identyfikatory ćwiczeń są celowo wspólne dla obu planów** (`p3b1` to ten sam
  przysiad w `B` i w `1`). Dzięki temu ciężary i podpowiedzi progresji przechodzą
  między wariantami. Przy edycji trzeba pilnować, żeby to samo `id` miało w obu
  planach ten sam `repRange`, `step` i nazwę — inaczej `progressionHint()` zgłupieje.
  Pilnuje tego test `/tmp/claude-0/t3.js`.
- **Klucze treningów są rozłączne** (`A`–`D` kontra `1`–`3`), więc szkice
  (`recomppro_drafts`) z jednego wariantu nie nadpiszą drugiego.
- Przy nieparzystej liczbie treningów ostatnia karta na ekranie głównym dostaje
  klasę `wide` (`grid-column: 1 / -1`), żeby nie zostawiać dziury w siatce.
- `collectWorkoutData()` dokłada pole `planDays`, a `Code.gs` zapisuje je
  w nowej kolumnie **„Plan (dni)"** (13., dopisywana na końcu przez
  `migrateWorkoutHeaders()` — kolumny 1–12 zostają nietknięte).
- `sw.js`: `CACHE_NAME` podbity do `recomppro-v6`.

Cykl deloadu liczy **tygodnie kalendarzowe, nie treningi**, więc przeplatanie
wariantów go nie psuje.

## Zamiana wyciskań (10.11.2026)

- **Ławka pozioma: hantle → sztanga**, id `p3a1` → **`p3a1s`**.
- **Ławka skośna: sztanga → hantle**, id `p3a3` → **`p3a3h`**.

Nowe id są konieczne: ciężar hantli (25,5 kg/rękę) nie może się podpowiedzieć
przy sztandze (~70 kg). Historia starych id zostaje w zakładce Historia.

Użytkownik ma **dwie sztangi**, więc para `p3a1s` ⇄ `p3a2` (wyciskanie ⇄ wiosłowanie
sztangą) jest wykonalna i została bez zmian.

W planie 3-dniowym, Trening 3, trzeba było przepiąć pary — po zamianie wyciskanie
skośne (hantle) i wiosłowanie hantlem jednorącz sięgałyby po ten sam sprzęt:

- `p3a5` (face pulls, transition) ⇄ `p3a3h`
- `p3c3` (wiosłowanie hantlem, transition) ⇄ `p3c7` (wąski chwyt, sztanga)

### Naprawione przy okazji (usterki z 5.10.2026)

Test par (`scratchpad/t.js`) dostał dwie nowe kontrole, które wykryły:

1. **Konflikt sprzętu w parze** — `p3c5` (wznosy bokiem, hantle) ⇄ `p3c6`
   (odwodzenie w opadzie, „Hantle lub Wyciąg"). `p3c6` ma teraz `equip: "Wyciąg + Uchwyty"`.
2. **Strona z krótką przerwą miała więcej serii niż partner** — wtedy nadmiarowe
   serie dostają czas przejścia (25–50 s) zamiast pełnej przerwy. Dotyczyło
   `p3c5` (4 vs 3) i `p3c1` w planie 3-dniowym (4 vs 3). Naprawione przez
   podniesienie serii partnera (`p3c6` 3→4) albo odwrócenie kolejności w parze
   (`p3c2` ⇄ `p3c1` w Treningu 2, `p3a5` ⇄ `p3a3h` w Treningu 3).
3. `p3d3` miał dwie różne nazwy w obu planach — ujednolicone.

**Reguła do zapamiętania:** w parze ćwiczenie z `transition: true` nie może mieć
więcej serii niż jego partner, a oba nie mogą wymagać tego samego sprzętu.

`sw.js`: `CACHE_NAME` → `recomppro-v7`.


## Głośniejszy stoper (10.11.2026)

Użytkownik zgłosił, że odliczania i sygnału końca przerwy prawie nie słychać.
Przyczyny były trzy naraz, wszystkie w `beep()`:

1. `gain` **0.14** dla odliczania i **0.30** dla końca — bardzo nisko.
2. `osc.type = 'sine'` — najcichszy przebieg przy danej amplitudzie, bo nie ma
   harmonicznych.
3. **660 Hz** — poniżej pasma, w którym małe głośniki telefonów mają sens;
   ich sprawność rośnie dopiero powyżej ok. 800 Hz.

Co zrobione:

- **Przebieg prostokątny + dołożona oktawa (sinus, 0.5)** — nieparzyste
  harmoniczne przebijają się przez hałas nieporównanie lepiej niż sinus.
- **Pasmo 820–1976 Hz** zamiast 660 — szczyt czułości ucha i sprawności głośnika.
- **`DynamicsCompressor` na wyjściu** (`threshold -20, ratio 12, attack 0.002`).
  To jest klucz: pozwala podbić sygnał grubo powyżej tego, co zniósłby czysty
  tor, bez trzasków. Bez kompresora poziom „głośny" przesterowywał.
- **Dłuższe tony** — 0.15 s zamiast 0.09 dla odliczania (ucho całkuje głośność
  przez ok. 100–200 ms, więc bardzo krótki dźwięk jest słyszany jako cichszy).
- **Odliczanie od 5 s zamiast 3**, z wysokością rosnącą co sekundę
  (820 → 1100 Hz), więc samo brzmienie mówi, ile zostało.
- **Sygnał końca grany dwa razy** (fraza 1175/1568/1976 Hz, powtórzona po 1,1 s).
- **Wibracja** przy każdym ticku (70 ms) i mocniejszy wzorzec na koniec.
- **Trzy poziomy głośności** w Ustawieniach (`recomppro_sound_level`:
  cichy 0.30 / normalny 0.80 / głośny 1.70) z przyciskiem „Odtwórz próbkę".
  Wybór poziomu od razu odtwarza próbkę.

Architektura dźwięku: `audioCtx -> compressor (audioBus) -> masterGain -> destination`.
Wszystkie tony wpinają się w `audioBus`, `masterGain` trzyma poziom z ustawień.
`beep()` zostawione jako alias `tone()` dla zgodności wstecz.

**Ograniczenie do zakomunikowania użytkownikowi:** WebAudio idzie przez kanał
multimediów, nie dzwonka. Jeśli ten kanał jest ściszony, żadne ustawienie
w aplikacji tego nie przebije.

`sw.js`: `CACHE_NAME` → `recomppro-v8`

## Aplikacja nie aktualizowała się na telefonie (10.11.2026) — PRZYCZYNA ŹRÓDŁOWA

Użytkownik zamknął i otworzył aplikację kilka razy i nadal miał starą wersję,
mimo że pliki na GitHub Pages były poprawne. To nie był przypadek — do v8
aktualizacja **nie mogła** zadziałać niezawodnie:

1. `sw.js` serwował **wyłącznie z cache**: `caches.match(req).then(c => c || fetch(req))`.
   Raz zapisany plik był podawany w nieskończoność. Sieć była odpytywana tylko
   wtedy, gdy czegoś w cache NIE było.
2. Jedyną drogą do nowego kodu była podmiana samego `sw.js` — przeglądarka
   instaluje nowego workera, gdy wykryje w nim różnicę bajtową. Ale `sw.js`
   jest pobierany zwykłym żądaniem HTTP i **GitHub Pages podaje go z własnym
   nagłówkiem cache**. `netlify.toml` ustawia dla niego `no-cache`, ale ten plik
   **działa tylko na Netlify i na Pages jest całkowicie ignorowany**.
3. Dodatkowo `cache.addAll()` przy instalacji pobierał pliki przez cache HTTP,
   więc nowy worker potrafił zapisać do swojego cache STARE pliki.

Czyli podbijanie `CACHE_NAME` przy każdym wydaniu — co robiliśmy od v5 do v8 —
było zabiegiem, który działał tylko wtedy, gdy przeglądarka akurat zechciała
pobrać świeży `sw.js`. Rada „otwórz aplikację dwa razy" opierała się na tym
samym przypadku i dlatego bywała skuteczna, a bywała nie.

### Naprawa (v9)

- **`sw.js` przepisany na network-first** z limitem 3,5 s i zapasem z cache.
  Online = zawsze świeży kod. Offline/słaby zasięg = cache, jak dotąd.
- `cache.addAll()` z `new Request(u, {cache:'reload'})` — omija cache HTTP.
- Obsługa `message: 'skipWaiting'`, żeby strona mogła wymusić przejęcie.
- Przechwytywane są tylko **GET** i tylko **ten sam origin** — POST do Apps
  Script i żądania do Google nigdy nie przechodzą przez workera.
- `app.js`: `reg.update()` przy starcie, przy każdym powrocie do aplikacji
  (`visibilitychange`) i raz na godzinę; `controllerchange` → jednorazowy
  `location.reload()`, więc nowa wersja wchodzi sama, bez zamykania aplikacji.
- **`APP_VERSION` w `data.js`, pokazywana w Ustawieniach** — od tej pory
  wystarczy spojrzeć, żeby wiedzieć, co jest zainstalowane. Tego brakowało
  i dlatego diagnoza zajęła tyle czasu.
- Przyciski **„Sprawdź aktualizację"** (porównuje `APP_VERSION` z serwerem,
  pobierając `data.js` z `cache:'no-store'`) i **„Wyczyść i pobierz na nowo"**
  (wyrejestrowuje workera i kasuje wszystkie cache; dane użytkownika
  w localStorage i IndexedDB zostają nietknięte).

**Przy każdym wydaniu podnoś `APP_VERSION` w `data.js` RAZEM z `CACHE_NAME` w `sw.js`.**
