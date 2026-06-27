import { useEffect } from 'react';
import { COLORS, GRADIENTS } from '../data/colors';

const COLOR_CSS_VARS = {
  orange: '--orange',
  orangeLight: '--orange-light',
  orangeDark: '--orange-dark',
  orangePale: '--orange-pale',
  red: '--red',
  redLight: '--red-light',
  redPale: '--red-pale',
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

export function useColorTokens() {
  useEffect(() => {
    const root = document.documentElement;
    for (const [key, cssVar] of Object.entries(COLOR_CSS_VARS)) {
      root.style.setProperty(cssVar, COLORS[key]);
    }
    for (const [key, cssVar] of Object.entries(GRADIENT_CSS_VARS)) {
      root.style.setProperty(cssVar, GRADIENTS[key]);
    }
  }, []);
}
