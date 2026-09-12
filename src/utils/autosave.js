export function nextDraftFlag(existing, { close = false } = {}) {
  if (close) return false;
  if (!existing?.id) return true;
  return existing.draft === true;
}

export function snapshotsEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function isImmediateAutosaveControl(target) {
  if (!target || target.disabled) return false;
  const tag = target.tagName;
  if (tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    return ['checkbox', 'radio', 'file', 'range', 'color'].includes(target.type);
  }
  return false;
}

export function getAutosaveFormHandlers(persist) {
  return {
    onBlur: (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target instanceof HTMLInputElement && target.type === 'search') return;
      if (!target.closest('input, textarea, select, [contenteditable="true"]')) return;
      persist();
    },
    onChange: (event) => {
      if (event.target?.dataset?.noAutosave === 'true') return;
      if (isImmediateAutosaveControl(event.target)) persist();
    },
    onClick: (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest('button, [role="switch"]');
      if (!control || control.disabled) return;
      if (control.getAttribute('type') === 'submit') return;
      if (control.dataset.noAutosave === 'true') return;
      window.setTimeout(() => persist(), 0);
    },
  };
}
