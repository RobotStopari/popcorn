import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { SITE_TEXT_FIELDS } from '../data/site-texts';
import { subscribeSiteTexts, updateSiteTexts } from '../services/site-texts';

const FORM_ID = 'admin-texts-form';

export default function AdminTextsPage() {
  const { canAccessAdmin, loading } = useAdminAuth();
  const [texts, setTexts] = useState({
    heroQuote: '',
    upcomingIntro: '',
    pastIntro: '',
    blogIntro: '',
  });
  const [listLoading, setListLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    document.title = 'Texty — Admin';
  }, []);

  useEffect(() => {
    if (!canAccessAdmin) return undefined;

    const unsubscribe = subscribeSiteTexts(
      (data) => {
        setTexts(data);
        setListLoading(false);
      },
      () => {
        setListLoading(false);
      },
    );

    return unsubscribe;
  }, [canAccessAdmin]);

  if (loading) {
    return (
      <div className="admin-content">
        <p className="admin-loading">Načítání…</p>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleChange = (id, value) => {
    setTexts((prev) => ({ ...prev, [id]: value }));
    setSaveMessage('');
    setSaveError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmed = {
      heroQuote: texts.heroQuote.trim(),
      upcomingIntro: texts.upcomingIntro.trim(),
      pastIntro: texts.pastIntro.trim(),
      blogIntro: texts.blogIntro.trim(),
    };

    if (!trimmed.heroQuote || !trimmed.upcomingIntro || !trimmed.pastIntro || !trimmed.blogIntro) {
      setSaveError('Všechna pole musí být vyplněná.');
      return;
    }

    setSaving(true);
    setSaveError('');
    setSaveMessage('');

    try {
      await updateSiteTexts(trimmed);
      setTexts(trimmed);
      setSaveMessage('Uloženo.');
    } catch (err) {
      setSaveError(err.message || 'Nepodařilo se uložit texty.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-content container admin-texts-page">
      <header className="admin-content__header admin-content__header--actions admin-texts-page__header">
        <div>
          <h1 className="admin-content__title">Texty</h1>
          <p className="admin-content__subtitle">Úprava textů zobrazených na veřejném webu</p>
        </div>
        {!listLoading && (
          <button
            type="submit"
            form={FORM_ID}
            className="btn btn--primary"
            disabled={saving}
          >
            {saving ? 'Ukládám…' : 'Uložit změny'}
          </button>
        )}
      </header>

      {(saveError || saveMessage) && (
        <p
          className={`admin-texts-page__status${saveError ? ' admin-texts-page__status--error' : ''}`}
          role="status"
        >
          {saveError || saveMessage}
        </p>
      )}

      {listLoading ? (
        <p className="admin-loading">Načítám texty…</p>
      ) : (
        <form id={FORM_ID} className="admin-texts-panel" onSubmit={handleSubmit}>
          {SITE_TEXT_FIELDS.map((field) => (
            <div key={field.id} className="admin-texts-row">
              <div className="admin-texts-row__head">
                <label className="admin-texts-row__label" htmlFor={field.id}>
                  {field.label}
                </label>
                <p className="admin-texts-row__hint">{field.hint}</p>
              </div>
              <textarea
                id={field.id}
                className="admin-form__input admin-texts-row__input"
                rows={field.minRows || 2}
                value={texts[field.id]}
                onChange={(e) => handleChange(field.id, e.target.value)}
                required
              />
            </div>
          ))}
        </form>
      )}
    </div>
  );
}
