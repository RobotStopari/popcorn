import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackAnalyticsEvent } from '../services/analytics';
import { getAnalyticsDeviceInfo } from '../utils/analytics-device';
import { getAnalyticsSessionId } from '../utils/analytics-track';

function shouldTrackPath(pathname) {
  return pathname
    && !pathname.startsWith('/admin')
    && !pathname.startsWith('/share/');
}

const LAST_VIEW_KEY = 'popcorn.analytics.lastView';
const HEARTBEAT_SECONDS = 30;

function parseContentFromPath(pathname) {
  const blogMatch = pathname.match(/^\/blog\/([^/]+)/);
  if (blogMatch) {
    return {
      articleSlug: decodeURIComponent(blogMatch[1]),
      eventId: '',
      eventSlug: '',
    };
  }

  const eventSlugMatch = pathname.match(/^\/akce\/([^/]+)/);
  if (eventSlugMatch) {
    return {
      articleSlug: '',
      eventId: '',
      eventSlug: decodeURIComponent(eventSlugMatch[1]),
    };
  }

  const legacyEventMatch = pathname.match(/^\/event\/([^/]+)/);
  if (legacyEventMatch) {
    return {
      articleSlug: '',
      eventId: decodeURIComponent(legacyEventMatch[1]),
      eventSlug: '',
    };
  }

  return {
    articleSlug: '',
    eventId: '',
    eventSlug: '',
  };
}

function shouldSkipDuplicateView(pathname) {
  try {
    const raw = sessionStorage.getItem(LAST_VIEW_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed.path !== pathname) return false;
    return Date.now() - parsed.at < 8000;
  } catch {
    return false;
  }
}

function rememberView(pathname) {
  try {
    sessionStorage.setItem(LAST_VIEW_KEY, JSON.stringify({ path: pathname, at: Date.now() }));
  } catch {
    // ignore storage errors
  }
}

export function useSiteAnalytics() {
  const location = useLocation();
  const deviceInfoRef = useRef(getAnalyticsDeviceInfo());
  const sessionIdRef = useRef(getAnalyticsSessionId());
  const lastPathRef = useRef('');
  const visibleRef = useRef(typeof document !== 'undefined' ? document.visibilityState === 'visible' : true);

  useEffect(() => {
    const onVisibilityChange = () => {
      visibleRef.current = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    const pathname = location.pathname;
    if (!shouldTrackPath(pathname)) return undefined;
    if (shouldSkipDuplicateView(pathname)) return undefined;

    const content = parseContentFromPath(pathname);
    const basePayload = {
      sessionId: sessionIdRef.current,
      path: pathname,
      ...deviceInfoRef.current,
      ...content,
    };

    rememberView(pathname);
    lastPathRef.current = pathname;

    trackAnalyticsEvent({
      ...basePayload,
      type: 'page_view',
      clickTarget: '',
      clickLabel: '',
      durationSec: 0,
    });

    if (content.articleSlug) {
      trackAnalyticsEvent({ ...basePayload, type: 'article_view', clickTarget: '', clickLabel: '', durationSec: 0 });
    }

    if (content.eventSlug || content.eventId) {
      trackAnalyticsEvent({ ...basePayload, type: 'event_view', clickTarget: '', clickLabel: '', durationSec: 0 });
    }

    return undefined;
  }, [location.pathname]);

  useEffect(() => {
    if (!shouldTrackPath(location.pathname)) return undefined;

    const intervalId = window.setInterval(() => {
      if (!visibleRef.current) return;
      const pathname = lastPathRef.current || location.pathname;
      if (!shouldTrackPath(pathname)) return;

      trackAnalyticsEvent({
        type: 'engagement',
        sessionId: sessionIdRef.current,
        path: pathname,
        ...deviceInfoRef.current,
        ...parseContentFromPath(pathname),
        clickTarget: '',
        clickLabel: '',
        durationSec: HEARTBEAT_SECONDS,
      });
    }, HEARTBEAT_SECONDS * 1000);

    return () => window.clearInterval(intervalId);
  }, [location.pathname]);
}
