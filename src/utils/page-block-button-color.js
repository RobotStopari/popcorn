import { COLOR_CSS_VARS } from '../data/colors';
import {
  PAGE_BLOCK_BUTTON_COLOR_DEFAULT,
  PAGE_BLOCK_BUTTON_COLOR_IDS,
  PAGE_BLOCK_BUTTON_COLORS,
} from '../data/page-block-button-colors';

export function normalizePageBlockButtonColor(value) {
  const id = typeof value === 'string' ? value.trim() : '';
  return PAGE_BLOCK_BUTTON_COLOR_IDS.includes(id) ? id : PAGE_BLOCK_BUTTON_COLOR_DEFAULT;
}

export function getPageBlockButtonColorTokens(colorId) {
  const normalized = normalizePageBlockButtonColor(colorId);
  const color = PAGE_BLOCK_BUTTON_COLORS.find((item) => item.id === normalized)
    || PAGE_BLOCK_BUTTON_COLORS[0];

  return {
    id: color.id,
    accentVar: COLOR_CSS_VARS[color.token],
    paleVar: COLOR_CSS_VARS[color.paleToken],
  };
}

export function getPageBlockButtonColorStyle(colorId) {
  const { accentVar, paleVar } = getPageBlockButtonColorTokens(colorId);

  return {
    '--page-block-btn-accent': `var(${accentVar})`,
    '--page-block-btn-accent-pale': `var(${paleVar})`,
  };
}
