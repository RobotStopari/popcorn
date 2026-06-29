const PREVIEW_WINDOW_NAME = 'popcorn-live-preview';

function getPreviewWindowFeatures() {
  const availWidth = window.screen.availWidth;
  const availHeight = window.screen.availHeight;
  const width = Math.round(Math.min(1100, Math.max(480, availWidth * 0.48)));
  const height = Math.round(Math.min(900, Math.max(560, availHeight * 0.88)));

  let left = window.screenX + window.outerWidth + 16;
  let top = window.screenY + 24;

  if (left + width > window.screenX + availWidth) {
    left = Math.max(0, window.screenX - width - 16);
  }

  if (left < 0) {
    left = Math.max(0, Math.round((availWidth - width) / 2));
  }

  if (top + height > availHeight) {
    top = Math.max(0, Math.round((availHeight - height) / 2));
  }

  return [
    'popup=yes',
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'menubar=no',
    'toolbar=no',
    'location=yes',
    'status=no',
    'scrollbars=yes',
    'resizable=yes',
  ].join(',');
}

/**
 * Open (or focus) the public page in a separate browser popup window.
 * Returns false when the popup was blocked.
 */
export function openLivePagePreview(path, previewWindowRef) {
  if (typeof window === 'undefined') return false;

  const url = new URL(path, window.location.origin).href;
  let preview = previewWindowRef?.current;

  if (preview && !preview.closed) {
    try {
      if (preview.location.href !== url) {
        preview.location.assign(url);
      }
      preview.focus();
      return true;
    } catch {
      preview = null;
    }
  }

  preview = window.open(url, PREVIEW_WINDOW_NAME, getPreviewWindowFeatures());
  if (!preview) return false;

  if (previewWindowRef) {
    previewWindowRef.current = preview;
  }

  preview.focus();
  return true;
}
