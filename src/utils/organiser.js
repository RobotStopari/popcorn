export function organiserFromPreset(preset) {
  return {
    name: preset.name || '',
    nick: preset.nick || '',
    zapalovacYear: preset.zapalovacYear || '',
    email: preset.email || '',
    phone: preset.phone || '',
    instagram: preset.instagram || '',
    facebook: preset.facebook || '',
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
    instagram: raw.instagram?.trim() || '',
    facebook: raw.facebook?.trim() || '',
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
  const at = email.lastIndexOf('@');
  const safeEmail = at > 0 && at < email.length - 1 ? email : '';

  return {
    name: organiser.name.trim(),
    nick: organiser.nick.trim(),
    zapalovacYear: organiser.zapalovacYear?.trim() || '',
    email: safeEmail,
    phone: organiser.phone.trim(),
    instagram: organiser.instagram.trim(),
    facebook: organiser.facebook.trim(),
  };
}
