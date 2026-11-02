// Game rules and state machine. Knows nothing about the DOM or canvas.
import {
  WALL_L, WALL_R, DANGER, SUB, MAX_LEVEL, MAX_PULL, PULL_SPEED, TAP_POWER, CANCEL_POWER,
  TRAY_L, TRAY_R, TRAY_TOP, TRAY_BOT, TRAY_SIZE, TRAY_SPAWN_DELAY,
  COMBO_WINDOW, DANGER_TIME, radiusOf, valueOf, randomSpawnLevel,
} from './config.js';
import { Blob } from './physics/blob.js';
import { World } from './physics/world.js';
import { Effects } from './effects.js';
import { save, persist } from './storage.js';
import { theme, hsl } from './themes.js';
import { t } from './i18n.js';
import { sfx, buzz } from './audio.js';
import { checkAchievements } from './achievements.js';
import { MODES, addResult, record } from './modes.js';

const SHOTS_SETTLE = 3;   // s after the last shot (shots mode) for merges to finish before the run ends

// Captured at load, before any console script could replace them.
const wallNow = Date.now;

/** States: attract (menu backdrop) | play | paused | ending (popping animation) | over */
export class Game {
  // Score and time live in private fields: they can't be read or written from outside the class.
  // A masked copy of each is kept too; if the two ever disagree the run was tampered with.
  #score = 0; #scoreMask = 0;
  #time = 0; #timeMask = 0;
  #key = 0;
  #wallStart = 0; #pausedAt = 0; #pausedMs = 0;
  #run = null;
  #committed = true;
  #lastCheck = 0;

  constructor() {
    this.world = new World();
    this.fx = new Effects();
    this.state = 'attract';
    this.mode = save.mode;
    this.clock = 0;
    this.tampered = false;
    this.onOver = () => {};
    this.onStart = () => {};
    this.reset();
  }

  get score() { return this.#score; }
  get time() { return this.#time; }
  get merges() { return this.#run.merges; }
  get rules() { return MODES[this.mode]; }
  get shotsLeft() { return this.rules.shots - this.#run.launches; }

  #addScore(pts) {
    this.#verify();
    this.#score += pts; this.#scoreMask = (this.#score ^ this.#key) >>> 0;
  }
  #addTime(dt) {
    this.#verify();
    this.#time += dt; this.#timeMask = this.#time * 7 + this.#key;
  }
  /** Masked copies must match, and game time can never run ahead of the real clock. */
  #verify() {
    const realSec = (wallNow() - this.#wallStart - this.#pausedMs - (this.#pausedAt ? wallNow() - this.#pausedAt : 0)) / 1000;
    if (((this.#score ^ this.#key) >>> 0) !== this.#scoreMask
      || Math.abs(this.#time * 7 + this.#key - this.#timeMask) > 1e-6
      || (this.state === 'play' && this.#time > realSec + 2)) this.tampered = true;
    return !this.tampered;
  }

  reset() {
    this.#commitRun();
    this.world.clear(); this.fx.clear();
    this.#key = (Math.random() * 0xffffffff) >>> 0;
    this.#score = 0; this.#scoreMask = this.#key;
    this.#time = 0; this.#timeMask = this.#key;
    this.#wallStart = wallNow(); this.#pausedAt = 0; this.#pausedMs = 0; this.#lastCheck = 0;
    this.#run = {
      merges: 0, launches: 0, hardLaunches: 0, maxCombo: 0, gentleRun: 0, nearDeath: false, lastMergeAt: -1,
      flags: { cannon: false, bank: false, feather: false, closeCall: false, supreme: false, edge: false, lastShot: false },
    };
    this.tampered = false;
    this.combo = 0; this.lastMerge = -9; this.maxLevel = 0;
    this.dangerT = 0; this.spawnTimer = 0; this.endTimer = 0; this.trayT = 0; this.settleT = 0;
    this.isNewBest = false; this.selected = null; this.grip = null; this.hover = null;
    this.endReason = ''; this.result = null;
  }

  start(mode = save.mode) { this.mode = mode; this.reset(); this.state = 'play'; this.#committed = false; this.onStart(); }

  /** A pile of blobs falling behind the main menu. */
  attract() {
    this.reset(); this.state = 'attract';
    for (let i = 0; i < 14; i++) {
      const l = Math.floor(Math.random() * 5), r = radiusOf(l);
      const b = new Blob(l, WALL_L + r + Math.random() * (WALL_R - WALL_L - 2 * r), 300 + i * 40);
      b.fresh = false; this.world.add(b);
    }
  }

  pause() { if (this.state === 'play') { this.cancelAim(); this.state = 'paused'; this.#pausedAt = wallNow(); } }
  resume() {
    if (this.state !== 'paused') return;
    this.state = 'play';
    this.#pausedMs += wallNow() - this.#pausedAt; this.#pausedAt = 0;
  }
  get running() { return this.state !== 'paused' && this.state !== 'over'; }

  /** Blobs waiting in the tray, left to right. */
  get tray() { return this.world.blobs.filter(b => b.tray).sort((a, b) => a.cx - b.cx); }

  /** Push a new blob into the tray from the left, if there is room. */
  #refillTray() {
    const tray = this.tray;
    if (tray.length >= TRAY_SIZE) return;
    if (this.rules.shots && this.#run.launches + tray.length >= this.rules.shots) return;
    const level = randomSpawnLevel(this.maxLevel), r = radiusOf(level);
    // Room check: a squashed blob takes roughly area / channel height of tray length.
    const len = b => b.maxX - b.minX, h = TRAY_BOT - TRAY_TOP;
    const used = tray.reduce((s, b) => s + len(b), 0);
    if (used + Math.PI * r * r / h + 10 > TRAY_R - TRAY_L) return;
    if (tray.some(b => b.minX < TRAY_L + Math.min(2 * r, 90))) return;  // entrance still blocked
    const b = this.world.add(new Blob(level, TRAY_L + Math.min(r, h / 2), (TRAY_TOP + TRAY_BOT) / 2, 0.35));
    b.tray = true; b.fresh = false;
  }

  /** Read-only snapshot used by the achievement checks. */
  #context() {
    const r = this.#run, s = save.stats;
    return {
      mode: this.mode, end: this.endReason,
      score: this.#score, time: this.#time, maxLevel: this.maxLevel, blobs: this.world.blobs.filter(b => !b.tray).length,
      merges: r.merges, launches: r.launches, hardLaunches: r.hardLaunches, maxCombo: r.maxCombo,
      gentleRun: r.gentleRun, lastMergeAt: r.lastMergeAt, flags: { ...r.flags },
      bests: Object.fromEntries(Object.keys(MODES).map(id => [id, record(id).best])),
      life: {
        games: s.games + (this.#committed ? 0 : 1), merges: s.merges + r.merges,
        launches: s.launches + r.launches, playTime: s.playTime + this.#time,
        played: [...new Set([...s.played, this.mode])],
      },
    };
  }
  #check() { if (this.state === 'play' && this.#verify()) checkAchievements(this.#context()); }

  /** Add this run to the lifetime stats (once), unless it was tampered with. */
  #commitRun() {
    if (this.#committed || !this.#run) return;
    this.#committed = true;
    if (!this.#verify()) return;
    const s = save.stats, r = this.#run;
    s.games++; s.merges += r.merges; s.launches += r.launches; s.playTime += this.#time;
    if (!s.played.includes(this.mode)) s.played.push(this.mode);
    persist();
  }

  // ---- Pick a tray blob, drag toward where it should go, release to launch ----
  get canAim() { return this.state === 'play' && !this.selected; }

  /** Tray blob under (or nearest to) a point, within reach. */
  trayBlobAt(p) {
    let best = null, bestD = 1e9;
    for (const b of this.tray) {
      if (p.x < b.minX - 18 || p.x > b.maxX + 18 || p.y < b.minY - 40 || p.y > b.maxY + 40) continue;
      const d = Math.abs(p.x - b.cx);
      if (d < bestD) { bestD = d; best = b; }
    }
    return best;
  }

  setHover(p) { this.hover = this.state === 'play' && !this.selected ? this.trayBlobAt(p) : null; }

  beginAim(p, id) {
    if (!this.canAim) return;
    const b = this.trayBlobAt(p);
    if (!b) return;
    this.selected = b; this.hover = null;
    // Grip point kept relative to the blob: tray blobs keep sliding while held.
    this.grip = { ox: p.x - b.cx, oy: p.y - b.cy, x: p.x, y: p.y, id };
    sfx.click();
  }
  moveAim(p, id) {
    if (!this.grip || this.grip.id !== id) return;
    this.grip.x = p.x; this.grip.y = p.y;
    if (this.aimPower() >= CANCEL_POWER) this.grip.armed = true;
  }
  releaseAim(p, id) {
    if (!this.grip || this.grip.id !== id) return;
    this.moveAim(p, id);
    if (this.aimCancelled) this.cancelAim(); else this.#launch();
  }
  /** Arrow was pulled out and then brought back to the blob or pointed above the danger line: releasing now puts it back. */
  get aimCancelled() { return !!this.grip?.armed && (this.aimPower() < CANCEL_POWER || this.aimTip().y < DANGER); }
  /** Where the drawn launch arrow ends. */
  aimTip() {
    const b = this.selected, p = this.aimPull(), d = Math.hypot(p.x, p.y);
    if (!b || !d) return { x: b?.cx ?? 0, y: b?.cy ?? 0 };
    const len = 24 + d * 0.75;
    return { x: b.cx + p.x / d * len, y: b.cy + p.y / d * len };
  }
  cancelAim() { this.selected = null; this.grip = null; }

  /** Drag vector from the grip point on the blob, clamped to MAX_PULL: the launch direction and strength. */
  aimPull() {
    const g = this.grip, b = this.selected;
    if (!g || !b) return { x: 0, y: 0 };
    let x = g.x - (b.cx + g.ox), y = g.y - (b.cy + g.oy);
    const d = Math.hypot(x, y);
    if (d > MAX_PULL) { x *= MAX_PULL / d; y *= MAX_PULL / d; }
    return { x, y };
  }
  aimPower() { const p = this.aimPull(); return Math.hypot(p.x, p.y) / MAX_PULL; }

  #launch() {
    const b = this.selected, pull = this.aimPull(), power = this.aimPower(), r = this.#run;
    this.selected = null; this.grip = null;
    if (!b || b.dead || !b.tray) return;
    b.tray = false; b.launched = true; b.power = power; b.age = 0; b.fresh = true; b.sideHit = false;
    b.setVelocity(power >= TAP_POWER ? pull.x * PULL_SPEED : 0, power >= TAP_POWER ? pull.y * PULL_SPEED : 0);
    sfx.launch(power); buzz(8);
    // Speedrun: launched with the tray timer almost out.
    if (this.rules.trayTimer && this.trayT > this.rules.trayTimer - 0.3) r.flags.edge = true;
    r.launches++;
    if (power > 0.5) r.hardLaunches++;
    r.gentleRun = power < 0.25 ? r.gentleRun + 1 : 0;
    this.spawnTimer = TRAY_SPAWN_DELAY;
    this.#check();
  }

  merge(a, b) {
    a.dead = b.dead = true;
    const m = a.mass + b.mass;
    const cx = (a.cx * a.mass + b.cx * b.mass) / m, cy = (a.cy * a.mass + b.cy * b.mass) / m;
    const vx = (a.vcx * a.mass + b.vcx * b.mass) / m, vy = (a.vcy * a.mass + b.vcy * b.mass) / m;
    const L = a.level + 1, playing = this.state === 'play', fx = this.fx, r = this.#run;
    this.combo = this.clock - this.lastMerge < COMBO_WINDOW ? this.combo + 1 : 1;
    this.lastMerge = this.clock;

    const col = theme.col(Math.min(L, MAX_LEVEL), this.clock);
    fx.burst(cx, cy, hsl(col), 10 + L * 3, 260 + L * 25, 4 + L * 0.6);
    fx.burst(cx, cy, hsl(theme.col(a.level, this.clock), 10), 6, 200, 4);
    fx.ring(cx, cy, radiusOf(Math.min(L, MAX_LEVEL)), hsl(col));
    fx.addShake(2 + L * 0.8);

    if (playing) {
      const pts = valueOf(L) * this.combo;
      this.#addScore(pts);
      fx.text(cx, cy - 10, '+' + pts, 26 + L * 2);
      if (this.combo > 1) fx.text(cx, cy - 44, 'x' + this.combo + '!', 34 + this.combo * 3, true);
      r.merges++; r.lastMergeAt = this.#time;
      if (this.rules.shots && this.shotsLeft <= 0) r.flags.lastShot = true;
      r.maxCombo = Math.max(r.maxCombo, this.combo);
      const recent = [a, b].filter(o => o.age < 4);
      if (recent.some(o => o.launched && o.power > 0.95)) r.flags.cannon = true;
      if (recent.some(o => o.bank)) r.flags.bank = true;
      if (recent.some(o => o.launched && o.power < TAP_POWER)) r.flags.feather = true;
    }
    sfx.merge(L, this.combo); buzz(12 + L * 3);

    let R = radiusOf(Math.min(L, MAX_LEVEL));
    if (a.level === MAX_LEVEL) {
      // Two 2048s vanish in a shower
      if (playing) { this.#addScore(8192); r.flags.supreme = true; fx.text(cx, cy, t('supreme'), 44, true, 1.6); }
      fx.burst(cx, cy, '#fff', 60, 700, 7); fx.addShake(24, 24); sfx.boom(); buzz([30, 40, 60]);
      R *= 2;
    } else {
      const nb = this.world.add(new Blob(L, Math.max(WALL_L + R * 0.6, Math.min(WALL_R - R * 0.6, cx)), cy, 0.78));
      nb.setVelocity(vx * 0.5, vy * 0.5); nb.happy = 1.3; nb.fresh = false; nb.age = 0.4;
      if (playing && L > this.maxLevel) this.maxLevel = L;
    }

    // Shove neighbours outward: the satisfying "squish wave"
    for (const o of this.world.blobs) {
      if (o.dead || o.happy > 1.2) continue;
      const dx = o.cx - cx, dy = o.cy - cy, d = Math.hypot(dx, dy) || 1, reach = R * 2.4;
      if (d > reach) continue;
      // Small neighbours get a gentler push so they aren't flung across the jar.
      const f = (1 - d / reach) * (120 + L * 10) * Math.min(1, Math.sqrt(o.r / R));
      for (let i = 0; i < o.n; i++) { o.vx[i] += dx / d * f; o.vy[i] += dy / d * f; }
    }
    this.#check();
  }

  tick(dt) {
    this.clock += dt;
    const sub = this.state === 'attract' ? 3 : SUB;
    const world = this.world, h = dt / sub;
    for (let s = 0; s < sub; s++) world.step(h);

    for (const b of world.blobs) {
      b.update(dt);
      if (b.fresh && b.hit) {
        b.fresh = false;
        b.bank = b.launched && b.sideHit;   // first thing it touched was a side wall
        sfx.plop(Math.hypot(b.vcx, b.vcy));
      }
      b.hit = false;
    }
    if (world.contacts.length) {
      for (const [a, b] of world.contacts) if (!a.dead && !b.dead) this.merge(a, b);
      world.contacts.length = 0;
      world.removeDead();
    }

    if (this.state === 'play') {
      this.#addTime(dt);
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) { this.#refillTray(); this.spawnTimer = TRAY_SPAWN_DELAY; }
      const over = world.blobs.some(b => !b.tray && b.age > 1.2 && b.minY < DANGER && Math.hypot(b.vcx, b.vcy) < 260);
      this.dangerT = over ? this.dangerT + dt : Math.max(0, this.dangerT - dt * 2);
      const r = this.#run;
      if (this.dangerT > DANGER_TIME - 0.5) r.nearDeath = true;
      if (this.dangerT === 0 && r.nearDeath) { r.nearDeath = false; r.flags.closeCall = true; }
      const end = this.dangerT > DANGER_TIME ? 'overflow' : this.#modeEnd(dt);
      if (end) this.gameOver(end);
      else if (this.#time - this.#lastCheck >= 1) { this.#lastCheck = this.#time; this.#check(); }
    } else if (this.state === 'ending') {
      this.tickEnding(dt);
    }
  }

  /** The current mode's own ending rule, checked every step after the danger line: why the run ends now, or ''. */
  #modeEnd(dt) {
    const m = this.rules;
    if (m.limit && this.#time >= m.limit) return 'time';
    if (m.trayTimer) {
      this.trayT = this.tray.length >= TRAY_SIZE ? this.trayT + dt : 0;
      if (this.trayT > m.trayTimer) return 'slow';
    }
    if (m.shots && this.shotsLeft <= 0 && (this.settleT += dt) > SHOTS_SETTLE) return 'shots';
    if (m.goal && this.maxLevel >= m.goal) return 'goal';
    return '';
  }

  /** reason: overflow | time | slow | shots | goal */
  gameOver(reason = 'overflow') {
    this.endReason = reason;
    if (this.#verify()) {
      // byTime modes only count runs that reach the goal, and their result is the time it took.
      this.result = !this.rules.byTime ? this.#score : reason === 'goal' ? this.#time : null;
      if (this.result !== null) this.isNewBest = addResult(this.mode, this.result);
    }
    this.#check();   // last check: sees why the run ended and the result just stored
    this.state = 'ending'; this.endTimer = 0.6; this.selected = null; this.grip = null; this.hover = null; this.dangerT = 0;
    if (reason === 'goal') sfx.ach(); else sfx.over();
    buzz([40, 60, 40]);
    this.#commitRun();
  }

  // Pop the remaining blobs one by one, top first, then show the results.
  tickEnding(dt) {
    this.endTimer -= dt;
    if (this.endTimer > 0) return;
    const blobs = this.world.blobs;
    if (!blobs.length) { this.state = 'over'; this.onOver(); return; }
    const b = blobs.reduce((m, o) => (o.cy < m.cy ? o : m));
    b.dead = true; this.world.removeDead();
    this.fx.burst(b.cx, b.cy, hsl(theme.col(b.level, this.clock)), 12, 300, 5);
    this.fx.addShake(2);
    sfx.pop(blobs.length);
    this.endTimer = 0.08;
  }
}
