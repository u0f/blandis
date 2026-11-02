// Overlay menus (start, pause, game over, settings, styles, achievements, help) + top-right buttons.
import { save, persist } from '../storage.js';
import { t, tx, setLang, LANGS, formatTime } from '../i18n.js';
import { THEMES, hsl, setTheme, setBg } from '../themes.js';
import { ACHIEVEMENTS, isThemeUnlocked, unlock, unlockedCount } from '../achievements.js';
import { sfx, unlockAudio } from '../audio.js';
import { fetchTop, submitScore, deleteScore, NAME_RE } from '../leaderboard.js';
import { hasAnalytics, setAnalytics } from '../analytics.js';
import { MODES, record, formatResult } from '../modes.js';
import {
  iconGlobe, iconTrophy, iconCrown, iconLock, iconShare, iconCheck, iconTrash, iconPalette
} from '../icons.js';

// Title of the game over screen for each Game#endReason.
const END_TITLE = { overflow: 'over', time: 'timeUp', slow: 'tooSlow', shots: 'noShots', goal: 'goalDone' };

const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const legalLink = (page, label) => `<a href="legal/${page}.html" target="_blank" rel="noopener">${label}</a>`;
// Static, crawlable how-to-play page in the current language.
const guideLink = label => `<a href="${save.lang === 'es' ? 'como-jugar' : 'how-to-play'}.html" target="_blank" rel="noopener">${label}</a>`;

const ICON_PAUSE = '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="3" width="4" height="14" rx="2" fill="currentColor"/><rect x="12" y="3" width="4" height="14" rx="2" fill="currentColor"/></svg>';
const ICON_SOUND = on => `<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 8h4l5-4v14l-5-4H3z" fill="currentColor"/>${on
  ? '<path d="M15 7.5q3 3.5 0 7M17.5 5q5 6 0 12" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
  : '<path d="M15 8l5 6M20 8l-5 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'}</svg>`;

export class Menu {
  constructor(game) {
    this.game = game;
    this.overlay = document.getElementById('overlay');
    this.card = document.getElementById('card');
    this.btnMute = document.getElementById('bMute');
    this.btnPause = document.getElementById('bPause');
    this.base = 'start';     // screen that "Back" returns to
    this.screen = 'start';

    this.btnPause.innerHTML = ICON_PAUSE;
    this.overlay.addEventListener('click', e => this.onClick(e));
    this.btnPause.onclick = () => { unlockAudio(); sfx.click(); this.togglePause(); };
    this.btnMute.onclick = () => { save.muted = !save.muted; persist(); this.refreshButtons(); unlockAudio(); sfx.click(); };
    // Nickname inputs: Enter sends from the game-over screen, settings saves on change.
    this.overlay.addEventListener('keydown', e => { if (e.key === 'Enter') { if (e.target.id === 'lbName') this.sendName(); if (e.target.id === 'bgUrl') this.applyBg(); } });
    this.overlay.addEventListener('change', e => {
      if (e.target.id === 'langSet') {
        unlockAudio(); sfx.click(); setLang(e.target.value); unlock('polyglot');
        this.refreshButtons(); this.show('settings', false); return;
      }
      if (e.target.id !== 'nameSet') return;
      const n = e.target.value.trim();
      if (!n || NAME_RE.test(n)) { save.name = n; persist(); } else e.target.value = save.name;
    });
    // Global leaderboard status for the last run: null | 'ask' | 'sending' | 'error' | rank number.
    this.lb = null;
    // Scores are sent automatically only after the player has joined once (age + terms accepted,
    // which is when the player id is created); otherwise the join form is shown.
    game.onOver = () => {
      this.lb = game.tampered || !game.result ? null : save.name && save.pid ? 'sending' : 'ask';
      this.show('over');
      if (this.lb === 'sending') this.send();
    };
    this.refreshButtons();
  }

  async send() {
    const g = this.game, line = () => { const el = document.getElementById('lbLine'); if (el) el.innerHTML = this.lbLine(); };
    this.lb = 'sending'; line();
    try { this.lb = (await submitScore(g.mode, g.score, g.time, g.merges)).rank; } catch (e) { this.lb = 'error'; }
    line();
  }

  /** Phones get the native share sheet; elsewhere the text is copied (or shown to copy by hand). */
  async share(button) {
    const g = this.game, sec = Math.floor(g.time);
    const text = t('shareText')(g.score, Math.floor(sec / 60), sec % 60, location.origin + location.pathname);
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ text }); } catch (e) { /* cancelled */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      button.innerHTML = `${iconCheck()} ${t('copied')}`;
      setTimeout(() => { button.innerHTML = `${iconShare()} ${t('share')}`; }, 2000);
    } catch (e) {
      button.outerHTML = `<textarea class="shareText" readonly>${esc(text)}</textarea>`;
      this.card.querySelector('.shareText').select();
    }
  }

  sendName() {
    const input = document.getElementById('lbName'), n = input.value.trim(), ok = document.getElementById('lbOk');
    if (!NAME_RE.test(n)) { input.classList.add('bad'); input.focus(); return; }
    if (!ok.checked) { ok.parentElement.classList.add('bad'); return; }
    save.name = n; persist(); this.send();
  }

  /** Custom background: only applied (and saved) once the image actually loads. */
  applyBg() {
    const input = document.getElementById('bgUrl');
    let url;
    try { url = new URL(input.value.trim()); } catch (e) { /* not a URL */ }
    if (!url || !/^https?:$/.test(url.protocol)) { input.classList.add('bad'); input.focus(); return; }
    const img = new Image(), done = () => { if (this.screen === 'settings') this.show('settings', false); };
    img.onload = () => { this.bgErr = ''; setBg(url.href); unlock('wallpaper'); done(); };
    img.onerror = () => { this.bgErr = input.value; done(); };
    img.src = url.href;
  }

  lbLine() {
    const s = this.lb;
    if (s === 'ask') return `<div class="row"><input id="lbName" maxlength="16" placeholder="${t('yourName')}" autocomplete="nickname" value="${esc(save.name)}">
      <button class="opt on" data-a="sendName">${t('send')}</button></div>
      <label class="check"><input type="checkbox" id="lbOk"><span>${t('joinTerms')(legalLink('terms', t('terms')), legalLink('privacy', t('privacyPolicy')))}</span></label>
      <p class="note">${t('publicNote')}</p>`;
    if (s === 'sending') return `<p class="sub">${iconGlobe('ico-sm')} ${t('sending')}</p>`;
    if (s === 'error') return `<p class="sub">${iconGlobe('ico-sm')} ${t('lbError')} <button class="opt on" data-a="send">${t('retry')}</button></p>`;
    if (typeof s === 'number') return `<p class="sub">${iconGlobe('ico-sm')} ${t('globalRank')}: <b>#${s}</b></p>`;
    return '';
  }

  async loadTop() {
    let html;
    const mode = this.lbMode;
    try {
      const rows = await fetchTop(mode), byTime = MODES[mode].byTime;
      if (mode !== this.lbMode) return;   // another tab was picked while this one loaded
      html = rows.length
        ? `<ol class="lb">${rows.map(r => `<li class="${r.name === save.name ? 'me' : ''}">${esc(r.name)}<b>${byTime ? formatResult(mode, r.time) : r.score}</b></li>`).join('')}</ol>`
        : `<p class="sub">${t('lbEmpty')}</p>`;
    } catch (e) { html = `<p class="sub">${t('lbError')}</p>`; }
    const el = document.getElementById('lbList');
    if (el) el.innerHTML = html;
  }

  refreshButtons() {
    this.btnMute.innerHTML = ICON_SOUND(!save.muted);
    this.btnMute.title = this.btnMute.ariaLabel = t('soundBtn');
    this.btnPause.title = this.btnPause.ariaLabel = t('menuBtn');
  }

  togglePause() {
    const g = this.game;
    if (g.state === 'play') { g.pause(); this.show('pause'); }
    else if (g.state === 'paused') { g.resume(); this.hide(); }
  }

  hide() { this.overlay.classList.add('hide'); }

  show(screen, animate = true) {
    if (['start', 'pause', 'over'].includes(screen)) this.base = screen;
    this.screen = screen;
    this.overlay.classList.remove('hide');
    this.card.innerHTML = this.html(screen);
    if (animate) { this.card.style.animation = 'none'; void this.card.offsetWidth; this.card.style.animation = ''; }
    if (screen === 'lb') this.loadTop();
  }

  html(screen) {
    const g = this.game;
    const btn = (a, label, alt = true) => `<button class="big ${alt ? 'alt' : ''}" data-a="${a}">${label}</button>`;
    const opt = (a, v, on, label, title) => `<button class="opt ${on ? 'on' : ''}" data-a="${a}" data-v="${v}"${title ? ` title="${title}"` : ''}>${label}</button>`;
    const best = `<p class="sub">${t('best')}: <b>${save.best}</b></p>`;
    const back = btn('back', t('back'), false);
    const achBtn = btn('ach', `${iconTrophy()} ${t('ach')} ${unlockedCount()}/${ACHIEVEMENTS.length}`);
    const lbBtn = btn('lb', `${iconGlobe()} ${t('globalTop')}`);

    switch (screen) {
      case 'start':
        return `<p class="logo">Blandis</p><p class="sub">${t('tagline')}</p>
          ${btn('modes', t('play'), false)}${lbBtn}${achBtn}${btn('settings', t('settings'))}${btn('help', t('help'))}
          ${save.best ? best : ''}
          <a class="more" href="#about-game">${t('moreAbout')} ↓</a>
          <p class="legal">${guideLink(t('guide'))} · ${legalLink('privacy', t('privacy'))} · ${legalLink('cookies', 'Cookies')} · ${legalLink('terms', t('terms'))} · ${legalLink('about', t('about'))}</p>`;
      case 'pause':
        return `<h2>${t('pause')}</h2>
          ${btn('resume', t('resume'), false)}${btn('play', t('restart'))}${achBtn}${btn('settings', t('settings'))}
          ${btn('help', t('help'))}${btn('menu', t('mainMenu'))}`;
      case 'modes':
        return `<h2>${t('modes')}</h2>${Object.entries(MODES).map(([id, m]) => {
          const b = record(id).best;
          return `<button class="ach mode ${save.mode === id ? 'on' : ''}" data-a="mode" data-v="${id}"><div class="ic">${m.icon}</div>
            <div><b>${tx(m.name)}</b><span>${tx(m.desc)}${b ? ` · ${t('best')}: ${formatResult(id, b)}` : ''}</span></div></button>`;
        }).join('')}${back}`;
      case 'over': {
        // Main number: the score, or the time for byTime modes ('—' if the goal wasn't reached).
        const m = g.rules, rec = record(g.mode), fmt = v => formatResult(g.mode, v);
        return `<h2>${t(END_TITLE[g.endReason] || 'over')}</h2><p class="sub">${m.icon} ${tx(m.name)}</p>
          <div class="score">${m.byTime ? (g.result === null ? '—' : fmt(g.result)) : g.score}</div>
          <p class="sub">${m.byTime ? `${t('score')}: <b>${g.score}</b>` : `${t('time')}: <b>${formatTime(g.time)}</b>`}</p>
          ${g.tampered ? `<p class="warn">${t('notRecorded')}</p>` : ''}
          ${g.isNewBest && g.result > 0 ? `<span class="badge">${t('newBest')}</span>` : rec.best ? `<p class="sub">${t('best')}: <b>${fmt(rec.best)}</b></p>` : ''}
          <ol>${rec.top.map(v => `<li>${fmt(v)}</li>`).join('')}</ol>
          <div id="lbLine">${this.lbLine()}</div>
          ${btn('play', t('again'), false)}${g.score ? btn('share', `${iconShare()} ${t('share')}`) : ''}${lbBtn}${btn('modes', t('modes'))}${btn('menu', t('mainMenu'))}`;
      }
      case 'lb':
        return `<h2>${iconGlobe()} ${t('globalTop')}</h2>
          <div class="tabs">${Object.entries(MODES).map(([id, m]) => opt('lbMode', id, this.lbMode === id, m.icon, tx(m.name))).join('')}</div>
          <p class="sub">${tx(MODES[this.lbMode].name)}</p><div id="lbList"><p class="sub">${t('loading')}</p></div>${back}`;
      case 'settings':
        return `<h2>${t('settings')}</h2>
          <div class="row"><b>${t('language')}</b><select id="langSet">${Object.entries(LANGS).map(([id, name]) =>
            `<option value="${id}" lang="${id}" ${save.lang === id ? 'selected' : ''}>${name}</option>`).join('')}</select></div>
          <div class="row"><b>${t('sound')}</b><div>${opt('sound', 'on', !save.muted, t('on'))}${opt('sound', 'off', save.muted, t('off'))}</div></div>
          ${hasAnalytics ? `<div class="row"><b>${t('analytics')}</b><div>${opt('ga', 'on', save.ga, t('on'))}${opt('ga', 'off', !save.ga, t('off'))}</div></div>` : ''}
          <div class="row"><b>${t('name')}</b><input id="nameSet" maxlength="16" value="${esc(save.name)}" placeholder="${t('yourName')}" autocomplete="nickname"></div>
          <p class="note">${t('publicNote')} ${legalLink('privacy', t('privacy'))}</p>
          ${save.pid ? btn('delMine', `${iconTrash()} ${this.confirmDel ? t('delConfirm') : t('delMine')}`) : ''}
          ${this.delMsg ? `<p class="note">${this.delMsg}</p>` : ''}
          <div class="row"><input id="bgUrl" type="url" value="${esc(this.bgErr || save.bg)}" placeholder="${t('bgUrl')}" autocomplete="off">
            <button class="opt on" data-a="bgSet">${t('apply')}</button></div>
          ${this.bgErr ? `<p class="warn">${t('bgError')}</p>` : ''}
          ${save.bg ? btn('bgDel', `${iconTrash()} ${t('bgDel')}`) : ''}
          ${btn('styles', t('styles'))}${back}`;
      case 'styles':
        return `<h2>${t('styles')}</h2><div class="grid">${Object.entries(THEMES).map(([id, th]) => {
          const ok = isThemeUnlocked(id), a = ACHIEVEMENTS.find(a => a.theme === id);
          const dots = [0, 2, 4, 6, 8].map(l => `<i style="background:${hsl(th.col(l, l * 0.4))}"></i>`).join('');
          return `<button class="sw ${save.theme === id ? 'on' : ''}" data-a="theme" data-v="${id}" ${ok ? '' : 'disabled'}
            style="background:linear-gradient(${th.bg[0]},${th.bg[1]});color:${th.ink}">
            <div class="dots">${dots}</div>${ok ? '' : iconLock('ico-sm') + ' '}${tx(th.name)}${ok || !a ? '' : `<small>${tx(a.desc)}</small>`}</button>`;
        }).join('')}</div>${back}`;
      case 'ach':
        return `<h2>${t('ach')}</h2>
          <div class="progress"><i style="width:${unlockedCount() / ACHIEVEMENTS.length * 100}%"></i></div>
          <p class="sub">${unlockedCount()} / ${ACHIEVEMENTS.length}</p>
          ${ACHIEVEMENTS.map(a => {
            const ok = save.ach.includes(a.id);
            const reward = a.theme ? ` · ${iconPalette('ico-sm')} ${tx(THEMES[a.theme].name)}` : '';
            return `<div class="ach ${ok ? '' : 'lock'}"><div class="ic">${ok ? a.icon : iconLock()}</div>
              <div><b>${tx(a.name)}</b><span>${tx(a.desc)}${reward}</span></div></div>`;
          }).join('')}${back}`;
      case 'help':
        return `<h2>${t('help')}</h2><ul class="help">${t('helpList').map(s => `<li>${s}</li>`).join('')}</ul>
          <p class="note">${guideLink(t('fullGuide'))}</p>${back}`;
    }
    return '';
  }

  onClick(e) {
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    unlockAudio(); sfx.click();
    const g = this.game, a = el.dataset.a, v = el.dataset.v;
    if (a !== 'delMine') { this.confirmDel = false; this.delMsg = ''; }
    this.bgErr = '';
    switch (a) {
      case 'delMine':
        if (!this.confirmDel) { this.confirmDel = true; this.show('settings', false); break; }
        this.confirmDel = false;
        deleteScore().then(() => { this.delMsg = t('deleted'); }, () => { this.delMsg = t('lbError'); })
          .then(() => { if (this.screen === 'settings') this.show('settings', false); });
        break;
      case 'bgSet': this.applyBg(); break;
      case 'bgDel': setBg(''); this.show('settings', false); break;
      case 'play': g.start(); this.hide(); break;
      case 'lb': this.lbMode = g.mode; this.show('lb'); break;
      case 'lbMode': this.lbMode = v; this.show('lb', false); break;
      case 'mode': save.mode = v; persist(); g.start(); this.hide(); break;
      case 'resume': g.resume(); this.hide(); break;
      case 'menu': g.attract(); this.show('start'); break;
      case 'send': this.send(); break;
      case 'share': this.share(el); break;
      case 'sendName': this.sendName(); break;
      case 'back': this.show(this.screen === 'styles' ? 'settings' : this.base); break;
      case 'sound': save.muted = v === 'off'; persist(); this.refreshButtons(); this.show('settings', false); break;
      case 'ga': setAnalytics(v === 'on'); this.show('settings', false); break;
      case 'theme':
        if (v !== save.theme) { setTheme(v); unlock('fashion'); }
        this.show('styles', false); break;
      default: this.show(a);
    }
  }
}
