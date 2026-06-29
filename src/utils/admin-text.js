import { ADMIN_TEXTS } from '../data/admin-texts';

/**
 * Read a nested admin UI string by dot path, e.g. adminText('blog.list.title').
 * Optional {name} placeholders are replaced from vars.
 */
export function adminText(path, vars) {
  const value = path.split('.').reduce((node, key) => node?.[key], ADMIN_TEXTS);

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

export function adminDocumentTitle(sectionTitle) {
  return adminText('shell.documentTitle', { section: sectionTitle });
}
