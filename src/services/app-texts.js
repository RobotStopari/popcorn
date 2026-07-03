import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { APP_TEXT_FIELDS } from '../data/app-texts-registry';
import { db } from '../firebase';
import { buildDraftFromOverrides, buildOverridesFromDraft } from '../utils/app-text-merge';

export const APP_TEXTS_DOC_ID = 'config';
const appTextsRef = doc(db, 'appTexts', APP_TEXTS_DOC_ID);

const VALID_FIELD_IDS = new Set(APP_TEXT_FIELDS.map((field) => field.id));

function normalizeOverrides(raw = {}) {
  if (!raw || typeof raw !== 'object') return {};

  return Object.entries(raw).reduce((acc, [key, value]) => {
    if (!VALID_FIELD_IDS.has(key)) return acc;
    if (typeof value !== 'string') return acc;
    acc[key] = value;
    return acc;
  }, {});
}

export function normalizeAppTexts(data = {}) {
  const overrides = normalizeOverrides(data.overrides);
  return {
    overrides,
    draft: buildDraftFromOverrides(APP_TEXT_FIELDS, overrides),
  };
}

export function subscribeAppTexts(onData, onError) {
  return onSnapshot(
    appTextsRef,
    (snapshot) => {
      onData(normalizeAppTexts(snapshot.exists() ? snapshot.data() : {}));
    },
    onError,
  );
}

export async function updateAppTexts(draft) {
  const overrides = buildOverridesFromDraft(APP_TEXT_FIELDS, draft);

  // Replace the whole document (no merge) so removed overrides — i.e. fields
  // reset back to their default — are actually deleted instead of lingering.
  await setDoc(
    appTextsRef,
    {
      overrides,
      updatedAt: serverTimestamp(),
    },
  );
}
