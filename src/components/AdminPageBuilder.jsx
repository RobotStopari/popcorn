import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  isBlockEditable,
  PAGE_BLOCK_DESCRIPTIONS,
  PAGE_BLOCK_LABELS,
  PAGE_BLOCK_PALETTE_GROUPS,
  PAGE_BLOCK_SPACE_HEIGHT_DEFAULT,
  PAGE_BLOCK_NEGATIVE_SPACE_PULL_DEFAULT,
  PAGE_BLOCK_TYPES,
} from '../data/page-blocks';
import { canEditPageSlug, canEditPageTitle, getPageIntroFieldCopy, pagePath } from '../data/pages';
import {
  applyHomeIntroToBlocks,
  canPageHaveBlocks,
  createBlock,
  ensureLockedPageTitleBlock,
  getBlocksForPage,
  getHomeIntroFromBlocks,
  hasLockedPageTitleBlock,
  isBlockAllowedForPage,
  isBlockEmpty,
  isLockedPageTitleBlock,
  mergePageBlockPatch,
  normalizePageBlock,
  validatePageBlocks,
} from '../utils/page-blocks';
import { adminText } from '../utils/admin-text';
import { openLivePagePreview } from '../utils/live-page-preview';
import AdminDeleteBlockDialog from './AdminDeleteBlockDialog';
import AdminPageBlockEditModal from './AdminPageBlockEditModal';
import SortableList from './SortableList';

const BLOCK_ENTER_MS = 320;
const BLOCK_EXIT_MS = 280;

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
      className={`admin-page-builder__add-chevron${open ? ' is-open' : ''}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function getBlockSummary(block) {
  const stripHtml = (html) => (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  switch (block.type) {
    case PAGE_BLOCK_TYPES.citation:
    case PAGE_BLOCK_TYPES.citationSmall:
    case PAGE_BLOCK_TYPES.h1:
    case PAGE_BLOCK_TYPES.h2:
      return block.text?.trim() || 'Prázdný text';
    case PAGE_BLOCK_TYPES.reference:
      if (block.text?.trim()) return block.text.trim();
      return block.imageUrl ? 'Reference' : 'Fotka + citace';
    case PAGE_BLOCK_TYPES.paragraph:
      return stripHtml(block.html) || 'Prázdný odstavec';
    case PAGE_BLOCK_TYPES.imageText:
      if (stripHtml(block.html)) return stripHtml(block.html);
      return block.imageUrl ? 'Obrázek s textem' : 'Obrázek + text';
    case PAGE_BLOCK_TYPES.divider:
      return 'Oddělovač';
    case PAGE_BLOCK_TYPES.upcomingEvents:
      return 'Tři nejbližší akce a odkaz na VyPUKne';
    case PAGE_BLOCK_TYPES.pastEvents:
      return 'Tři poslední proběhlé akce';
    case PAGE_BLOCK_TYPES.calendar:
      return 'Měsíční kalendář akcí';
    case PAGE_BLOCK_TYPES.parallaxImage:
      return block.imageUrl ? 'Vlastní parallax obrázek' : 'Parallax textura';
    case PAGE_BLOCK_TYPES.socials:
      return block.imageUrl ? 'Parallax s vlastním obrázkem' : 'Parallax s texturou';
    case PAGE_BLOCK_TYPES.instagramFeed:
      return 'Poslední čtyři příspěvky z Instagramu';
    case PAGE_BLOCK_TYPES.wideImage:
      return block.imageUrl ? (block.imageAlt?.trim() || 'Široký obrázek') : 'Prázdný široký obrázek';
    case PAGE_BLOCK_TYPES.imageTriplet: {
      const count = (block.images || []).filter((image) => image?.imageUrl?.trim()).length;
      return count ? `${count} / 3 obrázků` : 'Tři čtvercové obrázky';
    }
    case PAGE_BLOCK_TYPES.button:
      return block.label?.trim() || 'Prázdné tlačítko';
    case PAGE_BLOCK_TYPES.buttonPair: {
      const labels = (block.buttons || [])
        .map((button) => button?.label?.trim())
        .filter(Boolean);
      return labels.length ? labels.join(' · ') : 'Dvě tlačítka';
    }
    case PAGE_BLOCK_TYPES.youtube:
      return block.title?.trim() || (block.videoId ? 'YouTube video' : 'Prázdné video');
    case PAGE_BLOCK_TYPES.space:
      return `Výška ${block.heightRem ?? PAGE_BLOCK_SPACE_HEIGHT_DEFAULT} rem`;
    case PAGE_BLOCK_TYPES.negativeSpace:
      return `Zmenšení −${block.pullRem ?? PAGE_BLOCK_NEGATIVE_SPACE_PULL_DEFAULT} rem`;
    case PAGE_BLOCK_TYPES.medallions: {
      const count = (block.people || []).filter((person) => person?.name?.trim()).length;
      return count ? `${count} ${count === 1 ? 'osoba' : count < 5 ? 'osoby' : 'osob'}` : 'Medailonky';
    }
    default:
      return '';
  }
}

function DragHandleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="7" r="1.5" />
      <circle cx="15" cy="7" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="17" r="1.5" />
      <circle cx="15" cy="17" r="1.5" />
    </svg>
  );
}

function BlockListRow({
  block,
  index,
  locked = false,
  onEdit,
  onRemove,
  onHandlePointerDown,
  ghost = false,
}) {
  const summary = getBlockSummary(block);
  const label = PAGE_BLOCK_LABELS[block.type] || block.type;
  const editable = !locked && isBlockEditable(block);

  const content = (
    <>
      <span className="admin-page-builder__block-headline">
        <strong className="admin-page-builder__block-type">{label}</strong>
        {locked && (
          <span className="admin-page-builder__block-lock-badge">{adminText('pages.builder.lockedHeadingBadge')}</span>
        )}
      </span>
      {summary && (
        <span className="admin-page-builder__block-summary">{summary}</span>
      )}
    </>
  );

  return (
    <div className={`admin-page-builder__block-card${ghost ? ' admin-page-builder__block-card--ghost' : ''}${editable ? '' : ' admin-page-builder__block-card--static'}${locked ? ' admin-page-builder__block-card--locked' : ''}`}>
      {!locked && (
        <button
          type="button"
          className="admin-page-builder__block-handle admin-sortable__handle"
          aria-label={`Přesunout prvek ${index + 1}`}
          onPointerDown={onHandlePointerDown}
          tabIndex={ghost ? -1 : 0}
          disabled={!onHandlePointerDown}
        >
          <DragHandleIcon />
        </button>
      )}

      <span className="admin-page-builder__block-index" aria-hidden="true">
        {index + 1}
      </span>

      {editable ? (
        <button
          type="button"
          className="admin-page-builder__block-body"
          onClick={() => onEdit(block.id)}
          disabled={ghost}
        >
          {content}
        </button>
      ) : (
        <div className="admin-page-builder__block-body admin-page-builder__block-body--static">
          {content}
        </div>
      )}

      {!ghost && !locked && (
        <div className="admin-page-builder__block-actions">
          {editable && (
            <button
              type="button"
              className="admin-page-builder__icon-btn"
              aria-label={`Upravit prvek ${label}`}
              onClick={() => onEdit(block.id)}
            >
              <EditIcon />
            </button>
          )}
          <button
            type="button"
            className="admin-page-builder__icon-btn admin-page-builder__icon-btn--danger"
            aria-label={`Odstranit prvek ${label}`}
            onClick={() => onRemove(block.id)}
          >
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminPageBuilder({
  open,
  page,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({ title: '', slug: '' });
  const [homeIntro, setHomeIntro] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [metaOpen, setMetaOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [enteringBlockIds, setEnteringBlockIds] = useState(() => new Set());
  const [removingBlockIds, setRemovingBlockIds] = useState(() => new Set());
  const [blockToDelete, setBlockToDelete] = useState(null);
  const editingBlockIdRef = useRef(null);
  const blocksRef = useRef([]);
  const paletteOpenRef = useRef(null);
  const blockToDeleteRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const previewWindowRef = useRef(null);
  const removeTimeoutsRef = useRef(new Map());
  blocksRef.current = blocks;
  editingBlockIdRef.current = editingBlockId;
  paletteOpenRef.current = paletteOpen;
  blockToDeleteRef.current = blockToDelete;
  onCloseRef.current = onClose;

  const hasBlocks = canPageHaveBlocks(page);
  const lockedTitleBlock = hasLockedPageTitleBlock(page);
  const editingBlock = blocks.find((block) => block.id === editingBlockId) || null;
  const editingBlockIndex = editingBlock
    ? blocks.findIndex((block) => block.id === editingBlockId)
    : -1;
  const editingBlockForModal = editingBlock
    && isBlockEditable(editingBlock)
    && !isLockedPageTitleBlock(page, editingBlock, editingBlockIndex)
    ? normalizePageBlock(editingBlock)
    : null;

  useEffect(() => {
    if (!open || !page) return;

    const nextBlocks = hasBlocks ? getBlocksForPage(page) : [];
    blocksRef.current = nextBlocks;
    setForm({ title: page.title, slug: page.slug });
    setHomeIntro(page?.id === 'home' ? getHomeIntroFromBlocks(nextBlocks) : '');
    setBlocks(nextBlocks);
    setSaving(false);
    setError('');
    setSaveMessage('');
    setMetaOpen(false);
    setPaletteOpen(false);
    setEditingBlockId(null);
    setEnteringBlockIds(new Set());
    setRemovingBlockIds(new Set());
    setBlockToDelete(null);

    removeTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    removeTimeoutsRef.current.clear();
  }, [open, page?.id, hasBlocks]);

  useEffect(() => {
    if (!open || !lockedTitleBlock) return;

    setBlocks((prev) => {
      const next = ensureLockedPageTitleBlock(prev, form.title, page);
      blocksRef.current = next;
      return next;
    });
  }, [form.title, lockedTitleBlock, open, page?.id, page?.type]);

  useEffect(() => {
    if (!saveMessage) return undefined;

    const timeout = window.setTimeout(() => setSaveMessage(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [saveMessage]);

  useEffect(() => {
    if (!open) return undefined;

    document.body.classList.add('admin-modal-open');

    const onKeydown = (event) => {
      if (event.key !== 'Escape') return;
      if (editingBlockIdRef.current) {
        setEditingBlockId(null);
        return;
      }
      if (blockToDeleteRef.current) {
        setBlockToDelete(null);
        return;
      }
      if (paletteOpenRef.current) {
        setPaletteOpen(false);
        return;
      }
      onCloseRef.current();
    };

    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('admin-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [open]);

  if (!open || !page) return null;

  const lockTitle = !canEditPageTitle(page);
  const lockSlug = !canEditPageSlug(page);

  const markBlockEntering = (blockId) => {
    setEnteringBlockIds((prev) => new Set(prev).add(blockId));
    window.setTimeout(() => {
      setEnteringBlockIds((prev) => {
        if (!prev.has(blockId)) return prev;
        const next = new Set(prev);
        next.delete(blockId);
        return next;
      });
    }, BLOCK_ENTER_MS);
  };

  const animateRemoveBlock = (blockId) => {
    let shouldAnimate = false;

    setRemovingBlockIds((prev) => {
      if (prev.has(blockId)) return prev;
      shouldAnimate = true;
      return new Set(prev).add(blockId);
    });

    if (!shouldAnimate) return;

    if (editingBlockId === blockId) {
      setEditingBlockId(null);
    }

    const existingTimeout = removeTimeoutsRef.current.get(blockId);
    if (existingTimeout) window.clearTimeout(existingTimeout);

    const timeoutId = window.setTimeout(() => {
      removeTimeoutsRef.current.delete(blockId);
      setBlocks((prev) => {
        const next = prev.filter((item) => item.id !== blockId);
        blocksRef.current = next;
        return next;
      });
      setRemovingBlockIds((prev) => {
        if (!prev.has(blockId)) return prev;
        const next = new Set(prev);
        next.delete(blockId);
        return next;
      });
    }, BLOCK_EXIT_MS);

    removeTimeoutsRef.current.set(blockId, timeoutId);
  };

  const handleAddBlock = (type) => {
    const newBlock = type === PAGE_BLOCK_TYPES.imageText
      ? createBlock(type, { reversed: true })
      : createBlock(type);
    setBlocks((prev) => {
      const next = [...prev, newBlock];
      blocksRef.current = next;
      return next;
    });
    markBlockEntering(newBlock.id);
    setPaletteOpen(false);
    if (isBlockEditable(newBlock)) {
      setEditingBlockId(newBlock.id);
    }
  };

  const handleReorderBlocks = (next) => {
    blocksRef.current = next;
    setBlocks(next);
  };

  const handleUpdateBlock = (blockId, patch) => {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return;

    setBlocks((prev) => {
      const next = prev.map((item) => (
        item.id === blockId ? mergePageBlockPatch(item, patch) : item
      ));
      blocksRef.current = next;
      return next;
    });
  };

  const handleRequestRemoveBlock = (blockId) => {
    const block = blocks.find((item) => item.id === blockId);
    if (!block) return;

    const index = blocks.findIndex((item) => item.id === blockId);
    if (isLockedPageTitleBlock(page, block, index)) return;

    setPaletteOpen(false);
    if (editingBlockId === blockId) {
      setEditingBlockId(null);
    }
    setBlockToDelete(block);
  };

  const handleConfirmRemoveBlock = () => {
    if (!blockToDelete) return;
    animateRemoveBlock(blockToDelete.id);
    setBlockToDelete(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSaveMessage('');

    try {
      const currentBlocks = page?.id === 'home'
        ? applyHomeIntroToBlocks(blocksRef.current, homeIntro)
        : blocksRef.current;
      await onSave({
        title: form.title,
        slug: form.slug,
        blocks: hasBlocks
          ? validatePageBlocks(currentBlocks, page, { pageTitle: form.title })
          : undefined,
      });
      setSaveMessage(adminText('pages.builder.saved'));
    } catch (err) {
      setError(err.message || 'Uložení se nezdařilo.');
    } finally {
      setSaving(false);
    }
  };

  const handleLivePreview = () => {
    setError('');
    const opened = openLivePagePreview(pagePath({ slug: form.slug }), previewWindowRef);
    if (!opened) {
      setError('Nepodařilo se otevřít náhled — povolte vyskakovací okna pro tuto stránku.');
    }
  };

  const builder = (
    <div className="admin-page-builder" role="dialog" aria-modal="true" aria-labelledby="admin-page-builder-title">
      {saveMessage && (
        <p className="admin-page-builder__toast" role="status">
          {saveMessage}
        </p>
      )}

      <header className="admin-page-builder__header">
        <div className="admin-page-builder__header-main">
          <button
            type="button"
            className="admin-page-builder__close"
            aria-label="Zavřít editor"
            onClick={onClose}
            disabled={saving}
          >
            <CloseIcon />
          </button>
          <div className="admin-page-builder__header-copy">
            <p className="admin-page-builder__eyebrow">{adminText('pages.builder.eyebrow')}</p>
            <h2 id="admin-page-builder-title" className="admin-page-builder__title">
              {form.title || page.title}
            </h2>
          </div>
        </div>

        <div className="admin-page-builder__header-actions">
          <button
            type="button"
            className="btn btn--outline btn--small admin-page-builder__live-preview"
            onClick={handleLivePreview}
            aria-label={adminText('pages.builder.livePreviewAria')}
          >
            {adminText('pages.builder.livePreview')}
          </button>
          <button
            type="button"
            className={`btn btn--outline btn--small${metaOpen ? ' is-active' : ''}`}
            onClick={() => setMetaOpen((value) => !value)}
          >
            {adminText('common.settings')}
          </button>
          <button type="submit" form="admin-page-builder-form" className="btn btn--primary btn--small" disabled={saving}>
            {saving ? adminText('common.saving') : adminText('common.save')}
          </button>
        </div>
      </header>

      {metaOpen && (
        <section className="admin-page-builder__meta-bar">
          <div className="admin-page-builder__meta-field">
            <label className="admin-page-builder__meta-label" htmlFor="builder-page-title">{adminText('pages.builder.metaName')}</label>
            <input
              id="builder-page-title"
              className="admin-form__input"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              disabled={lockTitle}
              required
            />
          </div>
          <div className="admin-page-builder__meta-field">
            <label className="admin-page-builder__meta-label" htmlFor="builder-page-slug">{adminText('pages.builder.metaUrl')}</label>
            {lockSlug ? (
              <div className="admin-page-dialog__url-fixed" id="builder-page-slug">/</div>
            ) : (
              <div className="admin-page-dialog__url">
                <span className="admin-page-dialog__url-prefix">/</span>
                <input
                  id="builder-page-slug"
                  className="admin-form__input admin-page-dialog__url-input"
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({
                    ...prev,
                    slug: e.target.value.trim().toLowerCase(),
                  }))}
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  spellCheck={false}
                  autoCapitalize="none"
                />
              </div>
            )}
          </div>
          {page?.id === 'home' && (
            <div className="admin-page-builder__meta-field admin-page-builder__meta-field--wide">
              <label className="admin-page-builder__meta-label" htmlFor="builder-page-intro">
                {getPageIntroFieldCopy(page)?.label}
              </label>
              <textarea
                id="builder-page-intro"
                className="admin-form__input"
                rows={3}
                value={homeIntro}
                onChange={(e) => setHomeIntro(e.target.value)}
                required
              />
              <p className="admin-form__hint">{getPageIntroFieldCopy(page)?.hint}</p>
            </div>
          )}
        </section>
      )}

      <form id="admin-page-builder-form" className="admin-page-builder__body" onSubmit={handleSubmit}>
        {hasBlocks ? (
          <div className="admin-page-builder__list-shell">
            {!blocks.length ? (
              <p className="admin-page-builder__empty-canvas">{adminText('pages.builder.emptyCanvas')}</p>
            ) : (
              <SortableList
                items={blocks}
                onReorder={handleReorderBlocks}
                integratedHandle
                lockedBeforeIndex={lockedTitleBlock ? 1 : 0}
                listClassName="admin-page-builder__stack"
                itemClassName="admin-page-builder__frame admin-sortable__item"
                ghostClassName="admin-page-builder__frame-ghost"
                handleLabel="Přesunout prvek"
                getItemKey={(item) => item.id}
                getItemClassName={(item) => {
                  const classes = [];
                  if (enteringBlockIds.has(item.id)) classes.push('admin-page-builder__frame--entering');
                  if (removingBlockIds.has(item.id)) classes.push('admin-page-builder__frame--removing');
                  return classes.join(' ');
                }}
                isItemDraggable={(item, index) => !isLockedPageTitleBlock(page, item, index)}
                renderItem={(block, index, onHandlePointerDown) => (
                  <BlockListRow
                    block={block}
                    index={index}
                    locked={isLockedPageTitleBlock(page, block, index)}
                    onEdit={setEditingBlockId}
                    onRemove={handleRequestRemoveBlock}
                    onHandlePointerDown={onHandlePointerDown}
                  />
                )}
                renderGhostItem={(block, index, onHandlePointerDown) => (
                  <BlockListRow
                    block={block}
                    index={index ?? 0}
                    onEdit={() => {}}
                    onRemove={() => {}}
                    onHandlePointerDown={onHandlePointerDown || (() => {})}
                    ghost
                  />
                )}
              />
            )}
          </div>
        ) : (
          <div className="admin-page-builder__meta-only">
            <p className="admin-page-builder__meta-only-text">
              Tato stránka nemá editovatelný obsah — lze měnit jen název a URL v nastavení nahoře.
            </p>
          </div>
        )}

        {error && (
          <p className="admin-error admin-page-builder__error">{error}</p>
        )}
      </form>

      {hasBlocks && (
        <>
          {paletteOpen && (
            <>
              <button
                type="button"
                className="admin-page-builder__palette-overlay"
                aria-label="Zavřít nabídku prvků"
                onClick={() => setPaletteOpen(false)}
              />
              <div
                className="admin-page-builder__palette-panel"
                role="dialog"
                aria-label="Vyberte prvek"
              >
                <div className="admin-page-builder__palette-head">
                  <h3 className="admin-page-builder__palette-title">Přidat prvek</h3>
                  <button
                    type="button"
                    className="admin-page-builder__palette-close"
                    aria-label="Zavřít"
                    onClick={() => setPaletteOpen(false)}
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="admin-page-builder__palette-groups">
                  {PAGE_BLOCK_PALETTE_GROUPS.map((group) => {
                    const items = group.items.filter((type) => isBlockAllowedForPage(page, type));
                    if (!items.length) return null;

                    return (
                      <section key={group.id} className="admin-page-builder__palette-group">
                        <h4 className="admin-page-builder__palette-group-label">{group.label}</h4>
                        <div className="admin-page-builder__palette-grid">
                          {items.map((type) => (
                            <button
                              key={type}
                              type="button"
                              className="admin-page-builder__palette-card"
                              onClick={() => handleAddBlock(type)}
                            >
                              <span className="admin-page-builder__palette-card-label">
                                {PAGE_BLOCK_LABELS[type]}
                              </span>
                              {PAGE_BLOCK_DESCRIPTIONS[type] && (
                                <span className="admin-page-builder__palette-card-desc">
                                  {PAGE_BLOCK_DESCRIPTIONS[type]}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <footer className="admin-page-builder__footer-bar">
            <button
              type="button"
              className={`admin-page-builder__add-btn${paletteOpen ? ' is-open' : ''}`}
              aria-expanded={paletteOpen}
              aria-haspopup="dialog"
              onClick={() => setPaletteOpen((value) => !value)}
            >
              <PlusIcon />
              <span>{adminText('pages.builder.addBlock')}</span>
              <ChevronIcon open={paletteOpen} />
            </button>
          </footer>
        </>
      )}

      <AdminPageBlockEditModal
        open={Boolean(editingBlockForModal)}
        block={editingBlockForModal}
        onClose={() => setEditingBlockId(null)}
        onChange={(patch) => {
          const blockId = editingBlockIdRef.current;
          if (blockId) {
            handleUpdateBlock(blockId, patch);
          }
        }}
      />

      <AdminDeleteBlockDialog
        open={Boolean(blockToDelete)}
        block={blockToDelete}
        summary={blockToDelete ? getBlockSummary(blockToDelete) : ''}
        hasContent={blockToDelete ? !isBlockEmpty(blockToDelete) : false}
        onClose={() => setBlockToDelete(null)}
        onConfirm={handleConfirmRemoveBlock}
      />
    </div>
  );

  return createPortal(builder, document.body);
}
