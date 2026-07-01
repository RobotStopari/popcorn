import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  COLOR_KEYS,
  DEFAULT_COLORS,
  LEGACY_PALE_COLORS,
  PALE_COLOR_MIGRATION_KEYS,
  SITE_COLORS_DOC_ID,
  normalizeHexColor,
  normalizeSiteColors,
} from '../data/colors';
import { db } from '../firebase';

const siteColorsRef = doc(db, 'siteColors', SITE_COLORS_DOC_ID);

export function getPaleColorsToMigrate(colors = {}) {
  const updates = {};

  for (const key of PALE_COLOR_MIGRATION_KEYS) {
    const current = normalizeHexColor(colors[key] || '');
    const legacy = normalizeHexColor(LEGACY_PALE_COLORS[key]);
    if (current === legacy) {
      updates[key] = DEFAULT_COLORS[key];
    }
  }

  return updates;
}

export async function migrateSiteColorPaleDefaults() {
  const snapshot = await getDoc(siteColorsRef);
  const existing = snapshot.exists() ? snapshot.data()?.colors || {} : {};
  const updates = getPaleColorsToMigrate(existing);
  if (!Object.keys(updates).length) return false;

  const next = { ...existing };
  for (const [key, value] of Object.entries(updates)) {
    next[key] = value;
  }

  await updateSiteColors(next);
  return true;
}

export function serializeSiteColors(colors) {
  const payload = {};

  for (const key of COLOR_KEYS) {
    payload[key] = colors[key]?.trim() || DEFAULT_COLORS[key];
  }

  return payload;
}

export function subscribeSiteColors(onData, onError) {
  return onSnapshot(
    siteColorsRef,
    (snapshot) => {
      onData(normalizeSiteColors(snapshot.exists() ? snapshot.data() : {}));
    },
    onError,
  );
}

export async function updateSiteColors(colors) {
  await setDoc(
    siteColorsRef,
    {
      colors: serializeSiteColors(colors),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
