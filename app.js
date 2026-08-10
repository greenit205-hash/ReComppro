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

/* ===================== NAWIGACJA ===================== */
let currentWorkoutKey = null;
let autosaveTimer = null;
const AUTOSAVE_INTERVAL_MS = 30000;

function switchTab(tab){
  stopAutosave();
  document.querySelectorAll('nav.tabbar .tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  if(tab==='home') document.getElementById('screen-home').classList.add('active');
  if(tab==='report'){ document.getElementById('screen-report').classList.add('active'); renderReportHistory(); loadTodayReportDraft(); startReportAutosave(); }
  else { stopReportAutosave(); }
  if(tab==='history'){ document.getElementById('screen-history').classList.add('active'); renderWorkoutHistory(); }
  if(tab==='settings') document.getElementById('screen-settings').classList.add('active');
}
function goHome(){
  stopAutosave();
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-home').classList.add('active');
  document.querySelectorAll('nav.tabbar .tab').forEach(b=>b.classList.toggle('active', b.dataset.tab==='home'));
}

/* ===================== EKRAN GŁÓWNY ===================== */
function renderWorkoutGrid(){
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
    if(!weightEl || !repsEl) return; // karta jeszcze nie wyrenderowana
    const overrides = {};
    const checks = {};
    for(let i=1;i<=ex.sets;i++){
      const ov = document.getElementById(`override-${ex.id}-${i}`);
      if(ov && ov.value !== '') overrides[i] = ov.value;
      const chk = document.getElementById(`check-${ex.id}-${i}`);
      checks[i] = chk ? chk.classList.contains('done') : true;
    }
    exercises[ex.id] = { weight: weightEl.value, reps: repsEl.value, overrides, checks };
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
  const w = WORKOUTS[key];
  document.getElementById('wTitle').textContent = w.label;
  document.getElementById('wSub').textContent = w.subtitle;
  document.getElementById('draftStatus').textContent = '';
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
      ? { weight: draftEx.weight, reps: draftEx.reps, setOverrides: draftEx.overrides }
      : (last[ex.id] || {});
    const card = document.createElement('div');
    card.className = 'exercise';
    card.id = 'ex-' + ex.id;

    let setsHtml = '';
    for(let i=1;i<=ex.sets;i++){
      const overrideVal = (prev.setOverrides && prev.setOverrides[i] != null) ? prev.setOverrides[i] : '';
      const isDone = draftEx ? !!draftEx.checks[i] : true; // szkic pamięta odznaczone serie, domyślnie zaznaczone
      setsHtml += `
        <div class="set-row">
          <div class="set-num">S${i}</div>
          <div class="set-reps" id="setlabel-${ex.id}-${i}"><b>${prev.reps ?? '–'}</b> powt.</div>
          <input type="number" class="override-input ${overrideVal!=='' ? 'show':''}" id="override-${ex.id}-${i}" placeholder="powt." value="${overrideVal}" oninput="refreshSetLabel('${ex.id}',${i}); saveDraft();">
          <button class="override-link" onclick="toggleOverride('${ex.id}',${i})">inny wynik</button>
          <div class="check ${isDone?'done':''}" id="check-${ex.id}-${i}" onclick="toggleCheck('${ex.id}',${i})">✓</div>
        </div>`;
    }

    card.innerHTML = `
      <h3>${ex.name}</h3>
      <div class="ex-equip">${ex.equip}</div>
      <div class="ex-target">Cel: ${ex.repRange} powt. · ${ex.sets} serie${ex.perLeg ? ' (na nogę)' : ''}${ex.perSide ? ' (na stronę)' : ''}</div>
      <div class="bulk-row">
        <div class="field">
          <label>Ciężar (kg) — wszystkie serie</label>
          <input type="number" step="0.5" id="weight-${ex.id}" value="${prev.weight ?? ''}" placeholder="np. 60" oninput="saveDraft()">
        </div>
        <div class="field">
          <label>Powtórzenia — wszystkie serie</label>
          <input type="number" id="reps-${ex.id}" value="${prev.reps ?? ''}" placeholder="np. 8" oninput="bulkRepsChanged('${ex.id}'); saveDraft();">
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
}

function bulkRepsChanged(exId){
  const w = WORKOUTS[currentWorkoutKey];
  const ex = w.exercises.find(e=>e.id===exId);
  for(let i=1;i<=ex.sets;i++) refreshSetLabel(exId, i);
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
  document.getElementById(`check-${exId}-${setIdx}`).classList.toggle('done');
  saveDraft();
}

function collectWorkoutData(){
  const w = WORKOUTS[currentWorkoutKey];
  const exercises = w.exercises.map(ex=>{
    const weight = parseFloat(document.getElementById('weight-'+ex.id).value) || 0;
    const bulkReps = document.getElementById('reps-'+ex.id).value;
    const setOverrides = {};
    const sets = [];
    for(let i=1;i<=ex.sets;i++){
      const overrideEl = document.getElementById(`override-${ex.id}-${i}`);
      const override = overrideEl.value;
      if(override !== '') setOverrides[i] = override;
      const reps = override !== '' ? Number(override) : (bulkReps !== '' ? Number(bulkReps) : null);
      const done = document.getElementById(`check-${ex.id}-${i}`).classList.contains('done');
      sets.push({ set: i, reps, done });
    }
    return { id: ex.id, name: ex.name, weight, reps: bulkReps !== '' ? Number(bulkReps) : null, setOverrides, sets };
  });
  return { date: todayISO(), workoutKey: currentWorkoutKey, workoutLabel: w.label, exercises };
}

function finishWorkout(){
  const session = collectWorkoutData();

  // aktualizacja "ostatnich wartości" pod kątem prefillu następnym razem
  const last = ls_get('recomppro_last', {});
  session.exercises.forEach(ex=>{
    last[ex.id] = { weight: ex.weight, reps: ex.reps, setOverrides: ex.setOverrides, date: session.date };
  });
  ls_set('recomppro_last', last);

  // zapis do historii
  const history = ls_get('recomppro_history', []);
  session.synced = false;
  history.unshift(session);
  ls_set('recomppro_history', history);

  clearDraft(currentWorkoutKey);
  stopAutosave();
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
    return `<div class="hist-item">
      <div class="top"><span class="badge">${s.workoutLabel}</span><span>${fmtDatePL(s.date)}</span></div>
      <div class="meta">${s.exercises.length} ćwiczeń · ${totalSets} serii</div>
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
  initReportScreen();
  document.getElementById('webhookUrl').value = getWebhookUrl();

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
});
