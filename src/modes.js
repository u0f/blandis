// Game modes: each one adds a rule on top of the classic game (applied in src/game.js).
// Results are kept per mode; classic keeps its original save fields (save.best / save.top).
import { save } from './storage.js';
import { formatTime, addLangs } from './i18n.js';
import { MODE_ICONS } from './icons.js';

const M = (id, en, es, den, des, rules = {}) => ({
  id,
  icon: MODE_ICONS[id] || '',
  name: { en, es },
  desc: { en: den, es: des },
  ...rules,
});

// limit: seconds per run · trayTimer: seconds to launch once the tray is full · shots: launches per run
// goal: level that ends the run (8 = 512) · byTime: the result is the time to reach the goal (lower is better)
export const MODES = {
  classic: M('classic', 'Classic', 'Clásico', "Merge as long as you can. Don't let it overflow.", 'Fusiona todo lo que puedas sin que se desborde.'),
  time: M('time', 'Time attack', 'Contrarreloj', 'Score as much as you can in 2 minutes.', 'Haz todos los puntos que puedas en 2 minutos.', { limit: 120 }),
  speed: M('speed', 'Speedrun', 'Speedrun', 'Tray full? Launch within 3 seconds or you lose.', '¿Bandeja llena? Lanza en 3 segundos o pierdes.', { trayTimer: 3 }),
  sprint: M('sprint', 'Sprint 512', 'Sprint 512', 'Make a 512 as fast as you can.', 'Consigue un 512 lo más rápido posible.', { goal: 8, byTime: true }),
  shots: M('shots', '40 shots', '40 tiros', 'Only 40 launches: make every one count.', 'Solo 40 lanzamientos: que cada uno cuente.', { shots: 40 }),
};
addLangs(MODES, 'modes');
if (!MODES[save.mode]) save.mode = 'classic';

/** { best, top } of a mode (best 0 = none yet). */
export const record = id => (id === 'classic' ? save : save.modes[id] || { best: 0, top: [] });

/** Stores a finished run's result (score, or seconds for byTime modes); true if it's a new best. */
export function addResult(id, value) {
  const byTime = MODES[id].byTime, r = id === 'classic' ? save : (save.modes[id] ??= { best: 0, top: [] });
  const better = byTime ? !r.best || value < r.best : value > r.best;
  if (better) r.best = value;
  r.top = [...r.top, value].sort((a, b) => (byTime ? a - b : b - a)).slice(0, 5);
  return better;
}

export const formatResult = (id, v) => (MODES[id].byTime ? `${formatTime(v)}.${Math.floor(v * 10) % 10}` : String(v));
