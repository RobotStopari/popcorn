import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { pagePath } from '../data/pages';
import {
  DEFAULT_SITE_MENU,
  SITE_MENU_DOC_ID,
  normalizeMenuItems,
  validateMenuItems,
} from '../data/site-menu';
import { db } from '../firebase';

const siteMenuRef = doc(db, 'siteMenu', SITE_MENU_DOC_ID);

function serializeMenuItems(items) {
  return items.map((item) => {
    if (item.type === 'dropdown') {
      return {
        id: item.id,
        type: item.type,
        label: item.label.trim(),
        items: item.items.map((link) => ({
          id: link.id,
          label: link.label.trim(),
          linkType: link.linkType,
          pageId: link.linkType === 'page' ? link.pageId : '',
          href: link.linkType === 'custom' ? link.href.trim() : '',
          external: Boolean(link.external),
        })),
      };
    }

    return {
      id: item.id,
      type: item.type,
      label: item.label.trim(),
      linkType: item.linkType,
      pageId: item.linkType === 'page' ? item.pageId : '',
      href: item.linkType === 'custom' ? item.href.trim() : '',
      external: Boolean(item.external),
    };
  });
}

export function resolveMenuLink(link, pages) {
  if (link.linkType === 'page') {
    const page = pages.find((entry) => entry.id === link.pageId);
    return {
      ...link,
      href: page ? pagePath(page) : '/',
      external: Boolean(link.external),
    };
  }

  return {
    ...link,
    href: link.href || '#',
    external: Boolean(link.external),
  };
}

export function resolveMenuItems(items, pages) {
  return items.map((item) => {
    if (item.type === 'dropdown') {
      return {
        ...item,
        items: item.items.map((link) => resolveMenuLink(link, pages)),
      };
    }
    return resolveMenuLink(item, pages);
  });
}

export function subscribeSiteMenu(onData, onError) {
  return onSnapshot(
    siteMenuRef,
    (snapshot) => {
      const rawItems = snapshot.exists()
        ? snapshot.data().items
        : DEFAULT_SITE_MENU.items;
      onData(normalizeMenuItems(rawItems));
    },
    onError,
  );
}

export async function ensureDefaultSiteMenu() {
  const snapshot = await getDoc(siteMenuRef);
  if (snapshot.exists()) return;

  await setDoc(siteMenuRef, {
    items: serializeMenuItems(normalizeMenuItems(DEFAULT_SITE_MENU.items)),
    updatedAt: serverTimestamp(),
  });
}

export async function updateSiteMenu(items) {
  const normalized = normalizeMenuItems(items);
  validateMenuItems(normalized);

  await setDoc(
    siteMenuRef,
    {
      items: serializeMenuItems(normalized),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
