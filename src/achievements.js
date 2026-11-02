import { save, persist } from './storage.js';
import { t, tx, addLangs } from './i18n.js';
import { THEMES } from './themes.js';
import { sfx } from './audio.js';
import { toast } from './ui/toast.js';
import { achIcon } from './icons.js';

// `test(c)` gets a snapshot from Game#context():
//   mode, end (why the run ended, '' while playing), score, time, maxLevel, maxCombo, merges, launches, hardLaunches,
//   gentleRun, blobs, lastMergeAt, flags { cannon, bank, feather, closeCall, supreme, edge, lastShot },
//   bests { [mode]: best }, life { games, merges, launches, playTime, played }
// Achievements with a `theme` unlock that color style. Ones without `test` are unlocked directly.
const A = (id, icon, en, es, den, des, test, theme) => ({ id, icon: achIcon(id), name: { en, es }, desc: { en: den, es: des }, test, theme });

export const ACHIEVEMENTS = [
  // Merging up
  A('first', '💧', 'Plop!', '¡Plop!', 'Merge two blobs', 'Fusiona dos blandis', c => c.merges >= 1, 'sorbete'),
  A('m64', '🟢', 'Getting Bigger', 'Creciendo', 'Make a 64', 'Consigue un 64', c => c.maxLevel >= 5),
  A('lvl7', '🍮', 'Chonky', 'Gordito', 'Make a 128', 'Consigue un 128', c => c.maxLevel >= 6, 'neon'),
  A('m256', '🍩', 'Donut Size', 'Tamaño donut', 'Make a 256', 'Consigue un 256', c => c.maxLevel >= 7),
  A('m512', '🎈', 'Halfway There', 'A mitad de camino', 'Make a 512', 'Consigue un 512', c => c.maxLevel >= 8),
  A('m1024', '🏔️', 'Kiloblob', 'Kiloblandi', 'Make a 1024', 'Consigue un 1024', c => c.maxLevel >= 9),
  A('max', '👑', 'Supreme Blob', 'Blandi supremo', 'Make a 2048', 'Consigue un 2048', c => c.maxLevel >= 10, 'arcoiris'),
  A('supreme', '🌌', 'Big Bang', 'Big Bang', 'Merge two 2048s', 'Fusiona dos 2048', c => c.flags.supreme),
  // Score
  A('s1000', '⭐', 'A Thousand Squishes', 'Mil mimos', 'Score 1,000 in one game', 'Consigue 1.000 puntos en una partida', c => c.score >= 1000, 'nube'),
  A('s10k', '🌟', 'Ten Grand', 'Diez mil', 'Score 10,000 in one game', 'Consigue 10.000 puntos en una partida', c => c.score >= 10000),
  A('s50k', '💫', 'High Roller', 'Por todo lo alto', 'Score 50,000 in one game', 'Consigue 50.000 puntos en una partida', c => c.score >= 50000),
  A('s100k', '🏆', 'Six Digits', 'Seis cifras', 'Score 100,000 in one game', 'Consigue 100.000 puntos en una partida', c => c.score >= 100000),
  // Combos
  A('combo3', '🔁', 'Hat Trick', 'Triplete', 'Make a x3 combo', 'Haz un combo x3', c => c.maxCombo >= 3),
  A('combo4', '🔗', 'Squishy Chain', 'Cadena blandita', 'Make a x4 combo', 'Haz un combo x4', c => c.maxCombo >= 4, 'oceano'),
  A('combo6', '⛓️', 'Chain Reaction', 'Reacción en cadena', 'Make a x6 combo', 'Haz un combo x6', c => c.maxCombo >= 6),
  // Skill shots
  A('gentle', '🪶', 'Silk Touch', 'Mano de seda', '10 gentle launches in a row', '10 lanzamientos suaves seguidos', c => c.gentleRun >= 10, 'caramelo'),
  A('cannon', '💥', 'Cannonball', 'Cañonazo', 'Merge with a full-power launch', 'Fusiona con un lanzamiento a máxima potencia', c => c.flags.cannon, 'noche'),
  A('bank', '🎱', 'Bank Shot', 'Carambola', 'Bounce off a wall and merge', 'Rebota en una pared y fusiona', c => c.flags.bank),
  A('feather', '🍃', 'Featherfall', 'Caída de pluma', 'Merge with a tapped drop', 'Fusiona con un toque suave', c => c.flags.feather),
  A('zen', '🧘', 'Zen Master', 'Maestro zen', 'Score 1,000 without a strong launch', 'Consigue 1.000 puntos sin ningún lanzamiento fuerte', c => c.score >= 1000 && c.hardLaunches === 0),
  A('fast256', '⚡', 'Speedrun', 'Speedrun', 'Make a 256 in under 2 minutes', 'Consigue un 256 en menos de 2 minutos', c => c.maxLevel >= 7 && c.time < 120),
  // Survival
  A('close', '😅', 'Close Call', 'Por los pelos', 'Escape the danger line with under half a second left', 'Sal de la línea de peligro con menos de medio segundo', c => c.flags.closeCall),
  A('t3', '⏱️', 'Hang In There', 'Aguanta', 'Survive 3 minutes', 'Sobrevive 3 minutos', c => c.time >= 180),
  A('t10', '🕰️', 'Marathon', 'Maratón', 'Survive 10 minutes', 'Sobrevive 10 minutos', c => c.time >= 600),
  A('crowd', '🫧', 'Full House', 'Casa llena', 'Have 20 blobs in the jar at once', 'Ten 20 blandis a la vez en el bote', c => c.blobs >= 20),
  // Lifetime
  A('games10', '🎮', 'Regular', 'Habitual', 'Play 10 games', 'Juega 10 partidas', c => c.life.games >= 10),
  A('games50', '🕹️', 'Hooked', 'Enganchado', 'Play 50 games', 'Juega 50 partidas', c => c.life.games >= 50),
  A('merges500', '🫠', 'Squish Lover', 'Amante blandito', 'Merge 500 times in total', 'Fusiona 500 veces en total', c => c.life.merges >= 500),
  A('merges5k', '🌋', 'Squish Legend', 'Leyenda blandita', 'Merge 5,000 times in total', 'Fusiona 5.000 veces en total', c => c.life.merges >= 5000),
  A('launch1k', '🚀', 'Launch Pad', 'Plataforma de lanzamiento', 'Launch 1,000 blobs in total', 'Lanza 1.000 blandis en total', c => c.life.launches >= 1000),
  A('hour', '⌛', 'One Hour In', 'Una hora dentro', 'Play for 1 hour in total', 'Juega 1 hora en total', c => c.life.playTime >= 3600),
  // Classic
  A('cl_merges300', '🫧', 'Bubble Bath', 'Baño de burbujas', 'Merge 300 times in one Classic game', 'Fusiona 300 veces en una partida Clásica', c => c.mode === 'classic' && c.merges >= 300),
  A('cl_200k', '🏛️', 'Classic Legend', 'Leyenda clásica', 'Score 200,000 in Classic', 'Consigue 200.000 puntos en Clásico', c => c.mode === 'classic' && c.score >= 200000),
  A('cl_t20', '🗿', 'Unshakeable', 'Inquebrantable', 'Survive 20 minutes in Classic', 'Sobrevive 20 minutos en Clásico', c => c.mode === 'classic' && c.time >= 1200),
  // Time attack
  A('ta_done', '⏱️', 'Against the Clock', 'Contra el reloj', 'Finish a Time attack run', 'Termina una partida de Contrarreloj', c => c.mode === 'time' && c.end === 'time'),
  A('ta_2k', '⌚', 'Tick Tock', 'Tic tac', 'Score 2,000 in Time attack', 'Consigue 2.000 puntos en Contrarreloj', c => c.mode === 'time' && c.score >= 2000),
  A('ta_5k', '🔔', 'Rush Hour', 'Hora punta', 'Score 5,000 in Time attack', 'Consigue 5.000 puntos en Contrarreloj', c => c.mode === 'time' && c.score >= 5000),
  A('ta_10k', '🧨', 'Time Bomb', 'Bomba de relojería', 'Score 10,000 in Time attack', 'Consigue 10.000 puntos en Contrarreloj', c => c.mode === 'time' && c.score >= 10000),
  A('ta_256', '🥯', 'Fast Food', 'Comida rápida', 'Make a 256 in Time attack', 'Consigue un 256 en Contrarreloj', c => c.mode === 'time' && c.maxLevel >= 7),
  A('ta_merges40', '🌀', 'Merge Frenzy', 'Frenesí de fusiones', 'Merge 40 times in one Time attack run', 'Fusiona 40 veces en una partida de Contrarreloj', c => c.mode === 'time' && c.merges >= 40),
  A('ta_combo5', '🎆', 'Countdown Combo', 'Combo a contrarreloj', 'Make a x5 combo in Time attack', 'Haz un combo x5 en Contrarreloj', c => c.mode === 'time' && c.maxCombo >= 5),
  A('ta_buzzer', '🚨', 'Buzzer Beater', 'Sobre la bocina', 'Merge in the last second of Time attack', 'Fusiona en el último segundo de Contrarreloj', c => c.mode === 'time' && c.end === 'time' && c.lastMergeAt >= 119),
  // Speedrun
  A('sp_1m', '⚡', 'Quick Hands', 'Manos rápidas', 'Survive 1 minute in Speedrun', 'Sobrevive 1 minuto en Speedrun', c => c.mode === 'speed' && c.time >= 60),
  A('sp_3m', '🏃', 'No Time to Think', 'Sin tiempo para pensar', 'Survive 3 minutes in Speedrun', 'Sobrevive 3 minutos en Speedrun', c => c.mode === 'speed' && c.time >= 180),
  A('sp_5m', '🌪️', 'Whirlwind', 'Torbellino', 'Survive 5 minutes in Speedrun', 'Sobrevive 5 minutos en Speedrun', c => c.mode === 'speed' && c.time >= 300),
  A('sp_5k', '🔥', 'On Fire', 'En llamas', 'Score 5,000 in Speedrun', 'Consigue 5.000 puntos en Speedrun', c => c.mode === 'speed' && c.score >= 5000),
  A('sp_512', '🛸', 'Warp Speed', 'Velocidad warp', 'Make a 512 in Speedrun', 'Consigue un 512 en Speedrun', c => c.mode === 'speed' && c.maxLevel >= 8),
  A('sp_merges100', '🏎️', 'Overdrive', 'A toda máquina', 'Merge 100 times in one Speedrun run', 'Fusiona 100 veces en una partida de Speedrun', c => c.mode === 'speed' && c.merges >= 100),
  A('sp_combo4', '💨', 'Slipstream', 'Rebufo', 'Make a x4 combo in Speedrun', 'Haz un combo x4 en Speedrun', c => c.mode === 'speed' && c.maxCombo >= 4),
  A('sp_edge', '😰', 'Just in Time', 'Justo a tiempo', 'Launch with under 0.3 s left on the tray timer', 'Lanza con menos de 0,3 s en el temporizador de la bandeja', c => c.mode === 'speed' && c.flags.edge),
  // Sprint 512
  A('sr_done', '🏁', 'Finish Line', 'Línea de meta', 'Finish a Sprint 512', 'Termina un Sprint 512', c => c.mode === 'sprint' && c.end === 'goal'),
  A('sr_5m', '🚲', 'Steady Pace', 'Ritmo constante', 'Finish a Sprint 512 in under 5 minutes', 'Termina un Sprint 512 en menos de 5 minutos', c => c.mode === 'sprint' && c.end === 'goal' && c.time < 300),
  A('sr_3m', '🏍️', 'Fast Lane', 'Carril rápido', 'Finish a Sprint 512 in under 3 minutes', 'Termina un Sprint 512 en menos de 3 minutos', c => c.mode === 'sprint' && c.end === 'goal' && c.time < 180),
  A('sr_2m', '🚀', 'Rocket', 'Cohete', 'Finish a Sprint 512 in under 2 minutes', 'Termina un Sprint 512 en menos de 2 minutos', c => c.mode === 'sprint' && c.end === 'goal' && c.time < 120),
  A('sr_90', '☄️', 'Comet', 'Cometa', 'Finish a Sprint 512 in under 90 seconds', 'Termina un Sprint 512 en menos de 90 segundos', c => c.mode === 'sprint' && c.end === 'goal' && c.time < 90),
  A('sr_lean', '📐', 'No Waste', 'Sin desperdicio', 'Finish a Sprint 512 with 80 launches or fewer', 'Termina un Sprint 512 con 80 lanzamientos o menos', c => c.mode === 'sprint' && c.end === 'goal' && c.launches <= 80),
  A('sr_zen', '🐢', 'Slow and Steady', 'Despacito y buena letra', 'Finish a Sprint 512 without a strong launch', 'Termina un Sprint 512 sin ningún lanzamiento fuerte', c => c.mode === 'sprint' && c.end === 'goal' && c.hardLaunches === 0),
  A('sr_combo4', '🎢', 'Shortcut', 'Atajo', 'Make a x4 combo in Sprint 512', 'Haz un combo x4 en Sprint 512', c => c.mode === 'sprint' && c.maxCombo >= 4),
  // 40 shots
  A('sh_done', '🎯', 'Out of Ammo', 'Sin munición', 'Use all 40 shots', 'Usa los 40 tiros', c => c.mode === 'shots' && c.end === 'shots'),
  A('sh_1k', '🏹', 'Sharpshooter', 'Tirador experto', 'Score 1,000 in 40 shots', 'Consigue 1.000 puntos en 40 tiros', c => c.mode === 'shots' && c.score >= 1000),
  A('sh_2k', '🔭', 'Sniper', 'Francotirador', 'Score 2,000 in 40 shots', 'Consigue 2.000 puntos en 40 tiros', c => c.mode === 'shots' && c.score >= 2000),
  A('sh_128', '🎳', 'Strike', 'Pleno', 'Make a 128 in 40 shots', 'Consigue un 128 en 40 tiros', c => c.mode === 'shots' && c.maxLevel >= 6),
  A('sh_256', '🥇', 'Bullseye', 'En el blanco', 'Make a 256 in 40 shots', 'Consigue un 256 en 40 tiros', c => c.mode === 'shots' && c.maxLevel >= 7),
  A('sh_merges30', '🧮', 'Every Shot Counts', 'Cada tiro cuenta', 'Merge 30 times in one 40 shots run', 'Fusiona 30 veces en una partida de 40 tiros', c => c.mode === 'shots' && c.merges >= 30),
  A('sh_combo4', '🎇', 'Ricochet', 'Rebote en cadena', 'Make a x4 combo in 40 shots', 'Haz un combo x4 en 40 tiros', c => c.mode === 'shots' && c.maxCombo >= 4),
  A('sh_last', '🔚', 'Last Word', 'La última palabra', 'Merge after your final shot', 'Fusiona después de tu último tiro', c => c.mode === 'shots' && c.flags.lastShot),
  // Across modes
  A('explorer', '🧭', 'Explorer', 'Explorador', 'Play every game mode', 'Juega todos los modos de juego', c => Object.keys(c.bests).every(id => c.life.played.includes(id))),
  A('allround', '🏅', 'All-Rounder', 'Todoterreno', 'Set a personal best in every game mode', 'Consigue un récord en todos los modos de juego', c => Object.values(c.bests).every(b => b > 0)),
  // Extras
  A('polyglot', '🌍', 'Polyglot', 'Políglota', 'Change the language', 'Cambia el idioma'),
  A('fashion', '🎨', 'Fashionista', 'Con estilo', 'Switch to another color style', 'Cambia a otro estilo de color'),
  A('wallpaper', '🖼️', 'Interior Designer', 'Decorador de interiores', 'Set a custom background', 'Pon un fondo personalizado'),
  A('collector', '📦', 'Collector', 'Coleccionista', 'Unlock 20 achievements', 'Desbloquea 20 logros'),
  A('collector50', '🗃️', 'Hoarder', 'Acumulador', 'Unlock 50 achievements', 'Desbloquea 50 logros'),
  A('complete', '💎', 'Completionist', 'Completista', 'Unlock every other achievement', 'Desbloquea todos los demás logros'),
];
addLangs(ACHIEVEMENTS, 'ach');

export const isThemeUnlocked = id =>
  id === 'clasico' || ACHIEVEMENTS.some(a => a.theme === id && save.ach.includes(a.id));

export const unlockedCount = () => save.ach.length;

export function unlock(id) {
  if (save.ach.includes(id)) return;
  const a = ACHIEVEMENTS.find(a => a.id === id);
  if (!a) return;
  save.ach.push(id);
  persist();
  toast(`${a.icon} ${tx(a.name)}`, a.theme ? `${t('newStyle')}: ${tx(THEMES[a.theme].name)}` : t('achUnlocked'));
  sfx.ach();
  if (save.ach.length >= 20) unlock('collector');
  if (save.ach.length >= 50) unlock('collector50');
  if (save.ach.length === ACHIEVEMENTS.length - 1) unlock('complete');
}

/** Unlock every achievement whose test passes for this snapshot. */
export function checkAchievements(c) {
  for (const a of ACHIEVEMENTS) if (a.test && !save.ach.includes(a.id) && a.test(c)) unlock(a.id);
}
