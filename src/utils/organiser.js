import {
  ORGANISER_NAME_MAX,
  ORGANISER_NICK_MAX,
  getOrganiserEmailError,
  getOrganiserFacebookError,
  getOrganiserPhoneError,
  getZapalovacYearError,
  normalizeFacebookUrl,
  normalizeInstagramHandle,
} from './event-field-limits';

export function organiserFromPreset(preset) {
  return {
    name: preset.name || '',
    nick: preset.nick || '',
    zapalovacYear: preset.zapalovacYear || '',
    email: preset.email || '',
    phone: preset.phone || '',
    instagram: normalizeInstagramHandle(preset.instagram),
    facebook: normalizeFacebookUrl(preset.facebook),
  };
}

export function isCompleteOrganiser(item) {
  return Boolean(item?.name?.trim());
}

export function normalizeOrganiserPreset(raw) {
  return {
    id: raw.id,
    name: raw.name?.trim() || '',
    nick: raw.nick?.trim() || '',
    zapalovacYear: raw.zapalovacYear?.trim() || '',
    email: raw.email?.trim() || '',
    phone: raw.phone?.trim() || '',
    instagram: normalizeInstagramHandle(raw.instagram),
    facebook: normalizeFacebookUrl(raw.facebook),
  };
}

/** e.g. "Jakub Procházka (Robot) – 2022" */
export function formatOrganiserDisplayName(person) {
  const name = person?.name?.trim() || '';
  if (!name) return '';

  const nick = person?.nick?.trim();
  const year = person?.zapalovacYear?.trim();
  let label = nick ? `${name} (${nick})` : name;
  if (year) label = `${label} – ${year}`;
  return label;
}

export function presetDisplayLabel(preset) {
  return formatOrganiserDisplayName(preset) || preset?.name || '';
}

export function organiserToPresetPayload(organiser) {
  const email = organiser.email.trim();
  const year = organiser.zapalovacYear?.trim() || '';
  const phone = organiser.phone.trim();
  const facebook = normalizeFacebookUrl(organiser.facebook);

  return {
    name: organiser.name.trim().slice(0, ORGANISER_NAME_MAX),
    nick: organiser.nick.trim().slice(0, ORGANISER_NICK_MAX),
    zapalovacYear: getZapalovacYearError(year) ? '' : year,
    email: getOrganiserEmailError(email) ? '' : email,
    phone: getOrganiserPhoneError(phone) ? '' : phone,
    instagram: normalizeInstagramHandle(organiser.instagram),
    facebook: getOrganiserFacebookError(facebook) ? '' : facebook,
  };
}
