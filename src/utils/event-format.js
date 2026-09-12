import {
  formatEventDateLabel,
  formatSchedulePart,
  isEventPast,
  validateDateRange,
} from './event-dates';
import {
  EVENT_TITLE_MAX,
  ORGANISER_NAME_MAX,
  ORGANISER_NICK_MAX,
  PARTICIPANT_NAME_MAX,
  getEventPriceError,
  getOrganiserEmailError,
  getOrganiserFacebookError,
  getOrganiserPhoneError,
  getZapalovacYearError,
  normalizeFacebookUrl,
  normalizeInstagramHandle,
} from './event-field-limits';
import {
  normalizeEventImageList,
  getUpcomingGalleryImages,
  getPastGalleryImages,
} from '../data/event-images';
import {
  DEFAULT_EVENT_CATEGORY,
  getEventCategoryLabel,
  normalizeEventCategory,
} from '../data/event-categories';
import { deriveEventSlug } from '../data/events';
import { siteText } from './admin-text';
import { buildMapyCzPointUrl, normalizePlaceCoords } from './mapy-cz';

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Stored slug for forms/URLs — ignore empty values and Firestore-id fallbacks. */
export function normalizeEventSlug(raw = {}) {
  const stored = typeof raw.slug === 'string' ? raw.slug.trim() : '';
  if (stored && stored !== raw.id) return stored;
  return deriveEventSlug({ title: raw.title, slug: '' });
}

function hasText(value) {
  return Boolean(stripHtml(value));
}

function formatPrice(price) {
  if (price === null || price === undefined || price === '') return '';
  const numeric = String(price).trim();
  if (!numeric) return '';
  return `${numeric} Kč`;
}

function normalizeSocialUrl(value, type) {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, '');
  if (type === 'instagram') return `https://instagram.com/${handle}`;
  if (type === 'facebook') return `https://facebook.com/${handle}`;
  return trimmed;
}

export function isValidHttpsUrl(value) {
  const trimmed = value?.trim();
  if (!trimmed) return false;

  try {
    const url = new URL(trimmed);
    return (url.protocol === 'https:' || url.protocol === 'http:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function normalizeExternalPageFields(_category, raw = {}) {
  const enabled = raw.externalPageEnabled === true;
  const url = enabled ? (raw.externalPageUrl?.trim() || '') : '';

  return {
    externalPageEnabled: enabled,
    externalPageUrl: url,
    hasExternalPage: enabled && isValidHttpsUrl(url),
  };
}

export function normalizeCalendarOnlyFields(_category, raw = {}, externalPage = {}) {
  const calendarOnly = externalPage.externalPageEnabled === true
    && externalPage.hasExternalPage === true
    && raw.calendarOnly === true;

  return { calendarOnly };
}

export function isEventPublic(event) {
  return event?.published !== false;
}

export function isEventListedPublicly(event) {
  return isEventPublic(event) && !event?.calendarOnly;
}

export function isEventPublishable(form) {
  if (!form.title?.trim()) return false;
  if (form.title.trim().length > EVENT_TITLE_MAX) return false;
  return !validateDateRange(form);
}

export function getAdminEventTitle(event) {
  if (event.title?.trim()) return event.title.trim();
  if (event.isDraft) return 'Prázdný koncept';
  return 'Bez názvu';
}

export function normalizeEvent(raw) {
  const organisers = (raw.organisers || [])
    .map((item) => ({
      name: item.name?.trim() || '',
      nick: item.nick?.trim() || '',
      zapalovacYear: item.zapalovacYear?.trim() || '',
      email: item.email?.trim() || '',
      phone: item.phone?.trim() || '',
      instagram: item.instagram?.trim() || '',
      facebook: item.facebook?.trim() || '',
    }))
    .filter((item) => item.name);

  const participants = (raw.participants || [])
    .map((item) => (typeof item === 'string' ? item : item.name)?.trim())
    .filter(Boolean);

  const placeCoords = normalizePlaceCoords(raw.placeLat, raw.placeLng);

  const event = {
    id: raw.id,
    slug: normalizeEventSlug(raw),
    title: raw.title?.trim() || '',
    dateStart: raw.dateStart || '',
    timeStart: raw.timeStart || '',
    dateEnd: raw.dateEnd || '',
    timeEnd: raw.timeEnd || '',
    place: raw.place?.trim() || '',
    placeLat: placeCoords?.lat ?? null,
    placeLng: placeCoords?.lng ?? null,
    price: raw.price ?? '',
    description: raw.description || '',
    organisers,
    participants,
    registrationLink: raw.registrationLink?.trim() || '',
    report: raw.report || '',
    galleryLink: raw.galleryLink?.trim() || '',
    coverImage: raw.coverImage?.trim() || '',
    coverPublicId: raw.coverPublicId?.trim() || '',
    coverPatternSeed: typeof raw.coverPatternSeed === 'string'
      ? raw.coverPatternSeed.trim().slice(0, 80)
      : '',
    promoImages: normalizeEventImageList(raw.promoImages, 10),
    galleryPicks: normalizeEventImageList(raw.galleryPicks, 10),
    category: normalizeEventCategory(raw.category),
    stampId: typeof raw.stampId === 'string' ? raw.stampId.trim().slice(0, 64) : '',
    ...(function normalizeCategoryFields() {
      const externalPage = normalizeExternalPageFields(raw.category, raw);
      return {
        ...externalPage,
        ...normalizeCalendarOnlyFields(raw.category, raw, externalPage),
      };
    }()),
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  };

  const published = raw.published !== false;
  const isDraft = raw.published === false;
  const past = isEventPast(event);

  return {
    ...event,
    published,
    isDraft,
    name: event.title,
    dateLabel: formatEventDateLabel(event),
    past,
    categoryLabel: getEventCategoryLabel(normalizeEventCategory(raw.category)),
    sraz: formatSchedulePart(event.dateStart, event.timeStart),
    navrat: formatSchedulePart(event.dateEnd, event.timeEnd),
    misto: event.place,
    placeMapUrl: placeCoords ? buildMapyCzPointUrl(placeCoords.lat, placeCoords.lng) : '',
    cena: formatPrice(event.price),
    registerHref: event.registrationLink,
    galleryDriveHref: event.galleryLink,
    organisersBlock: organisers.length
      ? {
          label: siteText('events.detail.organisersTitle'),
          contacts: organisers.map((contact) => ({
            ...contact,
            instagramHref: contact.instagram
              ? normalizeSocialUrl(contact.instagram, 'instagram')
              : '',
            facebookHref: contact.facebook
              ? normalizeSocialUrl(contact.facebook, 'facebook')
              : '',
          })),
        }
      : null,
    hasDescription: hasText(event.description),
    hasReport: hasText(event.report),
    hasPlace: Boolean(event.place),
    hasPlaceMap: Boolean(placeCoords),
    hasPrice: formatPrice(event.price) !== '',
    hasParticipants: participants.length > 0,
    hasRegistration: Boolean(event.registrationLink),
    hasGalleryLink: Boolean(event.galleryLink),
    hasPromoImages: event.promoImages.length > 0,
    hasGalleryPicks: event.galleryPicks.length > 0,
    upcomingGalleryImages: getUpcomingGalleryImages(event),
    pastGalleryImages: getPastGalleryImages(event),
  };
}

export function toCalendarEvent(event) {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    name: event.title,
    start: event.dateStart,
    end: event.dateEnd,
    past: isEventPast(event),
    category: event.category,
    calendarOnly: event.calendarOnly === true,
    externalPageUrl: event.externalPageUrl || '',
  };
}

export function createEmptyOrganiser() {
  return {
    name: '',
    nick: '',
    zapalovacYear: '',
    email: '',
    phone: '',
    instagram: '',
    facebook: '',
  };
}

function createParticipantId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `participant-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyParticipant() {
  return { name: '', clientId: createParticipantId() };
}

function toFormParticipant(item, index) {
  if (typeof item === 'string') {
    return { name: item, clientId: `participant-${index}-${item}` };
  }

  return {
    name: item.name || '',
    clientId: item.clientId || createParticipantId(),
  };
}

export function eventToFormState(event) {
  if (!event) {
    return {
      title: '',
      slug: '',
      dateStart: '',
      timeStart: '',
      dateEnd: '',
      timeEnd: '',
      place: '',
      placeLat: '',
      placeLng: '',
      price: '',
      description: '',
      organisers: [],
      participants: [],
      registrationLink: '',
      report: '',
      galleryLink: '',
      coverImage: '',
      coverPublicId: '',
      coverPatternSeed: '',
      promoImages: [],
      galleryPicks: [],
      category: DEFAULT_EVENT_CATEGORY,
      stampId: '',
      externalPageEnabled: false,
      externalPageUrl: '',
      calendarOnly: false,
    };
  }

  return {
    title: event.title || '',
    slug: event.slug || '',
    dateStart: event.dateStart || '',
    timeStart: event.timeStart || '',
    dateEnd: event.dateEnd || '',
    timeEnd: event.timeEnd || '',
    place: event.place || '',
    placeLat: event.placeLat ?? '',
    placeLng: event.placeLng ?? '',
    price: event.price === '' || event.price === null ? '' : String(event.price),
    description: event.description || '',
    organisers: event.organisers?.length
      ? event.organisers.map((item) => ({
        ...createEmptyOrganiser(),
        ...item,
        zapalovacYear: item.zapalovacYear || '',
        instagram: normalizeInstagramHandle(item.instagram),
        facebook: normalizeFacebookUrl(item.facebook),
      }))
      : [],
    participants: event.participants?.map(toFormParticipant) || [],
    registrationLink: event.registrationLink || '',
    report: event.report || '',
    galleryLink: event.galleryLink || '',
    coverImage: event.coverImage || '',
    coverPublicId: event.coverPublicId || '',
    // Only the explicit override — public falls back to id via resolveCoverPatternSeed.
    coverPatternSeed: event.coverPatternSeed || '',
    promoImages: event.promoImages || [],
    galleryPicks: event.galleryPicks || [],
    category: normalizeEventCategory(event.category),
    stampId: event.stampId || '',
    externalPageEnabled: event.externalPageEnabled === true,
    externalPageUrl: event.externalPageUrl || '',
    calendarOnly: event.calendarOnly === true,
  };
}

export function formStateToPayload(form) {
  const category = normalizeEventCategory(form.category);
  const externalPageEnabled = form.externalPageEnabled === true;
  const externalPageUrl = externalPageEnabled ? form.externalPageUrl.trim() : '';
  const calendarOnly = externalPageEnabled
    && isValidHttpsUrl(externalPageUrl)
    && form.calendarOnly === true;

  const placeCoords = normalizePlaceCoords(form.placeLat, form.placeLng);

  return {
    title: form.title.trim().slice(0, EVENT_TITLE_MAX),
    slug: form.slug?.trim() || '',
    dateStart: form.dateStart,
    timeStart: form.timeStart,
    dateEnd: form.dateEnd,
    timeEnd: form.timeEnd,
    place: form.place.trim(),
    placeLat: placeCoords?.lat ?? null,
    placeLng: placeCoords?.lng ?? null,
    price: getEventPriceError(form.price) ? '' : form.price.trim(),
    description: form.description,
    organisers: form.organisers
      .map((item) => {
        const email = item.email.trim();
        const safeEmail = getOrganiserEmailError(email) ? '' : email;
        const year = item.zapalovacYear?.trim() || '';
        const phone = item.phone.trim();
        const facebook = normalizeFacebookUrl(item.facebook);

        return {
          name: item.name.trim().slice(0, ORGANISER_NAME_MAX),
          nick: item.nick.trim().slice(0, ORGANISER_NICK_MAX),
          zapalovacYear: getZapalovacYearError(year) ? '' : year,
          email: safeEmail,
          phone: getOrganiserPhoneError(phone) ? '' : phone,
          instagram: normalizeInstagramHandle(item.instagram),
          facebook: getOrganiserFacebookError(facebook) ? '' : facebook,
        };
      })
      .filter((item) => item.name),
    participants: form.participants
      .map((item) => ({ name: item.name.trim().slice(0, PARTICIPANT_NAME_MAX) }))
      .filter((item) => item.name),
    registrationLink: form.registrationLink.trim(),
    report: form.report,
    galleryLink: form.galleryLink.trim(),
    coverImage: form.coverImage?.trim() || '',
    coverPublicId: form.coverPublicId?.trim() || '',
    coverPatternSeed: typeof form.coverPatternSeed === 'string'
      ? form.coverPatternSeed.trim().slice(0, 80)
      : '',
    promoImages: form.promoImages,
    galleryPicks: form.galleryPicks,
    category,
    stampId: typeof form.stampId === 'string' ? form.stampId.trim().slice(0, 64) : '',
    externalPageEnabled,
    externalPageUrl,
    calendarOnly,
  };
}
