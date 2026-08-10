# RecompPro

Aplikacja PWA do zapisywania progresu na siłowni (treningi A/B/C/D) oraz raportów sylwetki (zdjęcia + obwody), z synchronizacją do Google Sheets/Drive.

---

## 1. Wgranie kodu na GitHub

### Opcja A — przez przeglądarkę (najprościej, bez terminala)

1. Wejdź na **github.com** i zaloguj się (lub załóż konto).
2. Kliknij **New repository** (zielony przycisk, prawy górny róg).
3. Nazwa repozytorium: np. `recomppro` → **Private** (jeśli nie chcesz, by ktoś obcy widział kod) → **Create repository**.
4. Na stronie nowego repo kliknij link **„uploading an existing file"**.
5. Przeciągnij tam **wszystkie pliki** z folderu `RecompPro` (index.html, app.js, data.js, manifest.json, sw.js, icon-192.png, icon-512.png, netlify.toml). **Pomiń `Code.gs`** — to osobny skrypt do Google, nie musi trafiać do repozytorium ze stroną.
6. Na dole kliknij **Commit changes**.

Gotowe — kod jest na GitHubie.

### Opcja B — przez terminal (jeśli wolisz Git)

W folderze `RecompPro` na swoim komputerze:

```bash
git init
git add index.html app.js data.js manifest.json sw.js icon-192.png icon-512.png netlify.toml README.md .gitignore
git commit -m "RecompPro - wersja początkowa"
git branch -M main
git remote add origin https://github.com/TWOJ-LOGIN/recomppro.git
git push -u origin main
```

(Adres `https://github.com/TWOJ-LOGIN/recomppro.git` znajdziesz na stronie repo po jego utworzeniu, przycisk **Code**.)

---

## 2. Publikacja strony — dwa sposoby

### Sposób 1: GitHub Pages (najprostszy, całkowicie darmowy, bez zewnętrznych kont)

1. W repozytorium na GitHub wejdź w **Settings → Pages** (menu po lewej).
2. Przy **Source** wybierz **Deploy from a branch**.
3. Branch: **main**, folder: **/ (root)** → **Save**.
4. Po ok. 1 minucie GitHub pokaże adres typu:
   `https://twoj-login.github.io/recomppro/`
5. Otwórz ten adres na telefonie → „Dodaj do ekranu głównego".

Każda kolejna zmiana w kodzie (po `git push` lub wgraniu nowego pliku przez przeglądarkę) automatycznie odświeży stronę w ciągu ok. 1 minuty.

### Sposób 2: Netlify połączony z GitHub (jeśli już masz konto Netlify)

Zamiast ręcznie przeciągać ZIP-y jak dotychczas, możesz podłączyć repo raz i mieć automatyczne wdrożenia:

1. Na netlify.com: **Add new site → Import an existing project**.
2. Wybierz **GitHub**, zaloguj się/autoryzuj, wybierz repozytorium `recomppro`.
3. Ustawienia builda zostaw puste (to statyczna strona, nic się nie kompiluje) → **Deploy**.
4. Od teraz każdy `git push` do `main` automatycznie aktualizuje stronę na Netlify — koniec z ręcznym przeciąganiem ZIP-a.

---

## 3. Backend Google (bez zmian względem wcześniejszej instrukcji)

Plik `Code.gs` wklejasz osobno do **Google Apps Script** (Rozszerzenia → Apps Script w arkuszu Google Sheets), wdrażasz jako aplikację internetową i wklejony adres `/exec` zapisujesz w aplikacji w zakładce **Ustawienia**. Ten krok nie zależy od tego, gdzie hostujesz samą stronę (GitHub Pages czy Netlify) — działa tak samo w obu przypadkach.

**Uwaga bezpieczeństwa:** adres webhooka nie jest zapisany w kodzie, tylko lokalnie w Twojej przeglądarce/telefonie (localStorage) — możesz spokojnie trzymać to repozytorium jako publiczne, jeśli chcesz, nikt nie zobaczy Twojego adresu Apps Script w kodzie źródłowym.

---

## 4. Aktualizacje w przyszłości

- **GitHub Pages:** po prostu podmień/wgraj zmienione pliki przez przeglądarkę (uploading an existing file) albo `git add . && git commit -m "opis zmiany" && git push`.
- **Netlify połączony z GitHub:** to samo, wdroży się automatycznie.
- **Stary sposób (ręczny ZIP na Netlify):** nadal działa, jeśli wolisz go zostawić równolegle — obie metody się nie wykluczają.
