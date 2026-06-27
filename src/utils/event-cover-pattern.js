const BRAND_PALETTE = [
  '#faa908',
  '#ffb82e',
  '#e89400',
  '#ffbe3d',
  '#d62839',
  '#e8354a',
  '#ffd0d5',
  '#faf9f7',
  '#ffffff',
];

const PAST_PALETTE = [
  '#faf9f7',
  '#ffffff',
  '#ffd0d5',
  '#ffbe3d',
  '#ffb82e',
  '#bbb',
];

function hashSeed(value) {
  const text = String(value || 'popcorn');
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

/**
 * Deterministic decorative cover when an event has no photo.
 * Same seed always produces the same pattern.
 */
export function getEventCoverStyle(seedKey, { past = false } = {}) {
  const rng = createRng(hashSeed(seedKey));
  const palette = past ? PAST_PALETTE : BRAND_PALETTE;
  const angle = Math.floor(rng() * 360);
  const stopA = 12 + Math.floor(rng() * 28);
  const stopB = 52 + Math.floor(rng() * 28);
  const colorA = pickColor(rng, palette);
  const colorB = pickColor(rng, palette);
  const colorC = pickColor(rng, palette);
  const base = `linear-gradient(${angle}deg, ${colorA} ${stopA}%, ${colorB} ${stopB}%, ${colorC} 100%)`;

  const blobCount = 3 + Math.floor(rng() * 4);
  const blobs = Array.from({ length: blobCount }, () => {
    const x = Math.floor(rng() * 100);
    const y = Math.floor(rng() * 100);
    const size = 28 + Math.floor(rng() * 42);
    const alpha = past ? 0.22 + rng() * 0.28 : 0.3 + rng() * 0.45;
    return `radial-gradient(circle at ${x}% ${y}%, ${withAlpha(pickColor(rng, palette), alpha)} 0%, transparent ${size}%)`;
  });

  const stripeAngle = Math.floor(rng() * 180);
  const stripeColor = withAlpha(pickColor(rng, palette), past ? 0.12 : 0.18);
  const stripes = `repeating-linear-gradient(${stripeAngle}deg, transparent 0 14px, ${stripeColor} 14px 16px)`;

  return {
    backgroundImage: `${stripes}, ${blobs.join(', ')}, ${base}`,
  };
}
