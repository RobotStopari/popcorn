import { COLOR_CSS_VARS, DEFAULT_COLORS } from '../data/colors';
const PATTERN_VERSION = 2;

const COVER_VAR_KEYS = [
  'orange', 'orangeLight', 'orangeDark', 'orangePale',
  'red', 'redLight', 'redPale',
  'blue', 'blueLight', 'bluePale',
  'green', 'greenLight', 'greenPale',
  'teal', 'tealLight', 'tealPale',
  'yellow', 'yellowPale',
];

const PAST_VAR_KEYS = [
  'offWhite', 'redPale', 'bluePale', 'greenPale', 'tealPale', 'yellowPale', 'orangePale', 'grayMuted',
];

function readCssColor(cssVar, fallback) {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return value || fallback;
}

function buildPaletteFromCss(keys) {
  return keys.map((key) => readCssColor(COLOR_CSS_VARS[key], DEFAULT_COLORS[key]));
}

function getCoverPalette() {
  return buildPaletteFromCss(COVER_VAR_KEYS);
}

function getPastPalette() {
  return buildPaletteFromCss(PAST_VAR_KEYS);
}

function hashSeed(value) {
  const text = `${PATTERN_VERSION}:${String(value || 'popcorn')}`;
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRng(seed) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickColor(rng, palette) {
  return palette[Math.floor(rng() * palette.length)];
}

function pickWeighted(rng, entries) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let cursor = rng() * total;

  for (const [value, weight] of entries) {
    cursor -= weight;
    if (cursor <= 0) return value;
  }

  return entries[entries.length - 1][0];
}

function withAlpha(hex, alpha) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function overlayAlpha(rng, past, min = 0.16, max = 0.32) {
  if (past) return min * 0.7 + rng() * (max - min) * 0.55;
  return min + rng() * (max - min);
}

function buildLinearBase(rng, palette) {
  const angle = Math.floor(rng() * 360);
  const stopA = 5 + Math.floor(rng() * 30);
  const stopB = 42 + Math.floor(rng() * 38);
  const colorA = pickColor(rng, palette);
  const colorB = pickColor(rng, palette);
  const colorC = pickColor(rng, palette);
  return {
    layer: `linear-gradient(${angle}deg, ${colorA} ${stopA}%, ${colorB} ${stopB}%, ${colorC} 100%)`,
    fill: colorB,
  };
}

function buildRadialBase(rng, palette) {
  const shape = rng() > 0.45 ? 'circle' : 'ellipse';
  const x = Math.floor(rng() * 100);
  const y = Math.floor(rng() * 100);
  const size = 40 + Math.floor(rng() * 55);
  const colorA = pickColor(rng, palette);
  const colorB = pickColor(rng, palette);
  const colorC = pickColor(rng, palette);
  return {
    layer: `radial-gradient(${shape} at ${x}% ${y}%, ${colorA} 0%, ${colorB} ${size}%, ${colorC} 100%)`,
    fill: colorC,
  };
}

function buildConicBase(rng, palette) {
  const angle = Math.floor(rng() * 360);
  const x = 20 + Math.floor(rng() * 60);
  const y = 20 + Math.floor(rng() * 60);
  const colors = Array.from({ length: 3 + Math.floor(rng() * 3) }, () => pickColor(rng, palette));
  return {
    layer: `conic-gradient(from ${angle}deg at ${x}% ${y}%, ${colors.join(', ')}, ${colors[0]})`,
    fill: colors[0],
  };
}

function buildDualLinearBase(rng, palette) {
  const angleA = Math.floor(rng() * 360);
  const angleB = Math.floor(rng() * 360);
  const colorA = pickColor(rng, palette);
  const colorB = pickColor(rng, palette);
  const colorC = pickColor(rng, palette);
  const colorD = pickColor(rng, palette);
  return {
    layer: [
      `linear-gradient(${angleA}deg, ${colorA} 0%, ${colorB} 100%)`,
      `linear-gradient(${angleB}deg, ${colorC} 0%, ${colorD} 100%)`,
    ].join(', '),
    fill: colorB,
  };
}

function buildBase(rng, palette) {
  const type = pickWeighted(rng, [
    ['linear', 34],
    ['radial', 32],
    ['conic', 16],
    ['dualLinear', 18],
  ]);

  switch (type) {
    case 'radial':
      return buildRadialBase(rng, palette);
    case 'conic':
      return buildConicBase(rng, palette);
    case 'dualLinear':
      return buildDualLinearBase(rng, palette);
    default:
      return buildLinearBase(rng, palette);
  }
}

function buildAccentBlobs(rng, palette, past) {
  const count = 1 + Math.floor(rng() * 3);
  return Array.from({ length: count }, () => {
    const x = Math.floor(rng() * 100);
    const y = Math.floor(rng() * 100);
    const size = 18 + Math.floor(rng() * 32);
    const alpha = past ? 0.22 + rng() * 0.28 : 0.28 + rng() * 0.35;
    const inner = pickColor(rng, palette);
    const outer = pickColor(rng, palette);
    return `radial-gradient(circle at ${x}% ${y}%, ${withAlpha(inner, alpha)} 0%, ${withAlpha(outer, alpha * 0.45)} ${size}%, ${withAlpha(outer, 0)} ${size + 8}%)`;
  });
}

function buildStripesOverlay(rng, palette, past) {
  const angle = Math.floor(rng() * 180);
  const spacing = 10 + Math.floor(rng() * 16);
  const width = rng() > 0.55 ? 2 : 1;
  const color = withAlpha(pickColor(rng, palette), overlayAlpha(rng, past));
  return `repeating-linear-gradient(${angle}deg, ${color} 0 ${width}px, transparent ${width}px ${spacing}px)`;
}

function buildCrossesOverlay(rng, palette, past) {
  const spacing = 16 + Math.floor(rng() * 20);
  const width = 1 + Math.floor(rng() * 2);
  const color = withAlpha(pickColor(rng, palette), overlayAlpha(rng, past, 0.12, 0.24));
  return [
    `repeating-linear-gradient(0deg, ${color} 0 ${width}px, transparent ${width}px ${spacing}px)`,
    `repeating-linear-gradient(90deg, ${color} 0 ${width}px, transparent ${width}px ${spacing}px)`,
  ];
}

function buildGridOverlay(rng, palette, past) {
  const spacing = 14 + Math.floor(rng() * 14);
  const color = withAlpha(pickColor(rng, palette), overlayAlpha(rng, past, 0.1, 0.2));
  return [
    `repeating-linear-gradient(0deg, ${color} 0 1px, transparent 1px ${spacing}px)`,
    `repeating-linear-gradient(90deg, ${color} 0 1px, transparent 1px ${spacing}px)`,
  ];
}

function buildDotsOverlay(rng, palette, past) {
  const spacing = 14 + Math.floor(rng() * 14);
  const size = 1.5 + rng() * 3;
  const color = withAlpha(pickColor(rng, palette), overlayAlpha(rng, past, 0.18, 0.34));
  const offsetX = Math.floor(rng() * spacing);
  const offsetY = Math.floor(rng() * spacing);
  return `radial-gradient(circle ${size}px, ${color} 99%, transparent 100%) ${offsetX}px ${offsetY}px / ${spacing}px ${spacing}px repeat`;
}

function buildDiagonalCrossOverlay(rng, palette, past) {
  const spacing = 12 + Math.floor(rng() * 12);
  const width = 1 + Math.floor(rng() * 2);
  const color = withAlpha(pickColor(rng, palette), overlayAlpha(rng, past, 0.12, 0.26));
  return [
    `repeating-linear-gradient(45deg, ${color} 0 ${width}px, transparent ${width}px ${spacing}px)`,
    `repeating-linear-gradient(-45deg, ${color} 0 ${width}px, transparent ${width}px ${spacing}px)`,
  ];
}

function buildChevronsOverlay(rng, palette, past) {
  const angle = 35 + Math.floor(rng() * 110);
  const step = 18 + Math.floor(rng() * 16);
  const width = 2 + Math.floor(rng() * 2);
  const color = withAlpha(pickColor(rng, palette), overlayAlpha(rng, past, 0.14, 0.28));
  return [
    `repeating-linear-gradient(${angle}deg, ${color} 0 ${width}px, transparent ${width}px ${step}px)`,
    `repeating-linear-gradient(${angle + 90}deg, ${color} 0 ${width}px, transparent ${width}px ${step * 2}px)`,
  ];
}

function buildArrowsOverlay(rng, palette, past) {
  const angle = -35 + Math.floor(rng() * 70);
  const step = 24 + Math.floor(rng() * 18);
  const color = withAlpha(pickColor(rng, palette), overlayAlpha(rng, past, 0.16, 0.3));
  const mark = Math.floor(step * 0.35);
  return [
    `repeating-linear-gradient(${angle}deg, ${color} 0 2px, transparent 2px ${mark}px, transparent ${mark}px ${step}px)`,
    `repeating-linear-gradient(${angle + 180}deg, ${color} 0 2px, transparent 2px ${mark}px, transparent ${mark}px ${step}px)`,
  ];
}

function buildWavesOverlay(rng, palette, past) {
  const angle = Math.floor(rng() * 40) - 20;
  const step = 22 + Math.floor(rng() * 14);
  const color = withAlpha(pickColor(rng, palette), overlayAlpha(rng, past, 0.1, 0.22));
  return [
    `repeating-linear-gradient(${angle}deg, ${color} 0 2px, transparent 2px ${step * 0.5}px, transparent ${step * 0.5}px ${step}px)`,
    `repeating-linear-gradient(${angle + 180}deg, ${color} 0 2px, transparent 2px ${step * 0.5}px, transparent ${step * 0.5}px ${step}px)`,
  ];
}

function buildOverlay(rng, palette, past) {
  if (rng() < 0.08) return [];

  const type = pickWeighted(rng, [
    ['stripes', 18],
    ['crosses', 14],
    ['grid', 12],
    ['dots', 14],
    ['diagonalCross', 14],
    ['chevrons', 10],
    ['arrows', 10],
    ['waves', 8],
  ]);

  switch (type) {
    case 'stripes':
      return [buildStripesOverlay(rng, palette, past)];
    case 'crosses':
      return buildCrossesOverlay(rng, palette, past);
    case 'grid':
      return buildGridOverlay(rng, palette, past);
    case 'dots':
      return [buildDotsOverlay(rng, palette, past)];
    case 'diagonalCross':
      return buildDiagonalCrossOverlay(rng, palette, past);
    case 'chevrons':
      return buildChevronsOverlay(rng, palette, past);
    case 'arrows':
      return buildArrowsOverlay(rng, palette, past);
    default:
      return buildWavesOverlay(rng, palette, past);
  }
}

/**
 * Deterministic decorative cover when an event has no photo.
 * Same seed always produces the same pattern.
 */
export function getEventCoverStyle(seedKey, { past = false } = {}) {
  const rng = createRng(hashSeed(seedKey));
  const palette = past ? getPastPalette() : getCoverPalette();
  const { layer: base, fill } = buildBase(rng, palette);
  const overlays = buildOverlay(rng, palette, past);
  const accents = buildAccentBlobs(rng, palette, past);

  const layers = [
    ...overlays,
    ...accents,
    base,
  ];

  return {
    backgroundColor: fill,
    backgroundImage: layers.join(', '),
  };
}
