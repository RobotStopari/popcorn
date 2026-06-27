const HOME_SCROLL_KEY = 'popcorn:home-scroll';

export function saveHomeScroll() {
  sessionStorage.setItem(HOME_SCROLL_KEY, String(window.scrollY));
}

export function clearHomeScroll() {
  sessionStorage.removeItem(HOME_SCROLL_KEY);
}

export function getHomeScroll() {
  const saved = sessionStorage.getItem(HOME_SCROLL_KEY);
  if (saved === null) return null;
  const value = Number.parseInt(saved, 10);
  return Number.isFinite(value) ? value : null;
}

function isHome(path) {
  return path === '/' || path === '/index.html';
}

function isEvent(path) {
  return path.startsWith('/event');
}

export function shouldSaveHomeScroll(fromPath, toPath) {
  return isHome(fromPath) && (isEvent(toPath) || toPath === '/admin');
}

export function shouldRestoreHomeScroll(fromPath, toPath) {
  return isHome(toPath) && !isHome(fromPath) && getHomeScroll() !== null;
}
