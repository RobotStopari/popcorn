import { NOTIFICATION_COLORS } from './notifications';

export const PAGE_BLOCK_BUTTON_COLOR_IDS = ['orange', 'red', 'blue'];
export const PAGE_BLOCK_BUTTON_COLOR_DEFAULT = 'orange';

export const PAGE_BLOCK_BUTTON_COLORS = NOTIFICATION_COLORS.filter(
  (color) => PAGE_BLOCK_BUTTON_COLOR_IDS.includes(color.id),
);
