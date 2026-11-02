// Reusable SVG icons styled for Blandis (soft rounded strokes, currentColor).

const svg = (cls, body) =>
  `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;

export const iconGlobe = (cls = '') =>
  svg(cls, '<circle cx="12" cy="12" r="9.5"/><path d="M12 2.5c2.8 2.6 4.5 5.8 4.5 9.5s-1.7 6.9-4.5 9.5c-2.8-2.6-4.5-5.8-4.5-9.5S9.2 5.1 12 2.5z"/><path d="M3.2 8.5h17.6M3.2 15.5h17.6"/>');

export const iconTrophy = (cls = '') =>
  svg(cls, '<path d="M7 4h10v6a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h1m10-7h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-1M12 15v4m-4.5 0h9"/>');

export const iconCrown = (cls = '') =>
  svg(cls, '<path d="M3.5 18h17l-1.5-10-4.5 4.5L12 5l-2.5 7.5L5 8l-1.5 10z"/><circle cx="5" cy="8" r="1.2" fill="currentColor"/><circle cx="12" cy="5" r="1.2" fill="currentColor"/><circle cx="19" cy="8" r="1.2" fill="currentColor"/>');

export const iconLock = (cls = '') =>
  svg(cls, '<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="15.5" r="1.2" fill="currentColor"/>');

export const iconShare = (cls = '') =>
  svg(cls, '<path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6m-8-9v12m-5-7 5-5 5 5"/>');

export const iconCheck = (cls = '') =>
  svg(cls, '<circle cx="12" cy="12" r="9.5"/><path d="M8 12l2.8 2.8 5.4-5.6"/>');

export const iconTrash = (cls = '') =>
  svg(cls, '<path d="M4 7h16m-10 4.5v5m4-5v5m-7-10.5h6a1 1 0 0 1 1 1V7H8V6a1 1 0 0 1 1-1zm-3 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6z"/>');

export const iconPalette = (cls = '') =>
  svg(cls, '<path d="M12 3a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9 1.5 0 2.5-.75 2.5-1.5 0-.46-.17-.89-.44-1.22-.26-.33-.44-.75-.44-1.28 0-1.1.9-2 2-2h1.88C18.8 14 21 11.8 21 9a6 6 0 0 0-6-6h-3z"/><circle cx="7.5" cy="10.5" r="1.3" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.3" fill="currentColor"/><circle cx="14.5" cy="7.5" r="1.3" fill="currentColor"/>');

// Game mode icons
export const iconClassic = (cls = '') =>
  svg(cls, '<circle cx="9" cy="14" r="5"/><circle cx="15.5" cy="10.5" r="4.5"/><circle cx="8" cy="7.5" r="2.5"/>');

export const iconTime = (cls = '') =>
  svg(cls, '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M10 2.5h4m-2 0v3.5"/>');

export const iconSpeed = (cls = '') =>
  svg(cls, '<path d="M13 2.5 5 13.5h5.5L9.5 22 19 10.5h-5.5z"/>');

export const iconSprint = (cls = '') =>
  svg(cls, '<path d="M5 22V3m0 2c3.5-1.8 6.5 1.8 10 0s3.5-1.2 5 0v8.5c-1.5-1.2-5 0-8.5 0s-6.5-1.8-6.5 0m5-1v4m4-4.5v4"/>');

export const iconShots = (cls = '') =>
  svg(cls, '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>');

export const MODE_ICONS = {
  classic: iconClassic(),
  time: iconTime(),
  speed: iconSpeed(),
  sprint: iconSprint(),
  shots: iconShots(),
};

// Achievement icons
const ACH_PATHS = {
  // Merging & Blobs
  first: '<path d="M12 3c-4.5 6-7 9.5-7 13a7 7 0 0 0 14 0c0-3.5-2.5-7-7-13z"/>',
  m64: '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="11" r="1.2" fill="currentColor"/><circle cx="15" cy="11" r="1.2" fill="currentColor"/><path d="M9 15c1 1 5 1 6 0"/>',
  lvl7: '<ellipse cx="12" cy="13" rx="10" ry="7"/><circle cx="8" cy="12" r="1.2" fill="currentColor"/><circle cx="16" cy="12" r="1.2" fill="currentColor"/><path d="M9.5 15.5c1.5 1 3.5 1 5 0"/>',
  m256: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M7 6l1 1m8-1l1 1m-10 9l1 1m9 0l1 1"/>',
  m512: '<circle cx="12" cy="9" r="7"/><path d="M12 16l-1 2h2zM12 18c-1 2 1 4 0 5"/>',
  m1024: '<path d="M3 20l7-13 4 7 2-3 5 9H3z"/>',
  max: '<path d="M3.5 18h17l-1.5-10-4.5 4.5L12 5l-2.5 7.5L5 8l-1.5 10z"/><circle cx="5" cy="8" r="1.2" fill="currentColor"/><circle cx="12" cy="5" r="1.2" fill="currentColor"/><circle cx="19" cy="8" r="1.2" fill="currentColor"/>',
  supreme: '<path d="M12 2v4m0 12v4M2 12h4m12 0h4m-15-7l3 3m8 8l3 3m-14 0l3-3m8-8l3-3"/><circle cx="12" cy="12" r="3"/>',

  // Score
  s1000: '<polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>',
  s10k: '<polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/>',
  s50k: '<polygon points="9,3 11,8 16,8 12,12 14,17 9,14 4,17 6,12 2,8 7,8"/><path d="M17 3l.8 2.2 2.2.8-2.2.8L17 9l-.8-2.2-2.2-.8 2.2-.8z"/>',
  s100k: '<path d="M7 4h10v6a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h1m10-7h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-1M12 15v4m-4.5 0h9"/>',

  // Combos
  combo3: '<path d="M21 12a9 9 0 0 1-15 6.7L3 16m0-4a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
  combo4: '<path d="M10 14a4 4 0 0 1 0-6l3-3a4 4 0 0 1 6 6l-1.5 1.5M14 10a4 4 0 0 1 0 6l-3 3a4 4 0 0 1-6-6L6.5 11.5"/>',
  combo6: '<path d="M9 15l6-6M11 6a4 4 0 0 1 6 0l1 1a4 4 0 0 1 0 6l-2 2M13 18a4 4 0 0 1-6 0l-1-1a4 4 0 0 1 0-6l2-2"/>',

  // Skill shots
  gentle: '<path d="M20 4a12 12 0 0 0-10 10l-6 6m7-9l4 2m-6-4l4 2m-1-7l3 1"/>',
  cannon: '<circle cx="12" cy="12" r="5"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3m-15-7l2.5 2.5m9 9l2.5 2.5m-14 0l2.5-2.5m9-9l2.5-2.5"/>',
  bank: '<rect x="2" y="2" width="3" height="20" rx="1.5"/><path d="M22 6l-17 6 17 6"/><circle cx="13" cy="12" r="3.5"/>',
  feather: '<path d="M4 20c4-8 12-14 16-16-2 6-6 13-14 16zM11 13l4 4"/>',
  zen: '<path d="M12 4c-3 4-3 9 0 14 3-5 3-10 0-14zM8 9c-3 3-3 7 0 10 2-2 3-5 1-9zm8 0c3 3 3 7 0 10-2-2-3-5-1-9zM3 19c6-1 12-1 18 0"/>',
  fast256: '<path d="M13 2.5 5 13.5h5.5L9.5 22 19 10.5h-5.5z"/>',

  // Survival
  close: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  t3: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M10 2.5h4m-2 0v3.5"/>',
  t10: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  crowd: '<circle cx="9" cy="14" r="5"/><circle cx="15.5" cy="10.5" r="4.5"/><circle cx="8" cy="7.5" r="2.5"/>',

  // Lifetime
  games10: '<rect x="3" y="6" width="18" height="12" rx="6"/><path d="M7 12h4M9 10v4m6-2h.01M17 12h.01"/>',
  games50: '<path d="M4 17h16v4H4zM12 17V8"/><circle cx="12" cy="6" r="3"/>',
  merges500: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
  merges5k: '<path d="M12 2c-.5 3-3 5-3 8 0 4 3.5 7 7 7s7-3 7-7c0-5-4-9-6-11 0 3-2 5-3 5-.5-1-1-1.5-2-2z"/>',
  launch1k: '<path d="M12 2.5s-5 4.5-5 10.5c0 3 2 5 5 5s5-2 5-5c0-6-5-10.5-5-10.5zM8 14l-4 4v2h2l4-4m6-2l4 4v2h-2l-4-4"/><circle cx="12" cy="10" r="1.5" fill="currentColor"/>',
  hour: '<path d="M6 3h12M6 21h12M7 3c0 5 4 6 5 9-1 3-5 4-5 9m10-18c0 5-4 6-5 9 1 3 5 4 5 9"/>',

  // Classic
  cl_merges300: '<circle cx="9" cy="14" r="5"/><circle cx="15.5" cy="10.5" r="4.5"/><circle cx="8" cy="7.5" r="2.5"/>',
  cl_200k: '<path d="M3 7l9-4 9 4v2H3zm2 4v8m4-8v8m6-8v8m4-8v8M3 21h18"/>',
  cl_t20: '<path d="M12 3s8 3 8 10c0 5-5 8-8 9-3-1-8-4-8-9 0-7 8-10 8-10z"/>',

  // Time attack
  ta_done: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M10 2.5h4m-2 0v3.5"/>',
  ta_2k: '<circle cx="12" cy="12" r="6"/><path d="M12 9v3l2 1M9 6V2h6v4M9 18v4h6v-4"/>',
  ta_5k: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 0 1-3.46 0"/>',
  ta_10k: '<circle cx="11" cy="13" r="8"/><path d="M17 7l3-3m-1 0l2 2m-2-2h3"/>',
  ta_256: '<path d="M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zm11 2h2a2 2 0 0 1 0 4h-2M4 20h14"/>',
  ta_merges40: '<path d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3zm0 18a9 9 0 0 1-9-9h3a6 6 0 0 0 6 6v3z"/>',
  ta_combo5: '<circle cx="12" cy="12" r="2"/><path d="M12 4v3m0 10v3M4 12h3m10 0h3M6.3 6.3l2.2 2.2m7 7l2.2 2.2M6.3 17.7l2.2-2.2m7-7l2.2-2.2"/>',
  ta_buzzer: '<path d="M12 3a7 7 0 0 0-7 7v5h14v-5a7 7 0 0 0-7-7zM3 18h18M9 21h6"/>',

  // Speedrun
  sp_1m: '<path d="M13 2.5 5 13.5h5.5L9.5 22 19 10.5h-5.5z"/>',
  sp_3m: '<circle cx="14" cy="5" r="2"/><path d="M7 21l3-5 3 2 4-6M10 11l4-2 3 3"/>',
  sp_5m: '<path d="M4 6h16M6 10h12M8 14h8M10 18h4"/>',
  sp_5k: '<path d="M12 2c-.5 3-3 5-3 8 0 4 3.5 7 7 7s7-3 7-7c0-5-4-9-6-11 0 3-2 5-3 5-.5-1-1-1.5-2-2z"/>',
  sp_512: '<ellipse cx="12" cy="13" rx="9" ry="4"/><path d="M8 12c0-3 1.8-5 4-5s4 2 4 5M8 17l-2 3m10-3l2 3m-6-3v4"/>',
  sp_merges100: '<circle cx="12" cy="12" r="9"/><path d="M12 12l4-4M7 16a6 6 0 0 1 10 0"/>',
  sp_combo4: '<path d="M4 8h12a3 3 0 0 1 0 6H3m14-8a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 0-2.5 2.5M6 18h11a2.5 2.5 0 0 0 0-5H4"/>',
  sp_edge: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4h.01"/>',

  // Sprint 512
  sr_done: '<path d="M5 22V3m0 2c3.5-1.8 6.5 1.8 10 0s3.5-1.2 5 0v8.5c-1.5-1.2-5 0-8.5 0s-6.5-1.8-6.5 0m5-1v4m4-4.5v4"/>',
  sr_5m: '<circle cx="6" cy="15" r="3.5"/><circle cx="18" cy="15" r="3.5"/><path d="M6 15l4-7h4l4 7M10 8l4 7m-4-7h-2"/>',
  sr_3m: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-6h5l3 6M10 10l3 6"/>',
  sr_2m: '<path d="M12 2.5s-5 4.5-5 10.5c0 3 2 5 5 5s5-2 5-5c0-6-5-10.5-5-10.5zM8 14l-4 4v2h2l4-4m6-2l4 4v2h-2l-4-4"/>',
  sr_90: '<circle cx="17" cy="7" r="4"/><path d="M14 9l-9 9m5-12L3 13m10 5L6 21"/>',
  sr_lean: '<path d="M3 21h18L3 3zM7 17h6M7 13h3"/>',
  sr_zen: '<ellipse cx="12" cy="13" rx="6" ry="4"/><circle cx="19" cy="13" r="2"/><path d="M7 10l-2-2m2 8l-2 2m10-8l2-2m-2 8l2 2"/>',
  sr_combo4: '<path d="M3 19c4 0 6-4 6-9s2-6 5-6 5 3 5 8-2 7-6 7M3 19h18"/>',

  // 40 shots
  sh_done: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
  sh_1k: '<path d="M6 3c7 4 7 14 0 18M6 12h14m-4-4l4 4-4 4"/>',
  sh_2k: '<path d="M4 14l11-9 4 4-11 9zM12 15l-3 6m7-6l3 6"/>',
  sh_128: '<circle cx="12" cy="6" r="2.5"/><path d="M9.5 8.5c-.5 2 0 4-2 7.5A3 3 0 0 0 10.5 20h3a3 3 0 0 0 3-4c-2-3.5-1.5-5.5-2-7.5"/>',
  sh_256: '<circle cx="12" cy="15" r="6"/><path d="M8 3l4 6 4-6M9 3l3 4.5L15 3"/>',
  sh_merges30: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M4 8h16M4 13h16M4 18h16M8 6v4m4-4v4m4 5v4m-8 0v4"/>',
  sh_combo4: '<path d="M12 2l2.5 6.5L21 11l-5 4.5 1.5 6.5L12 18.5 6.5 22 8 15.5 3 11l6.5-2.5z"/>',
  sh_last: '<circle cx="10" cy="14" r="7"/><circle cx="10" cy="14" r="3"/><path d="M10 14l10-10m-3 0h3v3"/>',

  // Across modes & Extras
  explorer: '<circle cx="12" cy="12" r="9"/><polygon points="12,7 15,12 12,17 9,12" fill="currentColor"/>',
  allround: '<circle cx="12" cy="14" r="6"/><path d="M8 2l4 6 4-6M12 11l1 2 2 .5-1.5 1.5.5 2-2-1-2 1 .5-2L9 13.5l2-.5z"/>',
  polyglot: '<circle cx="12" cy="12" r="9.5"/><path d="M12 2.5c2.8 2.6 4.5 5.8 4.5 9.5s-1.7 6.9-4.5 9.5c-2.8-2.6-4.5-5.8-4.5-9.5S9.2 5.1 12 2.5z"/><path d="M3.2 8.5h17.6M3.2 15.5h17.6"/>',
  fashion: '<path d="M12 3a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9 1.5 0 2.5-.75 2.5-1.5 0-.46-.17-.89-.44-1.22-.26-.33-.44-.75-.44-1.28 0-1.1.9-2 2-2h1.88C18.8 14 21 11.8 21 9a6 6 0 0 0-6-6h-3z"/><circle cx="7.5" cy="10.5" r="1.3" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.3" fill="currentColor"/><circle cx="14.5" cy="7.5" r="1.3" fill="currentColor"/>',
  wallpaper: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.5"/><path d="M20 15l-5-5-8 8"/>',
  collector: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  collector50: '<rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="10" width="18" height="10" rx="1"/><path d="M10 14h4"/>',
  complete: '<path d="M6 3h12l4 6-10 12L2 9zM2 9h20M12 21L7.5 9 12 3l4.5 6L12 21"/>',
};

export const achIcon = (id, cls = '') => {
  const body = ACH_PATHS[id] || ACH_PATHS.first;
  return svg(cls, body);
};
