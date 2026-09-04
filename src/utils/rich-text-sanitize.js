const FONT_MARKUP_RE = /font-family\s*:|^\s*font\s*:|<\/?font\b|\sface\s*=/i;

function hasForeignFontMarkup(html) {
  return FONT_MARKUP_RE.test(html || '');
}

function stripFontDeclarations(styleText) {
  return String(styleText || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const property = part.split(':')[0].trim().toLowerCase();
      // Drop family and the `font` shorthand (often carries a foreign family from Word/Google Docs).
      return property !== 'font-family' && property !== 'font';
    })
    .join('; ');
}

function unwrapFontElements(root) {
  root.querySelectorAll('font').forEach((fontEl) => {
    const parent = fontEl.parentNode;
    if (!parent) return;
    while (fontEl.firstChild) {
      parent.insertBefore(fontEl.firstChild, fontEl);
    }
    parent.removeChild(fontEl);
  });
}

/**
 * Remove pasted/foreign typefaces so rich text always uses the site font.
 * Safe to call in the browser only (uses DOM).
 */
export function stripForeignFonts(html) {
  const input = html || '';
  if (!input || !hasForeignFontMarkup(input)) return input;
  if (typeof document === 'undefined') {
    return input
      .replace(/\s*face\s*=\s*(['"]).*?\1/gi, '')
      .replace(/<\/?font\b[^>]*>/gi, '');
  }

  const template = document.createElement('template');
  template.innerHTML = input;

  template.content.querySelectorAll('*').forEach((el) => {
    if (el.hasAttribute('face')) {
      el.removeAttribute('face');
    }

    if (el.hasAttribute('style')) {
      const cleaned = stripFontDeclarations(el.getAttribute('style'));
      if (cleaned) el.setAttribute('style', cleaned);
      else el.removeAttribute('style');
    }
  });

  unwrapFontElements(template.content);

  return template.innerHTML;
}
