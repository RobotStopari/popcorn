import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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

const pagesRef = collection(db, 'pages');

function normalizePage(raw, fallback = null) {
  const base = fallback || {};
  const id = raw.id || base.id;
  const flags = getSystemFlags(id);

  const defaultPage = DEFAULT_PAGES.find((item) => item.id === id);
  let type = raw.type || base.type || PAGE_TYPES.content;

  if (id === 'blog' && defaultPage) {
    type = defaultPage.type;
  }

  return {
    id,
    slug: typeof raw.slug === 'string' ? raw.slug : (base.slug ?? ''),
    title: (raw.title || base.title || '').trim(),
    type,
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

export function subscribePages(onData, onError) {
  return onSnapshot(
    pagesRef,
    (snapshot) => {
      onData(mergePages(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))));
    },
    onError,
  );
}

export async function ensureDefaultPages() {
  const snapshot = await getDocs(pagesRef);
  const existingIds = new Set(snapshot.docs.map((item) => item.id));
  const batch = writeBatch(db);
  let pending = 0;

  DEFAULT_PAGES.forEach((page) => {
    if (existingIds.has(page.id)) return;

    batch.set(doc(pagesRef, page.id), {
      slug: page.slug,
      title: page.title,
      type: page.type,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    pending += 1;
  });

  if (pending > 0) {
    await batch.commit();
  }
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updatePage(pages, page, { title, slug }) {
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

  await updateDoc(doc(db, 'pages', page.id), {
    title: trimmedTitle,
    slug: trimmedSlug,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePage(page) {
  if (!canDeletePage(page)) {
    throw new Error('Tuto stránku nelze smazat.');
  }

  await deleteDoc(doc(db, 'pages', page.id));
}
