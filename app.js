/* ===================== POMOCNICZE ===================== */
function todayISO(){
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off*60000).toISOString().slice(0,10);
}
function fmtDatePL(iso){
  const [y,m,d] = iso.split('-');
  const months = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru'];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}
function toast(msg, isErr){
  const t = document.createElement('div');
  t.className = 'toast' + (isErr ? ' err' : '');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 2600);
}
function ls_get(key, fallback){
  try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; }
}
function ls_set(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

/* ===================== CYKL TRENINGOWY / DELOAD ===================== */
// Cykl: 6 tygodni pracy + 7. tydzień deloadu, potem liczenie zaczyna się od nowa.
function getCycleStart(){ return localStorage.getItem('recomppro_cycle_start') || ''; }

function getCycleInfo(){
  const start = getCycleStart();
  if(!start) return null;
  const startDate = new Date(start + 'T00:00:00');
  const today = new Date(todayISO() + 'T00:00:00');
  const days = Math.floor((today - startDate) / 86400000);
  if(days < 0) return null;
  const absWeek = Math.floor(days / 7);                 // 0,1,2...
  const week = (absWeek % CYCLE_WEEKS) + 1;             // 1..7
  const cycleNo = Math.floor(absWeek / CYCLE_WEEKS) + 1;
  return { week, cycleNo, isDeload: week === DELOAD_WEEK };
}

function startNewCycle(){
  localStorage.setItem('recomppro_cycle_start', todayISO());
  renderCycleBanner();
  renderCycleSettings();
  toast('Rozpoczęto nowy cykl (tydzień 1)');
}
function clearCycle(){
  localStorage.removeItem('recomppro_cycle_start');
  renderCycleBanner();
  renderCycleSettings();
  toast('Licznik cyklu wyłączony');
}

function renderCycleBanner(){
  const info = getCycleInfo();
  document.querySelectorAll('.cycle-banner').forEach(el=>{
    if(!info){ el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.className = 'cycle-banner' + (info.isDeload ? ' deload' : '');
    el.innerHTML = info.isDeload
      ? `<b>Tydzień ${info.week}/${CYCLE_WEEKS} — DELOAD.</b> ${DELOAD_SETS} serie zamiast pełnej liczby, ten sam ciężar, RIR ${DELOAD_RIR}. W przyszłym tygodniu wracasz na pełną objętość.`
      : `Cykl ${info.cycleNo} · tydzień <b>${info.week}/${CYCLE_WEEKS}</b>${info.week === DELOAD_WEEK - 1 ? ' — w przyszłym tygodniu deload' : ''}`;
  });
}

function renderCycleSettings(){
  const el = document.getElementById('cycleStatus');
  if(!el) return;
  const info = getCycleInfo();
  const start = getCycleStart();
  el.innerHTML = info
    ? `<span class="status-dot status-ok"></span>Cykl ${info.cycleNo}, tydzień ${info.week}/${CYCLE_WEEKS}${info.isDeload ? ' — <b>deload</b>' : ''} (start: ${fmtDatePL(start)})`
    : '<span class="status-dot status-bad"></span>Licznik cyklu nieaktywny — kliknij „Rozpocznij nowy cykl".';
}

/* ===================== PROGRESJA PODWÓJNA ===================== */
function parseRange(repRange){
  const m = String(repRange || '').match(/(\d+)\s*-\s*(\d+)/);
  if(!m) return null;
  return { min: Number(m[1]), max: Number(m[2]) };
}

// ile serii faktycznie robimy dziś (deload skraca do DELOAD_SETS)
let currentIsDeload = false;
function effSets(ex){ return currentIsDeload ? Math.min(DELOAD_SETS, ex.sets) : ex.sets; }
function effRir(ex){ return currentIsDeload ? DELOAD_RIR : (ex.rirTarget ?? 1); }

// prev = { weight, reps, setOverrides, rir }
function progressionHint(ex, prev){
  if(currentIsDeload) return null;
  if(!prev || prev.reps == null || prev.reps === '') return null;
  const range = parseRange(ex.repRange);
  if(!range) return null;

  const repsPerSet = [];
  for(let i = 1; i <= ex.sets; i++){
    const ov = prev.setOverrides && prev.setOverrides[i];
    const val = (ov !== undefined && ov !== null && ov !== '') ? ov : prev.reps;
    repsPerSet.push(Number(val));
  }
  if(repsPerSet.some(r => !isFinite(r))) return null;

  const allHit = repsPerSet.every(r => r >= range.max);
  const target = ex.rirTarget ?? 1;
  const rirOk = (prev.rir === undefined || prev.rir === null || prev.rir === '') ? true : Number(prev.rir) >= target;

  if(allHit && rirOk){
    const step = ex.step ?? 2.5;
    const w = Number(prev.weight) || 0;
    return { ready: true, step, newWeight: Math.round((w + step) * 10) / 10, bodyweight: w === 0 };
  }
  return { ready: false, max: range.max };
}

function applyProgression(exId, newWeight){
  const el = document.getElementById('weight-' + exId);
  if(!el) return;
  el.value = newWeight;
  const badge = document.getElementById('prog-' + exId);
  if(badge) badge.innerHTML = `<span class="prog ok">✓ Ustawiono ${newWeight} kg — celuj w dolną granicę zakresu</span>`;
  saveDraft();
}

/* ===================== USTAWIENIA PRZEŁĄCZNIKÓW ===================== */
function getFlag(key, def){
  const v = localStorage.getItem('recomppro_flag_' + key);
  return v === null ? def : v === '1';
}
function setFlag(key, val){
  localStorage.setItem('recomppro_flag_' + key, val ? '1' : '0');
}
function toggleFlag(key, def){
  const next = !getFlag(key, def);
  setFlag(key, next);
  renderFlags();
  if(key === 'wakelock'){ next && currentWorkoutKey ? requestWakeLock() : releaseWakeLock(); }
  return next;
}
function renderFlags(){
  [['timer',true],['sound',true],['vibrate',true],['wakelock',true]].forEach(([k,def])=>{
    const el = document.getElementById('flag-' + k);
    if(!el) return;
    const on = getFlag(k, def);
    el.classList.toggle('on', on);
    el.textContent = on ? 'Włączone' : 'Wyłączone';
  });
  const note = document.getElementById('wakelockNote');
  if(note){
    note.textContent = ('wakeLock' in navigator)
      ? 'Twoja przeglądarka obsługuje blokadę wygaszania.'
      : 'Ta przeglądarka nie obsługuje blokady wygaszania — ekran będzie gasł normalnie. Na Androidzie działa Chrome, na iPhonie Safari od iOS 16.4.';
  }
}

/* ===================== TEMPO TRENINGU (długość przerw) ===================== */
function getRestMode(){
  const m = localStorage.getItem('recomppro_rest_mode');
  return REST_MODES[m] ? m : 'standard';
}
function setRestMode(mode){
  if(!REST_MODES[mode]) return;
  localStorage.setItem('recomppro_rest_mode', mode);
  renderRestMode();
  // jeśli trening jest otwarty, przerysuj karty, żeby zgadzały się wyświetlane przerwy
  // (szkic jest zapisywany na bieżąco, więc openWorkout odtworzy wpisane wartości)
  if(currentWorkoutKey && document.getElementById('screen-workout').classList.contains('active')){
    openWorkout(currentWorkoutKey);
  }
  toast('Tempo: ' + REST_MODES[mode].label);
}
// Ciężkie boje mają twardą podłogę — skracanie przerwy akurat tam kosztuje
// powtórzenia w kolejnych seriach, czyli objętość, czyli efekt treningu.
function restFor(ex){
  const base = ex.rest || DEFAULT_REST;
  const scaled = Math.round(base * REST_MODES[getRestMode()].scale);
  // podłoga chroni regenerację przed kolejną ciężką serią — ale przejście
  // do partnera pary regeneracją nie jest, więc go nie dotyczy
  if(ex.anchor && !ex.transition) return Math.max(scaled, ANCHOR_FLOOR);
  return Math.max(scaled, 15);
}
function renderRestMode(){
  const cur = getRestMode();
  Object.keys(REST_MODES).forEach(k=>{
    const b = document.getElementById('mode-' + k);
    if(b) b.classList.toggle('on', k === cur);
  });
  const d = document.getElementById('restModeDesc');
  if(d) d.textContent = REST_MODES[cur].desc;
  const e = document.getElementById('restModeEst');
  if(e) e.innerHTML = estimateAllDurations();
}
// szacowany czas sesji: przerwy + ok. 40 s pracy na serię + 5 min rozgrzewki
function estimateWorkout(key){
  const ex = WORKOUTS[key].exercises;
  let sec = 300;
  ex.forEach(e => { const n = effSets(e); sec += n * (40 + restFor(e)); });
  return Math.round(sec / 60);
}
function estimateAllDurations(){
  return Object.keys(WORKOUTS)
    .map(k => k + ': <b>~' + estimateWorkout(k) + ' min</b>')
    .join(' · ');
}

/* ===================== DŹWIĘK ===================== */
let audioCtx = null;
// AudioContext musi powstać w reakcji na dotknięcie ekranu — dlatego wołamy to
// z toggleCheck(), a nie przy starcie aplikacji.
function ensureAudio(){
  try{
    if(!audioCtx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return null;
      audioCtx = new AC();
    }
    if(audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }catch(e){ return null; }
}
function beep(freq, dur, vol){
  if(!getFlag('sound', true)) return;
  const ctx = ensureAudio();
  if(!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(t); osc.stop(t + dur + 0.03);
}
function tickBeep(){ beep(660, 0.09, 0.14); }
function finishBeep(){
  beep(880, 0.16, 0.30);
  setTimeout(()=>beep(1175, 0.16, 0.30), 190);
  setTimeout(()=>beep(1568, 0.42, 0.30), 380);
  if(getFlag('vibrate', true) && navigator.vibrate) navigator.vibrate([220,110,220,110,420]);
}

/* ===================== BLOKADA WYGASZANIA EKRANU ===================== */
let wakeLock = null;
async function requestWakeLock(){
  if(!('wakeLock' in navigator) || !getFlag('wakelock', true)) return;
  try{
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', ()=>{ wakeLock = null; });
  }catch(e){ wakeLock = null; }
}
async function releaseWakeLock(){
  try{ if(wakeLock) await wakeLock.release(); }catch(e){}
  wakeLock = null;
}
// system zwalnia blokadę, gdy aplikacja idzie w tło — po powrocie trzeba ją odzyskać
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState === 'visible' && currentWorkoutKey && !wakeLock) requestWakeLock();
});

/* ===================== STOPER PRZERW ===================== */
const Rest = { endAt:0, total:0, label:'', ss:false, timer:null, lastTick:null, pausedLeft:null };

function restLeft(){
  if(Rest.pausedLeft !== null) return Rest.pausedLeft;
  return Math.max(0, Math.round((Rest.endAt - Date.now()) / 1000));
}
function fmtClock(sec){
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function restStart(seconds, label, isSuperset){
  if(!getFlag('timer', true)) return;
  ensureAudio();                    // odblokowanie dźwięku na dotknięciu użytkownika
  Rest.total = seconds;
  Rest.endAt = Date.now() + seconds * 1000;
  Rest.label = label || '';
  Rest.ss = !!isSuperset;
  Rest.pausedLeft = null;
  Rest.lastTick = null;
  document.getElementById('restTimer').classList.add('show');
  document.getElementById('rtPause').textContent = '❚❚';
  if(Rest.timer) clearInterval(Rest.timer);
  Rest.timer = setInterval(restTick, 200);
  restTick();
}

function restTick(){
  const left = restLeft();
  const el = document.getElementById('restTimer');
  if(!el) return;
  document.getElementById('rtTime').textContent = fmtClock(left);
  document.getElementById('rtLabel').textContent = Rest.label;
  const pct = Rest.total ? Math.max(0, Math.min(100, (left / Rest.total) * 100)) : 0;
  document.getElementById('rtProgress').style.width = pct + '%';
  el.classList.toggle('ending', left <= 10 && Rest.pausedLeft === null);

  if(Rest.pausedLeft !== null) return;
  if(left <= 3 && left > 0 && Rest.lastTick !== left){ Rest.lastTick = left; tickBeep(); }
  if(left === 0){
    clearInterval(Rest.timer); Rest.timer = null;
    finishBeep();
    document.getElementById('rtTime').textContent = 'Czas!';
    el.classList.add('done');
    setTimeout(()=>{ if(!Rest.timer) restStop(false); }, 5000);
  }
}

function restAdjust(delta){
  if(!Rest.timer && Rest.pausedLeft === null) return;
  if(Rest.pausedLeft !== null){
    Rest.pausedLeft = Math.max(0, Rest.pausedLeft + delta);
  } else {
    Rest.endAt += delta * 1000;
    if(Rest.endAt < Date.now()) Rest.endAt = Date.now();
  }
  Rest.total = Math.max(Rest.total + delta, restLeft(), 1);
  restTick();
}

function restTogglePause(){
  if(Rest.pausedLeft === null){
    Rest.pausedLeft = restLeft();
    document.getElementById('rtPause').textContent = '▶';
  } else {
    Rest.endAt = Date.now() + Rest.pausedLeft * 1000;
    Rest.pausedLeft = null;
    document.getElementById('rtPause').textContent = '❚❚';
    if(!Rest.timer) Rest.timer = setInterval(restTick, 200);
  }
  restTick();
}

function restStop(){
  if(Rest.timer){ clearInterval(Rest.timer); Rest.timer = null; }
  Rest.pausedLeft = null;
  const el = document.getElementById('restTimer');
  if(el){ el.classList.remove('show','ending','done'); }
}

/* ===================== NAWIGACJA ===================== */
let currentWorkoutKey = null;
let autosaveTimer = null;
const AUTOSAVE_INTERVAL_MS = 30000;

function switchTab(tab){
  stopAutosave();
  releaseWakeLock();
  document.querySelectorAll('nav.tabbar .tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  if(tab==='home') document.getElementById('screen-home').classList.add('active');
  if(tab==='report'){ document.getElementById('screen-report').classList.add('active'); renderReportHistory(); loadTodayReportDraft(); startReportAutosave(); }
  else { stopReportAutosave(); }
  if(tab==='history'){ document.getElementById('screen-history').classList.add('active'); renderWorkoutHistory(); }
  if(tab==='settings'){ document.getElementById('screen-settings').classList.add('active'); renderCycleSettings(); renderFlags(); renderRestMode(); }
}
function goHome(){
  stopAutosave();
  releaseWakeLock();
  restStop();
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-home').classList.add('active');
  document.querySelectorAll('nav.tabbar .tab').forEach(b=>b.classList.toggle('active', b.dataset.tab==='home'));
}

/* ===================== EKRAN GŁÓWNY ===================== */
function renderWorkoutGrid(){
  renderCycleBanner();
  const grid = document.getElementById('workoutGrid');
  grid.innerHTML = '';
  Object.keys(WORKOUTS).forEach(key=>{
    const w = WORKOUTS[key];
    const card = document.createElement('div');
    card.className = 'wcard';
    card.onclick = ()=>openWorkout(key);
    card.innerHTML = `<div class="letter">${key}</div><div class="name">${w.label}</div><div class="sub">${w.subtitle}</div>`;
    grid.appendChild(card);
  });
}

/* ===================== SZKICE / AUTOZAPIS ===================== */
function getDrafts(){ return ls_get('recomppro_drafts', {}); }

function getDraftForWorkout(key){
  const drafts = getDrafts();
  const draft = drafts[key];
  if(!draft) return null;
  if(draft.date !== todayISO()) return null; // szkic z innego dnia - nieaktualny
  return draft;
}

function clearDraft(key){
  const drafts = getDrafts();
  delete drafts[key];
  ls_set('recomppro_drafts', drafts);
}

function saveDraft(){
  if(!currentWorkoutKey) return;
  const w = WORKOUTS[currentWorkoutKey];
  const exercises = {};
  w.exercises.forEach(ex=>{
    const weightEl = document.getElementById('weight-'+ex.id);
    const repsEl = document.getElementById('reps-'+ex.id);
    const rirEl = document.getElementById('rir-'+ex.id);
    if(!weightEl || !repsEl) return; // karta jeszcze nie wyrenderowana
    const overrides = {};
    const checks = {};
    for(let i=1;i<=effSets(ex);i++){
      const ov = document.getElementById(`override-${ex.id}-${i}`);
      if(ov && ov.value !== '') overrides[i] = ov.value;
      const chk = document.getElementById(`check-${ex.id}-${i}`);
      checks[i] = chk ? chk.classList.contains('done') : true;
    }
    exercises[ex.id] = { weight: weightEl.value, reps: repsEl.value, rir: rirEl ? rirEl.value : '', overrides, checks };
  });
  const drafts = getDrafts();
  drafts[currentWorkoutKey] = { date: todayISO(), savedAt: new Date().toISOString(), exercises };
  ls_set('recomppro_drafts', drafts);

  const statusEl = document.getElementById('draftStatus');
  if(statusEl){
    const t = new Date().toLocaleTimeString('pl-PL', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    statusEl.textContent = `💾 Autozapis szkicu: ${t}`;
  }
}

function startAutosave(){
  stopAutosave();
  autosaveTimer = setInterval(saveDraft, AUTOSAVE_INTERVAL_MS);
  document.addEventListener('visibilitychange', saveDraftOnHide);
  window.addEventListener('pagehide', saveDraft);
}
function stopAutosave(){
  if(autosaveTimer){ clearInterval(autosaveTimer); autosaveTimer = null; }
  document.removeEventListener('visibilitychange', saveDraftOnHide);
  window.removeEventListener('pagehide', saveDraft);
}
function saveDraftOnHide(){
  if(document.visibilityState === 'hidden') saveDraft();
}

/* ===================== TRENING ===================== */
function openWorkout(key){
  currentWorkoutKey = key;
  const info = getCycleInfo();
  currentIsDeload = !!(info && info.isDeload);
  const w = WORKOUTS[key];
  document.getElementById('wTitle').textContent = w.label;
  document.getElementById('wSub').textContent = w.subtitle;
  document.getElementById('draftStatus').textContent = '';
  renderCycleBanner();
  const last = ls_get('recomppro_last', {});
  const draft = getDraftForWorkout(key);
  if(draft){
    toast('Przywrócono niedokończony trening ze szkicu 💾');
  }

  const list = document.getElementById('exerciseList');
  list.innerHTML = '';

  w.exercises.forEach(ex=>{
    const draftEx = draft ? draft.exercises[ex.id] : null;
    // szkic ma pierwszeństwo nad ostatnio zapisanym wynikiem
    const prev = draftEx
      ? { weight: draftEx.weight, reps: draftEx.reps, rir: draftEx.rir, setOverrides: draftEx.overrides }
      : (last[ex.id] || {});
    const card = document.createElement('div');
    card.className = 'exercise';
    card.id = 'ex-' + ex.id;

    const nSets = effSets(ex);
    let setsHtml = '';
    for(let i=1;i<=nSets;i++){
      const overrideVal = (prev.setOverrides && prev.setOverrides[i] != null) ? prev.setOverrides[i] : '';
      // Przy włączonym stoperze serie startują puste — odhaczasz je po wykonaniu,
      // a to odhaczenie uruchamia odliczanie przerwy. Przy wyłączonym stoperze
      // zachowane jest stare zachowanie (wszystko zaznaczone z góry).
      const isDone = draftEx ? !!draftEx.checks[i] : !getFlag('timer', true);
      setsHtml += `
        <div class="set-row">
          <div class="set-num">S${i}</div>
          <div class="set-reps" id="setlabel-${ex.id}-${i}"><b>${prev.reps ?? '–'}</b> powt.</div>
          <input type="number" class="override-input ${overrideVal!=='' ? 'show':''}" id="override-${ex.id}-${i}" placeholder="powt." value="${overrideVal}" oninput="refreshSetLabel('${ex.id}',${i}); saveDraft();">
          <button class="override-link" onclick="toggleOverride('${ex.id}',${i})">inny wynik</button>
          <div class="check ${isDone?'done':''}" id="check-${ex.id}-${i}" onclick="toggleCheck('${ex.id}',${i})">✓</div>
        </div>`;
    }

    // podpowiedź progresji na podstawie ostatniej ukończonej sesji (nie szkicu)
    const lastDone = last[ex.id];
    const hint = progressionHint(ex, lastDone);
    let progHtml = '';
    if(hint && hint.ready){
      progHtml = hint.bodyweight
        ? `<div class="prog-row" id="prog-${ex.id}"><span class="prog ready">🎯 Zakres wyrobiony — czas dołożyć obciążenie (pas/plecak)</span></div>`
        : `<div class="prog-row" id="prog-${ex.id}"><span class="prog ready">🎯 Zakres wyrobiony</span><button class="prog-btn" onclick="applyProgression('${ex.id}', ${hint.newWeight})">Dołóż → ${hint.newWeight} kg</button></div>`;
    } else if(lastDone && lastDone.weight){
      const rirTxt = (lastDone.rir !== undefined && lastDone.rir !== null && lastDone.rir !== '') ? ` · RIR ${lastDone.rir}` : '';
      progHtml = `<div class="prog-row" id="prog-${ex.id}"><span class="prog">Ostatnio: ${lastDone.weight} kg × ${lastDone.reps ?? '–'}${rirTxt}</span></div>`;
    }

    const targetRir = effRir(ex);
    const partnerEx = ex.pair ? WORKOUTS[currentWorkoutKey].exercises.find(e => e.id === ex.pair) : null;
    const pairHtml = partnerEx
      ? `<div class="pair-tag">⇄ w parze z: ${partnerEx.name}</div>`
      : '';
    const restTxt = fmtClock(restFor(ex));
    const setsTxt = currentIsDeload && nSets < ex.sets
      ? `<s>${ex.sets}</s> ${nSets} serie (deload)`
      : `${nSets} serie`;

    card.innerHTML = `
      <h3>${ex.name}</h3>
      <div class="ex-equip">${ex.equip}</div>
      <div class="ex-target">Cel: ${ex.repRange} powt. · ${setsTxt} · RIR ${targetRir}${ex.perLeg ? ' · na nogę' : ''}${ex.perSide ? ' · na stronę' : ''} · przerwa ${restTxt}</div>
      ${pairHtml}
      ${progHtml}
      <div class="bulk-row">
        <div class="field">
          <label>Ciężar (kg)</label>
          <input type="number" step="0.5" id="weight-${ex.id}" value="${prev.weight ?? ''}" placeholder="60" oninput="saveDraft()">
        </div>
        <div class="field">
          <label>Powtórzenia</label>
          <input type="number" id="reps-${ex.id}" value="${prev.reps ?? ''}" placeholder="8" oninput="bulkRepsChanged('${ex.id}'); saveDraft();">
        </div>
        <div class="field field-rir">
          <label>RIR (cel ${targetRir})</label>
          <input type="number" step="1" min="0" max="6" id="rir-${ex.id}" value="${prev.rir ?? ''}" placeholder="${targetRir}" oninput="saveDraft()">
        </div>
      </div>
      <div class="setlist">${setsHtml}</div>
      ${ex.note ? `<div class="ex-note">${ex.note}</div>` : ''}
    `;
    list.appendChild(card);
  });

  const finishBar = document.createElement('div');
  finishBar.className = 'finish-bar';
  finishBar.innerHTML = `<button class="finish-btn" onclick="finishWorkout()">Zakończ trening</button>`;
  list.appendChild(finishBar);

  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-workout').classList.add('active');

  startAutosave();
  requestWakeLock();
}

function bulkRepsChanged(exId){
  const w = WORKOUTS[currentWorkoutKey];
  const ex = w.exercises.find(e=>e.id===exId);
  for(let i=1;i<=effSets(ex);i++) refreshSetLabel(exId, i);
}
function refreshSetLabel(exId, setIdx){
  const bulk = document.getElementById('reps-'+exId).value;
  const overrideEl = document.getElementById(`override-${exId}-${setIdx}`);
  const override = overrideEl.value;
  const val = (override !== '' ? override : (bulk !== '' ? bulk : '–'));
  document.getElementById(`setlabel-${exId}-${setIdx}`).innerHTML = `<b>${val}</b> powt.`;
}
function toggleOverride(exId, setIdx){
  const el = document.getElementById(`override-${exId}-${setIdx}`);
  el.classList.toggle('show');
  if(el.classList.contains('show')) el.focus();
}
function toggleCheck(exId, setIdx){
  const el = document.getElementById(`check-${exId}-${setIdx}`);
  const nowDone = !el.classList.contains('done');
  el.classList.toggle('done', nowDone);
  saveDraft();

  const ex = WORKOUTS[currentWorkoutKey].exercises.find(e => e.id === exId);
  if(!ex) return;

  if(nowDone){
    const isLastSet = setIdx >= effSets(ex);
    // po ostatniej serii ostatniego ćwiczenia nie ma już czego odliczać
    const list = WORKOUTS[currentWorkoutKey].exercises;
    const isLastExercise = list[list.length - 1].id === exId;
    if(isLastSet && isLastExercise){ restStop(); return; }

    const partner = ex.pair ? list.find(e => e.id === ex.pair) : null;
    const isTransition = !!(partner && list.indexOf(partner) > list.indexOf(ex));
    const label = isTransition
      ? '→ teraz: ' + partner.name
      : (partner ? `Przerwa po parze · S${setIdx}` : `Przerwa po S${setIdx} · ${ex.name}`);
    restStart(restFor(ex), label, isTransition);
  } else {
    restStop();   // cofnięcie odhaczenia = pomyłka, kasujemy odliczanie
  }
}

function collectWorkoutData(){
  const w = WORKOUTS[currentWorkoutKey];
  const exercises = w.exercises.map(ex=>{
    const weight = parseFloat(document.getElementById('weight-'+ex.id).value) || 0;
    const bulkReps = document.getElementById('reps-'+ex.id).value;
    const rirEl = document.getElementById('rir-'+ex.id);
    const rir = rirEl && rirEl.value !== '' ? Number(rirEl.value) : null;
    const setOverrides = {};
    const sets = [];
    for(let i=1;i<=effSets(ex);i++){
      const overrideEl = document.getElementById(`override-${ex.id}-${i}`);
      const override = overrideEl.value;
      if(override !== '') setOverrides[i] = override;
      const reps = override !== '' ? Number(override) : (bulkReps !== '' ? Number(bulkReps) : null);
      const done = document.getElementById(`check-${ex.id}-${i}`).classList.contains('done');
      sets.push({ set: i, reps, done });
    }
    return { id: ex.id, name: ex.name, weight, reps: bulkReps !== '' ? Number(bulkReps) : null,
             rir, targetRir: effRir(ex), repRange: ex.repRange, setOverrides, sets };
  });
  const info = getCycleInfo();
  return {
    date: todayISO(),
    workoutKey: currentWorkoutKey,
    workoutLabel: w.label,
    phase: CURRENT_PHASE,
    cycleWeek: info ? info.week : null,
    isDeload: currentIsDeload,
    exercises
  };
}

function finishWorkout(){
  const session = collectWorkoutData();

  // aktualizacja "ostatnich wartości" pod kątem prefillu następnym razem
  const last = ls_get('recomppro_last', {});
  session.exercises.forEach(ex=>{
    last[ex.id] = { weight: ex.weight, reps: ex.reps, rir: ex.rir, setOverrides: ex.setOverrides, date: session.date };
  });
  ls_set('recomppro_last', last);

  // zapis do historii
  const history = ls_get('recomppro_history', []);
  session.synced = false;
  history.unshift(session);
  ls_set('recomppro_history', history);

  clearDraft(currentWorkoutKey);
  stopAutosave();
  releaseWakeLock();
  restStop();
  toast('Trening zapisany na urządzeniu ✓');

  // próba wysyłki do arkusza
  sendWorkoutToSheet(session).then(ok=>{
    if(ok){
      session.synced = true;
      const h = ls_get('recomppro_history', []);
      h[0] = session;
      ls_set('recomppro_history', h);
      toast('Wysłano do arkusza Google ☁️');
    }
  }).catch(()=>{ /* cicho - zostaje w historii jako niewysłane */ });

  goHome();
}

/* ===================== WYSYŁKA DO GOOGLE (Apps Script) ===================== */
function getWebhookUrl(){ return localStorage.getItem('recomppro_webhook') || ''; }

async function sendWorkoutToSheet(session){
  const url = getWebhookUrl();
  if(!url) return false;
  try{
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ type: 'workout', ...session })
    });
    return true; // odpowiedź jest nieczytelna (no-cors), zakładamy powodzenie
  }catch(e){
    return false;
  }
}

async function testConnection(){
  const url = document.getElementById('webhookUrl').value.trim();
  const statusEl = document.getElementById('connStatus');
  if(!url){ statusEl.innerHTML = '<span class="status-dot status-bad"></span>Podaj adres Web App.'; return; }
  statusEl.innerHTML = 'Sprawdzanie...';
  try{
    const res = await fetch(url, { method:'GET', mode:'cors' });
    if(res.ok){
      const txt = await res.text();
      statusEl.innerHTML = `<span class="status-dot status-ok"></span>Połączono: ${txt.slice(0,60)}`;
    } else {
      statusEl.innerHTML = `<span class="status-dot status-bad"></span>Serwer odpowiedział błędem (${res.status}).`;
    }
  }catch(e){
    statusEl.innerHTML = '<span class="status-dot status-bad"></span>Brak odpowiedzi (sprawdź czy wdrożenie jest publiczne — "Kto ma dostęp: Każda osoba").';
  }
}
function saveWebhook(){
  const url = document.getElementById('webhookUrl').value.trim();
  localStorage.setItem('recomppro_webhook', url);
  toast('Zapisano adres');
}

/* ===================== HISTORIA TRENINGÓW ===================== */
function renderWorkoutHistory(){
  const el = document.getElementById('workoutHistory');
  const history = ls_get('recomppro_history', []);
  if(history.length === 0){ el.innerHTML = '<div class="muted">Brak zapisanych treningów.</div>'; return; }
  el.innerHTML = history.slice(0,30).map(s=>{
    const totalSets = s.exercises.reduce((a,e)=>a+e.sets.length,0);
    const wk = s.cycleWeek ? ` · tydz. ${s.cycleWeek}` : '';
    const dl = s.isDeload ? ' <span style="color:#f0b429">· deload</span>' : '';
    const rirs = s.exercises.map(e=>e.rir).filter(r=>r!=null&&r!=='');
    const avgRir = rirs.length ? (rirs.reduce((a,b)=>a+Number(b),0)/rirs.length).toFixed(1) : null;
    return `<div class="hist-item">
      <div class="top"><span class="badge">${s.workoutLabel}</span><span>${fmtDatePL(s.date)}</span></div>
      <div class="meta">${s.exercises.length} ćwiczeń · ${totalSets} serii${wk}${dl}${avgRir ? ` · śr. RIR ${avgRir}` : ''}</div>
      ${s.synced ? '' : '<div class="pending">⏳ nie wysłano do arkusza</div>'}
    </div>`;
  }).join('');
}

/* ===================== RAPORT SYLWETKI ===================== */
const photoData = { front:null, back:null, side:null };

let reportAutosaveTimer = null;

function initReportScreen(){
  document.getElementById('reportDate').value = todayISO();
}

async function loadTodayReportDraft(){
  const date = document.getElementById('reportDate').value || todayISO();
  const existing = await idbGetReport(date);
  if(!existing) return;
  document.getElementById('m-biceps').value = existing.measurements?.biceps || '';
  document.getElementById('m-chest').value = existing.measurements?.chest || '';
  document.getElementById('m-waist').value = existing.measurements?.waist || '';
  document.getElementById('m-thigh').value = existing.measurements?.thigh || '';
  ['front','back','side'].forEach(slot=>{
    const photo = existing.photos && existing.photos[slot];
    if(photo){
      photoData[slot] = photo;
      const slotEl = document.getElementById('slot-'+slot);
      const label = slotEl.querySelector('.lbl').outerHTML;
      slotEl.innerHTML = `<img src="${photo}">${label}<input type="file" accept="image/*" capture="environment" onchange="handlePhoto(event,'${slot}')">`;
    }
  });
}

async function autosaveReport(){
  const date = document.getElementById('reportDate').value || todayISO();
  const m = currentMeasurements();
  const hasAnyData = m.biceps || m.chest || m.waist || m.thigh || photoData.front || photoData.back || photoData.side;
  if(!hasAnyData) return; // nic do zapisania - nie twórz pustych wpisów
  await idbSaveReport({ date, measurements: m, photos: {...photoData} });
  const statusEl = document.getElementById('reportDraftStatus');
  if(statusEl){
    const t = new Date().toLocaleTimeString('pl-PL', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    statusEl.textContent = `💾 Autozapis: ${t}`;
  }
}
function startReportAutosave(){
  stopReportAutosave();
  reportAutosaveTimer = setInterval(autosaveReport, AUTOSAVE_INTERVAL_MS);
  document.addEventListener('visibilitychange', reportAutosaveOnHide);
  window.addEventListener('pagehide', autosaveReport);
}
function stopReportAutosave(){
  if(reportAutosaveTimer){ clearInterval(reportAutosaveTimer); reportAutosaveTimer = null; }
  document.removeEventListener('visibilitychange', reportAutosaveOnHide);
  window.removeEventListener('pagehide', autosaveReport);
}
function reportAutosaveOnHide(){
  if(document.visibilityState === 'hidden') autosaveReport();
}

function compressImage(file, maxSize=1280, quality=0.82){
  return new Promise((resolve,reject)=>{
    const img = new Image();
    const reader = new FileReader();
    reader.onload = e=>{ img.src = e.target.result; };
    reader.onerror = reject;
    img.onload = ()=>{
      let {width,height} = img;
      if(width > height && width > maxSize){ height *= maxSize/width; width = maxSize; }
      else if(height > maxSize){ width *= maxSize/height; height = maxSize; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handlePhoto(event, slot){
  const file = event.target.files[0];
  if(!file) return;
  toast('Przetwarzanie zdjęcia...');
  const dataUrl = await compressImage(file);
  photoData[slot] = dataUrl;
  const slotEl = document.getElementById('slot-'+slot);
  const label = slotEl.querySelector('.lbl').outerHTML;
  slotEl.innerHTML = `<img src="${dataUrl}">${label}<input type="file" accept="image/*" capture="environment" onchange="handlePhoto(event,'${slot}')">`;
  autosaveReport();
}

function currentMeasurements(){
  return {
    biceps: document.getElementById('m-biceps').value,
    chest: document.getElementById('m-chest').value,
    waist: document.getElementById('m-waist').value,
    thigh: document.getElementById('m-thigh').value
  };
}

async function saveReportLocal(){
  const date = document.getElementById('reportDate').value || todayISO();
  const report = { date, measurements: currentMeasurements(), photos: {...photoData} };
  await idbSaveReport(report);
  toast('Raport zapisany na urządzeniu ✓');
  renderReportHistory();
}

async function sendReportToDrive(){
  const url = getWebhookUrl();
  if(!url){ toast('Najpierw ustaw adres Web App w Ustawieniach', true); return; }
  const date = document.getElementById('reportDate').value || todayISO();
  const report = { date, measurements: currentMeasurements(), photos: {...photoData} };
  await idbSaveReport(report); // zawsze zapisz lokalnie jako kopię
  toast('Wysyłanie na Dysk Google...');
  try{
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ type: 'report', ...report })
    });
    toast('Wysłano na Dysk Google ☁️');
  }catch(e){
    toast('Nie udało się wysłać — zapisano tylko lokalnie', true);
  }
  renderReportHistory();
}

async function renderReportHistory(){
  const el = document.getElementById('reportHistory');
  const reports = await idbGetAllReports();
  if(!reports.length){ el.innerHTML = '<div class="muted">Brak zapisanych raportów.</div>'; return; }
  el.innerHTML = reports.sort((a,b)=>b.date.localeCompare(a.date)).map(r=>{
    const m = r.measurements || {};
    return `<div class="hist-item">
      <div class="top"><span class="badge">Raport</span><span>${fmtDatePL(r.date)}</span></div>
      <div class="meta">Biceps: ${m.biceps||'–'} cm · Klatka: ${m.chest||'–'} cm · Pas: ${m.waist||'–'} cm · Udo: ${m.thigh||'–'} cm</div>
    </div>`;
  }).join('');
}

/* ===================== IndexedDB (zdjęcia raportów) ===================== */
let dbPromise = null;
function openDB(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve,reject)=>{
    const req = indexedDB.open('recomppro_db', 1);
    req.onupgradeneeded = ()=>{
      const db = req.result;
      if(!db.objectStoreNames.contains('reports')) db.createObjectStore('reports', { keyPath:'date' });
    };
    req.onsuccess = ()=>resolve(req.result);
    req.onerror = ()=>reject(req.error);
  });
  return dbPromise;
}
async function idbSaveReport(report){
  const db = await openDB();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction('reports','readwrite');
    tx.objectStore('reports').put(report);
    tx.oncomplete = ()=>resolve();
    tx.onerror = ()=>reject(tx.error);
  });
}
async function idbGetReport(date){
  const db = await openDB();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction('reports','readonly');
    const req = tx.objectStore('reports').get(date);
    req.onsuccess = ()=>resolve(req.result || null);
    req.onerror = ()=>reject(req.error);
  });
}
async function idbGetAllReports(){
  const db = await openDB();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction('reports','readonly');
    const req = tx.objectStore('reports').getAll();
    req.onsuccess = ()=>resolve(req.result || []);
    req.onerror = ()=>reject(req.error);
  });
}

/* ===================== EKSPORT KOPII ===================== */
async function exportData(){
  const history = ls_get('recomppro_history', []);
  const reports = await idbGetAllReports();
  const blob = new Blob([JSON.stringify({history, reports}, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `recomppro_kopia_${todayISO()}.json`;
  a.click();
}

/* ===================== START ===================== */
window.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('headerDate').textContent = fmtDatePL(todayISO());
  document.getElementById('phasePill').textContent = 'Faza ' + CURRENT_PHASE;
  renderWorkoutGrid();
  renderCycleSettings();
  renderFlags();
  renderRestMode();
  initReportScreen();
  document.getElementById('webhookUrl').value = getWebhookUrl();

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
});
