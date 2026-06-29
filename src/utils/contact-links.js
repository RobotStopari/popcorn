export function normalizeSocialContactUrl(value, type) {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, '');
  if (type === 'instagram') return `https://instagram.com/${handle}`;
  if (type === 'facebook') return `https://facebook.com/${handle}`;
  return trimmed;
}

export function buildPersonContactLinks(person = {}) {
  return {
    emailHref: person.email ? `mailto:${person.email}` : '',
    phoneHref: person.phone ? `tel:${person.phone.replace(/\s+/g, '')}` : '',
    instagramHref: normalizeSocialContactUrl(person.instagram, 'instagram'),
    facebookHref: normalizeSocialContactUrl(person.facebook, 'facebook'),
  };
}
