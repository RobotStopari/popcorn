/** Brand color palette — defaults; live values come from Firestore via SiteColorsProvider */

export const DEFAULT_COLORS = {
  orange: '#faa908',
  orangeLight: '#ffb82e',
  orangeDark: '#e89400',
  orangePale: '#ffbe3d',
  red: '#d62839',
  redLight: '#e8354a',
  redPale: '#ea4659',
  blue: '#3d85c6',
  blueLight: '#5a9ee0',
  bluePale: '#68a6e3',
  green: '#3da865',
  greenLight: '#52c47e',
  greenPale: '#61c989',
  teal: '#289e8f',
  tealLight: '#3bb8a8',
  tealPale: '#4cbeaf',
  yellow: '#f5d020',
  yellowPale: '#f6d433',
  black: '#111111',
  white: '#ffffff',
  offWhite: '#faf9f7',
  gray: '#6b6b6b',
  grayMuted: '#bbb',
};

export const COLOR_KEYS = Object.keys(DEFAULT_COLORS);
export const SITE_COLORS_DOC_ID = 'config';

/** Previous default pale values — migrated automatically in admin. */
export const LEGACY_PALE_COLORS = {
  redPale: '#ffd0d5',
  bluePale: '#d0e6f9',
  greenPale: '#d3f0df',
  tealPale: '#caeee9',
  yellowPale: '#fff3b0',
};

export const PALE_COLOR_MIGRATION_KEYS = Object.keys(LEGACY_PALE_COLORS);

export const COLOR_CATEGORIES = [
  {
    id: 'main',
    heading: 'Hlavní barvy',
    keys: ['white', 'black', 'orange', 'red', 'blue'],
  },
  {
    id: 'accent',
    heading: 'Akcentové barvy',
    keys: ['orangeLight', 'orangeDark', 'orangePale', 'redLight', 'redPale', 'blueLight', 'bluePale'],
  },
  {
    id: 'texture',
    heading: 'Texturové barvy',
    keys: [
      'offWhite', 'gray', 'grayMuted',
      'green', 'greenLight', 'greenPale',
      'teal', 'tealLight', 'tealPale',
      'yellow', 'yellowPale',
    ],
  },
];

/** @deprecated Use DEFAULT_COLORS or useSiteColors() */
export const COLORS = DEFAULT_COLORS;

export function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const normalized = value.length === 3
    ? value.split('').map((char) => char + char).join('')
    : value;

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function rgbString(hex) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

export function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function buildGradients(colors) {
  return {
    band: `linear-gradient(135deg, ${colors.orangePale} 0%, ${colors.orange} 48%, ${colors.orangeDark} 100%)`,
    loaderBar: `linear-gradient(90deg, ${colors.orange}, ${colors.red})`,
    parallaxOverlay: `linear-gradient(135deg, ${withAlpha(colors.orange, 0.75)} 0%, ${withAlpha(colors.red, 0.65)} 100%)`,
  };
}

export const COLOR_CSS_VARS = {
  orange: '--orange',
  orangeLight: '--orange-light',
  orangeDark: '--orange-dark',
  orangePale: '--orange-pale',
  red: '--red',
  redLight: '--red-light',
  redPale: '--red-pale',
  blue: '--blue',
  blueLight: '--blue-light',
  bluePale: '--blue-pale',
  green: '--green',
  greenLight: '--green-light',
  greenPale: '--green-pale',
  teal: '--teal',
  tealLight: '--teal-light',
  tealPale: '--teal-pale',
  yellow: '--yellow',
  yellowPale: '--yellow-pale',
  black: '--black',
  white: '--white',
  offWhite: '--off-white',
  gray: '--gray',
  grayMuted: '--gray-muted',
};

export const GRADIENT_CSS_VARS = {
  band: '--gradient-band',
  loaderBar: '--gradient-loader-bar',
  parallaxOverlay: '--gradient-parallax-overlay',
};

/** @deprecated Use buildGradients() */
export const GRADIENTS = buildGradients(DEFAULT_COLORS);

export function isValidHexColor(value) {
  return typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

export function normalizeHexColor(value) {
  const trimmed = value.trim();
  if (trimmed.length === 4) {
    return `#${trimmed.slice(1).split('').map((char) => char + char).join('')}`;
  }
  return trimmed.toLowerCase();
}

export function normalizeSiteColors(data = {}) {
  const colors = {};

  for (const key of COLOR_KEYS) {
    const raw = data.colors?.[key];
    colors[key] = isValidHexColor(raw)
      ? normalizeHexColor(raw)
      : DEFAULT_COLORS[key];
  }

  return {
    colors,
    gradients: buildGradients(colors),
  };
}

export function cloneColorMap(colors) {
  return Object.fromEntries(COLOR_KEYS.map((key) => [key, colors[key]]));
}

/** Apply palette colors as CSS custom properties on :root */
export function applyColorTokens(palette, root = document.documentElement) {
  const colors = palette?.colors ?? DEFAULT_COLORS;
  const gradients = palette?.gradients ?? buildGradients(colors);

  for (const [key, cssVar] of Object.entries(COLOR_CSS_VARS)) {
    root.style.setProperty(cssVar, colors[key]);
  }

  for (const [key, cssVar] of Object.entries(GRADIENT_CSS_VARS)) {
    root.style.setProperty(cssVar, gradients[key]);
  }
}
