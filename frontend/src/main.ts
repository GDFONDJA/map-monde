import './styles/template.css';
import './styles/signin.css';
import type { PlayerProfile } from './types';

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Élément introuvable : ${id}`);
  return found as T;
}
const form = element<HTMLFormElement>('player-form');
const playerName = element<HTMLInputElement>('player-name');
const language = element<HTMLSelectElement>('player-language');
const country = element<HTMLSelectElement>('player-country');
const error = element<HTMLElement>('form-error');
const countryCodes = `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ
        BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
        CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ
        DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR
        GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY
        HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP
        KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY
        MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ
        NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY
        QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ
        TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ
        VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`.trim().split(/\s+/)
const regionNames = new Intl.DisplayNames(['fr'], { type: 'region' });
countryCodes.map(code => ({ code, name: regionNames.of(code) ?? code }))
  .sort((a,b) => a.name.localeCompare(b.name, 'fr'))
  .forEach(({code,name}) => country.add(new Option(name,code)));

playerName.addEventListener('input', () => playerName.setCustomValidity(''));
form.addEventListener('submit', event => {
  event.preventDefault();
  const name = playerName.value.trim().replace(/\s+/g, ' ');
  if (!name) {
    playerName.setCustomValidity('Indique ton nom et prénom.');
    playerName.reportValidity(); return;
  }
  const profile: PlayerProfile = { name, language: language.value, country: country.value };
  try {
    sessionStorage.setItem('mapmonde.player', JSON.stringify(profile));
    error.hidden = true;
    location.assign(form.action);
  } catch {
    error.textContent = 'Impossible de démarrer. Autorise le stockage de session dans ton navigateur, puis réessaie.';
    error.hidden = false;
  }
});
