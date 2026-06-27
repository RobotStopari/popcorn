export function organiserFromPreset(preset) {
  return {
    name: preset.name || '',
    nick: preset.nick || '',
    email: preset.email || '',
    phone: preset.phone || '',
    instagram: preset.instagram || '',
    facebook: preset.facebook || '',
  };
}

export function isCompleteOrganiser(item) {
  return Boolean(item?.name?.trim() && item?.email?.trim());
}

export function normalizeOrganiserPreset(raw) {
  return {
    id: raw.id,
    name: raw.name?.trim() || '',
    nick: raw.nick?.trim() || '',
    email: raw.email?.trim() || '',
    phone: raw.phone?.trim() || '',
    instagram: raw.instagram?.trim() || '',
    facebook: raw.facebook?.trim() || '',
  };
}

export function presetDisplayLabel(preset) {
  if (preset.nick) return `${preset.name} (${preset.nick})`;
  return preset.name;
}

export function organiserToPresetPayload(organiser) {
  return {
    name: organiser.name.trim(),
    nick: organiser.nick.trim(),
    email: organiser.email.trim(),
    phone: organiser.phone.trim(),
    instagram: organiser.instagram.trim(),
    facebook: organiser.facebook.trim(),
  };
}
