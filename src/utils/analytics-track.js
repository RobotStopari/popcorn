import { trackAnalyticsEvent } from '../services/analytics';
import { getAnalyticsDeviceInfo } from './analytics-device';

const SESSION_KEY = 'popcorn.analytics.session';

export function getAnalyticsSessionId() {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return `sess-${Date.now()}`;
  }
}

function basePayload(path = '') {
  const pathname = path || (typeof window !== 'undefined' ? window.location.pathname : '/');
  return {
    sessionId: getAnalyticsSessionId(),
    path: pathname,
    ...getAnalyticsDeviceInfo(),
    articleSlug: '',
    eventId: '',
    eventSlug: '',
    durationSec: 0,
  };
}

export function trackInteraction(type, { path, clickTarget = '', clickLabel = '' } = {}) {
  if (typeof window === 'undefined') return;
  const pathname = path || window.location.pathname;
  if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/share/')) return;

  trackAnalyticsEvent({
    type,
    ...basePayload(pathname),
    clickTarget: String(clickTarget || '').slice(0, 120),
    clickLabel: String(clickLabel || '').slice(0, 200),
  });
}

export function trackSocialClick(preset, label = '') {
  trackInteraction('social_click', { clickTarget: preset, clickLabel: label });
}

export function trackNavClick(href, label = '') {
  trackInteraction('nav_click', { clickTarget: href, clickLabel: label });
}

export function trackOutboundClick(href, label = '') {
  trackInteraction('outbound_click', { clickTarget: href, clickLabel: label });
}

export function trackNotificationClick(notificationId, label = '') {
  trackInteraction('notification_click', { clickTarget: notificationId, clickLabel: label });
}

export function trackContactClick(target = 'email', label = '') {
  trackInteraction('contact_click', { clickTarget: target, clickLabel: label });
}

export function trackBlogLike(postId, label = '') {
  trackInteraction('blog_like', { clickTarget: postId, clickLabel: label });
}

export function trackBlogComment(postId, label = '') {
  trackInteraction('blog_comment', { clickTarget: postId, clickLabel: label });
}
