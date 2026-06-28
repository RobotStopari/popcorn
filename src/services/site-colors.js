import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  COLOR_KEYS,
  DEFAULT_COLORS,
  SITE_COLORS_DOC_ID,
  normalizeSiteColors,
} from '../data/colors';
import { db } from '../firebase';

const siteColorsRef = doc(db, 'siteColors', SITE_COLORS_DOC_ID);

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
