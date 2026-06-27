function revealFrame(frame) {
  requestAnimationFrame(() => {
    frame.classList.add('is-loaded');
  });
}

export function bindFrameImage(img) {
  const frame = img.closest('.img-frame');
  if (!frame) return;

  frame.classList.remove('is-loaded');

  const reveal = () => revealFrame(frame);
  img.onload = reveal;
  img.onerror = reveal;

  if (img.complete && img.naturalWidth > 0) {
    reveal();
  }
}

export function initImageFrames(root = document) {
  root.querySelectorAll('.img-frame > img').forEach(bindFrameImage);
}
