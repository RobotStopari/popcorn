import {
  formatEventDateLabel,
  formatSchedulePart,
  isEventPast,
  validateDateRange,
} from './event-dates';
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

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function normalizeExternalPageFields(category, raw = {}) {
  const external = normalizeEventCategory(category) === 'external';
  const enabled = external && raw.externalPageEnabled === true;
  const url = enabled ? (raw.externalPageUrl?.trim() || '') : '';

  return {
    externalPageEnabled: enabled,
    externalPageUrl: url,
    hasExternalPage: enabled && isValidHttpsUrl(url),
  };
}

export function normalizeCalendarOnlyFields(category, raw = {}, externalPage = {}) {
  const external = normalizeEventCategory(category) === 'external';
  const calendarOnly = external
    && externalPage.externalPageEnabled === true
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
  if (form.title.trim().length > 200) return false;
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
      email: item.email?.trim() || '',
      phone: item.phone?.trim() || '',
      instagram: item.instagram?.trim() || '',
      facebook: item.facebook?.trim() || '',
    }))
    .filter((item) => item.name || item.email);

  const participants = (raw.participants || [])
    .map((item) => (typeof item === 'string' ? item : item.name)?.trim())
    .filter(Boolean);

  const event = {
    id: raw.id,
    slug: raw.slug?.trim() || deriveEventSlug({ id: raw.id, title: raw.title, slug: '' }),
    title: raw.title?.trim() || '',
    dateStart: raw.dateStart || '',
    timeStart: raw.timeStart || '',
    dateEnd: raw.dateEnd || '',
    timeEnd: raw.timeEnd || '',
    place: raw.place?.trim() || '',
    price: raw.price ?? '',
    description: raw.description || '',
    organisers,
    participants,
    registrationLink: raw.registrationLink?.trim() || '',
    report: raw.report || '',
    galleryLink: raw.galleryLink?.trim() || '',
    coverImage: raw.coverImage?.trim() || '',
    coverPublicId: raw.coverPublicId?.trim() || '',
    promoImages: normalizeEventImageList(raw.promoImages, 10),
    galleryPicks: normalizeEventImageList(raw.galleryPicks, 10),
    category: normalizeEventCategory(raw.category),
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
    cena: formatPrice(event.price),
    registerHref: event.registrationLink,
    galleryDriveHref: event.galleryLink,
    organisersBlock: organisers.length
      ? {
          label: 'Organizátoři',
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
  return { name: '', nick: '', email: '', phone: '', instagram: '', facebook: '' };
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
      price: '',
      description: '',
      organisers: [],
      participants: [],
      registrationLink: '',
      report: '',
      galleryLink: '',
      coverImage: '',
      coverPublicId: '',
      promoImages: [],
      galleryPicks: [],
      category: DEFAULT_EVENT_CATEGORY,
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
    price: event.price === '' || event.price === null ? '' : String(event.price),
    description: event.description || '',
    organisers: event.organisers?.length ? event.organisers : [],
    participants: event.participants?.map(toFormParticipant) || [],
    registrationLink: event.registrationLink || '',
    report: event.report || '',
    galleryLink: event.galleryLink || '',
    coverImage: event.coverImage || '',
    coverPublicId: event.coverPublicId || '',
    promoImages: event.promoImages || [],
    galleryPicks: event.galleryPicks || [],
    category: normalizeEventCategory(event.category),
    externalPageEnabled: event.externalPageEnabled === true,
    externalPageUrl: event.externalPageUrl || '',
    calendarOnly: event.calendarOnly === true,
  };
}

export function formStateToPayload(form) {
  const category = normalizeEventCategory(form.category);
  const external = category === 'external';
  const externalPageEnabled = external && form.externalPageEnabled === true;
  const externalPageUrl = externalPageEnabled ? form.externalPageUrl.trim() : '';
  const calendarOnly = external
    && externalPageEnabled
    && isValidHttpsUrl(externalPageUrl)
    && form.calendarOnly === true;

  return {
    title: form.title.trim(),
    slug: form.slug?.trim() || '',
    dateStart: form.dateStart,
    timeStart: form.timeStart,
    dateEnd: form.dateEnd,
    timeEnd: form.timeEnd,
    place: form.place.trim(),
    price: form.price.trim(),
    description: form.description,
    organisers: form.organisers
      .map((item) => ({
        name: item.name.trim(),
        nick: item.nick.trim(),
        email: item.email.trim(),
        phone: item.phone.trim(),
        instagram: item.instagram.trim(),
        facebook: item.facebook.trim(),
      }))
      .filter((item) => item.name || item.email),
    participants: form.participants
      .map((item) => ({ name: item.name.trim() }))
      .filter((item) => item.name),
    registrationLink: form.registrationLink.trim(),
    report: form.report,
    galleryLink: form.galleryLink.trim(),
    coverImage: form.coverImage?.trim() || '',
    coverPublicId: form.coverPublicId?.trim() || '',
    promoImages: form.promoImages,
    galleryPicks: form.galleryPicks,
    category,
    externalPageEnabled,
    externalPageUrl,
    calendarOnly,
  };
}
