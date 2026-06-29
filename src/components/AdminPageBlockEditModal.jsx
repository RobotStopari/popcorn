import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { PAGE_BLOCK_TYPES } from '../data/page-blocks';
import { adminText } from '../utils/admin-text';
import AdminPageBlockEditor, { getBlockEditorTitle } from './AdminPageBlockEditor';
import AdminPageBlockWireframe from './AdminPageBlockWireframe';
import AdminModalPanel from './AdminModalPanel';

const COMPACT_PREVIEW_BLOCK_TYPES = new Set([
  PAGE_BLOCK_TYPES.imageTriplet,
  PAGE_BLOCK_TYPES.medallions,
  PAGE_BLOCK_TYPES.buttonPair,
  PAGE_BLOCK_TYPES.imageText,
]);

export default function AdminPageBlockEditModal({
  open,
  block,
  onClose,
  onChange,
}) {
  const { mounted, visible } = useAnimatedPresence(open, 240);
  const scrollRef = useRef(null);
  const scrollTopRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    scrollTopRef.current = 0;
  }, [open, block?.id]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return undefined;

    const onScroll = () => {
      scrollTopRef.current = node.scrollTop;
    };

    node.addEventListener('scroll', onScroll, { passive: true });
    return () => node.removeEventListener('scroll', onScroll);
  }, [mounted]);

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) return undefined;

    const clampScroll = () => {
      const maxScroll = Math.max(0, node.scrollHeight - node.clientHeight);
      if (node.scrollTop > maxScroll) {
        const next = maxScroll;
        node.scrollTop = next;
        scrollTopRef.current = next;
      }
    };

    node.scrollTop = scrollTopRef.current;
    clampScroll();

    const observer = new ResizeObserver(clampScroll);
    observer.observe(node);

    return () => observer.disconnect();
  }, [block?.id]);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [mounted, onClose]);

  if (!mounted || !block) return null;

  const isWidgetEditor = block.type === PAGE_BLOCK_TYPES.socials
    || block.type === PAGE_BLOCK_TYPES.parallaxImage;
  const useCompactPreview = !isWidgetEditor && COMPACT_PREVIEW_BLOCK_TYPES.has(block.type);

  const preview = (
    <AdminPageBlockWireframe block={block} />
  );

  return createPortal(
    <div
      className={`admin-modal admin-page-block-modal${isWidgetEditor ? ' admin-page-block-modal--widget' : ''}${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-page-block-modal-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <AdminModalPanel
        ref={scrollRef}
        className="admin-modal__panel--page admin-page-block-modal__panel"
        footer={(
          <div className="admin-modal__actions admin-page-block-modal__footer">
            <button type="button" className="btn btn--primary" onClick={onClose}>
              {adminText('common.done')}
            </button>
          </div>
        )}
      >
        <h2 id="admin-page-block-modal-title" className="admin-modal__title">
          {getBlockEditorTitle(block)}
        </h2>

        <div className="admin-page-block-modal__body">
          {!isWidgetEditor && (
            useCompactPreview ? (
              <details className="admin-page-block-modal__preview admin-page-block-modal__preview--compact">
                <summary className="admin-page-block-modal__preview-toggle">
                  {adminText('pages.builder.previewToggle')}
                </summary>
                {preview}
              </details>
            ) : (
              <section className="admin-page-block-modal__preview" aria-label={adminText('pages.builder.previewAria')}>
                {preview}
              </section>
            )
          )}
          <section className="admin-page-block-modal__editor" aria-label="Úprava obsahu">
            <AdminPageBlockEditor block={block} onChange={onChange} />
          </section>
        </div>
      </AdminModalPanel>
    </div>,
    document.body,
  );
}
