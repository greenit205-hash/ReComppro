// Dane treningów wyciągnięte z dokumentu planu (bez przypisania do dni tygodnia)
// FAZA 2 - zaktualizowano wg raportu "Rekompozycja Sylwetki" (rotacja ćwiczeń akcesoryjnych, lipiec/sierpień 2026)
const CURRENT_PHASE = 2;

const WORKOUTS = {
  A: {
    label: "Trening A",
    subtitle: "Góra ciała – Push & Wyciągi",
    exercises: [
      { id: "p2a1", name: "Wyciskanie hantli na ławce poziomej", equip: "Ławka + Hantle", sets: 4, repRange: "6-8", note: "Większy zakres ruchu niż przy sztandze. Schodź hantlami głęboko." },
      { id: "p2a2", name: "Ściąganie drążka wyciągu chwytem neutralnym (równoległym)", equip: "Wyciąg górny + Uchwyt równoległy", sets: 3, repRange: "8-10", note: "Mocniejsze zaangażowanie dolnej części mięśnia najszerszego grzbietu." },
      { id: "p2a3", name: "Wyciskanie sztangi na ławce skośnej (30°)", equip: "Ławka skośna + Sztanga", sets: 3, repRange: "8-10", note: "Rozwój górnego rejonu klatki (obojczykowego). Pełna kontrola opuszczania." },
      { id: "p2a4", name: "Wznosy ramion bokiem na wyciągu dolnym", equip: "Wyciąg dolny + Pojedynczy uchwyt", sets: 3, repRange: "12-15", note: "Superseria z Face Pulls." },
      { id: "p2a5", name: "Face Pulls (przyciąganie sznura do twarzy)", equip: "Wyciąg górny + Sznur", sets: 3, repRange: "15-20", note: "Superseria. Łokcie prowadzone wyżej niż linia barków." },
      { id: "p2a6", name: "Uginanie ramion z hantlami z supinacją", equip: "Ławka (siedząc) + Hantle", sets: 3, repRange: "10-12", note: "Superseria z tricepsem. Obracaj nadgarstki na zewnątrz w górnej fazie." },
      { id: "p2a7", name: "Prostowanie ramion na wyciągu z prostym drążkiem (podchwyt)", equip: "Wyciąg górny + Prosty drążek", sets: 3, repRange: "12-15", note: "Superseria. Zmiana chwytu na podchwyt mocniej stymuluje głowę boczną tricepsa." }
    ]
  },
  B: {
    label: "Trening B",
    subtitle: "Dół ciała – Przód uda i Brzuch",
    exercises: [
      { id: "p2b1", name: "Przysiady ze sztangą na karku", equip: "Podpory + Sztanga", sets: 4, repRange: "6-8", note: "Fundament. Schodzenie co najmniej do kąta prostego." },
      { id: "p2b2", name: "Rumuński Martwy Ciąg (RDL)", equip: "Sztanga lub Hantle", sets: 3, repRange: "8-10", note: "Fundament. Ruch zawiasowy w biodrach." },
      { id: "p2b3", name: "Przysiady bułgarskie (wykroki z tylną nogą podpartą)", equip: "Ławka + Hantle", sets: 3, repRange: "10-12/noga", note: "Zejście pionowo w dół, praca nogi wykrocznej.", perLeg: true },
      { id: "p2b4", name: "Wyprosty tułowia na ławce rzymskiej", equip: "Ławka rzymska (+ obciążenie)", sets: 3, repRange: "12-15", note: "Pełne rozciągnięcie na dole, omijaj przeprost u góry." },
      { id: "p2b5", name: "Wspięcia na palce stojąc ze sztangą", equip: "Sztanga + Podest", sets: 4, repRange: "15-20", note: "Pauza 2-sekundowa w maksymalnym rozciągnięciu." },
      { id: "p2b6", name: "Wznosy kolan w zwisie na drążku", equip: "Drążek drabinkowy", sets: 3, repRange: "12-15", note: "Ściągaj miednicę w stronę klatki piersiowej, kontroluj opuszczanie." }
    ]
  },
  C: {
    label: "Trening C",
    subtitle: "Góra ciała – Pull & Klatka",
    exercises: [
      { id: "p2c1", name: "Podciąganie na drążku", equip: "Drążek drabinkowy", sets: 3, repRange: "AMRAP", note: "Do upadku technicznego." },
      { id: "p2c2", name: "Wyciskanie hantli siedząc (kąt ok. 80°)", equip: "Ławka skośna + Hantle", sets: 3, repRange: "6-8", note: "Stabilne oparcie pozwala mocniej wyizolować pracę barków." },
      { id: "p2c3", name: "Wiosłowanie hantlem jednorącz w oparciu o ławkę", equip: "Ławka + Hantel", sets: 3, repRange: "10-12/str.", note: "Ruch prowadzony łokciem w stronę biodra.", perSide: true },
      { id: "p2c4", name: "Pompki na poręczach (Dipy)", equip: "Poręcze 2w1", sets: 3, repRange: "AMRAP", note: "Skieruj tułów w dół dla mocnego uderzenia w klatkę." },
      { id: "p2c5", name: "Przenoszenie hantla za głowę (Pullover)", equip: "Ławka pozioma + Hantel", sets: 3, repRange: "12-15", note: "Silnie rozciąga klatkę i angażuje najszerszy grzbietu." },
      { id: "p2c6", name: "Wyciskanie sztangi w wąskim chwycie", equip: "Ławka pozioma + Sztanga", sets: 3, repRange: "8-10", note: "Superseria z bicepsem. Potężne ćwiczenie budujące masę tricepsów." },
      { id: "p2c7", name: "Uginanie ramion chwytem młotkowym", equip: "Hantle", sets: 3, repRange: "10-12", note: "Superseria. Buduje mięsień ramienno-promieniowy i wypycha biceps na zewnątrz." }
    ]
  },
  D: {
    label: "Trening D",
    subtitle: "Dół ciała – Tył uda i Brzuch",
    exercises: [
      { id: "p2d1", name: "Wypychanie bioder ze sztangą (Hip Thrust)", equip: "Ławka + Sztanga + Gąbka", sets: 4, repRange: "8-10", note: "Najsilniejszy aktywator mięśni pośladkowych. Zatrzymanie na górze 1 sek." },
      { id: "p2d2", name: "Przysiady przednie (Front Squat) ze sztangą", equip: "Podpory + Sztanga", sets: 3, repRange: "8-10", note: "Sztanga z przodu narzuca idealnie pionową postawę i izoluje czworogłowe uda." },
      { id: "p2d3", name: "Uginanie podudzi leżąc z hantlem", equip: "Mata + Hantel", sets: 3, repRange: "12-15", note: "Ściśnij hantel stopami. Wolne, kontrolowane opuszczanie." },
      { id: "p2d4", name: "Wchodzenie na ławkę (Step-ups) z hantlami", equip: "Ławka + Hantle", sets: 3, repRange: "10-12/noga", note: "Praca jednonóż. Bardzo wolno opuszczaj ciało w dół, kontrolując ciężar.", perLeg: true },
      { id: "p2d5", name: "Wspięcia na palce siedząc", equip: "Ławka + Sztanga/Hantle", sets: 3, repRange: "15-20", note: "Praca w siadzie stymuluje wyizolowanie mięśnia płaszczkowatego." },
      { id: "p2d6", name: "Dead Bug (Martwy Robak) z obciążeniem", equip: "Mata + Hantel", sets: 3, repRange: "15-20/str.", note: "Izometryczna stabilizacja rdzenia i wciśnięcie lędźwi w matę.", perSide: true }
    ]
  }
};
