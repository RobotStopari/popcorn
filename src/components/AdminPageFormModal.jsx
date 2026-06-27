import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  canEditPageSlug,
  canEditPageTitle,
  slugifyTitle,
} from '../data/pages';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';

const EMPTY_FORM = {
  title: '',
  slug: '',
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
      setForm({ title: page.title, slug: page.slug });
      setSlugTouched(true);
    } else {
      setForm(EMPTY_FORM);
      setSlugTouched(false);
    }
  }, [open, page]);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (keyEvent) => {
      if (keyEvent.key === 'Escape') onClose();
    };

    document.body.classList.add('admin-modal-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('admin-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  const lockTitle = page && !canEditPageTitle(page);
  const lockSlug = page && !canEditPageSlug(page);

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
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Uložení se nezdařilo.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className={`admin-modal${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-page-form-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="admin-modal__panel admin-modal__panel--page">
        <h2 id="admin-page-form-title" className="admin-modal__title">
          {isCreate ? 'Nová stránka' : 'Upravit stránku'}
        </h2>

        <form className="admin-form admin-page-dialog" onSubmit={handleSubmit}>
          <div className="admin-form__group">
            <label className="admin-form__label" htmlFor="page-title">
              Název
            </label>
            <input
              id="page-title"
              className="admin-form__input"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={lockTitle}
              placeholder="Např. Blog"
              required
            />
            {lockTitle && (
              <p className="admin-form__hint">Hlavní stránka — název nelze měnit.</p>
            )}
          </div>

          <div className="admin-form__group">
            <label className="admin-form__label" htmlFor="page-slug">
              URL
            </label>
            {lockSlug ? (
              <div className="admin-page-dialog__url-fixed" id="page-slug">
                /
              </div>
            ) : (
              <div className="admin-page-dialog__url">
                <span className="admin-page-dialog__url-prefix">/</span>
                <input
                  id="page-slug"
                  className="admin-form__input admin-page-dialog__url-input"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((prev) => ({ ...prev, slug: e.target.value.trim().toLowerCase() }));
                    setError('');
                  }}
                  required
                  placeholder="nazev-stranky"
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  spellCheck={false}
                  autoCapitalize="none"
                />
              </div>
            )}
            <p className="admin-form__hint">
              {lockSlug
                ? 'Hlavní stránka je vždy na kořenové adrese /.'
                : 'Jen malá písmena, čísla a pomlčky.'}
            </p>
          </div>

          {error && <p className="admin-error">{error}</p>}

          <div className="admin-modal__actions">
            <button type="button" className="btn btn--outline" onClick={onClose} disabled={saving}>
              Zrušit
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Ukládám…' : isCreate ? 'Vytvořit' : 'Uložit'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
