import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  DEFAULT_SITE_SETTINGS,
  EVENT_CATEGORY_FIELDS,
  SITE_SETTINGS_DOC_ID,
  normalizeBrandLinks,
  normalizeFooterSocialSlots,
} from '../data/site-settings';
import { db } from '../firebase';

const siteSettingsRef = doc(db, 'siteSettings', SITE_SETTINGS_DOC_ID);

const EVENT_CATEGORY_FIELD_IDS = EVENT_CATEGORY_FIELDS.map((field) => field.id);

function normalizeBoolean(value, defaultValue) {
  if (typeof value === 'boolean') return value;
  return defaultValue;
}

export function normalizeSiteSettings(data = {}) {
  return {
    logoUrl: typeof data.logoUrl === 'string' && data.logoUrl ? data.logoUrl : DEFAULT_SITE_SETTINGS.logoUrl,
    logoPublicId: typeof data.logoPublicId === 'string' ? data.logoPublicId : '',
    logoAlt: typeof data.logoAlt === 'string' && data.logoAlt ? data.logoAlt : DEFAULT_SITE_SETTINGS.logoAlt,
    brandLine1: typeof data.brandLine1 === 'string' && data.brandLine1.trim()
      ? data.brandLine1.trim()
      : DEFAULT_SITE_SETTINGS.brandLine1,
    brandLine2: typeof data.brandLine2 === 'string' && data.brandLine2.trim()
      ? data.brandLine2.trim()
      : DEFAULT_SITE_SETTINGS.brandLine2,
    footerYear: typeof data.footerYear === 'string' ? data.footerYear : DEFAULT_SITE_SETTINGS.footerYear,
    footerContactLabel: typeof data.footerContactLabel === 'string'
      ? data.footerContactLabel
      : DEFAULT_SITE_SETTINGS.footerContactLabel,
    footerContactEmail: typeof data.footerContactEmail === 'string'
      ? data.footerContactEmail
      : DEFAULT_SITE_SETTINGS.footerContactEmail,
    brandLinks: normalizeBrandLinks(data.brandLinks),
    footerSocialSlots: normalizeFooterSocialSlots(data.footerSocialSlots),
    comingSoonEnabled: normalizeBoolean(data.comingSoonEnabled, DEFAULT_SITE_SETTINGS.comingSoonEnabled),
    anonymousBlogLikesEnabled: normalizeBoolean(
      data.anonymousBlogLikesEnabled,
      DEFAULT_SITE_SETTINGS.anonymousBlogLikesEnabled,
    ),
    membersCanCreateBlogPosts: normalizeBoolean(
      data.membersCanCreateBlogPosts,
      DEFAULT_SITE_SETTINGS.membersCanCreateBlogPosts,
    ),
    ...EVENT_CATEGORY_FIELD_IDS.reduce((acc, fieldId) => {
      acc[fieldId] = typeof data[fieldId] === 'string' && data[fieldId].trim()
        ? data[fieldId].trim()
        : DEFAULT_SITE_SETTINGS[fieldId];
      return acc;
    }, {}),
  };
}

export function serializeSiteSettings(settings) {
  const normalized = normalizeSiteSettings(settings);
  return {
    logoUrl: normalized.logoUrl,
    logoPublicId: normalized.logoPublicId,
    logoAlt: normalized.logoAlt,
    brandLine1: normalized.brandLine1,
    brandLine2: normalized.brandLine2,
    footerYear: normalized.footerYear,
    footerContactLabel: normalized.footerContactLabel,
    footerContactEmail: normalized.footerContactEmail,
    brandLinks: normalized.brandLinks,
    footerSocialSlots: normalized.footerSocialSlots,
    comingSoonEnabled: normalized.comingSoonEnabled,
    anonymousBlogLikesEnabled: normalized.anonymousBlogLikesEnabled,
    membersCanCreateBlogPosts: normalized.membersCanCreateBlogPosts,
    ...EVENT_CATEGORY_FIELD_IDS.reduce((acc, fieldId) => {
      acc[fieldId] = normalized[fieldId];
      return acc;
    }, {}),
  };
}

export function subscribeSiteSettings(onData, onError) {
  return onSnapshot(
    siteSettingsRef,
    (snapshot) => {
      onData(normalizeSiteSettings(snapshot.exists() ? snapshot.data() : {}));
    },
    onError,
  );
}

export async function updateSiteSettings(settings) {
  await setDoc(
    siteSettingsRef,
    {
      ...serializeSiteSettings(settings),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function updateEventCategorySettings(patch) {
  const payload = EVENT_CATEGORY_FIELD_IDS.reduce((acc, fieldId) => {
    if (typeof patch[fieldId] === 'string') {
      acc[fieldId] = patch[fieldId].trim();
    }
    return acc;
  }, {});

  if (!Object.keys(payload).length) return;

  await setDoc(
    siteSettingsRef,
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
