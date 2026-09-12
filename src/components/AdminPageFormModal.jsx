import { useEffect, useRef, useState } from 'react';
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
import { useAutosaveRunner } from '../hooks/useAutosaveRunner';
import { getAutosaveFormHandlers } from '../utils/autosave';
import { adminText } from '../utils/admin-text';
import AdminModalPanel from './AdminModalPanel';
import AutosaveStatus from './AutosaveStatus';

const EMPTY_FORM = {
  title: '',
  slug: '',
  intro: '',
  seoTitle: '',
  seoDescription: '',
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
  const skipFormResetRef = useRef(false);
  const formRef = useRef(form);
  const { run: runAutosave, remember: rememberAutosave, status: autosaveStatus } = useAutosaveRunner();
  const { mounted, visible } = useAnimatedPresence(open, 240);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setSlugTouched(false);
      setSaving(false);
      setError('');
      return;
    }

    if (skipFormResetRef.current) {
      skipFormResetRef.current = false;
      return;
    }

    if (page) {
      const next = {
        title: page.title,
        slug: page.slug,
        intro: getPageIntro(page),
        seoTitle: page.seoTitle || '',
        seoDescription: page.seoDescription || '',
      };
      setForm(next);
      formRef.current = next;
      rememberAutosave(next);
      setSlugTouched(true);
    } else {
      setForm(EMPTY_FORM);
      formRef.current = EMPTY_FORM;
      rememberAutosave(EMPTY_FORM);
      setSlugTouched(false);
    }
  }, [open, page, rememberAutosave]);

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
      formRef.current = next;
      return next;
    });
    setError('');
  };

  const persistPage = async ({ close = false } = {}) => {
    const current = formRef.current;
    const payload = {
      title: current.title,
      slug: current.slug,
      intro: showIntro ? current.intro : undefined,
      seoTitle: current.seoTitle,
      seoDescription: current.seoDescription,
    };

    if (!close && isCreate && (!payload.title.trim() || !payload.slug.trim())) {
      return true;
    }

    skipFormResetRef.current = true;
    if (close) setSaving(true);
    setError('');

    const ok = await runAutosave(payload, async () => {
      await onSave(payload, { silent: !close });
      return true;
    });

    if (close) {
      setSaving(false);
      if (ok) onClose();
      else setError(adminText('common.saveFailed'));
    }
    return ok;
  };

  const persistSoon = () => {
    persistPage();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await persistPage({ close: true });
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
              <AutosaveStatus status={autosaveStatus} />
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

        <form
          id="admin-page-form"
          className="admin-page-form-modal__form"
          onSubmit={handleSubmit}
          {...getAutosaveFormHandlers(persistSoon)}
        >
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
                      setForm((prev) => {
                        const next = { ...prev, slug: e.target.value.trim().toLowerCase() };
                        formRef.current = next;
                        return next;
                      });
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
                  setForm((prev) => {
                    const next = { ...prev, intro: e.target.value };
                    formRef.current = next;
                    return next;
                  });
                  setError('');
                }}
                required
              />
            </section>
          )}

          {!isCreate && (
            <section className="admin-page-form-modal__section">
              <div className="admin-page-form-modal__section-head">
                <h3 className="admin-page-form-modal__section-title">{adminText('pages.form.seoTitle')}</h3>
                <p className="admin-page-form-modal__section-hint">{adminText('pages.form.seoHint')}</p>
              </div>
              <div className="admin-page-form-modal__field">
                <label className="admin-page-form-modal__label" htmlFor="page-seo-title">
                  {adminText('pages.form.seoMetaTitleLabel')}
                </label>
                <input
                  id="page-seo-title"
                  className="admin-form__input admin-page-meta-control"
                  value={form.seoTitle}
                  onChange={(e) => {
                    setForm((prev) => {
                      const next = { ...prev, seoTitle: e.target.value };
                      formRef.current = next;
                      return next;
                    });
                    setError('');
                  }}
                  placeholder={form.title || adminText('pages.form.seoMetaTitlePlaceholder')}
                  maxLength={120}
                />
              </div>
              <div className="admin-page-form-modal__field">
                <label className="admin-page-form-modal__label" htmlFor="page-seo-description">
                  {adminText('pages.form.seoMetaDescriptionLabel')}
                </label>
                <textarea
                  id="page-seo-description"
                  className="admin-form__input admin-page-form-modal__intro"
                  rows={3}
                  value={form.seoDescription}
                  onChange={(e) => {
                    setForm((prev) => {
                      const next = { ...prev, seoDescription: e.target.value };
                      formRef.current = next;
                      return next;
                    });
                    setError('');
                  }}
                  placeholder={adminText('pages.form.seoMetaDescriptionPlaceholder')}
                  maxLength={320}
                />
              </div>
            </section>
          )}
        </form>
      </AdminModalPanel>
    </div>,
    document.body,
  );
}
