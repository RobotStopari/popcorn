function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function parseYoutubeVideoId(value) {
  const trimmed = value?.trim();
  if (!trimmed) return '';

  try {
    const url = trimmed.startsWith('http') ? new URL(trimmed) : new URL(`https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      return url.pathname.slice(1).split('/')[0] || '';
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (url.pathname === '/watch') {
        return url.searchParams.get('v') || '';
      }

      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') {
        return parts[1] || '';
      }
    }
  } catch {
    return '';
  }

  return '';
}

function sanitizeYoutubeId(videoId) {
  return videoId.replace(/[^a-zA-Z0-9_-]/g, '');
}

const DEFAULT_YOUTUBE_LABEL = 'YouTube video';

export function buildYoutubePlaceholderHtml(videoId, title = DEFAULT_YOUTUBE_LABEL) {
  const safeId = sanitizeYoutubeId(videoId);
  const safeTitle = escapeHtml(title.trim() || DEFAULT_YOUTUBE_LABEL);

  return (
    '<p><span class="rich-text__youtube-marker" contenteditable="false" '
    + `data-youtube-id="${safeId}">`
    + '<span class="rich-text__youtube-marker-icon" aria-hidden="true">▶</span>'
    + `<span class="rich-text__youtube-marker-label" contenteditable="true">${safeTitle}</span>`
    + '</span></p><p><br></p>'
  );
}

export function buildYoutubeEmbedHtml(videoId, title = DEFAULT_YOUTUBE_LABEL) {
  const safeId = sanitizeYoutubeId(videoId);
  const safeTitle = escapeHtml(title.trim() || DEFAULT_YOUTUBE_LABEL);

  return (
    `<div class="rich-text__youtube" data-youtube-id="${safeId}">`
    + '<div class="rich-text__youtube-frame">'
    + `<iframe src="https://www.youtube-nocookie.com/embed/${safeId}" `
    + `title="${safeTitle}" loading="lazy" `
    + 'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" '
    + 'allowfullscreen></iframe>'
    + '</div></div>'
  );
}

export function buildDividerEditorHtml() {
  return (
    '<div class="rich-text__divider rich-text__divider--editor" contenteditable="false" aria-hidden="true">'
    + '<hr class="rich-text__divider-line">'
    + '</div><p><br></p>'
  );
}

export function buildDividerDisplayHtml() {
  return (
    '<div class="rich-text__divider flow-connector" aria-hidden="true">'
    + '<span class="flow-connector__line flow-connector__line--orange"></span>'
    + '<span class="flow-connector__dot"></span>'
    + '<span class="flow-connector__line flow-connector__line--red"></span>'
    + '</div>'
  );
}

/** @deprecated use buildDividerEditorHtml */
export function buildDividerHtml() {
  return buildDividerEditorHtml();
}

function getYoutubeMarkerTitle(marker) {
  const label = marker.querySelector('.rich-text__youtube-marker-label');
  const text = label?.textContent?.trim() || marker.textContent?.replace(/^▶\s*/, '').trim();
  return text || DEFAULT_YOUTUBE_LABEL;
}

function transformYoutubeMarkers(root) {
  root.querySelectorAll('.rich-text__youtube-marker').forEach((marker) => {
    const videoId = marker.getAttribute('data-youtube-id') || '';
    const title = getYoutubeMarkerTitle(marker);
    const embed = document.createElement('template');
    embed.innerHTML = buildYoutubeEmbedHtml(videoId, title);
    marker.closest('p')?.replaceWith(embed.content.firstChild);
  });

  root.querySelectorAll('.rich-text__youtube[data-youtube-id]').forEach((block) => {
    if (block.querySelector('iframe')) return;
    const videoId = block.getAttribute('data-youtube-id') || '';
    block.outerHTML = buildYoutubeEmbedHtml(videoId);
  });
}

function transformEditorDividers(root) {
  root.querySelectorAll('.rich-text__divider--editor').forEach((divider) => {
    const display = document.createElement('template');
    display.innerHTML = buildDividerDisplayHtml();
    divider.replaceWith(display.content.firstChild);
  });
}

export function transformRichTextForDisplay(html) {
  if (!html) return '';

  if (typeof document === 'undefined') {
    return html;
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  transformYoutubeMarkers(wrapper);
  transformEditorDividers(wrapper);
  return wrapper.innerHTML;
}

const PREVIEW_EMBED_SELECTOR = [
  '.rich-text__youtube-marker',
  '.rich-text__youtube',
  '.rich-text__divider',
].join(', ');

export function stripRichTextEmbedsForPreview(html) {
  if (!html) return '';

  if (typeof document !== 'undefined') {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    wrapper.querySelectorAll(PREVIEW_EMBED_SELECTOR).forEach((el) => el.remove());
    return wrapper.innerHTML;
  }

  return html
    .replace(/<span[^>]*class="[^"]*rich-text__youtube-marker[^"]*"[^>]*>[\s\S]*?<\/span>/gi, ' ')
    .replace(/<div[^>]*class="[^"]*rich-text__youtube[^"]*"[^>]*>[\s\S]*?<\/div>/gi, ' ')
    .replace(/<div[^>]*class="[^"]*rich-text__divider[^"]*"[^>]*>[\s\S]*?<\/div>/gi, ' ');
}
