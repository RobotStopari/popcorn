export function splitPrefixInputValue(value, prefix) {
  const raw = String(value ?? '');
  if (!raw.trim()) {
    return { prefix, rest: '' };
  }

  const trimmed = raw.trim();
  if (trimmed.startsWith(prefix)) {
    return { prefix, rest: trimmed.slice(prefix.length) };
  }

  return { prefix, rest: trimmed };
}

export function composePrefixInputValue(inputText, prefix) {
  let rest = String(inputText ?? '');
  while (prefix && rest.startsWith(prefix)) {
    rest = rest.slice(prefix.length);
  }
  if (!rest.trim()) return '';
  return `${prefix}${rest}`;
}
