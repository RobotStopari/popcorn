import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_SITE_TEXTS, SITE_TEXTS_DOC_ID } from '../data/site-texts';

const siteTextsRef = doc(db, 'siteTexts', SITE_TEXTS_DOC_ID);

export function normalizeSiteTexts(data = {}) {
  return {
    heroQuote: data.heroQuote?.trim() || DEFAULT_SITE_TEXTS.heroQuote,
    upcomingIntro: data.upcomingIntro?.trim() || DEFAULT_SITE_TEXTS.upcomingIntro,
    pastIntro: data.pastIntro?.trim() || DEFAULT_SITE_TEXTS.pastIntro,
    blogIntro: data.blogIntro?.trim() || DEFAULT_SITE_TEXTS.blogIntro,
  };
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
  await setDoc(
    siteTextsRef,
    {
      heroQuote: texts.heroQuote.trim(),
      upcomingIntro: texts.upcomingIntro.trim(),
      pastIntro: texts.pastIntro.trim(),
      blogIntro: texts.blogIntro.trim(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
