import { useEffect, useMemo, useRef, useState } from 'react';
import {
  exitYoutubeMarkerOnEnter,
  indentList,
  outdentList,
  removeAdjacentYoutubeMarker,
  toggleHeading,
} from '../utils/rich-text-editor-commands';
import { buildDividerEditorHtml, buildYoutubePlaceholderHtml } from '../utils/rich-text-embeds';
import { resolveRichTextFeatures } from '../utils/rich-text-features';
import RichTextLinkDialog from './RichTextLinkDialog';
import RichTextYoutubeDialog from './RichTextYoutubeDialog';

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

function captureEditorRange(editor) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !editor?.contains(selection.anchorNode)) {
    return null;
  }
  return selection.getRangeAt(0).cloneRange();
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

function getActiveRange(editor) {
  const selection = window.getSelection();
  if (selection?.rangeCount && editor.contains(selection.anchorNode)) {
    return selection.getRangeAt(0);
  }

  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  return range;
}

function insertHtmlAtRange(editor, range, html) {
  const selection = window.getSelection();
  const activeRange = restoreSelection(editor, range.cloneRange()) || range.cloneRange();

  if (activeRange.collapsed) {
    let node = activeRange.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    const block = node?.closest?.('p, h1, h2, h3, h4, h5, h6, li');
    if (block && block !== editor && editor.contains(block)) {
      const afterBlock = document.createRange();
      afterBlock.setStartAfter(block);
      afterBlock.collapse(true);
      activeRange.setStart(afterBlock.startContainer, afterBlock.startOffset);
      activeRange.collapse(true);
    }
  }

  const template = document.createElement('template');
  template.innerHTML = html.trim();
  const fragment = template.content;

  activeRange.deleteContents();
  activeRange.insertNode(fragment);

  const lastNode = fragment.lastChild || editor.lastChild;
  const afterRange = document.createRange();

  if (lastNode) {
    afterRange.setStartAfter(lastNode);
  } else {
    afterRange.selectNodeContents(editor);
    afterRange.collapse(false);
  }

  afterRange.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(afterRange);
}

function preserveToolbarSelection(event) {
  event.preventDefault();
}

function ToolbarSeparator() {
  return <span className="rich-text__sep" aria-hidden="true" />;
}

export default function RichTextEditor({
  id,
  label,
  value,
  onChange,
  maxLength,
  tone = 'content',
  features = 'full',
}) {
  const enabled = useMemo(() => resolveRichTextFeatures(features), [features]);
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const insertRangeRef = useRef(null);
  const lastRangeRef = useRef(null);
  const editingLinkRef = useRef(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
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

  const rememberInsertRange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const range = captureEditorRange(editor) || lastRangeRef.current;
    if (range) {
      insertRangeRef.current = range.cloneRange();
    }
  };

  const insertBlockHtml = (html) => {
    const editor = editorRef.current;
    if (!editor) return;

    const range = insertRangeRef.current?.cloneRange()
      || captureEditorRange(editor)
      || lastRangeRef.current?.cloneRange()
      || getActiveRange(editor);

    editor.focus();
    insertHtmlAtRange(editor, range, html);
    insertRangeRef.current = null;
    emitChange();
  };

  const handleToggleHeading = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    toggleHeading(editor);
    emitChange();
  };

  const handleIndent = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    indentList(editor);
    emitChange();
  };

  const handleOutdent = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    outdentList(editor);
    emitChange();
  };

  const handleEditorKeyDown = (event) => {
    const editor = editorRef.current;
    if (!editor) return;

    if (enabled.youtube && event.key === 'Enter' && !event.shiftKey) {
      if (exitYoutubeMarkerOnEnter(editor)) {
        event.preventDefault();
        emitChange();
        return;
      }
    }

    if (!enabled.youtube || (event.key !== 'Backspace' && event.key !== 'Delete')) return;

    if (removeAdjacentYoutubeMarker(editor, event.key)) {
      event.preventDefault();
      emitChange();
    }
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
      return;
    }

    closeLinkDialog();
  };

  const handleInsertToolbarMouseDown = (event) => {
    preserveToolbarSelection(event);
    rememberInsertRange();
  };

  const openYoutubeDialog = () => {
    setYoutubeDialogOpen(true);
  };

  const closeYoutubeDialog = () => {
    setYoutubeDialogOpen(false);
    insertRangeRef.current = null;
    editorRef.current?.focus();
  };

  const insertDivider = () => {
    insertBlockHtml(buildDividerEditorHtml());
  };

  const handleEditorBlur = () => {
    const editor = editorRef.current;
    const range = captureEditorRange(editor);
    if (range) {
      lastRangeRef.current = range;
    } else if (insertRangeRef.current) {
      lastRangeRef.current = insertRangeRef.current.cloneRange();
    }
    emitChange();
  };

  const applyYoutube = ({ videoId, title }) => {
    insertBlockHtml(buildYoutubePlaceholderHtml(videoId, title));
    setYoutubeDialogOpen(false);
    insertRangeRef.current = null;
    editorRef.current?.focus();
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
          {enabled.bold && (
            <button type="button" className="rich-text__btn rich-text__btn--bold" onClick={() => runCommand('bold')} aria-label="Tučně">
              <strong>B</strong>
            </button>
          )}
          {enabled.italic && (
            <button type="button" className="rich-text__btn rich-text__btn--italic" onClick={() => runCommand('italic')} aria-label="Kurzíva">
              <em>I</em>
            </button>
          )}
          {enabled.underline && (
            <button type="button" className="rich-text__btn rich-text__btn--underline" onClick={() => runCommand('underline')} aria-label="Podtržení">
              <span className="rich-text__underline">U</span>
            </button>
          )}
          {enabled.heading && (
            <>
              <ToolbarSeparator />
              <button type="button" className="rich-text__btn rich-text__btn--heading" onClick={handleToggleHeading} aria-label="Nadpis">
                H
              </button>
            </>
          )}
          {enabled.lists && (
            <>
              <ToolbarSeparator />
              <button type="button" className="rich-text__btn rich-text__btn--list" onClick={() => runCommand('insertUnorderedList')} aria-label="Odrážky">
                •
              </button>
              <button type="button" className="rich-text__btn rich-text__btn--list" onClick={() => runCommand('insertOrderedList')} aria-label="Číslovaný seznam">
                1.
              </button>
              <button type="button" className="rich-text__btn rich-text__btn--list" onClick={handleOutdent} aria-label="Odsadit vlevo">
                ←
              </button>
              <button type="button" className="rich-text__btn rich-text__btn--list" onClick={handleIndent} aria-label="Odsadit vpravo">
                →
              </button>
            </>
          )}
          {enabled.link && (
            <>
              <ToolbarSeparator />
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
            </>
          )}
          {enabled.youtube && (
            <button
              type="button"
              className="rich-text__btn rich-text__btn--youtube"
              onMouseDown={handleInsertToolbarMouseDown}
              onClick={openYoutubeDialog}
              aria-label="YouTube video"
            >
              <span className="rich-text__btn-icon" aria-hidden="true">▶</span>
              Video
            </button>
          )}
          {enabled.divider && (
            <button
              type="button"
              className="rich-text__btn rich-text__btn--divider"
              onMouseDown={handleInsertToolbarMouseDown}
              onClick={insertDivider}
              aria-label="Oddělovač"
            >
              <span className="rich-text__btn-icon" aria-hidden="true">—</span>
              Oddělovač
            </button>
          )}
        </div>
        <div
          id={id}
          ref={editorRef}
          className="rich-text__editor"
          contentEditable
          role="textbox"
          aria-multiline="true"
          onInput={emitChange}
          onBlur={handleEditorBlur}
          onKeyDown={handleEditorKeyDown}
          data-placeholder="Začněte psát…"
          {...(maxLength ? { 'data-max-length': maxLength } : {})}
        />
      </div>

      {enabled.link && (
        <RichTextLinkDialog
          open={linkDialogOpen}
          initialHref={linkDialogState.href}
          initialText={linkDialogState.text}
          initialNewTab={linkDialogState.newTab}
          isEdit={linkDialogState.isEdit}
          onClose={closeLinkDialog}
          onApply={applyLink}
        />
      )}

      {enabled.youtube && (
        <RichTextYoutubeDialog
          open={youtubeDialogOpen}
          onClose={closeYoutubeDialog}
          onApply={applyYoutube}
        />
      )}
    </>
  );
}
