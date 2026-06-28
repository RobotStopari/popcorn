const UPLOAD_BUSY_ATTR = 'data-upload-busy';

export function setUploadBusy(active) {
  if (typeof document === 'undefined') return;

  if (active) {
    document.body.setAttribute(UPLOAD_BUSY_ATTR, 'true');
    return;
  }

  document.body.removeAttribute(UPLOAD_BUSY_ATTR);
}

export function isUploadBusy() {
  if (typeof document === 'undefined') return false;
  return document.body.getAttribute(UPLOAD_BUSY_ATTR) === 'true';
}
