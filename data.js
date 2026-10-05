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
//   - pary antagonistyczne (pole "pair") — skracają trening bez skracania przerwy
//     dla danego mięśnia; kolejność ćwiczeń ustawiona tak, by partnerzy sąsiadowali
const CURRENT_PHASE = 3;

// Cykl treningowy: 6 tygodni pracy + 1 tydzień deloadu
const CYCLE_WEEKS = 7;
const DELOAD_WEEK = 7;
const DELOAD_SETS = 2;   // ile serii w tygodniu deloadu
const DELOAD_RIR = 4;    // docelowy RIR w tygodniu deloadu

// Domyślne przerwy dla stopera, gdy ćwiczenie nie ma własnej wartości
const DEFAULT_REST = 120;

// Tryby tempa treningu — mnożnik długości przerw.
// Ćwiczenia oznaczone anchor:true (ciężkie boje) mają twardą podłogę ANCHOR_FLOOR,
// bo skracanie przerwy akurat tam kosztuje powtórzenia w kolejnych seriach.
const REST_MODES = {
  standard: { label: 'Standard',  scale: 1.00, desc: 'Pełne przerwy — najlepszy bodziec.' },
  szybki:   { label: 'Szybki',    scale: 0.75, desc: 'Krótsze przerwy przy izolacjach, boje bez zmian.' },
  ekspres:  { label: 'Ekspres',   scale: 0.55, desc: 'Maksymalnie zwięźle. Licz się z mniejszą liczbą powtórzeń.' }
};
const ANCHOR_FLOOR = 120;
// transition:true = przerwa to tylko przejście do partnera pary, a nie regeneracja,
// więc NIE obowiązuje jej podłoga ANCHOR_FLOOR (inaczej parowanie nic by nie dawało)

// step = o ile dokładać ciężar po osiągnięciu górnej granicy zakresu we wszystkich seriach
// rest = długość przerwy po serii w sekundach (stoper startuje po odhaczeniu serii)
// ssNext = po tym ćwiczeniu od razu idziesz do partnera superserii (krótkie przejście)
const PLAN_4 = {
  A: {
    label: "Trening A",
    subtitle: "Góra – klatka, wiosłowanie, barki boczne",
    exercises: [
      { id: "p3a1", rest: 50, pair: "p3a2", transition: true, anchor: true, name: "Wyciskanie hantli na ławce poziomej", equip: "Ławka + Hantle", sets: 4, repRange: "6-8", rirTarget: 2, step: 2.5, note: "Schodź hantlami głęboko, łopatki ściągnięte. Rozgrzewka: 2–3 serie narastające." },
      { id: "p3a2", rest: 150, pair: "p3a1", anchor: true, name: "Wiosłowanie sztangą w opadzie", equip: "Sztanga", sets: 4, repRange: "8-10", rirTarget: 2, step: 2.5, note: "Tułów ok. 45°, łokcie prowadzone do bioder. To jest ćwiczenie na postawę — nie oszczędzaj na nim." },
      { id: "p3a3", rest: 50, pair: "p3a5", transition: true, anchor: true, name: "Wyciskanie sztangi na ławce skośnej (30°)", equip: "Ławka skośna + Sztanga", sets: 3, repRange: "8-10", rirTarget: 2, step: 2.5, note: "Górna część klatki. Opuszczanie kontrolowane, ok. 2 s." },
      { id: "p3a5", rest: 110, pair: "p3a3", name: "Face Pulls", equip: "Wyciąg górny + Sznur", sets: 3, repRange: "15-20", rirTarget: 1, step: 2.5, note: "Superseria. Łokcie wyżej niż linia barków, rozejście rąk na końcu ruchu." },
      { id: "p3a4", rest: 60, name: "Wznosy ramion bokiem na wyciągu dolnym", equip: "Wyciąg dolny + Uchwyt", sets: 4, repRange: "12-15", rirTarget: 1, step: 2.5, note: "Superseria z Face Pulls. Lekko pochylony, ramię prowadzi łokieć — nie nadgarstek." },
      { id: "p3a6", rest: 25, pair: "p3a7", transition: true, name: "Prostowanie ramion na wyciągu ze sznurem", equip: "Wyciąg górny + Sznur", sets: 3, repRange: "10-12", rirTarget: 1, step: 2.5, note: "Superseria z bicepsem. Rozejście sznura w dolnej fazie." },
      { id: "p3a7", rest: 80, pair: "p3a6", name: "Uginanie ramion z hantlami z supinacją", equip: "Hantle (siedząc)", sets: 3, repRange: "10-12", rirTarget: 1, step: 2.5, note: "Superseria. Obracaj nadgarstki na zewnątrz w górnej fazie." }
    ]
  },
  B: {
    label: "Trening B",
    subtitle: "Dół – nacisk czworogłowe",
    exercises: [
      { id: "p3b1", rest: 210, anchor: true, name: "Przysiad ze sztangą na karku", equip: "Podpory + Sztanga", sets: 4, repRange: "5-8", rirTarget: 2, step: 5, note: "Co najmniej do kąta prostego, najlepiej niżej. Kolana podążają za stopami. Rozgrzewka: 3 serie narastające." },
      { id: "p3b2", rest: 45, pair: "p3b6", transition: true, anchor: true, name: "Rumuński Martwy Ciąg (RDL)", equip: "Sztanga", sets: 3, repRange: "8-10", rirTarget: 2, step: 5, note: "Ruch zawiasowy w biodrach, sztanga blisko ud. Kończysz, gdy plecy zaczynają się zaokrąglać." },
      { id: "p3b6", rest: 140, pair: "p3b2", name: "Wznosy kolan w zwisie na drążku", equip: "Drążek drabinkowy", sets: 3, repRange: "12-15", rirTarget: 1, step: 2.5, note: "Miednica do klatki, opuszczanie 3 s." },
      { id: "p3b3", rest: 90, name: "Przysiady bułgarskie", equip: "Ławka + Hantle", sets: 3, repRange: "10-12", rirTarget: 1, step: 2.5, perLeg: true, note: "Tułów lekko w przód = więcej pośladka, pionowo = więcej czworogłowego." },
      { id: "p3b4", rest: 35, pair: "p3b5", transition: true, name: "Uginanie podudzi leżąc", equip: "Ławeczka do uginania", sets: 3, repRange: "10-12", rirTarget: 1, step: 2.5, note: "Wałek/ręcznik pod miednicą — lekkie zgięcie bioder wydłuża dwugłowe. Opuszczanie 3 s." },
      { id: "p3b5", rest: 75, pair: "p3b4", name: "Wspięcia na palce stojąc ze sztangą", equip: "Sztanga + Podest", sets: 4, repRange: "10-15", rirTarget: 1, step: 5, note: "Pauza 2 s w pełnym rozciągnięciu na dole. To ta pauza robi robotę." }
    ]
  },
  C: {
    label: "Trening C",
    subtitle: "Góra – podciąganie, barki, ramiona",
    exercises: [
      { id: "p3c1", rest: 50, pair: "p3c2", transition: true, anchor: true, name: "Podciąganie na drążku", equip: "Drążek drabinkowy (+ obciążenie)", sets: 4, repRange: "6-10", rirTarget: 1, step: 2.5, note: "Ostatnia seria do upadku technicznego. Gdy pierwsza seria daje 12+, dołóż obciążenie (plecak/pas)." },
      { id: "p3c2", rest: 150, pair: "p3c1", anchor: true, name: "Wyciskanie hantli siedząc (oparcie ~80°)", equip: "Ławka skośna + Hantle", sets: 4, repRange: "6-8", rirTarget: 2, step: 2.5, note: "Oparcie chroni lędźwie. Nie blokuj łokci na górze." },
      { id: "p3c4", rest: 45, pair: "p3c3", transition: true, anchor: true, name: "Pompki na poręczach (Dipy)", equip: "Poręcze 2w1", sets: 3, repRange: "8-12", rirTarget: 1, step: 2.5, note: "Ostatnia seria do upadku. Tułów pochylony w przód = klatka, pionowo = triceps." },
      { id: "p3c3", rest: 110, pair: "p3c4", name: "Wiosłowanie hantlem jednorącz", equip: "Ławka + Hantel", sets: 3, repRange: "10-12", rirTarget: 1, step: 2.5, perSide: true, note: "Łokieć do biodra, pełne rozciągnięcie na dole." },
      { id: "p3c5", rest: 25, pair: "p3c6", transition: true, name: "Wznosy ramion bokiem z hantlami", equip: "Hantle", sets: 4, repRange: "12-15", rirTarget: 1, step: 2.5, note: "Superseria z odwodzeniem w opadzie. Ostatnia seria: dropset o jeden hantel niżej." },
      { id: "p3c6", rest: 80, pair: "p3c5", name: "Odwodzenie ramion w opadzie (rear delt fly)", equip: "Hantle lub Wyciąg", sets: 3, repRange: "15-20", rirTarget: 1, step: 2.5, note: "Superseria. Lekki ciężar, ruch łopatkami — nie szarpaniem tułowia." },
      { id: "p3c7", rest: 30, pair: "p3c8", transition: true, name: "Wyciskanie sztangi w wąskim chwycie", equip: "Ławka pozioma + Sztanga", sets: 3, repRange: "8-10", rirTarget: 1, step: 2.5, note: "Superseria z bicepsem. Chwyt na szerokość barków, łokcie przy tułowiu." },
      { id: "p3c8", rest: 100, pair: "p3c7", name: "Uginanie ramion chwytem młotkowym", equip: "Hantle", sets: 3, repRange: "10-12", rirTarget: 1, step: 2.5, note: "Superseria. Ramienno-promieniowy — dodaje grubości ramieniu." }
    ]
  },
  D: {
    label: "Trening D",
    subtitle: "Dół – nacisk pośladki i tył uda",
    exercises: [
      { id: "p3d1", rest: 180, anchor: true, name: "Wypychanie bioder ze sztangą (Hip Thrust)", equip: "Ławka + Sztanga + Gąbka", sets: 4, repRange: "8-10", rirTarget: 2, step: 5, note: "Zatrzymanie 1 s na górze, żebra ściągnięte — bez przeprostu lędźwi." },
      { id: "p3d2", rest: 180, anchor: true, name: "Przysiady przednie (Front Squat)", equip: "Podpory + Sztanga", sets: 3, repRange: "6-8", rirTarget: 2, step: 5, note: "Łokcie wysoko, tułów pionowo. Jeśli bolą nadgarstki — chwyt krzyżowy. Zamiennik przy zmęczonych lędźwiach: wyprosty na ławce rzymskiej 3×12–15." },
      { id: "p3d3", rest: 30, pair: "p3d5", transition: true, name: "Uginanie podudzi leżąc", equip: "Ławeczka do uginania", sets: 3, repRange: "15-20", rirTarget: 1, step: 2.5, note: "Wyższy zakres niż w treningu B — inne włókna, mniejszy koszt regeneracyjny. Pauza 1 s w skurczu." },
      { id: "p3d5", rest: 75, pair: "p3d3", name: "Wspięcia na palce siedząc", equip: "Ławka + Sztanga na udach", sets: 3, repRange: "12-15", rirTarget: 1, step: 5, note: "Pauza 2 s w dole. Siad izoluje mięsień płaszczkowaty." },
      { id: "p3d4", rest: 35, pair: "p3d6", transition: true, name: "Wchodzenie na ławkę (Step-ups)", equip: "Ławka + Hantle", sets: 3, repRange: "10-12", rirTarget: 1, step: 2.5, perLeg: true, note: "Cały nacisk na piętę nogi stojącej na ławce, schodzenie wolne (3 s)." },
      { id: "p3d6", rest: 90, pair: "p3d4", name: "Pallof Press", equip: "Wyciąg + Uchwyt", sets: 3, repRange: "12-15", rirTarget: 1, step: 2.5, perSide: true, note: "Antyrotacja rdzenia. Alternatywa: Dead Bug z hantlem 3×15/str." }
    ]
  }
};

/* ===================================================================
   WARIANT 3-DNIOWY — trzy sesje całego ciała
   -------------------------------------------------------------------
   Przy 3 dniach podział góra/dół się nie spina: każda partia dostałaby
   bodziec raz na tydzień albo rzadziej. Dlatego trzy sesje całego ciała
   — każda ma jeden ciężki bój na dół, jedno pchanie, jedno ciągnięcie
   i akcesoria, a partie wracają co 2–3 dni.

   Identyfikatory ćwiczeń są CELOWO te same co w planie 4-dniowym
   (p3a1, p3b1...). Dzięki temu ciężary i progresja przechodzą między
   wariantami — przysiad to ten sam przysiad niezależnie od tego, czy
   w danym tygodniu trenujesz 3 czy 4 razy.
   =================================================================== */
const PLAN_3 = {
  "1": {
    label: "Trening 1",
    subtitle: "Całe ciało – przysiad, klatka, wiosłowanie",
    exercises: [
      { id: "p3b1", rest: 210, anchor: true, name: "Przysiad ze sztangą na karku", equip: "Podpory + Sztanga", sets: 4, repRange: "5-8", rirTarget: 2, step: 5, note: "Główny bój sesji. Co najmniej do kąta prostego. Rozgrzewka: 3 serie narastające." },
      { id: "p3a1", rest: 50, pair: "p3a2", transition: true, anchor: true, name: "Wyciskanie hantli na ławce poziomej", equip: "Ławka + Hantle", sets: 3, repRange: "6-8", rirTarget: 2, step: 2.5, note: "Schodź hantlami głęboko, łopatki ściągnięte." },
      { id: "p3a2", rest: 150, pair: "p3a1", anchor: true, name: "Wiosłowanie sztangą w opadzie", equip: "Sztanga", sets: 3, repRange: "8-10", rirTarget: 2, step: 2.5, note: "Tułów ok. 45°, łokcie do bioder. Ćwiczenie na postawę — nie oszczędzaj na nim." },
      { id: "p3b4", rest: 35, pair: "p3a4", transition: true, name: "Uginanie podudzi leżąc", equip: "Ławeczka do uginania", sets: 3, repRange: "10-12", rirTarget: 1, step: 2.5, note: "Wałek pod miednicą, opuszczanie 3 s." },
      { id: "p3a4", rest: 75, pair: "p3b4", name: "Wznosy ramion bokiem na wyciągu dolnym", equip: "Wyciąg dolny + Uchwyt", sets: 4, repRange: "12-15", rirTarget: 1, step: 2.5, note: "W parze z uginaniem podudzi. Ramię prowadzi łokieć, nie nadgarstek." },
      { id: "p3b5", rest: 35, pair: "p3a7", transition: true, name: "Wspięcia na palce stojąc ze sztangą", equip: "Sztanga + Podest", sets: 3, repRange: "10-15", rirTarget: 1, step: 5, note: "Pauza 2 s w pełnym rozciągnięciu na dole." },
      { id: "p3a7", rest: 80, pair: "p3b5", name: "Uginanie ramion z hantlami z supinacją", equip: "Hantle (siedząc)", sets: 3, repRange: "10-12", rirTarget: 1, step: 2.5, note: "W parze z łydkami. Obracaj nadgarstki na zewnątrz u góry." }
    ]
  },
  "2": {
    label: "Trening 2",
    subtitle: "Całe ciało – biodra, podciąganie, barki",
    exercises: [
      { id: "p3d1", rest: 180, anchor: true, name: "Wypychanie bioder ze sztangą (Hip Thrust)", equip: "Ławka + Sztanga + Gąbka", sets: 3, repRange: "8-10", rirTarget: 2, step: 5, note: "Główny bój sesji. Zatrzymanie 1 s na górze, żebra ściągnięte." },
      { id: "p3c1", rest: 50, pair: "p3c2", transition: true, anchor: true, name: "Podciąganie na drążku", equip: "Drążek drabinkowy (+ obciążenie)", sets: 4, repRange: "6-10", rirTarget: 1, step: 2.5, note: "Jedyne ciągnięcie pionowe w tygodniu — stąd 4 serie. Ostatnia do upadku technicznego." },
      { id: "p3c2", rest: 150, pair: "p3c1", anchor: true, name: "Wyciskanie hantli siedząc (oparcie ~80°)", equip: "Ławka skośna + Hantle", sets: 3, repRange: "6-8", rirTarget: 2, step: 2.5, note: "Oparcie chroni lędźwie. Nie blokuj łokci na górze." },
      { id: "p3b2", rest: 45, pair: "p3b6", transition: true, anchor: true, name: "Rumuński Martwy Ciąg (RDL)", equip: "Sztanga", sets: 3, repRange: "8-10", rirTarget: 2, step: 5, note: "Ruch zawiasowy, sztanga blisko ud. Kończysz, gdy plecy się zaokrąglają." },
      { id: "p3b6", rest: 140, pair: "p3b2", name: "Wznosy kolan w zwisie na drążku", equip: "Drążek drabinkowy", sets: 3, repRange: "12-15", rirTarget: 1, step: 2.5, note: "Miednica do klatki, opuszczanie 3 s." },
      { id: "p3c5", rest: 25, pair: "p3c6", transition: true, name: "Wznosy ramion bokiem z hantlami", equip: "Hantle", sets: 4, repRange: "12-15", rirTarget: 1, step: 2.5, note: "Superseria z odwodzeniem w opadzie. Ostatnia seria: dropset o jeden hantel niżej." },
      { id: "p3c6", rest: 80, pair: "p3c5", name: "Odwodzenie ramion w opadzie (rear delt fly)", equip: "Hantle lub Wyciąg", sets: 3, repRange: "15-20", rirTarget: 1, step: 2.5, note: "Superseria. Ruch łopatkami, nie szarpaniem tułowia." }
    ]
  },
  "3": {
    label: "Trening 3",
    subtitle: "Całe ciało – jednonóż, klatka skośna, ramiona",
    exercises: [
      { id: "p3b3", rest: 100, anchor: true, name: "Przysiady bułgarskie", equip: "Ławka + Hantle", sets: 4, repRange: "10-12", rirTarget: 1, step: 2.5, perLeg: true, note: "Główny bój sesji — zastępuje przysiad ze sztangą. Tułów pionowo = więcej czworogłowego." },
      { id: "p3a3", rest: 50, pair: "p3c3", transition: true, anchor: true, name: "Wyciskanie sztangi na ławce skośnej (30°)", equip: "Ławka skośna + Sztanga", sets: 4, repRange: "8-10", rirTarget: 2, step: 2.5, note: "Druga z dwóch sesji na klatkę w tygodniu — stąd 4 serie. Opuszczanie ok. 2 s." },
      { id: "p3c3", rest: 110, pair: "p3a3", name: "Wiosłowanie hantlem jednorącz", equip: "Ławka + Hantel", sets: 3, repRange: "10-12", rirTarget: 1, step: 2.5, perSide: true, note: "Łokieć do biodra, pełne rozciągnięcie na dole." },
      { id: "p3d3", rest: 30, pair: "p3d5", transition: true, name: "Uginanie podudzi leżąc (wysoki zakres)", equip: "Ławeczka do uginania", sets: 3, repRange: "15-20", rirTarget: 1, step: 2.5, note: "Wyższy zakres niż w Treningu 1 — inne włókna, mniejszy koszt regeneracyjny." },
      { id: "p3d5", rest: 75, pair: "p3d3", name: "Wspięcia na palce siedząc", equip: "Ławka + Sztanga na udach", sets: 3, repRange: "12-15", rirTarget: 1, step: 5, note: "Pauza 2 s w dole. Siad izoluje mięsień płaszczkowaty." },
      { id: "p3a5", rest: 30, pair: "p3c7", transition: true, name: "Face Pulls", equip: "Wyciąg górny + Sznur", sets: 2, repRange: "15-20", rirTarget: 1, step: 2.5, note: "Łokcie wyżej niż linia barków, rozejście rąk na końcu." },
      { id: "p3c7", rest: 100, pair: "p3a5", name: "Wyciskanie sztangi w wąskim chwycie", equip: "Ławka pozioma + Sztanga", sets: 3, repRange: "8-10", rirTarget: 1, step: 2.5, note: "W parze z face pullsami. Chwyt na szerokość barków, łokcie przy tułowiu." },
      { id: "p3d6", rest: 60, name: "Pallof Press", equip: "Wyciąg + Uchwyt", sets: 2, repRange: "12-15", rirTarget: 1, step: 2.5, perSide: true, note: "Antyrotacja rdzenia. Alternatywa: Dead Bug z hantlem." }
    ]
  }
};

/* ===================== WYBÓR PLANU (3 albo 4 dni) ===================== */
const PLANS = {
  "4": { days: 4, label: "4 dni", short: "4-dniowy", workouts: PLAN_4,
         desc: "Góra / dół na przemian. Pełna objętość — najszybszy progres." },
  "3": { days: 3, label: "3 dni", short: "3-dniowy", workouts: PLAN_3,
         desc: "Trzy sesje całego ciała. Ok. 75% objętości, partie wracają co 2–3 dni." }
};
const DEFAULT_PLAN = "4";

function getPlanKey(){
  try{
    const k = localStorage.getItem('recomppro_plan');
    return PLANS[k] ? k : DEFAULT_PLAN;
  }catch(e){ return DEFAULT_PLAN; }
}

// WORKOUTS jest podmieniane w locie przy zmianie planu (patrz setPlanKey w app.js),
// dlatego "let", a nie "const".
let WORKOUTS = PLANS[getPlanKey()].workouts;
