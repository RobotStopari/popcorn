import { ADMIN_TEXTS, SITE_UI_TEXTS } from '../data/admin-texts';

let runtimeAdminTexts = ADMIN_TEXTS;
let runtimeSiteTexts = SITE_UI_TEXTS;

export function setAppTextRuntime({ admin, site } = {}) {
  if (admin) runtimeAdminTexts = admin;
  if (site) runtimeSiteTexts = site;
}

function resolveText(texts, path, vars) {
  const value = path.split('.').reduce((node, key) => node?.[key], texts);

  if (typeof value !== 'string') {
    return path;
  }

  if (!vars) {
    return value;
  }

  return value.replace(/\{(\w+)\}/g, (_, key) => (
    vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : `{${key}}`
  ));
}

/**
 * Read a nested admin UI string by dot path, e.g. adminText('blog.list.title').
 * Optional {name} placeholders are replaced from vars.
 */
export function adminText(path, vars) {
  return resolveText(runtimeAdminTexts, path, vars);
}

/**
 * Read a fixed public-site UI string by dot path, e.g. siteText('blog.list.empty').
 */
export function siteText(path, vars) {
  return resolveText(runtimeSiteTexts, path, vars);
}

export function adminDocumentTitle(sectionTitle) {
  return adminText('shell.documentTitle', { section: sectionTitle });
}

export function siteDocumentTitle(pageTitle) {
  return `${pageTitle} — ${siteText('common.documentTitleSuffix')}`;
}

export function getCalendarLocale() {
  return {
    months: [...runtimeSiteTexts.calendar.months],
    weekdays: [...runtimeSiteTexts.calendar.weekdays],
  };
}
