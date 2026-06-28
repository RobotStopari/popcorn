export function getActiveBlockTag(editor) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !editor) return '';

  let node = selection.anchorNode;
  if (node?.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editor) {
    const tag = node.tagName;
    if (/^H[1-6]$/.test(tag) || tag === 'P' || tag === 'LI' || tag === 'DIV') {
      if (tag === 'DIV' && node !== editor) {
        node = node.parentElement;
        continue;
      }
      return tag;
    }
    node = node.parentElement;
  }

  return '';
}

export function isHeadingActive(editor) {
  const tag = getActiveBlockTag(editor);
  return /^H[1-6]$/.test(tag);
}

export function toggleHeading(editor) {
  if (isHeadingActive(editor)) {
    document.execCommand('formatBlock', false, 'p');
  } else {
    document.execCommand('formatBlock', false, 'h2');
  }
}

export function getListContext(editor) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !editor) {
    return { inList: false, listType: null, depth: 0 };
  }

  let node = selection.anchorNode;
  if (node?.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  let depth = 0;
  let listType = null;

  while (node && node !== editor) {
    if (node.tagName === 'UL') {
      listType = 'ul';
      depth += 1;
    }
    if (node.tagName === 'OL') {
      listType = 'ol';
      depth += 1;
    }
    node = node.parentElement;
  }

  return {
    inList: Boolean(listType),
    listType,
    depth: Math.max(0, depth - 1),
  };
}

const MAX_LIST_DEPTH = 2;

export function indentList(editor) {
  const { inList, depth } = getListContext(editor);
  if (!inList || depth >= MAX_LIST_DEPTH) return false;
  document.execCommand('indent', false, null);
  return true;
}

export function outdentList(editor) {
  const { inList } = getListContext(editor);
  if (!inList) return false;
  document.execCommand('outdent', false, null);
  return true;
}

export function exitYoutubeMarkerOnEnter(editor) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !editor.contains(selection.anchorNode)) return false;

  let node = selection.anchorNode;
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  const label = node?.closest?.('.rich-text__youtube-marker-label');
  if (!label || !editor.contains(label)) return false;

  const markerParagraph = label.closest('p');
  const afterParagraph = document.createElement('p');
  afterParagraph.innerHTML = '<br>';

  if (markerParagraph?.nextSibling) {
    markerParagraph.parentNode.insertBefore(afterParagraph, markerParagraph.nextSibling);
  } else if (markerParagraph?.parentNode) {
    markerParagraph.parentNode.appendChild(afterParagraph);
  } else {
    editor.appendChild(afterParagraph);
  }

  const range = document.createRange();
  range.selectNodeContents(afterParagraph);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  return true;
}

export function removeAdjacentYoutubeMarker(editor, key) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !editor.contains(selection.anchorNode)) return false;

  const range = selection.getRangeAt(0);
  if (!range.collapsed) return false;

  const marker = findAdjacentYoutubeMarker(range, key);
  if (!marker || !editor.contains(marker)) return false;

  const parent = marker.parentElement;
  marker.remove();

  if (parent && parent.tagName === 'P' && !parent.textContent.trim() && !parent.querySelector('*')) {
    parent.remove();
  }

  return true;
}

function findAdjacentYoutubeMarker(range, key) {
  if (key === 'Backspace') {
    const node = range.startContainer;
    const offset = range.startOffset;

    if (node.nodeType === Node.TEXT_NODE && offset === 0) {
      const prev = findPreviousYoutubeMarker(node);
      if (prev) return prev;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const childBefore = node.childNodes[offset - 1];
      const marker = findYoutubeMarkerInNode(childBefore, 'end');
      if (marker) return marker;
    }
  }

  if (key === 'Delete') {
    const node = range.startContainer;
    const offset = range.startOffset;

    if (node.nodeType === Node.TEXT_NODE && offset === node.textContent.length) {
      const next = findNextYoutubeMarker(node);
      if (next) return next;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const childAfter = node.childNodes[offset];
      const marker = findYoutubeMarkerInNode(childAfter, 'start');
      if (marker) return marker;
    }
  }

  return null;
}

function findYoutubeMarkerInNode(node, edge) {
  if (!node) return null;
  if (node.nodeType === Node.ELEMENT_NODE && node.classList?.contains('rich-text__youtube-marker')) {
    return node;
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    if (edge === 'start') {
      const inner = node.querySelector?.('.rich-text__youtube-marker');
      if (inner) return inner;
    }
    if (node.classList?.contains('rich-text__youtube-marker')) return node;
  }
  return null;
}

function findPreviousYoutubeMarker(node) {
  let current = node;

  while (current) {
    const previous = current.previousSibling;
    if (previous) {
      const marker = walkToYoutubeMarker(previous, 'backward');
      if (marker) return marker;
    }
    current = current.parentElement;
    if (current?.classList?.contains('rich-text__youtube-marker')) return current;
  }

  return null;
}

function findNextYoutubeMarker(node) {
  let current = node;

  while (current) {
    const next = current.nextSibling;
    if (next) {
      const marker = walkToYoutubeMarker(next, 'forward');
      if (marker) return marker;
    }
    current = current.parentElement;
  }

  return null;
}

function walkToYoutubeMarker(node, direction) {
  if (!node) return null;
  if (node.nodeType === Node.ELEMENT_NODE && node.classList?.contains('rich-text__youtube-marker')) {
    return node;
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const nested = node.querySelector?.('.rich-text__youtube-marker');
    if (nested) return nested;
    const sibling = direction === 'backward' ? node.lastChild : node.firstChild;
    return walkToYoutubeMarker(sibling, direction);
  }
  return null;
}
