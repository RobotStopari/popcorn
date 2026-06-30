export function readSsrBootstrap() {
  if (typeof window === 'undefined') return null;
  const bootstrap = window.__POPCORN_SSR__;
  if (bootstrap) {
    delete window.__POPCORN_SSR__;
  }
  return bootstrap || null;
}
