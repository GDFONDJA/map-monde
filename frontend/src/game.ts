import { SECONDS_PER_PIECE, MAX_HELPS } from './rules';
import { readRecords, recordForStage, writeRecords } from './record-store';
import './styles/template.css';
import './styles/game.css';
import stageData from './data/stages.json';
import type { Stage, PlayerProfile, PersonalRecord, PieceDrag } from './types';

(() => {
  'use strict';
interface GameElements {
  'game-sidebar': HTMLElement;
  'stage-list': HTMLElement;
  'drawer-backdrop': HTMLButtonElement;
  'menu-button': HTMLButtonElement;
  'stage-kind': HTMLElement;
  'stage-title': HTMLElement;
  'stage-description': HTMLElement;
  'current-stage': HTMLElement;
  'score': HTMLElement;
  'progress-value': HTMLElement;
  'progress-bar': HTMLElement;
  'timer': HTMLElement;
  'timer-note': HTMLElement;
  'best-score': HTMLElement;
  'best-time': HTMLElement;
  'player-avatar': HTMLElement;
  'player-name': HTMLElement;
  'restart-button': HTMLButtonElement;
  'help-button': HTMLButtonElement;
  'quit-button': HTMLButtonElement;
  'piece-heading': HTMLElement;
  'piece-counter': HTMLElement;
  'piece-button': HTMLButtonElement;
  'piece-image': HTMLImageElement;
  'piece-name': HTMLElement;
  'piece-type': HTMLElement;
  'piece-description': HTMLElement;
  'piece-instructions': HTMLElement;
  'map-heading': HTMLElement;
  'help-count': HTMLElement;
  'error-count': HTMLElement;
  'map-percent': HTMLElement;
  'stage-count': HTMLElement;
  'game-status': HTMLElement;
  'atlas-surface': HTMLElement;
  'atlas-frame': HTMLElement;
  'atlas-image': HTMLImageElement;
  'placed-pieces': HTMLElement;
  'hint-ring': HTMLElement;
  'result-dialog': HTMLDialogElement;
  'result-kind': HTMLElement;
  'result-title': HTMLElement;
  'result-summary': HTMLElement;
  'result-record': HTMLElement;
  'close-result': HTMLButtonElement;
  'replay-result': HTMLButtonElement;
}
function $<K extends keyof GameElements>(id: K): GameElements[K] {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Élément introuvable : ${id}`);
  return element as GameElements[K];
}

  const stages: Stage[] = stageData;
  const order = ['01_monde','09_cameroun','02_afrique','03_europe','04_asie','05_amerique_du_nord','06_amerique_du_sud','07_oceanie','08_antarctique'];
  let player: Pick<PlayerProfile, 'name'> = { name: 'Joueur' };
  try { const saved = JSON.parse(sessionStorage.getItem('mapmonde.player') ?? 'null'); if (typeof saved?.name === 'string') player = { name: saved.name }; } catch {}
  $('player-name').textContent = player.name.slice(0, 80);
  $('player-avatar').textContent = player.name.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
  const records: Record<string, PersonalRecord> = readRecords();
  let remainingAtFinish = 0;
  let stage: Stage;
  let index = 0, errors = 0, helps = 0, finished = false, elapsed = 0, selected = false, hinted = false;
  let started: number | null = null;
  let drag: PieceDrag | null = null;
  const asset = (file: string) => `${import.meta.env.BASE_URL}${stage.id}/${file}`;
  const piece = () => stage.pieces[index];
  const timeText = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
  const seconds = () => finished ? elapsed : started === null ? 0 : Math.floor((performance.now() - started) / 1000);
  const score = () => Math.max(0, index * 100 - errors * 10 - helps * 20);
  const status = (text: string) => { $('game-status').textContent = text; };
  const timeLimit = () => stage.pieces.length * SECONDS_PER_PIECE;
  const remainingSeconds = () => finished ? remainingAtFinish : started === null ? timeLimit() : Math.max(0, Math.ceil(timeLimit() - (performance.now() - started) / 1000));
  function renderTimer() {
    const remaining = remainingSeconds();
    $('timer').textContent = timeText(remaining);
    $('timer').classList.toggle('timer-low', started !== null && remaining <= SECONDS_PER_PIECE);
  }
  function updateHelpButton() {
    const left = Math.max(0, MAX_HELPS - helps);
    $('help-button').disabled = finished || !piece() || hinted || left === 0;
    $('help-button').title = left === 0 ? 'Les 5 aides de cette carte ont été utilisées.' : hinted ? 'L’aide de cette pièce est déjà affichée.' : `${left} aide(s) restante(s) sur cette carte. Une aide retire 20 points.`;
  }
  function expire() {
    if (finished) return;
    elapsed = timeLimit(); remainingAtFinish = 0; finished = true; selected = false;
    stopDrag(); $('hint-ring').hidden = true; $('piece-button').classList.remove('selected'); $('piece-button').disabled = true;
    $('timer-note').textContent = 'Temps écoulé'; renderTimer(); updateStats();
    $('result-kind').textContent = 'Temps écoulé';
    $('result-title').textContent = `${stage.title} : temps écoulé`;
    $('result-summary').textContent = `${index} pièce(s) placée(s) sur ${stage.pieces.length} en ${timeText(timeLimit())}. Score : ${score()} points.`;
    $('result-record').textContent = 'La carte n’est pas terminée. Cette partie ne compte pas comme record.';
    status('Temps écoulé. Recommence la carte pour réessayer.'); $('result-dialog').showModal();
  }
  function canAct() {
    if (finished) return false;
    if (started !== null && performance.now() - started >= timeLimit() * 1000) { expire(); return false; }
    return true;
  }
  function start() {
    if (!canAct()) return false;
    if (started === null) started = performance.now();
    $('timer-note').textContent = `Budget total : ${timeText(timeLimit())}`;
    renderTimer(); return true;
  }
  function tick() { canAct(); renderTimer(); }

  function currentRecord() { return recordForStage(stage, records); }
  function updateStats() {
    $('score').textContent = String(score());
    $('progress-value').replaceChildren(document.createTextNode(`${index} `));
    const total = document.createElement('sup'); total.textContent = `/ ${stage.pieces.length}`; $('progress-value').append(total);
    const percentage = Math.round(index / stage.pieces.length * 100);
    $('progress-bar').style.width = `${percentage}%`; $('map-percent').textContent = `${percentage} %`;
    $('help-count').textContent = `${helps} / ${MAX_HELPS}`; $('error-count').textContent = String(errors); updateHelpButton();
    const r = currentRecord(); $('best-score').textContent = r ? String(r.score) : '—';
    $('best-time').textContent = r ? `Temps du record : ${timeText(r.time)}` : 'Aucune partie terminée';
  }
  function showPiece() {
    hinted = false; selected = false; $('hint-ring').hidden = true; $('piece-button').classList.remove('selected');
    if (!piece()) {
      $('piece-image').hidden = true; $('piece-button').disabled = true;
      $('piece-name').textContent = 'Carte complétée'; $('piece-type').textContent = stage.title;
      $('piece-description').textContent = 'Toutes les pièces ont trouvé leur place.'; $('piece-counter').textContent = `${index} / ${index}`;
      $('help-button').disabled = true; return;
    }
    const p = piece()!; $('piece-button').disabled = false; $('piece-image').hidden = false;
    $('piece-image').src = asset(p.file); $('piece-image').alt = `${p.title}, pièce à placer`;
    $('piece-name').textContent = p.title; $('piece-type').textContent = p.type; $('piece-description').textContent = p.description;
    $('piece-counter').textContent = `${index + 1} / ${stage.pieces.length}`; updateHelpButton();
  }
  function stopDrag() { if (drag) drag.ghost.remove(); drag = null; }
  function loadStage(id: string) {
    const next = stages.find(s => s.id === id);
    if (!next) throw new Error(`Parcours introuvable : ${id}`);
    stopDrag(); stage = next; index = errors = helps = elapsed = 0; started = null; finished = false; remainingAtFinish = 0;
    // Afficher les contours utiles, sans les marges transparentes du PNG.
    const bounds = stage.displayBounds || { x:0, y:0, width:2400, height:1700 };
    $('atlas-surface').style.setProperty('--map-ratio', String(bounds.width / bounds.height));
    const frame = $('atlas-frame');
    frame.style.width = `${2400 / bounds.width * 100}%`;
    frame.style.height = `${1700 / bounds.height * 100}%`;
    frame.style.left = `${-bounds.x / bounds.width * 100}%`;
    frame.style.top = `${-bounds.y / bounds.height * 100}%`;

    $('placed-pieces').replaceChildren(); renderTimer(); $('timer-note').textContent = '15 s par pièce · départ au premier geste';
    $('current-stage').textContent = stage.title; $('stage-title').textContent = stage.heading;
    $('stage-kind').textContent = stage.kind; $('stage-description').textContent = stage.description;
    $('stage-count').textContent = `${stage.pieces.length} ${stage.unit}`;
    document.querySelectorAll<HTMLAnchorElement>('[data-records-link]').forEach(link => {
      link.href = `records.html?parcours=${encodeURIComponent(stage.id)}`;
    });
    $('atlas-image').src = asset('atlas_vide.png'); $('atlas-image').alt = `Carte de ${stage.title} à compléter`;
    for (const b of Array.from($('stage-list').children) as HTMLButtonElement[]) { b.classList.toggle('is-active', b.dataset.stage === id); b.setAttribute('aria-current', b.dataset.stage === id ? 'page' : 'false'); }
    updateStats(); showPiece(); status('Sélectionne ou déplace la première pièce pour commencer.'); closeMenu();
  }
  function changeStage(id: string) {
    if (started !== null && !finished && !confirm('Changer de parcours abandonne la partie en cours. Continuer ?')) return;
    loadStage(id);
  }
  order.forEach((id,n) => {
    const s = stages.find(s => s.id === id)!; const b = document.createElement('button'); b.className = 'nav-link'; b.dataset.stage = id;
    const number = document.createElement('i'); number.className = 'stage-number'; number.style.fontStyle = 'normal'; number.textContent = String(n + 1).padStart(2,'0');
    const title = document.createElement('span'); title.textContent = s.title;
    const count = document.createElement('small'); count.className = 'stage-total'; count.textContent = String(s.pieces.length);
    b.append(number,title,count); b.addEventListener('click', () => changeStage(id)); $('stage-list').append(b);
  });
  function finish() {
    remainingAtFinish = remainingSeconds(); elapsed = seconds(); finished = true; stopDrag(); renderTimer(); $('timer-note').textContent = 'Parcours terminé'; $('result-kind').textContent = 'Parcours terminé';
    const result = { score: score(), time: elapsed, helps, errors };
    const old = currentRecord(); const isRecord = !old || result.score > old.score || (result.score === old.score && result.time < old.time);
    let saved = true;
    if (isRecord) { records[stage.id] = result; saved = writeRecords(records); }
    updateStats(); $('result-title').textContent = `${stage.title} : carte complétée`;
    $('result-summary').textContent = `${result.score} points en ${timeText(elapsed)}. ${helps} aide(s), ${errors} erreur(s).`;
    $('result-record').textContent = isRecord ? saved ? 'Nouveau record personnel sur ce navigateur.' : 'Nouveau record. La sauvegarde locale est indisponible sur ce navigateur.' : 'Ton record personnel reste à battre.';
    status('Bravo, la carte est complétée.'); $('result-dialog').showModal();
  }
  function tryPlace(x: number, y: number) {
    if (!piece() || !start()) return;
    const p = piece()!; const box = $('atlas-frame').getBoundingClientRect();
    const targetX = box.left + p.point[0] / 2400 * box.width, targetY = box.top + p.point[1] / 1700 * box.height;
    const tolerance = Math.max(20, Math.min(box.width,box.height) * .055);
    if (x < box.left || x > box.right || y < box.top || y > box.bottom || Math.hypot(x-targetX,y-targetY) > tolerance) {
      errors++; updateStats(); status('Pas tout à fait. Rapproche la pièce de son emplacement, ou utilise Aide.'); return;
    }
    const image = document.createElement('img'); image.className = 'placed-piece'; image.src = asset(p.file); image.alt = p.title;
    image.style.left = `${p.box.x/2400*100}%`; image.style.top = `${p.box.y/1700*100}%`; image.style.width = `${p.box.largeur/2400*100}%`; image.style.height = `${p.box.hauteur/1700*100}%`;
    $('placed-pieces').append(image); index++; updateStats(); showPiece();
    if (index === stage.pieces.length) finish(); else status(`${p.title} : bien placé. À la pièce suivante.`);
  }
  $('piece-button').addEventListener('pointerdown', e => {
    if (!piece() || (e.pointerType === 'mouse' && e.button !== 0) || !start()) return;
    e.preventDefault(); stopDrag(); selected = true; $('piece-button').classList.add('selected');
    const p = piece()!, box = $('atlas-frame').getBoundingClientRect(), scale = box.width / 2400;
    const ghost = document.createElement('img'); ghost.className = 'drag-ghost'; ghost.src = asset(p.file); ghost.alt = ''; ghost.style.width = `${p.box.largeur*scale}px`; ghost.style.height = `${p.box.hauteur*scale}px`; document.body.append(ghost);
    drag = { ghost, pointer:e.pointerId, startX:e.clientX, startY:e.clientY, anchorX:(p.point[0]-p.box.x)*scale, anchorY:(p.point[1]-p.box.y)*scale, moved:false };
    moveGhost(e); $('piece-button').setPointerCapture(e.pointerId);
  });
  function moveGhost(e: PointerEvent) { if (!drag || drag.pointer !== e.pointerId || !canAct()) return; drag.ghost.style.left = `${e.clientX-drag.anchorX}px`; drag.ghost.style.top = `${e.clientY-drag.anchorY}px`; if (Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>7) drag.moved=true; }
  $('piece-button').addEventListener('pointermove', moveGhost);
  $('piece-button').addEventListener('pointerup', e => { if (!drag || drag.pointer !== e.pointerId) return; if (!canAct()) { stopDrag(); return; } const moved = drag.moved; stopDrag(); if (moved) tryPlace(e.clientX,e.clientY); else status('Pièce sélectionnée. Clique sur son emplacement dans la carte.'); });
  $('piece-button').addEventListener('pointercancel', stopDrag);
  $('piece-button').addEventListener('click', e => { if (e.detail === 0 && piece() && start()) { selected=true; $('piece-button').classList.add('selected'); status('Pièce sélectionnée. Clique sur son emplacement dans la carte.'); } });
  $('atlas-surface').addEventListener('click', e => { if (selected) tryPlace(e.clientX,e.clientY); });
  $('help-button').addEventListener('click', () => {
    if (!piece() || hinted || helps >= MAX_HELPS || !start()) return; hinted = true; helps++;
    $('hint-ring').style.left = `${piece().point[0]/2400*100}%`; $('hint-ring').style.top = `${piece().point[1]/1700*100}%`; $('hint-ring').hidden = false;
    updateStats(); status('Le cercle indique où déposer la pièce. Cette aide retire 20 points.');
  });
  $('restart-button').addEventListener('click', () => changeStage(stage.id));
  $('quit-button').addEventListener('click', () => { if (started !== null && !finished && !confirm('Quitter abandonne la partie en cours. Continuer ?')) return; location.assign('index.html'); });
  $('close-result').addEventListener('click', () => { $('result-dialog').close(); if (matchMedia('(max-width:900px)').matches) openMenu(); else $('stage-list').querySelector('button')?.focus(); });
  $('replay-result').addEventListener('click', () => { $('result-dialog').close(); loadStage(stage.id); });
  function openMenu() { document.body.classList.add('game-nav-open'); $('drawer-backdrop').hidden=false; $('menu-button').setAttribute('aria-expanded','true'); }
  function closeMenu() { document.body.classList.remove('game-nav-open'); $('drawer-backdrop').hidden=true; $('menu-button').setAttribute('aria-expanded','false'); }
  $('menu-button').addEventListener('click', () => document.body.classList.contains('game-nav-open') ? closeMenu() : openMenu());
  $('drawer-backdrop').addEventListener('click',closeMenu);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { stopDrag(); closeMenu(); selected=false; $('piece-button').classList.remove('selected'); } });
  $('piece-image').addEventListener('error', () => status('La pièce ne peut pas être chargée. Recharge la page et vérifie le dossier images.'));
  $('atlas-image').addEventListener('error', () => status('La carte ne peut pas être chargée. Recharge la page et vérifie le dossier images.'));
  setInterval(tick,200);
  document.querySelectorAll<HTMLAnchorElement>('[data-records-link]').forEach(link => {
    link.addEventListener('click', event => {
      if (started !== null && !finished && !confirm('Voir les records abandonne la partie en cours. Continuer ?')) event.preventDefault();
    });
  });
  const requestedStage = new URLSearchParams(location.search).get('parcours');
  const initialStage = stages.find(item => item.id === requestedStage)?.id ?? '01_monde';
  loadStage(initialStage);
})();
