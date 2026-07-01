import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  canEditPageSlug,
  canEditPageTitle,
  getPageIntro,
  getPageIntroFieldCopy,
  pageHasIntroField,
  pageHasPublicUrl,
  pagePath,
  PAGE_TYPES,
  slugifyTitle,
} from '../data/pages';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { adminText } from '../utils/admin-text';
import AdminModalPanel from './AdminModalPanel';

const EMPTY_FORM = {
  title: '',
  slug: '',
  intro: '',
};

export default function AdminPageFormModal({
  open,
  page,
  onClose,
  onSave,
}) {
  const isCreate = !page;
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { mounted, visible } = useAnimatedPresence(open, 240);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setSlugTouched(false);
      setSaving(false);
      setError('');
      return;
    }

    if (page) {
      setForm({
        title: page.title,
        slug: page.slug,
        intro: getPageIntro(page),
      });
      setSlugTouched(true);
    } else {
      setForm(EMPTY_FORM);
      setSlugTouched(false);
    }
  }, [open, page]);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (keyEvent) => {
      if (keyEvent.key === 'Escape' && !saving) onClose();
    };

    document.body.classList.add('admin-modal-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('admin-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [mounted, onClose, saving]);

  if (!mounted) return null;

  const lockTitle = page && !canEditPageTitle(page);
  const lockSlug = page && !canEditPageSlug(page);
  const showUrlField = !page || pageHasPublicUrl(page);
  const introCopy = page ? getPageIntroFieldCopy(page) : null;
  const showIntro = Boolean(page && pageHasIntroField(page) && page.id !== 'home' && introCopy);
  const previewPath = pagePath({ slug: form.slug });

  const handleTitleChange = (value) => {
    setForm((prev) => {
      const next = { ...prev, title: value };
      if (isCreate && !slugTouched) {
        next.slug = slugifyTitle(value);
      }
      return next;
    });
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await onSave({
        title: form.title,
        slug: form.slug,
        intro: showIntro ? form.intro : undefined,
      });
      onClose();
    } catch (err) {
      setError(err.message || adminText('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className={`admin-modal admin-page-form-modal${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-page-form-title"
    >
      <div className="admin-modal__backdrop" onClick={saving ? undefined : onClose} aria-hidden="true" />
      <AdminModalPanel
        className="admin-modal__panel--page-settings"
        footer={(
          <div className="admin-page-form-modal__footer">
            {error && <p className="admin-error admin-page-form-modal__error">{error}</p>}
            <div className="admin-modal__actions admin-page-form-modal__actions">
              <button type="button" className="btn btn--outline" onClick={onClose} disabled={saving}>
                {adminText('common.cancel')}
              </button>
              <button type="submit" form="admin-page-form" className="btn btn--primary" disabled={saving}>
                {saving
                  ? adminText('common.saving')
                  : (isCreate ? adminText('pages.form.createButton') : adminText('common.save'))}
              </button>
            </div>
          </div>
        )}
      >
        <header className="admin-page-form-modal__header">
          <p className="admin-page-form-modal__eyebrow">{adminText('pages.form.settingsEyebrow')}</p>
          <h2 id="admin-page-form-title" className="admin-page-form-modal__title">
            {isCreate ? adminText('pages.form.newTitle') : adminText('pages.form.editTitle')}
          </h2>
          {!isCreate && (
            <p className="admin-page-form-modal__subtitle">
              {form.title || page.title}
              {showUrlField && (
                <span className="admin-page-form-modal__path">{previewPath}</span>
              )}
            </p>
          )}
        </header>

        <form id="admin-page-form" className="admin-page-form-modal__form" onSubmit={handleSubmit}>
          <section className="admin-page-form-modal__section">
            <div className="admin-page-form-modal__field">
              <label className="admin-page-form-modal__label" htmlFor="page-title">
                {adminText('pages.form.nameLabel')}
              </label>
              <input
                id="page-title"
                className="admin-form__input admin-page-meta-control"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                disabled={lockTitle}
                placeholder={adminText('pages.form.namePlaceholder')}
                required
              />
              {lockTitle && (
                <p className="admin-form__hint">{adminText('pages.form.homeNameHint')}</p>
              )}
            </div>

            {showUrlField && (
            <div className="admin-page-form-modal__field">
              <label className="admin-page-form-modal__label" htmlFor="page-slug">
                {adminText('pages.form.urlLabel')}
              </label>
              {lockSlug ? (
                <div className="admin-page-form-modal__url admin-page-form-modal__url--fixed admin-page-meta-control" id="page-slug">
                  {page?.type === PAGE_TYPES.home ? '/' : pagePath(page)}
                </div>
              ) : (
                <div className="admin-page-form-modal__url admin-page-meta-control">
                  <span className="admin-page-form-modal__url-prefix" aria-hidden="true">/</span>
                  <input
                    id="page-slug"
                    className="admin-form__input admin-page-form-modal__url-input"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm((prev) => ({ ...prev, slug: e.target.value.trim().toLowerCase() }));
                      setError('');
                    }}
                    required
                    placeholder={adminText('pages.form.urlPlaceholder')}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    spellCheck={false}
                    autoCapitalize="none"
                  />
                </div>
              )}
              <p className="admin-form__hint">
                {lockSlug
                  ? adminText('pages.form.homeUrlHint')
                  : adminText('pages.form.urlHint')}
              </p>
            </div>
            )}
          </section>

          {showIntro && (
            <section className="admin-page-form-modal__section admin-page-form-modal__section--intro">
              <div className="admin-page-form-modal__section-head">
                <h3 className="admin-page-form-modal__section-title">{introCopy.label}</h3>
                <p className="admin-page-form-modal__section-hint">{introCopy.hint}</p>
              </div>
              <textarea
                id="page-intro"
                className="admin-form__input admin-page-form-modal__intro"
                rows={4}
                value={form.intro}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, intro: e.target.value }));
                  setError('');
                }}
                required
              />
            </section>
          )}
        </form>
      </AdminModalPanel>
    </div>,
    document.body,
  );
}
