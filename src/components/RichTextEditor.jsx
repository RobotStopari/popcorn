import { useEffect, useRef, useState } from 'react';
import RichTextLinkDialog from './RichTextLinkDialog';

const LINK_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l2.92-2.92a5 5 0 0 0-7.07-7.07l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.54-.54L3.54 13.4a5 5 0 0 0 7.07 7.07l1.2-1.2"/></svg>';

function setLinkTarget(anchor, openInNewTab) {
  if (openInNewTab) {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  } else {
    anchor.removeAttribute('target');
    anchor.removeAttribute('rel');
  }
}

function getLinkContext(editorEl) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !editorEl) {
    return { range: null, link: null, selectedText: '' };
  }

  const range = selection.getRangeAt(0);
  if (!editorEl.contains(range.commonAncestorContainer)) {
    return { range: null, link: null, selectedText: '' };
  }

  let node = range.commonAncestorContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  const link = node?.closest?.('a') || null;

  return {
    range: range.cloneRange(),
    link: link && editorEl.contains(link) ? link : null,
    selectedText: selection.toString(),
  };
}

function restoreSelection(editor, range) {
  const selection = window.getSelection();
  if (!selection || !editor) return null;

  try {
    selection.removeAllRanges();
    selection.addRange(range);
    return range;
  } catch {
    const fallback = document.createRange();
    fallback.selectNodeContents(editor);
    fallback.collapse(false);
    selection.removeAllRanges();
    selection.addRange(fallback);
    return fallback;
  }
}

export default function RichTextEditor({ id, label, value, onChange, maxLength, tone = 'content' }) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const editingLinkRef = useRef(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkDialogState, setLinkDialogState] = useState({
    href: '',
    text: '',
    newTab: true,
    isEdit: false,
  });

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const emitChange = () => {
    onChange(editorRef.current?.innerHTML || '');
  };

  const runCommand = (command, commandValue = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const openLinkDialog = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const { range, link, selectedText } = getLinkContext(editor);
    if (!range) return;

    savedRangeRef.current = range;
    editingLinkRef.current = link;

    setLinkDialogState({
      href: link?.getAttribute('href') || '',
      text: link?.textContent || selectedText,
      newTab: link ? link.target === '_blank' : true,
      isEdit: Boolean(link),
    });
    setLinkDialogOpen(true);
  };

  const closeLinkDialog = () => {
    setLinkDialogOpen(false);
    savedRangeRef.current = null;
    editingLinkRef.current = null;
    editorRef.current?.focus();
  };

  const applyLink = ({ href, text, newTab }) => {
    const editor = editorRef.current;
    let range = savedRangeRef.current;
    const existingLink = editingLinkRef.current;

    if (!editor || !range) {
      closeLinkDialog();
      return;
    }

    try {
      editor.focus();
      range = restoreSelection(editor, range) || range;
      const selection = window.getSelection();

      if (existingLink && editor.contains(existingLink)) {
        existingLink.href = href;
        existingLink.textContent = text;
        setLinkTarget(existingLink, newTab);
      } else {
        if (!range.collapsed) {
          range.deleteContents();
        }

        const anchor = document.createElement('a');
        anchor.href = href;
        anchor.textContent = text;
        setLinkTarget(anchor, newTab);
        range.insertNode(anchor);

        const afterRange = document.createRange();
        afterRange.setStartAfter(anchor);
        afterRange.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(afterRange);
      }

      emitChange();
    } catch {
      // Keep dialog open if insertion fails.
      return;
    }

    closeLinkDialog();
  };

  return (
    <>
      <div className={`rich-text rich-text--${tone}`}>
        {label && (
          <label className="admin-form__label" htmlFor={id}>
            {label}
          </label>
        )}
        <div className="rich-text__toolbar" role="toolbar" aria-label={label ? `Formátování: ${label}` : 'Formátování textu'}>
          <button type="button" className="rich-text__btn rich-text__btn--bold" onClick={() => runCommand('bold')} aria-label="Tučně">
            <strong>B</strong>
          </button>
          <button type="button" className="rich-text__btn rich-text__btn--italic" onClick={() => runCommand('italic')} aria-label="Kurzíva">
            <em>I</em>
          </button>
          <button type="button" className="rich-text__btn rich-text__btn--underline" onClick={() => runCommand('underline')} aria-label="Podtržení">
            <span className="rich-text__underline">U</span>
          </button>
          <button
            type="button"
            className="rich-text__btn rich-text__btn--link"
            onMouseDown={(event) => event.preventDefault()}
            onClick={openLinkDialog}
            aria-label="Odkaz"
          >
            <span className="rich-text__btn-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: LINK_ICON }} />
            Odkaz
          </button>
        </div>
        <div
          id={id}
          ref={editorRef}
          className="rich-text__editor"
          contentEditable
          role="textbox"
          aria-multiline="true"
          onInput={emitChange}
          onBlur={emitChange}
          data-placeholder="Začněte psát…"
          {...(maxLength ? { 'data-max-length': maxLength } : {})}
        />
      </div>

      <RichTextLinkDialog
        open={linkDialogOpen}
        initialHref={linkDialogState.href}
        initialText={linkDialogState.text}
        initialNewTab={linkDialogState.newTab}
        isEdit={linkDialogState.isEdit}
        onClose={closeLinkDialog}
        onApply={applyLink}
      />
    </>
  );
}
