// Draws the game onto the canvas. Reads game state, never changes it.
import {
  W, H, WALL_L, WALL_R, FLOOR, JAR_TOP, DANGER, MAX_LEVEL, DANGER_TIME,
  TRAY_L, TRAY_R, TRAY_TOP, TRAY_BOT, valueOf,
} from './config.js';
import { theme, hsl, jarImg } from './themes.js';
import { t, tx, formatTime } from './i18n.js';
import { record, formatResult } from './modes.js';

const LINE = '#0b0a09';
const LIGHT = '#fff6ea';
const FONT = 'Nunito, system-ui, sans-serif';

function drawHudTimer(ctx, cx, cy) {
  ctx.save();
  ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, cy + 1, 7.5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 3, cy - 8.5); ctx.lineTo(cx + 3, cy - 8.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 6.5); ctx.lineTo(cx, cy - 8.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy + 1); ctx.lineTo(cx, cy - 3); ctx.lineTo(cx + 2.5, cy - 1); ctx.stroke();
  ctx.restore();
}

function drawHudTarget(ctx, cx, cy) {
  ctx.save();
  ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawHudLightning(ctx, cx, cy) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx + 1, cy - 9);
  ctx.lineTo(cx - 6, cy + 1);
  ctx.lineTo(cx - 0.5, cy + 1);
  ctx.lineTo(cx - 1.5, cy + 9);
  ctx.lineTo(cx + 6, cy - 1);
  ctx.lineTo(cx + 0.5, cy - 1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export class Renderer {
  constructor(canvas, game) {
    this.cv = canvas;
    this.mainCtx = canvas.getContext('2d');
    this.ctx = this.mainCtx;
    this.bgCv = document.createElement('canvas');
    this.bgCtx = this.bgCv.getContext('2d');
    this.bgScale = 0.35;
    this.game = game;
    this.view = { s: 1, ox: 0, oy: 0, dpr: 1 };
    this.shownScore = 0;
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = this.cv.clientWidth, h = this.cv.clientHeight;
    this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
    const s = Math.min(w / W, h / H);
    this.view = { s, dpr, ox: (w - W * s) / 2, oy: (h - H * s) / 2 };
    this.bgCv.width = Math.max(1, Math.round(w * this.bgScale));
    this.bgCv.height = Math.max(1, Math.round(h * this.bgScale));
  }

  /** Screen (CSS px) -> world coordinates. */
  toWorld(clientX, clientY) {
    const v = this.view, r = this.cv.getBoundingClientRect();
    return { x: (clientX - r.left - v.ox) / v.s, y: (clientY - r.top - v.oy) / v.s };
  }

  draw() {
    const { game, mainCtx } = this, { s, dpr, ox, oy } = this.view, fx = game.fx;
    // Behind the menu the jar is drawn into a small buffer and scaled up: cheaper, and the softness reads as a backdrop.
    const attract = game.state === 'attract', ctx = this.ctx = attract ? this.bgCtx : mainCtx, k = attract ? this.bgScale : dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const shx = (Math.random() - 0.5) * fx.shake, shy = (Math.random() - 0.5) * fx.shake;
    ctx.setTransform(k * s, 0, 0, k * s, k * (ox + shx * s), k * (oy + shy * s));

    this.drawJar();
    if (!attract) this.drawTray();
    for (const b of game.world.blobs) this.drawBody(b.px, b.py, b.n, b.level, b.cx, b.cy, b.r * b.scale, b.happy > 0);
    this.drawAim();
    this.drawEffects();
    if (!attract) this.drawHud();

    if (attract) {
      mainCtx.setTransform(1, 0, 0, 1, 0, 0);
      mainCtx.clearRect(0, 0, this.cv.width, this.cv.height);
      mainCtx.drawImage(this.bgCv, 0, 0, this.cv.width, this.cv.height);
    }
  }

  drawJar() {
    const { ctx, game } = this;
    const x = WALL_L - 8, y = JAR_TOP, w = WALL_R - WALL_L + 16, h = FLOOR - JAR_TOP + 8;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 28);
    ctx.fillStyle = theme.jar; ctx.fill();
    if (jarImg?.naturalWidth) {
      // Custom background, scaled to cover the jar and clipped to its shape.
      const iw = jarImg.naturalWidth, ih = jarImg.naturalHeight, k = Math.max(w / iw, h / ih);
      ctx.save(); ctx.clip();
      ctx.drawImage(jarImg, x + (w - iw * k) / 2, y + (h - ih * k) / 2, iw * k, ih * k);
      ctx.restore();
    }
    ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.stroke();

    const warn = game.dangerT > 0;
    ctx.setLineDash([14, 12]); ctx.lineWidth = 3;
    ctx.strokeStyle = warn ? `rgba(255,90,70,${0.5 + 0.5 * Math.sin(game.clock * 18)})` : LIGHT;
    ctx.globalAlpha = warn ? 1 : 0.22;
    ctx.beginPath(); ctx.moveTo(WALL_L, DANGER); ctx.lineTo(WALL_R, DANGER); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }

  /** The channel where the next blobs wait. */
  drawTray() {
    const ctx = this.ctx, pad = 7, h = TRAY_BOT - TRAY_TOP + pad * 2;
    ctx.beginPath();
    ctx.roundRect(TRAY_L - pad, TRAY_TOP - pad, TRAY_R - TRAY_L + pad * 2, h, h / 2);
    ctx.fillStyle = theme.jar; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.stroke();
  }

  /** White outline on the hovered/picked tray blob, and an arrow showing the launch. */
  drawAim() {
    const { ctx, game } = this, b = game.selected || game.hover;
    if (!b || b.dead) return;
    this.blobPath(b.px, b.py, b.n);
    // Dimmed outline: releasing now puts the blob back.
    ctx.globalAlpha = game.aimCancelled ? 0.35 : 1;
    ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = LIGHT; ctx.stroke();
    ctx.globalAlpha = 1;
    // No arrow until the drag is past the cancel zone, so "arrow gone" always means "release cancels".
    if (!game.grip?.armed || game.aimCancelled) return;
    const pull = game.aimPull(), d = Math.hypot(pull.x, pull.y);
    const ux = pull.x / d, uy = pull.y / d, { x: ex, y: ey } = game.aimTip();
    ctx.lineCap = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = LIGHT;
    ctx.beginPath(); ctx.moveTo(b.cx, b.cy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ex - ux * 18 - uy * 13, ey - uy * 18 + ux * 13); ctx.lineTo(ex, ey);
    ctx.lineTo(ex - ux * 18 + uy * 13, ey - uy * 18 - ux * 13);
    ctx.stroke();
  }

  drawEffects() {
    const { ctx } = this, fx = this.game.fx;
    for (const r of fx.rings) {
      const k = r.life / r.max;
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = r.col; ctx.lineWidth = 8 * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (0.8 + k * 0.9), 0, Math.PI * 2); ctx.stroke();
    }
    for (const p of fx.parts) {
      ctx.globalAlpha = 1 - p.life / p.max; ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const tx of fx.texts) {
      const k = tx.life / tx.max, pop = Math.min(1, tx.life * 8);
      ctx.globalAlpha = 1 - k * k;
      ctx.font = `900 ${tx.size * (0.6 + 0.4 * pop)}px ${FONT}`;
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(70,50,35,.55)'; ctx.strokeText(tx.text, tx.x, tx.y);
      ctx.fillStyle = tx.hot ? '#f2c46b' : '#fffaf2'; ctx.fillText(tx.text, tx.x, tx.y);
    }
    ctx.globalAlpha = 1;
  }

  drawHud() {
    const { ctx, game } = this, ink = theme.ink;
    this.shownScore += (game.score - this.shownScore) * 0.2;
    if (Math.abs(game.score - this.shownScore) < 1) this.shownScore = game.score;

    ctx.textAlign = 'left'; ctx.fillStyle = ink;
    ctx.font = `900 52px ${FONT}`; ctx.fillText(Math.round(this.shownScore), WALL_L, 46);
    const m = game.rules, best = record(game.mode).best;
    // Mode being played, centred at the top (nudged right if a long score would reach it).
    const scoreEnd = WALL_L + ctx.measureText(Math.round(this.shownScore)).width;
    const title = tx(m.name);
    ctx.font = `900 22px ${FONT}`; ctx.globalAlpha = 0.75;
    ctx.textAlign = 'center';
    ctx.fillText(title, Math.max(W / 2, scoreEnd + ctx.measureText(title).width / 2 + 20), 32);

    // Second line: the mode's best on the left; time (or time left) on the right.
    ctx.globalAlpha = 0.6; ctx.font = `800 20px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`${t('best')}: ${m.byTime ? (best ? formatResult(game.mode, best) : '-') : Math.max(best, game.score)}`, WALL_L + 2, 94);

    const timeStr = m.limit ? formatTime(Math.ceil(Math.max(0, m.limit - game.time))) : formatTime(game.time);
    ctx.textAlign = 'right';
    ctx.fillText(timeStr, WALL_R, 94);
    const tw = ctx.measureText(timeStr).width;
    ctx.strokeStyle = ink;
    drawHudTimer(ctx, WALL_R - tw - 13, 86);
    ctx.textAlign = 'center'; ctx.globalAlpha = 1;

    // Shots mode: launches used out of the total, red near the end.
    if (m.shots) {
      const left = Math.max(0, game.shotsLeft);
      const shotsCol = left <= 5 ? '#ff3c5a' : ink;
      const str = `${m.shots - left}/${m.shots}`;
      ctx.fillStyle = ctx.strokeStyle = shotsCol; ctx.font = `900 30px ${FONT}`;
      ctx.textAlign = 'center';
      const sw = ctx.measureText(str).width;
      ctx.fillText(str, W / 2 + 10, 94);
      drawHudTarget(ctx, W / 2 - sw / 2 - 4, 84);
    }
    // Speedrun: countdown while the tray is full.
    if (m.trayTimer && game.trayT > 0 && game.state === 'play') {
      const str = Math.max(0, m.trayTimer - game.trayT).toFixed(1);
      ctx.fillStyle = ctx.strokeStyle = '#ff3c5a'; ctx.font = `900 26px ${FONT}`;
      ctx.textAlign = 'center';
      const lw = ctx.measureText(str).width;
      ctx.fillText(str, W / 2 + 9, 94);
      drawHudLightning(ctx, W / 2 - lw / 2 - 3, 85);
    }

    // Evolution chain under the jar
    let x = WALL_L + 14;
    for (let l = 0; l <= MAX_LEVEL; l++) {
      const r = 6 + l * 1.1;
      ctx.globalAlpha = l <= Math.max(game.maxLevel, 4) ? 1 : 0.3;
      ctx.fillStyle = hsl(theme.col(l, game.clock)); ctx.strokeStyle = hsl(theme.col(l, game.clock), -24); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x + r, FLOOR + 30, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      x += r * 2 + 13.5;
    }
    ctx.globalAlpha = 1;

    if (game.dangerT > 0 && game.state === 'play') {
      ctx.fillStyle = '#ff3c5a'; ctx.font = `900 26px ${FONT}`;
      ctx.fillText(t('careful') + ' ' + Math.max(0, DANGER_TIME - game.dangerT).toFixed(1), W / 2, DANGER + 30);
    }
  }

  /** Smooth closed curve through the points (midpoint quadratic). */
  blobPath(xs, ys, n) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo((xs[n - 1] + xs[0]) / 2, (ys[n - 1] + ys[0]) / 2);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      ctx.quadraticCurveTo(xs[i], ys[i], (xs[i] + xs[j]) / 2, (ys[i] + ys[j]) / 2);
    }
    ctx.closePath();
  }

  drawBody(xs, ys, n, level, cx, cy, r, happy) {
    const ctx = this.ctx, c = theme.col(level, this.game.clock);
    this.blobPath(xs, ys, n);
    ctx.fillStyle = hsl(c); ctx.fill();
    ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = LINE; ctx.stroke();

    const label = String(valueOf(level)), len = label.length;
    const size = Math.min(r * 0.5, 40) * (len <= 2 ? 1 : len === 3 ? 0.85 : 0.7) * (happy ? 1.12 : 1);
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = c[2] > 40 ? 'rgba(11,10,9,.82)' : LIGHT;
    ctx.fillText(label, cx, cy + size * 0.04);
  }
}
