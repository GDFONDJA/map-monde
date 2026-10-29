import './styles/template.css';
import './styles/game.css';
import './styles/records.css';
import stageData from './data/stages.json';
import type { Stage } from './types';
import { readRecords, recordForStage } from './record-store';
import { MAX_HELPS } from './rules';

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Élément introuvable : ${id}`);
  return found as T;
}
const order = ['01_monde','09_cameroun','02_afrique','03_europe','04_asie','05_amerique_du_nord','06_amerique_du_sud','07_oceanie','08_antarctique'];
const stages: Stage[] = [...stageData].sort((a,b) => order.indexOf(a.id) - order.indexOf(b.id));
const rows = element<HTMLTableSectionElement>('record-rows');
const filter = element<HTMLSelectElement>('record-filter');
const previous = element<HTMLButtonElement>('previous-page');
const next = element<HTMLButtonElement>('next-page');
const tableWrap = element<HTMLElement>('records-table-wrap');
let records = readRecords();
let page = 0;
let pageSize = 9;
const formatTime = (seconds: number) => `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
const gameUrl = (id: string) => `jeu.html?parcours=${encodeURIComponent(id)}`;
const wanted = new URLSearchParams(location.search).get('parcours');
const returnStage = stages.find(stage => stage.id === wanted)?.id ?? '01_monde';
element<HTMLAnchorElement>('back-to-game').href = gameUrl(returnStage);
element<HTMLAnchorElement>('sidebar-play').href = gameUrl(returnStage);

let name = 'Joueur';
try {
  const profile = JSON.parse(sessionStorage.getItem('mapmonde.player') ?? 'null');
  if (typeof profile?.name === 'string' && profile.name.trim()) name = profile.name.trim().slice(0,80);
} catch {}
element('player-name').textContent = name;
element('player-avatar').textContent = name.split(/\s+/).map(s=>s[0]).slice(0,2).join('').toUpperCase();

stages.forEach((stage,index) => {
  const link = document.createElement('a'); link.href = gameUrl(stage.id); link.className = 'nav-link';
  const number = document.createElement('i'); number.className = 'stage-number'; number.style.fontStyle = 'normal'; number.textContent = String(index+1).padStart(2,'0');
  const title = document.createElement('span'); title.textContent = stage.title;
  const count = document.createElement('small'); count.className = 'stage-total'; count.textContent = String(stage.pieces.length);
  link.append(number,title,count); element('records-stage-list').append(link);
});

function cell(label: string, text: string): HTMLTableCellElement {
  const td = document.createElement('td'); td.dataset.label = label; td.textContent = text; return td;
}
function render() {
  const completed = stages.filter(stage => recordForStage(stage,records));
  element('completed-count').textContent = `${completed.length} / ${stages.length} cartes`;
  element('records-note').textContent = completed.length
    ? 'Un meilleur résultat par carte. À score égal, le temps le plus court est conservé.'
    : 'Aucun record pour le moment. Termine une carte avant la fin du compte à rebours.';
  const visible = stages.filter(stage => {
    const has = !!recordForStage(stage,records);
    return filter.value === 'completed' ? has : filter.value === 'unplayed' ? !has : true;
  });
  const pages = Math.max(1,Math.ceil(visible.length/pageSize)); page = Math.min(page,pages-1);
  const start = page * pageSize;
  rows.replaceChildren();
  visible.slice(start,start+pageSize).forEach(stage => {
    const record = recordForStage(stage,records);
    const row = document.createElement('tr');
    const stageCell = document.createElement('td'); stageCell.className = 'record-stage';
    const title = document.createElement('strong'); title.textContent = stage.title;
    const detail = document.createElement('span'); detail.textContent = `${stage.pieces.length} pièces${record ? '' : ' · À terminer'}`;
    stageCell.append(title,detail);
    const action = document.createElement('td'); action.className = 'record-action';
    const link = document.createElement('a'); link.className = 'card-action'; link.href = gameUrl(stage.id); link.textContent = record ? 'Rejouer' : 'Jouer'; link.setAttribute('aria-label',`${record ? 'Rejouer' : 'Jouer'} : ${stage.title}`);
    action.append(link);
    row.append(stageCell,cell('Score',record ? record.score.toLocaleString('fr-FR') : '—'),cell('Temps',record ? formatTime(record.time) : '—'),cell('Aides',record ? `${record.helps} / ${MAX_HELPS}` : '—'),cell('Erreurs',record ? String(record.errors) : '—'),action);
    rows.append(row);
  });
  if (!visible.length) {
    const row = document.createElement('tr'); row.className = 'empty-record-row';
    const td = document.createElement('td'); td.colSpan = 6; td.textContent = filter.value === 'completed' ? 'Aucune carte terminée pour le moment.' : 'Toutes les cartes possèdent déjà un record.'; row.append(td); rows.append(row);
  }
  element('page-info').textContent = visible.length ? `${start+1}–${Math.min(start+pageSize,visible.length)} sur ${visible.length} carte${visible.length > 1 ? 's' : ''}` : 'Aucune carte';
  previous.disabled = page === 0; next.disabled = page >= pages-1;
}
function fitRows() {
  const mobile = matchMedia('(max-width:600px)').matches;
  const header = mobile ? 0 : 34;
  const height = mobile ? 88 : 48;
  const size = Math.max(1,Math.min(stages.length,Math.floor((tableWrap.clientHeight-header)/height)));
  if (size !== pageSize) { pageSize = size; render(); }
}
filter.addEventListener('change',()=>{page=0;render();});
previous.addEventListener('click',()=>{page=Math.max(0,page-1);render();});
next.addEventListener('click',()=>{page++;render();});
new ResizeObserver(fitRows).observe(tableWrap);
window.addEventListener('storage',event=>{if(event.key==='mapmonde.records'||event.key===null){records=readRecords();render();}});
window.addEventListener('pageshow',()=>{records=readRecords();render();fitRows();});

const menu = element<HTMLButtonElement>('menu-button');
const backdrop = element<HTMLButtonElement>('drawer-backdrop');
function closeMenu(){document.body.classList.remove('game-nav-open');backdrop.hidden=true;menu.setAttribute('aria-expanded','false');}
menu.addEventListener('click',()=>{const open=!document.body.classList.contains('game-nav-open');document.body.classList.toggle('game-nav-open',open);backdrop.hidden=!open;menu.setAttribute('aria-expanded',String(open));});
backdrop.addEventListener('click',closeMenu);
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
render(); fitRows();
