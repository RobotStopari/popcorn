const PROTOCOL_RE = /^(https?:)\/\//i;
const SPECIAL_SCHEME_RE = /^(mailto:|tel:)/i;

function peelUrlProtocols(value) {
  let rest = String(value ?? '').replace(/^\s+/, '');
  let protocol = 'https:';

  if (rest.startsWith('//')) {
    rest = rest.slice(2);
  }

  while (PROTOCOL_RE.test(rest)) {
    const match = rest.match(PROTOCOL_RE);
    protocol = match[1].toLowerCase();
    rest = rest.slice(match[0].length);
  }

  return { protocol, rest };
}

export function splitUrlInputValue(value, options = {}) {
  const { allowRelative = false, allowSpecialSchemes = false } = options;
  const raw = String(value ?? '');

  if (!raw.trim()) {
    return { prefix: 'https://', rest: '', mode: 'web' };
  }

  const trimmed = raw.trim();

  if (allowSpecialSchemes && SPECIAL_SCHEME_RE.test(trimmed)) {
    return { prefix: '', rest: trimmed, mode: 'special' };
  }

  if (allowRelative && trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return { prefix: '', rest: trimmed, mode: 'relative' };
  }

  const { protocol, rest } = peelUrlProtocols(trimmed);
  return { prefix: `${protocol}//`, rest, mode: 'web' };
}

export function composeUrlInputValue(inputText, options = {}) {
  const { allowRelative = false, allowSpecialSchemes = false } = options;
  const incoming = String(inputText ?? '');

  if (!incoming.trim()) return '';

  const trimmedStart = incoming.replace(/^\s+/, '');

  if (allowSpecialSchemes && SPECIAL_SCHEME_RE.test(trimmedStart)) {
    return trimmedStart.trim();
  }

  if (allowRelative && trimmedStart.startsWith('/') && !trimmedStart.startsWith('//')) {
    return trimmedStart;
  }

  const { protocol, rest } = peelUrlProtocols(incoming);
  if (!rest.trim()) return '';
  return `${protocol}//${rest}`;
}
