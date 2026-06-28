/** Brand color palette — single source of truth for all site colors */

export const COLORS = {
  orange: '#faa908',
  orangeLight: '#ffb82e',
  orangeDark: '#e89400',
  orangePale: '#ffbe3d',
  red: '#d62839',
  redLight: '#e8354a',
  redPale: '#ffd0d5',
  blue: '#3d85c6',
  blueLight: '#5a9ee0',
  bluePale: '#d0e6f9',
  green: '#3da865',
  greenLight: '#52c47e',
  greenPale: '#d3f0df',
  teal: '#289e8f',
  tealLight: '#3bb8a8',
  tealPale: '#caeee9',
  yellow: '#f5d020',
  yellowPale: '#fff3b0',
  black: '#111111',
  white: '#ffffff',
  offWhite: '#faf9f7',
  gray: '#6b6b6b',
  grayMuted: '#bbb',
};

function hexToRgb(hex) {
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

function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const GRADIENTS = {
  band: `linear-gradient(135deg, ${COLORS.orangePale} 0%, ${COLORS.orange} 48%, ${COLORS.orangeDark} 100%)`,
  loaderBar: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.red})`,
  parallaxOverlay: `linear-gradient(135deg, ${withAlpha(COLORS.orange, 0.75)} 0%, ${withAlpha(COLORS.red, 0.65)} 100%)`,
};

const COLOR_CSS_VARS = {
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

const GRADIENT_CSS_VARS = {
  band: '--gradient-band',
  loaderBar: '--gradient-loader-bar',
  parallaxOverlay: '--gradient-parallax-overlay',
};

/** Apply palette colors as CSS custom properties on :root */
export function applyColorTokens(root = document.documentElement) {
  for (const [key, cssVar] of Object.entries(COLOR_CSS_VARS)) {
    root.style.setProperty(cssVar, COLORS[key]);
  }

  for (const [key, cssVar] of Object.entries(GRADIENT_CSS_VARS)) {
    root.style.setProperty(cssVar, GRADIENTS[key]);
  }
}
