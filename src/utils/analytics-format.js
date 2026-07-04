import {
  ANALYTICS_DEVICE_LABELS,
  ANALYTICS_OS_LABELS,
  normalizeAnalyticsDeviceInfo,
} from './analytics-device';
import { SOCIAL_LINK_PRESETS } from '../data/social-link-presets';

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDayLabel(dayKey) {
  const [year, month, day] = dayKey.split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return dayKey;
  return `${day}. ${month}. ${year}`;
}

function incrementMap(map, key, amount = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + amount);
}

function mapToSortedRows(map, labelFn = (key) => key) {
  return [...map.entries()]
    .map(([key, value]) => ({ key, label: labelFn(key), value }))
    .sort((a, b) => b.value - a.value);
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.round(seconds || 0));
  if (total < 60) return `${total} s`;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes < 60) return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours} h ${mins} min` : `${hours} h`;
}

function formatPathLabel(path) {
  if (!path || path === '/') return 'Domovská stránka';
  return path;
}

function formatHourLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function formatClickLabel(type, target, label) {
  if (type === 'social_click') {
    return SOCIAL_LINK_PRESETS[target]?.label || label || target;
  }
  if (label?.trim()) return label.trim();
  return target || '—';
}

function incrementClickMap(map, labelMap, type, target, label) {
  if (!target) return;
  incrementMap(map, target);
  if (!labelMap.has(target)) {
    labelMap.set(target, formatClickLabel(type, target, label));
  }
}

export function buildPageTimeSeries(pageViewsByDayByPath, allDayKeys, selectedPaths = []) {
  return allDayKeys.map((dayKey) => {
    const row = { key: dayKey, label: formatDayLabel(dayKey) };
    for (const path of selectedPaths) {
      row[path] = pageViewsByDayByPath.get(path)?.get(dayKey) || 0;
    }
    return row;
  });
}

export function buildAnalyticsSummary(events = []) {
  const pageViewsByDay = new Map();
  const pageViewsByDayByPath = new Map();
  const paths = new Map();
  const devices = new Map();
  const osNames = new Map();
  const browsers = new Map();
  const articles = new Map();
  const eventViews = new Map();
  const sessions = new Map();
  const engagementByPath = new Map();
  const viewsByHour = new Map();
  const entryPages = new Map();
  const exitPages = new Map();

  const socialClicks = new Map();
  const socialClickLabels = new Map();
  const navClicks = new Map();
  const navClickLabels = new Map();
  const outboundClicks = new Map();
  const outboundClickLabels = new Map();
  const notificationClicks = new Map();
  const notificationClickLabels = new Map();
  const contactClicks = new Map();
  const contactClickLabels = new Map();
  const blogLikes = new Map();
  const blogLikeLabels = new Map();
  const blogComments = new Map();
  const blogCommentLabels = new Map();

  let pageViews = 0;
  let engagementSeconds = 0;
  let socialClickTotal = 0;
  let navClickTotal = 0;
  let outboundClickTotal = 0;
  let notificationClickTotal = 0;
  let contactClickTotal = 0;
  let blogLikeTotal = 0;
  let blogCommentTotal = 0;

  for (const event of events) {
    const createdAt = toDate(event.createdAt);
    if (!createdAt) continue;

    const { device, os, browser } = normalizeAnalyticsDeviceInfo({
      device: event.device,
      os: event.os,
      browser: event.browser,
    });

    const sessionId = event.sessionId || 'unknown';
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        id: sessionId,
        startedAt: createdAt,
        lastSeenAt: createdAt,
        device,
        os,
        browser,
        entryPath: event.path || '/',
        exitPath: event.path || '/',
        pagesViewed: 0,
        totalSeconds: 0,
        paths: [],
      });
    }

    const session = sessions.get(sessionId);
    if (createdAt < session.startedAt) session.startedAt = createdAt;
    if (createdAt > session.lastSeenAt) session.lastSeenAt = createdAt;

    if (event.type === 'page_view') {
      pageViews += 1;
      session.pagesViewed += 1;
      const path = event.path || '/';
      const dayKey = formatDayKey(createdAt);

      incrementMap(pageViewsByDay, dayKey);
      incrementMap(paths, path);
      incrementMap(devices, device);
      incrementMap(osNames, os);
      incrementMap(browsers, browser);
      incrementMap(viewsByHour, createdAt.getHours());

      if (!pageViewsByDayByPath.has(path)) {
        pageViewsByDayByPath.set(path, new Map());
      }
      incrementMap(pageViewsByDayByPath.get(path), dayKey);

      if (session.pagesViewed === 1) {
        session.entryPath = path;
      }
      session.exitPath = path;

      if (!session.paths.includes(path)) {
        session.paths = [...session.paths, path].slice(-12);
      }
    }

    if (event.type === 'article_view' && event.articleSlug) {
      incrementMap(articles, event.articleSlug);
    }

    if (event.type === 'event_view') {
      const key = event.eventSlug || event.eventId || event.path;
      if (key) incrementMap(eventViews, key);
    }

    if (event.type === 'engagement') {
      const seconds = Number(event.durationSec) || 0;
      engagementSeconds += seconds;
      session.totalSeconds += seconds;
      incrementMap(engagementByPath, event.path || '/', seconds);
    }

    if (event.type === 'social_click') {
      socialClickTotal += 1;
      incrementClickMap(socialClicks, socialClickLabels, 'social_click', event.clickTarget, event.clickLabel);
    }

    if (event.type === 'nav_click') {
      navClickTotal += 1;
      incrementClickMap(navClicks, navClickLabels, 'nav_click', event.clickTarget, event.clickLabel);
    }

    if (event.type === 'outbound_click') {
      outboundClickTotal += 1;
      incrementClickMap(outboundClicks, outboundClickLabels, 'outbound_click', event.clickTarget, event.clickLabel);
    }

    if (event.type === 'notification_click') {
      notificationClickTotal += 1;
      incrementClickMap(notificationClicks, notificationClickLabels, 'notification_click', event.clickTarget, event.clickLabel);
    }

    if (event.type === 'contact_click') {
      contactClickTotal += 1;
      incrementClickMap(contactClicks, contactClickLabels, 'contact_click', event.clickTarget, event.clickLabel);
    }

    if (event.type === 'blog_like') {
      blogLikeTotal += 1;
      incrementClickMap(blogLikes, blogLikeLabels, 'blog_like', event.clickTarget, event.clickLabel);
    }

    if (event.type === 'blog_comment') {
      blogCommentTotal += 1;
      incrementClickMap(blogComments, blogCommentLabels, 'blog_comment', event.clickTarget, event.clickLabel);
    }
  }

  for (const session of sessions.values()) {
    incrementMap(entryPages, session.entryPath || '/');
    incrementMap(exitPages, session.exitPath || session.entryPath || '/');
  }

  const clickRows = (map, labelMap) => mapToSortedRows(map, (key) => labelMap.get(key) || key);

  const sessionRows = [...sessions.values()]
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
    .map((session) => ({
      ...session,
      deviceLabel: ANALYTICS_DEVICE_LABELS[session.device] || session.device,
      osLabel: ANALYTICS_OS_LABELS[session.os] || session.os,
      durationLabel: formatDuration(session.totalSeconds),
      startedLabel: session.startedAt.toLocaleString('cs-CZ'),
      lastSeenLabel: session.lastSeenAt.toLocaleString('cs-CZ'),
      pathsLabel: [...session.paths].reverse().map(formatPathLabel).join(' → ') || formatPathLabel(session.entryPath),
    }));

  const uniqueSessions = sessionRows.length;
  const avgSessionSeconds = uniqueSessions ? engagementSeconds / uniqueSessions : 0;
  const mobileViews = (devices.get('mobile') || 0) + (devices.get('tablet') || 0);
  const mobileShare = pageViews ? Math.round((mobileViews / pageViews) * 100) : 0;
  const allDayKeys = mapToSortedRows(pageViewsByDay, formatDayLabel)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((row) => row.key);

  const totalClicks = socialClickTotal + navClickTotal + outboundClickTotal
    + notificationClickTotal + contactClickTotal + blogLikeTotal + blogCommentTotal;

  return {
    totals: {
      pageViews,
      uniqueSessions,
      engagementSeconds,
      avgSessionSeconds,
      avgSessionLabel: formatDuration(avgSessionSeconds),
      mobileShare,
      socialClicks: socialClickTotal,
      navClicks: navClickTotal,
      outboundClicks: outboundClickTotal,
      notificationClicks: notificationClickTotal,
      contactClicks: contactClickTotal,
      blogLikes: blogLikeTotal,
      blogComments: blogCommentTotal,
      totalClicks,
    },
    viewsByDay: mapToSortedRows(pageViewsByDay, formatDayLabel).sort((a, b) => a.key.localeCompare(b.key)),
    allDayKeys,
    pageViewsByDayByPath,
    topPaths: mapToSortedRows(paths, formatPathLabel).slice(0, 20),
    engagementByPath: mapToSortedRows(engagementByPath, formatPathLabel)
      .map((row) => ({ ...row, durationLabel: formatDuration(row.value) }))
      .slice(0, 12),
    viewsByHour: mapToSortedRows(viewsByHour, formatHourLabel).sort((a, b) => Number(a.key) - Number(b.key)),
    entryPages: mapToSortedRows(entryPages, formatPathLabel).slice(0, 12),
    exitPages: mapToSortedRows(exitPages, formatPathLabel).slice(0, 12),
    devices: mapToSortedRows(devices, (key) => ANALYTICS_DEVICE_LABELS[key] || key),
    os: mapToSortedRows(osNames, (key) => ANALYTICS_OS_LABELS[key] || key).slice(0, 8),
    browsers: mapToSortedRows(browsers).slice(0, 8),
    articles: mapToSortedRows(articles).slice(0, 12),
    events: mapToSortedRows(eventViews).slice(0, 12),
    socialClicks: clickRows(socialClicks, socialClickLabels).slice(0, 12),
    navClicks: clickRows(navClicks, navClickLabels).slice(0, 12),
    outboundClicks: clickRows(outboundClicks, outboundClickLabels).slice(0, 12),
    notificationClicks: clickRows(notificationClicks, notificationClickLabels).slice(0, 12),
    contactClicks: clickRows(contactClicks, contactClickLabels).slice(0, 12),
    blogLikes: clickRows(blogLikes, blogLikeLabels).slice(0, 12),
    blogComments: clickRows(blogComments, blogCommentLabels).slice(0, 12),
    sessions: sessionRows.slice(0, 40),
  };
}

export function getAnalyticsRangePresets() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const makeFrom = (days) => {
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    from.setHours(0, 0, 0, 0);
    return from;
  };

  return [
    { id: '7', label: 'Posledních 7 dní', from: makeFrom(7), to: today },
    { id: '30', label: 'Posledních 30 dní', from: makeFrom(30), to: today },
    { id: '90', label: 'Posledních 90 dní', from: makeFrom(90), to: today },
  ];
}
