import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import {
  MAX_RESOURCE_CATEGORIES,
  RESOURCE_CATEGORY_TYPES,
  createResourceCategoryId,
  normalizeResourceCategoriesList,
  normalizeResourceCategoryItem,
} from '../data/resource-categories';
import { DEFAULT_SITE_SETTINGS } from '../data/site-settings';
import { subscribeSiteSettings, updateResourceCategories } from '../services/site-settings';
import AdminModalPanel from './AdminModalPanel';
import { adminText } from '../utils/admin-text';

function emptyCategory() {
  return {
    id: createResourceCategoryId(),
    label: '',
  };
}

export default function AdminResourceCategoriesModal({
  open,
  onClose,
  type,
}) {
  const meta = RESOURCE_CATEGORY_TYPES[type];
  const { mounted, visible } = useAnimatedPresence(open, 240);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open || !meta) return undefined;

    setLoading(true);
    setError('');
    setMessage('');

    const unsubscribe = subscribeSiteSettings(
      (data) => {
        setCategories(normalizeResourceCategoriesList(data[meta.settingsKey]).map((item) => ({ ...item })));
        setLoading(false);
      },
      () => {
        setCategories(normalizeResourceCategoriesList(DEFAULT_SITE_SETTINGS[meta.settingsKey]));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [open, meta]);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (event) => {
      if (event.key === 'Escape' && !saving) onClose();
    };

    document.body.classList.add('admin-modal-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('admin-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [mounted, onClose, saving]);

  if (!mounted || !meta) return null;

  const updateCategory = (index, patch) => {
    setCategories((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    setMessage('');
    setError('');
  };

  const moveCategory = (index, direction) => {
    setCategories((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
    setMessage('');
    setError('');
  };

  const removeCategory = (index) => {
    const label = categories[index]?.label?.trim() || 'tuto kategorii';
    if (!window.confirm(`Opravdu smazat „${label}“? Položky v této kategorii zůstanou bez kategorie.`)) {
      return;
    }
    setCategories((prev) => prev.filter((_, i) => i !== index));
    setMessage('');
    setError('');
  };

  const addCategory = () => {
    if (categories.length >= MAX_RESOURCE_CATEGORIES) {
      setError(`Maximum je ${MAX_RESOURCE_CATEGORIES} kategorií.`);
      return;
    }
    setCategories((prev) => [...prev, emptyCategory()]);
    setMessage('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    const normalized = categories
      .map((item) => normalizeResourceCategoryItem(item))
      .filter(Boolean);

    if (normalized.length !== categories.length) {
      setError('Každá kategorie musí mít vyplněný název.');
      setSaving(false);
      return;
    }

    const ids = normalized.map((item) => item.id);
    if (new Set(ids).size !== ids.length) {
      setError('Každá kategorie musí mít unikátní identifikátor.');
      setSaving(false);
      return;
    }

    try {
      await updateResourceCategories(type, normalized);
      setCategories(normalized.map((item) => ({ ...item })));
      setMessage(normalized.length ? 'Kategorie uloženy.' : 'Kategorie odstraněny.');
    } catch (err) {
      setError(err.message || 'Uložení se nezdařilo.');
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <div className="admin-page-form-modal__footer">
      {(error || message) && (
        <p
          className={`admin-texts-page__status${error ? ' admin-texts-page__status--error' : ''}`}
          role="status"
        >
          {error || message}
        </p>
      )}
      <div className="admin-modal__actions admin-page-form-modal__actions">
        <button type="button" className="btn btn--outline" onClick={onClose} disabled={saving}>
          {adminText('common.cancel')}
        </button>
        <button
          type="submit"
          form={`admin-resource-categories-${type}`}
          className="btn btn--primary"
          disabled={saving || loading}
        >
          {saving ? adminText('common.saving') : adminText('common.save')}
        </button>
      </div>
    </div>
  );

  return createPortal(
    <div
      className={`admin-modal admin-resource-categories-modal${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`admin-resource-categories-title-${type}`}
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <AdminModalPanel className="admin-modal__panel--page-settings" footer={footer}>
        <h2 id={`admin-resource-categories-title-${type}`} className="admin-modal__title">
          {meta.title}
        </h2>
        <p className="admin-modal__subtitle">{meta.subtitle}</p>

        {loading ? (
          <p className="admin-loading">{adminText('common.loading')}</p>
        ) : (
          <form
            id={`admin-resource-categories-${type}`}
            className="admin-form admin-resource-categories-editor"
            onSubmit={handleSubmit}
          >
            {categories.length === 0 ? (
              <p className="admin-resource-categories-editor__empty">{meta.emptyHint}</p>
            ) : (
              <ul className="admin-resource-categories-editor__list" aria-label="Kategorie">
                {categories.map((category, index) => (
                  <li key={category.id} className="admin-resource-categories-editor__item">
                    <span className="admin-resource-categories-editor__index" aria-hidden="true">
                      {index + 1}
                    </span>
                    <input
                      id={`resource-category-label-${category.id}`}
                      type="text"
                      className="admin-form__input admin-resource-categories-editor__input"
                      value={category.label}
                      onChange={(event) => updateCategory(index, { label: event.target.value })}
                      placeholder="Název kategorie"
                      aria-label={`Název kategorie ${index + 1}`}
                      required
                      disabled={saving}
                    />
                    <div className="admin-resource-categories-editor__item-actions">
                      <button
                        type="button"
                        className="admin-resource-categories-editor__icon-btn"
                        onClick={() => moveCategory(index, -1)}
                        disabled={saving || index === 0}
                        aria-label="Posunout nahoru"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="admin-resource-categories-editor__icon-btn"
                        onClick={() => moveCategory(index, 1)}
                        disabled={saving || index === categories.length - 1}
                        aria-label="Posunout dolů"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="admin-resource-categories-editor__icon-btn admin-resource-categories-editor__delete"
                        onClick={() => removeCategory(index)}
                        disabled={saving}
                        aria-label={`Smazat kategorii ${category.label?.trim() || index + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="admin-resource-categories-editor__toolbar">
              <button
                type="button"
                className="btn btn--outline"
                onClick={addCategory}
                disabled={saving || categories.length >= MAX_RESOURCE_CATEGORIES}
              >
                Přidat kategorii
              </button>
            </div>
          </form>
        )}
      </AdminModalPanel>
    </div>,
    document.body,
  );
}
