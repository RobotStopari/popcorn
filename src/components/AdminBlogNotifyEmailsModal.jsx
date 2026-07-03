import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { normalizeBlogNotifyEmails } from '../data/site-settings';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { subscribeSiteSettings, updateBlogNotifyEmails } from '../services/site-settings';
import { adminText } from '../utils/admin-text';
import AdminModalPanel from './AdminModalPanel';

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <path d="m4 8 8 5 8-5" />
    </svg>
  );
}

function formatRecipientsCount(count) {
  if (count === 1) return '1 adresa';
  if (count >= 2 && count <= 4) return `${count} adresy`;
  return `${count} adres`;
}

export default function AdminBlogNotifyEmailsModal({
  open,
  onClose,
  adminUsers = [],
}) {
  const [emails, setEmails] = useState([]);
  const [draftEmail, setDraftEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [inputError, setInputError] = useState('');
  const { mounted, visible } = useAnimatedPresence(open, 240);

  useEffect(() => {
    if (!open) return undefined;

    setLoading(true);
    setError('');
    setInputError('');
    setDraftEmail('');

    const unsubscribe = subscribeSiteSettings(
      (settings) => {
        setEmails(settings.blogNotifyEmails || []);
        setLoading(false);
      },
      () => {
        setError(adminText('users.notifyEmails.loadFailed'));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [open]);

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
  }, [mounted, saving, onClose]);

  const adminEmails = useMemo(
    () => [...new Set(
      adminUsers
        .filter((item) => item.admin === true)
        .map((item) => String(item.email || '').trim().toLowerCase())
        .filter((email) => isValidEmail(email)),
    )],
    [adminUsers],
  );

  if (!mounted) return null;

  const addEmail = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return false;

    if (!isValidEmail(normalized)) {
      setInputError(adminText('users.notifyEmails.invalidEmail'));
      return false;
    }

    if (emails.includes(normalized)) {
      setInputError(adminText('users.notifyEmails.duplicateEmail'));
      return false;
    }

    if (emails.length >= 50) {
      setInputError(adminText('users.notifyEmails.limitReached'));
      return false;
    }

    setEmails((prev) => [...prev, normalized]);
    setDraftEmail('');
    setInputError('');
    return true;
  };

  const handleAddDraft = () => {
    addEmail(draftEmail);
  };

  const handleAddAdmins = () => {
    const next = normalizeBlogNotifyEmails([...emails, ...adminEmails]);
    setEmails(next);
    setInputError('');
  };

  const handleRemove = (email) => {
    setEmails((prev) => prev.filter((item) => item !== email));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      await updateBlogNotifyEmails(emails);
      onClose();
    } catch {
      setError(adminText('users.notifyEmails.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <div className="admin-blog-notify-emails__footer">
      <button type="button" className="btn btn--outline" onClick={onClose} disabled={saving}>
        {adminText('common.cancel')}
      </button>
      <button
        type="button"
        className="btn btn--primary"
        onClick={handleSave}
        disabled={saving || loading}
      >
        {saving ? adminText('common.saving') : adminText('common.save')}
      </button>
    </div>
  );

  return createPortal(
    <div
      className={`admin-modal admin-modal--wide admin-blog-notify-emails${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-blog-notify-emails-title"
    >
      <div className="admin-modal__backdrop" onClick={saving ? undefined : onClose} aria-hidden="true" />
      <AdminModalPanel
        className="admin-modal__panel--wide admin-blog-notify-emails__panel"
        footer={footer}
      >
        <header className="admin-blog-notify-emails__header">
          <span className="admin-blog-notify-emails__eyebrow">
            <MailIcon />
            {adminText('users.notifyEmails.eyebrow')}
          </span>
          <h2 id="admin-blog-notify-emails-title" className="admin-blog-notify-emails__title">
            {adminText('users.notifyEmails.title')}
          </h2>
          <p className="admin-blog-notify-emails__intro">
            {adminText('users.notifyEmails.description')}
          </p>
        </header>

        {loading ? (
          <p className="admin-loading admin-blog-notify-emails__loading">{adminText('common.loading')}</p>
        ) : (
          <div className="admin-blog-notify-emails__body">
            <section className="admin-blog-notify-emails__controls" aria-label={adminText('users.notifyEmails.title')}>
              <div className="admin-blog-notify-emails__add">
                <input
                  type="email"
                  className="admin-form__input admin-blog-notify-emails__input"
                  placeholder={adminText('users.notifyEmails.inputPlaceholder')}
                  value={draftEmail}
                  onChange={(event) => {
                    setDraftEmail(event.target.value);
                    if (inputError) setInputError('');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleAddDraft();
                    }
                  }}
                  disabled={saving}
                />
                <button
                  type="button"
                  className="btn btn--primary admin-blog-notify-emails__add-btn"
                  onClick={handleAddDraft}
                  disabled={saving}
                >
                  {adminText('common.add')}
                </button>
              </div>

              {inputError && (
                <p className="admin-error admin-blog-notify-emails__field-error" role="alert">
                  {inputError}
                </p>
              )}

              {adminEmails.length > 0 && (
                <button
                  type="button"
                  className="btn btn--outline admin-blog-notify-emails__add-admins"
                  onClick={handleAddAdmins}
                  disabled={saving}
                >
                  {adminText('users.notifyEmails.addAdminsButton')}
                </button>
              )}
            </section>

            <section className="admin-blog-notify-emails__recipients" aria-labelledby="admin-blog-notify-recipients-title">
              <div className="admin-blog-notify-emails__recipients-head">
                <h3 id="admin-blog-notify-recipients-title" className="admin-blog-notify-emails__recipients-title">
                  {adminText('users.notifyEmails.recipientsHeading')}
                </h3>
                <span className="admin-blog-notify-emails__count">
                  {formatRecipientsCount(emails.length)}
                </span>
              </div>

              {emails.length > 0 ? (
                <ul className="admin-blog-notify-emails__list">
                  {emails.map((email) => (
                    <li key={email} className="admin-blog-notify-emails__item">
                      <span className="admin-blog-notify-emails__email">{email}</span>
                      <button
                        type="button"
                        className="admin-blog-notify-emails__remove"
                        aria-label={adminText('users.notifyEmails.removeAria', { email })}
                        onClick={() => handleRemove(email)}
                        disabled={saving}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-blog-notify-emails__empty">{adminText('users.notifyEmails.empty')}</p>
              )}
            </section>
          </div>
        )}

        {error && <p className="admin-error admin-blog-notify-emails__error" role="alert">{error}</p>}
      </AdminModalPanel>
    </div>,
    document.body,
  );
}
