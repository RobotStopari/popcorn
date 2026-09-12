export const COLOR_BOLD_COLORS = ['black', 'yellow', 'red', 'blue'];

export const COLOR_BOLD_CLASS = 'rich-text-color';

const COLOR_LABELS = {
  black: 'černá',
  yellow: 'žlutá',
  red: 'červená',
  blue: 'modrá',
};

export function getColorBoldLabel(color) {
  return `Tučně — ${COLOR_LABELS[color] || color}`;
}

export function isColorBoldColor(color) {
  return COLOR_BOLD_COLORS.includes(color);
}

function isBoldMark(node) {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
  const tag = node.tagName;
  return tag === 'STRONG' || tag === 'B';
}

function getMarkColor(el) {
  if (!isBoldMark(el)) return null;
  if (!el.classList.contains(COLOR_BOLD_CLASS)) return 'black';
  const found = COLOR_BOLD_COLORS.find((color) => (
    el.classList.contains(`${COLOR_BOLD_CLASS}--${color}`)
  ));
  return found || 'black';
}

function findBoldMark(node, editor) {
  let el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  while (el && el !== editor) {
    if (isBoldMark(el)) return el;
    el = el.parentElement;
  }
  return null;
}

function unwrapElement(el) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) {
    parent.insertBefore(el.firstChild, el);
  }
  parent.removeChild(el);
  parent.normalize?.();
}

function unwrapBoldMarks(root) {
  if (!root) return;

  const marks = [];
  if (root.nodeType === Node.ELEMENT_NODE && isBoldMark(root)) {
    marks.push(root);
  }

  root.querySelectorAll?.('strong, b').forEach((el) => {
    if (isBoldMark(el)) marks.push(el);
  });

  marks.reverse().forEach((el) => {
    if (el.parentNode) unwrapElement(el);
  });
}

function createColorBold(color) {
  const strong = document.createElement('strong');
  strong.className = `${COLOR_BOLD_CLASS} ${COLOR_BOLD_CLASS}--${color}`;
  return strong;
}

function placeCaretInside(node) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function collectTextNodes(node, range, out) {
  if (!node) return;

  if (node.nodeType === Node.TEXT_NODE) {
    if (node.textContent && range.intersectsNode(node)) {
      out.push(node);
    }
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;
  if (node.classList.contains('rich-text__youtube-marker')) return;
  if (node.classList.contains('rich-text__divider')) return;

  node.childNodes.forEach((child) => collectTextNodes(child, range, out));
}

function selectionIsColor(range, color, editor) {
  const nodes = [];
  collectTextNodes(range.commonAncestorContainer, range, nodes);
  if (!nodes.length) return false;
  return nodes.every((node) => {
    const mark = findBoldMark(node, editor);
    return mark && getMarkColor(mark) === color;
  });
}

function wrapElementContents(parent, color) {
  if (!parent.hasChildNodes()) return;
  const strong = createColorBold(color);
  while (parent.firstChild) {
    strong.appendChild(parent.firstChild);
  }
  parent.appendChild(strong);
}

function wrapFragmentInlines(fragment, color) {
  const blocks = fragment.querySelectorAll?.('p, li, h1, h2, h3, h4, h5, h6, div');
  if (blocks?.length) {
    blocks.forEach((block) => wrapElementContents(block, color));
    return;
  }
  wrapElementContents(fragment, color);
}

function applyCollapsed(editor, range, color) {
  const existing = findBoldMark(range.startContainer, editor);

  if (existing && getMarkColor(existing) === color) {
    unwrapElement(existing);
    return;
  }

  if (existing) {
    existing.className = `${COLOR_BOLD_CLASS} ${COLOR_BOLD_CLASS}--${color}`;
    return;
  }

  const strong = createColorBold(color);
  strong.appendChild(document.createTextNode('\u200B'));
  range.insertNode(strong);
  placeCaretInside(strong);
}

export function getActiveColorBold(editor) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !editor) return null;

  const node = selection.anchorNode;
  if (!node || !editor.contains(node)) return null;

  const mark = findBoldMark(node, editor);
  return mark ? getMarkColor(mark) : null;
}

export function applyColorBold(editor, color) {
  if (!editor || !isColorBoldColor(color)) return;

  editor.focus();
  const selection = window.getSelection();
  if (!selection?.rangeCount || !editor.contains(selection.anchorNode)) return;

  const range = selection.getRangeAt(0);

  if (range.collapsed) {
    applyCollapsed(editor, range, color);
    return;
  }

  const togglingOff = selectionIsColor(range, color, editor);
  const contents = range.extractContents();
  unwrapBoldMarks(contents);

  if (!togglingOff) {
    wrapFragmentInlines(contents, color);
  }

  const first = contents.firstChild;
  const last = contents.lastChild;
  range.insertNode(contents);
  editor.normalize();

  if (first && last) {
    const next = document.createRange();
    try {
      next.setStartBefore(first);
      next.setEndAfter(last);
      selection.removeAllRanges();
      selection.addRange(next);
    } catch {
      // Inserted nodes may have been merged by normalize().
    }
  }
}
