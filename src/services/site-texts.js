import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  DEFAULT_SITE_TEXTS,
  SITE_TEXT_FIELD_IDS,
  SITE_TEXTS_DOC_ID,
} from '../data/site-texts';

const siteTextsRef = doc(db, 'siteTexts', SITE_TEXTS_DOC_ID);

export function normalizeSiteTexts(data = {}) {
  return SITE_TEXT_FIELD_IDS.reduce((acc, fieldId) => {
    acc[fieldId] = data[fieldId]?.trim() || DEFAULT_SITE_TEXTS[fieldId];
    return acc;
  }, {});
}

export function subscribeSiteTexts(onData, onError) {
  return onSnapshot(
    siteTextsRef,
    (snapshot) => {
      onData(normalizeSiteTexts(snapshot.exists() ? snapshot.data() : {}));
    },
    onError,
  );
}

export async function updateSiteTexts(texts) {
  const payload = SITE_TEXT_FIELD_IDS.reduce((acc, fieldId) => {
    acc[fieldId] = texts[fieldId].trim();
    return acc;
  }, {});

  await setDoc(
    siteTextsRef,
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
