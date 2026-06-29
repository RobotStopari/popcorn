import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import {
  DEFAULT_SITE_SETTINGS,
  EVENT_CATEGORY_FIELDS,
} from '../data/site-settings';
import { subscribeSiteSettings, updateEventCategorySettings } from '../services/site-settings';
import AdminModalPanel from './AdminModalPanel';
import { adminText } from '../utils/admin-text';

export default function AdminEventSettingsModal({ open, onClose }) {
  const { mounted, visible } = useAnimatedPresence(open, 240);
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return undefined;

    setLoading(true);
    setError('');
    setMessage('');

    const unsubscribe = subscribeSiteSettings(
      (data) => {
        setSettings(data);
        setLoading(false);
      },
      () => {
        setSettings(DEFAULT_SITE_SETTINGS);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [open]);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.classList.add('admin-modal-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('admin-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  const handleChange = (fieldId, value) => {
    setSettings((prev) => ({ ...prev, [fieldId]: value }));
    setMessage('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    const payload = EVENT_CATEGORY_FIELDS.reduce((acc, field) => {
      acc[field.id] = settings[field.id]?.trim() || '';
      return acc;
    }, {});

    const missingField = EVENT_CATEGORY_FIELDS.find((field) => !payload[field.id]);
    if (missingField) {
      setError('Vyplňte všechna pole kategorií akcí.');
      setSaving(false);
      return;
    }

    try {
      await updateEventCategorySettings(payload);
      setMessage('Kategorie akcí uloženy.');
    } catch (err) {
      setError(err.message || 'Uložení se nezdařilo.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className={`admin-modal admin-event-settings-modal${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-event-settings-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <AdminModalPanel className="admin-modal__panel--page">
        <h2 id="admin-event-settings-title" className="admin-modal__title">
          Nastavení kategorií akcí
        </h2>
        <p className="admin-modal__subtitle">
          Názvy a popisy kategorií se zobrazují na kartách, v kalendáři i na stránkách akcí.
        </p>

        {loading ? (
          <p className="admin-loading">{adminText('common.loading')}</p>
        ) : (
          <form className="admin-form admin-texts" onSubmit={handleSubmit}>
            <div className="admin-texts__section-body">
              {EVENT_CATEGORY_FIELDS.map((field) => (
                <div key={field.id} className="admin-texts-row">
                  <div className="admin-texts-row__head">
                    <label className="admin-texts-row__label" htmlFor={field.id}>
                      {field.label}
                    </label>
                    <p className="admin-texts-row__hint">{field.hint}</p>
                  </div>
                  {field.inputType === 'text' ? (
                    <input
                      id={field.id}
                      type="text"
                      className="admin-form__input admin-texts-row__input admin-texts-row__input--text"
                      value={settings[field.id] || ''}
                      onChange={(event) => handleChange(field.id, event.target.value)}
                      required
                    />
                  ) : (
                    <textarea
                      id={field.id}
                      className="admin-form__input admin-texts-row__input"
                      rows={2}
                      value={settings[field.id] || ''}
                      onChange={(event) => handleChange(field.id, event.target.value)}
                      required
                    />
                  )}
                </div>
              ))}
            </div>

            {(error || message) && (
              <p className={`admin-texts-page__status${error ? ' admin-texts-page__status--error' : ''}`} role="status">
                {error || message}
              </p>
            )}

            <div className="admin-modal__actions">
              <button type="button" className="btn btn--outline" onClick={onClose} disabled={saving}>
                {adminText('common.cancel')}
              </button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? adminText('common.saving') : adminText('common.save')}
              </button>
            </div>
          </form>
        )}
      </AdminModalPanel>
    </div>,
    document.body,
  );
}
