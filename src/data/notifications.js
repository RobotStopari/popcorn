export const NOTIFICATION_SCHEDULE_MODES = {
  scheduled: 'scheduled',
  manual: 'manual',
};

export const NOTIFICATION_COLOR_IDS = ['orange', 'red', 'blue', 'green', 'teal'];

export const NOTIFICATION_COLORS = [
  { id: 'orange', label: 'Oranžová', token: 'orange', paleToken: 'orangePale' },
  { id: 'red', label: 'Červená', token: 'red', paleToken: 'redPale' },
  { id: 'blue', label: 'Modrá', token: 'blue', paleToken: 'bluePale' },
  { id: 'green', label: 'Zelená', token: 'green', paleToken: 'greenPale' },
  { id: 'teal', label: 'Tyrkysová', token: 'teal', paleToken: 'tealPale' },
];

export const NOTIFICATION_ICON_IDS = [
  'notification',
  'important',
  'starting',
  'ending',
  'warning',
  'info',
];

export const DEFAULT_NOTIFICATION = {
  title: '',
  text: '',
  scheduleMode: NOTIFICATION_SCHEDULE_MODES.scheduled,
  manualActive: false,
  dateStart: '',
  timeStart: '',
  dateEnd: '',
  timeEnd: '',
  color: 'orange',
  icon: 'notification',
  ctaEnabled: false,
  ctaLabel: '',
  ctaHref: '',
  ctaOpenInNewTab: false,
};
