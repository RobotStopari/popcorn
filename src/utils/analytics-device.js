export const ANALYTICS_DEVICES = ['pc', 'mobile', 'tablet', 'other'];
export const ANALYTICS_OS = ['windows', 'macos', 'linux', 'android', 'ios', 'other'];

export const ANALYTICS_DEVICE_LABELS = {
  pc: 'Počítač',
  desktop: 'Počítač',
  mobile: 'Mobil',
  tablet: 'Tablet',
  other: 'Jiné',
};

export const ANALYTICS_OS_LABELS = {
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  android: 'Android',
  ios: 'iOS',
  other: 'Other',
};

function detectBrowserFromUa(ua) {
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/Chrome\//i.test(ua) && !/Edg/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/Firefox/i.test(ua)) return 'Firefox';
  return 'Other';
}

function detectOsFromUa(ua, platform, maxTouch) {
  if (/iPhone|iPod/i.test(ua)) return 'ios';
  if (/iPad/i.test(ua) || (platform === 'MacIntel' && maxTouch > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  if (/Windows/i.test(ua)) return 'windows';
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macos';
  if (/Linux/i.test(ua)) return 'linux';
  return 'other';
}

function detectDeviceFromUa(ua, platform, maxTouch, os) {
  if (os === 'ios') {
    return /iPad/i.test(ua) || (platform === 'MacIntel' && maxTouch > 1) ? 'tablet' : 'mobile';
  }

  if (os === 'android') {
    return /Mobile/i.test(ua) && !/Tablet/i.test(ua) ? 'mobile' : 'tablet';
  }

  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (maxTouch > 1 && /Mac/i.test(platform))) {
    return 'tablet';
  }

  if (/Mobi|IEMobile|Opera Mini|BlackBerry|Android|iPhone|iPod/i.test(ua)) {
    return /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
  }

  return 'pc';
}

function detectFromUserAgentData(uaData) {
  if (!uaData) return null;

  const platformHint = String(uaData.platform || '').toLowerCase();
  let os = 'other';
  let device = uaData.mobile ? 'mobile' : 'pc';

  if (platformHint === 'android') {
    os = 'android';
    device = uaData.mobile ? 'mobile' : 'tablet';
  } else if (platformHint === 'ios') {
    os = 'ios';
    device = uaData.mobile ? 'mobile' : 'tablet';
  } else if (platformHint === 'windows') {
    os = 'windows';
    device = 'pc';
  } else if (platformHint === 'macos') {
    os = 'macos';
    device = 'pc';
  } else if (platformHint === 'linux') {
    os = 'linux';
    device = 'pc';
  }

  if (uaData.mobile && device === 'pc') {
    device = 'mobile';
  }

  return { device, os };
}

export function normalizeAnalyticsDevice(value) {
  const key = String(value || '').trim().toLowerCase();

  if (key === 'pc' || key === 'desktop' || key === 'počítač' || key === 'pocitac') return 'pc';
  if (key === 'mobile' || key === 'mobil') return 'mobile';
  if (key === 'tablet') return 'tablet';
  if (key === 'other' || key === 'jiné' || key === 'jine') return 'other';

  return 'other';
}

export function normalizeAnalyticsOs(value) {
  const key = String(value || '').trim().toLowerCase();

  if (key === 'windows') return 'windows';
  if (key === 'macos' || key === 'mac os x' || key === 'mac') return 'macos';
  if (key === 'linux') return 'linux';
  if (key === 'android') return 'android';
  if (key === 'ios') return 'ios';
  if (key === 'other') return 'other';

  return 'other';
}

export function reconcileAnalyticsDeviceOs(device, os) {
  let normalizedDevice = normalizeAnalyticsDevice(device);
  let normalizedOs = normalizeAnalyticsOs(os);

  const mobileOs = new Set(['android', 'ios']);
  const desktopOs = new Set(['windows', 'macos', 'linux']);

  if ((normalizedDevice === 'mobile' || normalizedDevice === 'tablet') && desktopOs.has(normalizedOs)) {
    normalizedOs = 'other';
  }

  if (normalizedDevice === 'pc' && mobileOs.has(normalizedOs)) {
    normalizedDevice = normalizedOs === 'ios' ? 'tablet' : 'mobile';
  }

  return {
    device: normalizedDevice,
    os: normalizedOs,
  };
}

export function normalizeAnalyticsDeviceInfo({ device, os, browser } = {}) {
  const reconciled = reconcileAnalyticsDeviceOs(device, os);

  return {
    device: reconciled.device,
    os: reconciled.os,
    browser: browser || 'Other',
  };
}

export function getAnalyticsDeviceInfo() {
  if (typeof navigator === 'undefined') {
    return { device: 'pc', os: 'other', browser: 'other' };
  }

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const maxTouch = navigator.maxTouchPoints || 0;
  const uaData = navigator.userAgentData;

  const hinted = detectFromUserAgentData(uaData);
  let device = hinted?.device || 'pc';
  let os = hinted?.os || 'other';

  if (os === 'other') {
    os = detectOsFromUa(ua, platform, maxTouch);
  }

  if (device === 'pc' && !hinted) {
    device = detectDeviceFromUa(ua, platform, maxTouch, os);
  }

  const reconciled = reconcileAnalyticsDeviceOs(device, os);

  return {
    device: reconciled.device,
    os: reconciled.os,
    browser: detectBrowserFromUa(ua),
  };
}
