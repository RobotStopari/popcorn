import {
  COLOR_CATEGORIES,
  DEFAULT_COLORS,
  isValidHexColor,
  normalizeHexColor,
  withAlpha,
} from '../data/colors';

export const PARALLAX_OVERLAY_COLOR_KEYS = COLOR_CATEGORIES.find((category) => category.id === 'main')?.keys
  ?? ['white', 'black', 'orange', 'red', 'blue'];

export const PARALLAX_OVERLAY_COLOR_LABELS = {
  white: 'Bílá',
  black: 'Černá',
  orange: 'Oranžová',
  red: 'Červená',
  blue: 'Modrá',
};

export const PARALLAX_OVERLAY_COLOR_START_KEY_DEFAULT = 'orange';
export const PARALLAX_OVERLAY_COLOR_END_KEY_DEFAULT = 'red';
export const PARALLAX_OVERLAY_OPACITY_DEFAULT = 70;
export const PARALLAX_OVERLAY_OPACITY_MIN = 0;
export const PARALLAX_OVERLAY_OPACITY_MAX = 100;
export const PARALLAX_OVERLAY_ANGLE_DEFAULT = 135;
export const PARALLAX_OVERLAY_ANGLE_MIN = 0;
export const PARALLAX_OVERLAY_ANGLE_MAX = 360;

function resolveOverlayColorKey(value, fallbackKey, colors = DEFAULT_COLORS) {
  if (PARALLAX_OVERLAY_COLOR_KEYS.includes(value)) return value;

  if (isValidHexColor(value)) {
    const normalized = normalizeHexColor(value);
    const match = PARALLAX_OVERLAY_COLOR_KEYS.find(
      (key) => normalizeHexColor(colors[key] ?? DEFAULT_COLORS[key]) === normalized,
    );
    if (match) return match;
  }

  return fallbackKey;
}

export function clampParallaxOverlayOpacity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return PARALLAX_OVERLAY_OPACITY_DEFAULT;
  return Math.min(
    PARALLAX_OVERLAY_OPACITY_MAX,
    Math.max(PARALLAX_OVERLAY_OPACITY_MIN, Math.round(parsed)),
  );
}

export function clampParallaxOverlayAngle(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return PARALLAX_OVERLAY_ANGLE_DEFAULT;
  const normalized = ((Math.round(parsed) % 360) + 360) % 360;
  return normalized;
}

export function normalizeParallaxOverlayFields(raw = {}, colors = DEFAULT_COLORS) {
  return {
    overlayColorStartKey: resolveOverlayColorKey(
      raw.overlayColorStartKey ?? raw.overlayColorStart,
      PARALLAX_OVERLAY_COLOR_START_KEY_DEFAULT,
      colors,
    ),
    overlayColorEndKey: resolveOverlayColorKey(
      raw.overlayColorEndKey ?? raw.overlayColorEnd,
      PARALLAX_OVERLAY_COLOR_END_KEY_DEFAULT,
      colors,
    ),
    overlayOpacity: clampParallaxOverlayOpacity(raw.overlayOpacity),
    overlayAngle: clampParallaxOverlayAngle(raw.overlayAngle),
  };
}

function resolveOverlayHex(key, colors, fallbackKey = 'orange') {
  const hex = colors?.[key] ?? DEFAULT_COLORS[key] ?? DEFAULT_COLORS[fallbackKey];
  return isValidHexColor(hex) ? normalizeHexColor(hex) : DEFAULT_COLORS[fallbackKey];
}

export function getParallaxOverlayBackground(raw = {}, colors = DEFAULT_COLORS) {
  const {
    overlayColorStartKey,
    overlayColorEndKey,
    overlayOpacity,
    overlayAngle,
  } = normalizeParallaxOverlayFields(raw, colors);

  const startHex = resolveOverlayHex(overlayColorStartKey, colors, 'orange');
  const endHex = resolveOverlayHex(overlayColorEndKey, colors, 'red');
  const alpha = overlayOpacity / 100;

  return `linear-gradient(${overlayAngle}deg, ${withAlpha(startHex, alpha)} 0%, ${withAlpha(endHex, alpha)} 100%)`;
}

export function isDefaultParallaxOverlay(raw = {}, colors = DEFAULT_COLORS) {
  const normalized = normalizeParallaxOverlayFields(raw, colors);
  return normalized.overlayColorStartKey === PARALLAX_OVERLAY_COLOR_START_KEY_DEFAULT
    && normalized.overlayColorEndKey === PARALLAX_OVERLAY_COLOR_END_KEY_DEFAULT
    && normalized.overlayOpacity === PARALLAX_OVERLAY_OPACITY_DEFAULT
    && normalized.overlayAngle === PARALLAX_OVERLAY_ANGLE_DEFAULT;
}
