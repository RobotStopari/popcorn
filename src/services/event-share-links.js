import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { updateEvent } from './events';
import {
  computeShareExpiresAt,
  generateShareId,
  getShareLinkStatus,
  normalizeShareLink,
} from '../utils/event-share-link-format';

const shareLinksRef = collection(db, 'eventShareLinks');

export function subscribeEventShareLinks(eventId, onData, onError) {
  if (!eventId) {
    onData([]);
    return () => {};
  }

  const q = query(shareLinksRef, where('eventId', '==', eventId));

  return onSnapshot(
    q,
    (snapshot) => {
      const links = snapshot.docs
        .map((item) => normalizeShareLink({ id: item.id, ...item.data() }))
        .filter(Boolean)
        .sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
      onData(links);
    },
    onError,
  );
}

export async function fetchShareLink(shareId) {
  const snapshot = await getDoc(doc(db, 'eventShareLinks', shareId));
  if (!snapshot.exists()) return null;
  return normalizeShareLink({ id: snapshot.id, ...snapshot.data() });
}

export async function createEventShareLink({
  eventId,
  createdBy,
  expiryMode,
  durationValue,
  durationUnit,
  expiresAtLocal,
  maxUses,
  label = '',
}) {
  if (!eventId) throw new Error('Chybí akce pro sdílení.');

  const shareId = generateShareId();
  const expiresAtDate = computeShareExpiresAt({
    expiryMode,
    durationValue,
    durationUnit,
    expiresAtLocal,
  });

  const parsedMaxUses = maxUses === '' || maxUses == null
    ? null
    : Number.parseInt(String(maxUses), 10);

  if (parsedMaxUses != null && (!Number.isFinite(parsedMaxUses) || parsedMaxUses <= 0)) {
    throw new Error('Maximální počet použití musí být kladné číslo.');
  }

  await setDoc(doc(db, 'eventShareLinks', shareId), {
    eventId,
    expiresAt: expiresAtDate,
    maxUses: parsedMaxUses,
    openCount: 0,
    active: true,
    label: label.trim(),
    createdAt: serverTimestamp(),
    createdBy: createdBy || '',
  });

  return shareId;
}

export async function revokeEventShareLink(shareId) {
  await updateDoc(doc(db, 'eventShareLinks', shareId), {
    active: false,
  });
}

export async function registerShareLinkOpen(shareId) {
  const linkRef = doc(db, 'eventShareLinks', shareId);
  const snapshot = await getDoc(linkRef);
  if (!snapshot.exists()) {
    throw new Error('Sdílecí odkaz neexistuje.');
  }

  const link = normalizeShareLink({ id: snapshot.id, ...snapshot.data() });
  const status = getShareLinkStatus(link, { forOpen: true });

  if (!status.valid) {
    throw new Error(status.reason);
  }

  try {
    await updateDoc(linkRef, {
      openCount: (link.openCount || 0) + 1,
      lastOpenedAt: serverTimestamp(),
    });
  } catch {
    // Opening must not be blocked when open-count tracking fails.
  }

  return link;
}

export async function updateEventViaShareLink(shareId, eventId, payload) {
  const link = await fetchShareLink(shareId);
  if (!link || link.eventId !== eventId) {
    throw new Error('Sdílecí odkaz neodpovídá této akci.');
  }

  const status = getShareLinkStatus(link);
  if (!status.valid) {
    throw new Error(status.reason);
  }

  await updateEvent(eventId, {
    ...payload,
    _shareEditId: shareId,
  });
}

export async function fetchShareLinksForEvent(eventId) {
  const snapshot = await getDocs(query(shareLinksRef, where('eventId', '==', eventId)));
  return snapshot.docs
    .map((item) => normalizeShareLink({ id: item.id, ...item.data() }))
    .filter(Boolean);
}
