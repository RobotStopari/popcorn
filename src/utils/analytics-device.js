export function getAnalyticsDeviceInfo() {
  if (typeof navigator === 'undefined') {
    return { device: 'desktop', os: 'Other', browser: 'Other' };
  }

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const maxTouch = navigator.maxTouchPoints || 0;

  let device = 'desktop';
  if (/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    device = 'mobile';
  } else if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (maxTouch > 1 && /Mac/i.test(platform))) {
    device = 'tablet';
  }

  let os = 'Other';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Other';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  return { device, os, browser };
}

export const ANALYTICS_DEVICE_LABELS = {
  mobile: 'Mobil',
  tablet: 'Tablet',
  desktop: 'Počítač',
};
