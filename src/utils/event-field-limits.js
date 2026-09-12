export const EVENT_TITLE_MAX = 100;
export const EVENT_DATE_MIN_YEAR = 2015;
export const EVENT_DATE_MAX_YEAR = 2300;
export const EVENT_DATE_MIN = `${EVENT_DATE_MIN_YEAR}-01-01`;
export const EVENT_DATE_MAX = `${EVENT_DATE_MAX_YEAR}-12-31`;
export const EVENT_PRICE_MIN = 1;
export const EVENT_PRICE_MAX = 999999;
export const ORGANISER_NAME_MAX = 50;
export const ORGANISER_NICK_MAX = 50;
export const PARTICIPANT_NAME_MAX = 50;
export const PHONE_MAX_DIGITS = 12;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getIsoDateYear(iso) {
  const match = /^(\d{4})-/.exec(String(iso || '').trim());
  return match ? Number(match[1]) : null;
}

export function isEventDateYearAllowed(iso) {
  if (!String(iso || '').trim()) return true;
  const year = getIsoDateYear(iso);
  return year != null && year >= EVENT_DATE_MIN_YEAR && year <= EVENT_DATE_MAX_YEAR;
}

export function getEventTitleError(value) {
  if (String(value || '').trim().length > EVENT_TITLE_MAX) {
    return `Název může mít maximálně ${EVENT_TITLE_MAX} znaků.`;
  }
  return '';
}

export function getEventDateYearError(value) {
  if (!String(value || '').trim()) return '';
  if (!isEventDateYearAllowed(value)) {
    return `Datum musí být v letech ${EVENT_DATE_MIN_YEAR} až ${EVENT_DATE_MAX_YEAR}.`;
  }
  return '';
}

export function getEventPriceError(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (!/^\d+$/.test(trimmed)) {
    return `Cena musí být celé číslo mezi ${EVENT_PRICE_MIN} a ${EVENT_PRICE_MAX.toLocaleString('cs-CZ')}.`;
  }
  const amount = Number(trimmed);
  if (amount < EVENT_PRICE_MIN || amount > EVENT_PRICE_MAX) {
    return `Cena musí být mezi ${EVENT_PRICE_MIN} a ${EVENT_PRICE_MAX.toLocaleString('cs-CZ')}.`;
  }
  return '';
}

export function getOrganiserNameError(value) {
  if (String(value || '').trim().length > ORGANISER_NAME_MAX) {
    return `Jméno může mít maximálně ${ORGANISER_NAME_MAX} znaků.`;
  }
  return '';
}

export function getOrganiserNickError(value) {
  if (String(value || '').trim().length > ORGANISER_NICK_MAX) {
    return `Přezdívka může mít maximálně ${ORGANISER_NICK_MAX} znaků.`;
  }
  return '';
}

export function getZapalovacYearError(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (!/^\d+$/.test(trimmed)) {
    return 'Ročník Zapalovače musí být číslo.';
  }
  const year = Number(trimmed);
  if (year < EVENT_DATE_MIN_YEAR || year > EVENT_DATE_MAX_YEAR) {
    return `Ročník Zapalovače musí být mezi ${EVENT_DATE_MIN_YEAR} a ${EVENT_DATE_MAX_YEAR}.`;
  }
  return '';
}

export function getOrganiserEmailError(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (!EMAIL_RE.test(trimmed)) {
    return 'Zadejte platný e-mail.';
  }
  return '';
}

export function getOrganiserPhoneError(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (!/^\+?[\d ]+$/.test(trimmed)) {
    return 'Telefon může obsahovat jen čísla, mezery a volitelné + na začátku.';
  }
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) {
    return 'Zadejte telefonní číslo.';
  }
  if (digits.length > PHONE_MAX_DIGITS) {
    return `Telefon může mít nejvýše ${PHONE_MAX_DIGITS} číslic.`;
  }
  return '';
}

export function getOrganiserFacebookError(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    if ((url.protocol === 'https:' || url.protocol === 'http:') && url.hostname) {
      return '';
    }
  } catch {
    /* invalid */
  }
  return 'Zadejte platný odkaz (https://…).';
}

export function getParticipantNameError(value) {
  if (String(value || '').trim().length > PARTICIPANT_NAME_MAX) {
    return `Jméno účastníka může mít maximálně ${PARTICIPANT_NAME_MAX} znaků.`;
  }
  return '';
}

export function getOrganiserFieldError(item) {
  return getOrganiserNameError(item.name)
    || getOrganiserNickError(item.nick)
    || getZapalovacYearError(item.zapalovacYear)
    || getOrganiserEmailError(item.email)
    || getOrganiserPhoneError(item.phone)
    || getOrganiserFacebookError(item.facebook);
}

export function normalizeInstagramHandle(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  const fromUrl = trimmed.match(/instagram\.com\/([^/?#]+)/i)?.[1];
  const handle = (fromUrl || trimmed).replace(/^@+/, '').trim();
  return handle ? `@${handle}` : '';
}

export function normalizeFacebookUrl(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/facebook\.com/i.test(trimmed)) {
    return `https://${trimmed.replace(/^\/+/, '')}`;
  }
  return `https://facebook.com/${trimmed.replace(/^@+/, '')}`;
}
