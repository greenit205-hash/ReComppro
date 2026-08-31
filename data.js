// Dane treningów wyciągnięte z dokumentu planu (bez przypisania do dni tygodnia)
// FAZA 3 - zaktualizowano wg planu "Rekompozycja Sylwetki v2" (sierpień 2026)
// Zmiany względem Fazy 2:
//   - dodane cele RIR dla każdego ćwiczenia (progresja podwójna)
//   - wiosłowanie sztangą zamiast ściągania drążka w A (7 serii wiosłowania poziomego/tydz.)
//   - wznosy bokiem w A i C (8 serii/tydz. zamiast 3)
//   - uginanie podudzi na ławeczce w B i D zamiast hantla ściskanego stopami
//   - odwodzenie w opadzie zamiast pulloveru w C
//   - Pallof press zamiast dead buga w D
//   - zniesione AMRAP (podciąganie/dipy mają konkretne zakresy)
const CURRENT_PHASE = 3;

// Cykl treningowy: 6 tygodni pracy + 1 tydzień deloadu
const CYCLE_WEEKS = 7;
const DELOAD_WEEK = 7;
const DELOAD_SETS = 2;   // ile serii w tygodniu deloadu
const DELOAD_RIR = 4;    // docelowy RIR w tygodniu deloadu

// Domyślne przerwy dla stopera, gdy ćwiczenie nie ma własnej wartości
const DEFAULT_REST = 120;

// step = o ile dokładać ciężar po osiągnięciu górnej granicy zakresu we wszystkich seriach
// rest = długość przerwy po serii w sekundach (stoper startuje po odhaczeniu serii)
// ssNext = po tym ćwiczeniu od razu idziesz do partnera superserii (krótkie przejście)
const WORKOUTS = {
  A: {
    label: "Trening A",
    subtitle: "Góra – klatka, wiosłowanie, barki boczne",
    exercises: [
      { id: "p3a1", rest: 180, name: "Wyciskanie hantli na ławce poziomej", equip: "Ławka + Hantle", sets: 4, repRange: "6-8", rirTarget: 2, step: 2.5, note: "Schodź hantlami głęboko, łopatki ściągnięte. Rozgrzewka: 2–3 serie narastające." },
      { id: "p3a2", rest: 150, name: "Wiosłowanie sztangą w opadzie", equip: "Sztanga", sets: 4, repRange: "8-10", rirTarget: 2, step: 2.5, note: "Tułów ok. 45°, łokcie prowadzone do bioder. To jest ćwiczenie na postawę — nie oszczędzaj na nim." },
      { id: "p3a3", rest: 150, name: "Wyciskanie sztangi na ławce skośnej (30°)", equip: "Ławka skośna + Sztanga", sets: 3, repRange: "8-10", rirTarget: 2, step: 2.5, note: "Górna część klatki. Opuszczanie kontrolowane, ok. 2 s." },
      { id: "p3a4", rest: 20, ssNext: true, name: "Wznosy ramion bokiem na wyciągu dolnym", equip: "Wyciąg dolny + Uchwyt", sets: 4, repRange: "12-15", rirTarget: 1, step: 2.5, note: "Superseria z Face Pulls. Lekko pochylony, ramię prowadzi łokieć — nie nadgarstek." },
      { id: "p3a5", rest: 90, name: "Face Pulls", equip: "Wyciąg górny + Sznur", sets: 3, repRange: "15-20", rirTarget: 1, step: 2.5, note: "Superseria. Łokcie wyżej niż linia barków, rozejście rąk na końcu ruchu." },
      { id: "p3a6", rest: 20, ssNext: true, name: "Prostowanie ramion na wyciągu ze sznurem", equip: "Wyciąg górny + Sznur", sets: 3, repRange: "10-12", rirTarget: 1, step: 2.5, note: "Superseria z bicepsem. Rozejście sznura w dolnej fazie." },
      { id: "p3a7", rest: 90, name: "Uginanie ramion z hantlami z supinacją", equip: "Hantle (siedząc)", sets: 3, repRange: "10-12", rirTarget: 1, step: 2.5, note: "Superseria. Obracaj nadgarstki na zewnątrz w górnej fazie." }
    ]
  },
  B: {
    label: "Trening B",
    subtitle: "Dół – nacisk czworogłowe",
    exercises: [
      { id: "p3b1", rest: 210, name: "Przysiad ze sztangą na karku", equip: "Podpory + Sztanga", sets: 4, repRange: "5-8", rirTarget: 2, step: 5, note: "Co najmniej do kąta prostego, najlepiej niżej. Kolana podążają za stopami. Rozgrzewka: 3 serie narastające." },
      { id: "p3b2", rest: 180, name: "Rumuński Martwy Ciąg (RDL)", equip: "Sztanga", sets: 3, repRange: "8-10", rirTarget: 2, step: 5, note: "Ruch zawiasowy w biodrach, sztanga blisko ud. Kończysz, gdy plecy zaczynają się zaokrąglać." },
      { id: "p3b3", rest: 90, name: "Przysiady bułgarskie", equip: "Ławka + Hantle", sets: 3, repRange: "10-12", rirTarget: 1, step: 2.5, perLeg: true, note: "Tułów lekko w przód = więcej pośladka, pionowo = więcej czworogłowego." },
      { id: "p3b4", rest: 90, name: "Uginanie podudzi leżąc", equip: "Ławeczka do uginania", sets: 3, repRange: "10-12", rirTarget: 1, step: 2.5, note: "Wałek/ręcznik pod miednicą — lekkie zgięcie bioder wydłuża dwugłowe. Opuszczanie 3 s." },
      { id: "p3b5", rest: 90, name: "Wspięcia na palce stojąc ze sztangą", equip: "Sztanga + Podest", sets: 4, repRange: "10-15", rirTarget: 1, step: 5, note: "Pauza 2 s w pełnym rozciągnięciu na dole. To ta pauza robi robotę." },
      { id: "p3b6", rest: 60, name: "Wznosy kolan w zwisie na drążku", equip: "Drążek drabinkowy", sets: 3, repRange: "12-15", rirTarget: 1, step: 2.5, note: "Miednica do klatki, opuszczanie 3 s." }
    ]
  },
  C: {
    label: "Trening C",
    subtitle: "Góra – podciąganie, barki, ramiona",
    exercises: [
      { id: "p3c1", rest: 180, name: "Podciąganie na drążku", equip: "Drążek drabinkowy (+ obciążenie)", sets: 4, repRange: "6-10", rirTarget: 1, step: 2.5, note: "Ostatnia seria do upadku technicznego. Gdy pierwsza seria daje 12+, dołóż obciążenie (plecak/pas)." },
      { id: "p3c2", rest: 150, name: "Wyciskanie hantli siedząc (oparcie ~80°)", equip: "Ławka skośna + Hantle", sets: 4, repRange: "6-8", rirTarget: 2, step: 2.5, note: "Oparcie chroni lędźwie. Nie blokuj łokci na górze." },
      { id: "p3c3", rest: 90, name: "Wiosłowanie hantlem jednorącz", equip: "Ławka + Hantel", sets: 3, repRange: "10-12", rirTarget: 1, step: 2.5, perSide: true, note: "Łokieć do biodra, pełne rozciągnięcie na dole." },
      { id: "p3c4", rest: 150, name: "Pompki na poręczach (Dipy)", equip: "Poręcze 2w1", sets: 3, repRange: "8-12", rirTarget: 1, step: 2.5, note: "Ostatnia seria do upadku. Tułów pochylony w przód = klatka, pionowo = triceps." },
      { id: "p3c5", rest: 20, ssNext: true, name: "Wznosy ramion bokiem z hantlami", equip: "Hantle", sets: 4, repRange: "12-15", rirTarget: 1, step: 2.5, note: "Superseria z odwodzeniem w opadzie. Ostatnia seria: dropset o jeden hantel niżej." },
      { id: "p3c6", rest: 90, name: "Odwodzenie ramion w opadzie (rear delt fly)", equip: "Hantle lub Wyciąg", sets: 3, repRange: "15-20", rirTarget: 1, step: 2.5, note: "Superseria. Lekki ciężar, ruch łopatkami — nie szarpaniem tułowia." },
      { id: "p3c7", rest: 30, ssNext: true, name: "Wyciskanie sztangi w wąskim chwycie", equip: "Ławka pozioma + Sztanga", sets: 3, repRange: "8-10", rirTarget: 1, step: 2.5, note: "Superseria z bicepsem. Chwyt na szerokość barków, łokcie przy tułowiu." },
      { id: "p3c8", rest: 120, name: "Uginanie ramion chwytem młotkowym", equip: "Hantle", sets: 3, repRange: "10-12", rirTarget: 1, step: 2.5, note: "Superseria. Ramienno-promieniowy — dodaje grubości ramieniu." }
    ]
  },
  D: {
    label: "Trening D",
    subtitle: "Dół – nacisk pośladki i tył uda",
    exercises: [
      { id: "p3d1", rest: 180, name: "Wypychanie bioder ze sztangą (Hip Thrust)", equip: "Ławka + Sztanga + Gąbka", sets: 4, repRange: "8-10", rirTarget: 2, step: 5, note: "Zatrzymanie 1 s na górze, żebra ściągnięte — bez przeprostu lędźwi." },
      { id: "p3d2", rest: 180, name: "Przysiady przednie (Front Squat)", equip: "Podpory + Sztanga", sets: 3, repRange: "6-8", rirTarget: 2, step: 5, note: "Łokcie wysoko, tułów pionowo. Jeśli bolą nadgarstki — chwyt krzyżowy. Zamiennik przy zmęczonych lędźwiach: wyprosty na ławce rzymskiej 3×12–15." },
      { id: "p3d3", rest: 75, name: "Uginanie podudzi leżąc", equip: "Ławeczka do uginania", sets: 3, repRange: "15-20", rirTarget: 1, step: 2.5, note: "Wyższy zakres niż w treningu B — inne włókna, mniejszy koszt regeneracyjny. Pauza 1 s w skurczu." },
      { id: "p3d4", rest: 90, name: "Wchodzenie na ławkę (Step-ups)", equip: "Ławka + Hantle", sets: 3, repRange: "10-12", rirTarget: 1, step: 2.5, perLeg: true, note: "Cały nacisk na piętę nogi stojącej na ławce, schodzenie wolne (3 s)." },
      { id: "p3d5", rest: 75, name: "Wspięcia na palce siedząc", equip: "Ławka + Sztanga na udach", sets: 3, repRange: "12-15", rirTarget: 1, step: 5, note: "Pauza 2 s w dole. Siad izoluje mięsień płaszczkowaty." },
      { id: "p3d6", rest: 60, name: "Pallof Press", equip: "Wyciąg + Uchwyt", sets: 3, repRange: "12-15", rirTarget: 1, step: 2.5, perSide: true, note: "Antyrotacja rdzenia. Alternatywa: Dead Bug z hantlem 3×15/str." }
    ]
  }
};
