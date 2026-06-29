import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  DEFAULT_PAGES,
  PAGE_TYPES,
  canDeletePage,
  canEditPageSlug,
  canEditPageTitle,
  getSystemFlags,
  isSlugValid,
} from '../data/pages';
import { DEFAULT_SITE_TEXTS } from '../data/site-texts';
import {
  canPageHaveBlocks,
  getDefaultContentBlocks,
  getDefaultHomeBlocks,
  getPageBlockLimit,
  normalizePageBlocks,
} from '../utils/page-blocks';

const pagesRef = collection(db, 'pages');

function stripUndefinedDeep(value) {
  if (Array.isArray(value)) {
    return value.map(stripUndefinedDeep);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefinedDeep(entry)]),
    );
  }

  return value;
}

function normalizePage(raw, fallback = null) {
  const base = fallback || {};
  const id = raw.id || base.id;
  const flags = getSystemFlags(id);

  const defaultPage = DEFAULT_PAGES.find((item) => item.id === id);
  let type = raw.type || base.type || PAGE_TYPES.content;

  if (id === 'blog' && defaultPage) {
    type = defaultPage.type;
  }

  const title = (raw.title || base.title || '').trim();
  const slug = typeof raw.slug === 'string' ? raw.slug : (base.slug ?? '');
  const blocks = normalizePageBlocks(raw.blocks, { maxBlocks: getPageBlockLimit(slug) });

  return {
    id,
    slug,
    title,
    type,
    blocks,
    intro: typeof raw.intro === 'string' ? raw.intro : '',
    noDelete: flags.noDelete || false,
    lockName: flags.lockName || false,
    lockSlug: flags.lockSlug || false,
  };
}

export function mergePages(rawPages) {
  const storedById = new Map(rawPages.map((page) => [page.id, normalizePage(page)]));
  const merged = DEFAULT_PAGES.map((def) => normalizePage(storedById.get(def.id) || {}, def));
  const defaultIds = new Set(DEFAULT_PAGES.map((page) => page.id));

  rawPages.forEach((page) => {
    if (!defaultIds.has(page.id)) {
      merged.push(normalizePage(page));
    }
  });

  return merged.sort((a, b) => {
    if (a.type === PAGE_TYPES.home) return -1;
    if (b.type === PAGE_TYPES.home) return 1;
    return a.title.localeCompare(b.title, 'cs');
  });
}

/** Apply a saved page patch to the in-memory list (keeps public site in sync before Firestore snapshot). */
export function applyLocalPagePatch(pages, pageId, patch = {}) {
  const next = pages.map((page) => {
    if (page.id !== pageId) return page;

    return normalizePage({
      id: pageId,
      type: page.type,
      slug: patch.slug !== undefined ? patch.slug : page.slug,
      title: patch.title !== undefined ? patch.title : page.title,
      blocks: patch.blocks !== undefined ? patch.blocks : page.blocks,
      intro: patch.intro !== undefined ? patch.intro : page.intro,
    });
  });

  return next.sort((a, b) => {
    if (a.type === PAGE_TYPES.home) return -1;
    if (b.type === PAGE_TYPES.home) return 1;
    return a.title.localeCompare(b.title, 'cs');
  });
}

export function subscribePages(onData, onError) {
  return onSnapshot(
    pagesRef,
    (snapshot) => {
      onData(mergePages(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))));
    },
    onError,
  );
}

async function ensurePageBlocks(pageId, data) {
  if (!canPageHaveBlocks({ type: data.type })) return;

  if (Array.isArray(data.blocks) && data.blocks.length > 0) return;

  const blocks = pageId === 'home'
    ? getDefaultHomeBlocks(DEFAULT_SITE_TEXTS.heroQuote)
    : getDefaultContentBlocks(data.title || '');

  await updateDoc(doc(pagesRef, pageId), {
    blocks,
    updatedAt: serverTimestamp(),
  });
}

export async function ensureDefaultPages() {
  const snapshot = await getDocs(pagesRef);
  const existingIds = new Set(snapshot.docs.map((item) => item.id));
  const batch = writeBatch(db);
  let pending = 0;

  DEFAULT_PAGES.forEach((page) => {
    if (existingIds.has(page.id)) return;

    const payload = {
      slug: page.slug,
      title: page.title,
      type: page.type,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (canPageHaveBlocks(page)) {
      payload.blocks = page.id === 'home'
        ? getDefaultHomeBlocks(DEFAULT_SITE_TEXTS.heroQuote)
        : getDefaultContentBlocks(page.title);
    }

    batch.set(doc(pagesRef, page.id), payload);
    pending += 1;
  });

  if (pending > 0) {
    await batch.commit();
  }

  await Promise.all(
    snapshot.docs.map(async (item) => {
      const data = item.data();
      try {
        await ensurePageBlocks(item.id, data);
      } catch {
        // Ignore migration errors during read-only checks.
      }
    }),
  );
}

function assertUniqueSlug(pages, slug, excludeId = null) {
  const duplicate = pages.find((page) => page.slug === slug && page.id !== excludeId);
  if (duplicate) {
    throw new Error('URL už používá jiná stránka.');
  }
}

export async function createPage(pages, { title, slug }) {
  const trimmedTitle = title.trim();
  const trimmedSlug = slug.trim();

  if (!trimmedTitle) {
    throw new Error('Vyplňte název stránky.');
  }

  if (!isSlugValid(trimmedSlug)) {
    throw new Error('URL smí obsahovat jen malá písmena, čísla a pomlčky.');
  }

  assertUniqueSlug(pages, trimmedSlug);

  const docRef = await addDoc(pagesRef, {
    slug: trimmedSlug,
    title: trimmedTitle,
    type: PAGE_TYPES.content,
    blocks: getDefaultContentBlocks(trimmedTitle),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updatePage(pages, page, { title, slug, blocks, intro }) {
  if (!canEditPageTitle(page) && title.trim() !== page.title) {
    throw new Error('Název hlavní stránky nelze měnit.');
  }

  if (!canEditPageSlug(page) && slug.trim() !== page.slug) {
    throw new Error('URL hlavní stránky nelze měnit.');
  }

  const trimmedTitle = title.trim();
  const trimmedSlug = slug.trim();

  if (!trimmedTitle) {
    throw new Error('Vyplňte název stránky.');
  }

  if (!isSlugValid(trimmedSlug, { allowEmpty: page.type === PAGE_TYPES.home })) {
    throw new Error('URL smí obsahovat jen malá písmena, čísla a pomlčky.');
  }

  if (page.type === PAGE_TYPES.home && trimmedSlug !== '') {
    throw new Error('Hlavní stránka musí mít prázdnou URL.');
  }

  if (page.type !== PAGE_TYPES.home && !trimmedSlug) {
    throw new Error('Vyplňte URL stránky.');
  }

  assertUniqueSlug(pages, trimmedSlug, page.id);

  const payload = {
    title: trimmedTitle,
    slug: trimmedSlug,
    updatedAt: serverTimestamp(),
  };

  if (blocks !== undefined && canPageHaveBlocks(page)) {
    payload.blocks = stripUndefinedDeep(
      normalizePageBlocks(blocks, { maxBlocks: getPageBlockLimit(trimmedSlug) }),
    );
  }

  if (intro !== undefined) {
    payload.intro = typeof intro === 'string' ? intro.trim() : '';
  }

  await updateDoc(doc(db, 'pages', page.id), payload);
}

export async function fetchPageById(pageId) {
  const snapshot = await getDoc(doc(pagesRef, pageId));
  if (!snapshot.exists()) return null;
  return normalizePage({ id: snapshot.id, ...snapshot.data() });
}

export async function deletePage(page) {
  if (!canDeletePage(page)) {
    throw new Error('Tuto stránku nelze smazat.');
  }

  await deleteDoc(doc(db, 'pages', page.id));
}
