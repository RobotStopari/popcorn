import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BRAND_LINK_FIELDS, SITE_OPTION_TOGGLES } from '../data/site-settings';
import { SOCIAL_LINK_PRESETS } from '../data/social-link-presets';
import AdminModalPanel from './AdminModalPanel';

function SiteOptionConfirmDialog({
  open,
  title,
  text,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeydown = (event) => {
      if (event.key === 'Escape') onCancel();
    };

    document.body.classList.add('admin-modal-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('admin-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="admin-modal admin-modal--confirm admin-modal--visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-site-option-confirm-title"
    >
      <div className="admin-modal__backdrop" onClick={onCancel} aria-hidden="true" />
      <AdminModalPanel className="admin-modal__panel--compact">
        <h2 id="admin-site-option-confirm-title" className="admin-modal__title">{title}</h2>
        <p className="admin-modal__text">{text}</p>
        <div className="admin-modal__actions">
          <button type="button" className="btn btn--outline" onClick={onCancel}>
            Zrušit
          </button>
          <button type="button" className="btn btn--primary" onClick={onConfirm}>
            Potvrdit
          </button>
        </div>
      </AdminModalPanel>
    </div>,
    document.body,
  );
}

export default function AdminSiteOptionToggles({ settings, onChange }) {
  const [pendingToggle, setPendingToggle] = useState(null);

  const requestToggle = (option) => {
    const nextValue = !settings[option.id];
    const confirmCopy = nextValue ? option.confirmOn : option.confirmOff;
    setPendingToggle({
      optionId: option.id,
      nextValue,
      title: confirmCopy.title,
      text: confirmCopy.text,
    });
  };

  const handleConfirm = () => {
    if (!pendingToggle) return;
    onChange({ [pendingToggle.optionId]: pendingToggle.nextValue });
    setPendingToggle(null);
  };

  return (
    <>
      <div className="admin-site-options">
        {SITE_OPTION_TOGGLES.map((option) => {
          const enabled = Boolean(settings[option.id]);

          return (
            <article key={option.id} className="admin-site-options__row">
              <div className="admin-site-options__copy">
                <span className="admin-site-options__label">{option.label}</span>
                <p className="admin-settings__hint">{option.hint}</p>
              </div>
              <label
                className="admin-toggle admin-site-options__toggle"
                onClick={(event) => {
                  event.preventDefault();
                  requestToggle(option);
                }}
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  readOnly
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <span className="admin-toggle__track" aria-hidden="true">
                  <span className="admin-toggle__thumb" />
                </span>
                <span className="admin-toggle__label" id={`site-option-${option.id}-label`}>
                  {enabled ? 'Zapnuto' : 'Vypnuto'}
                </span>
              </label>
            </article>
          );
        })}
      </div>

      <SiteOptionConfirmDialog
        open={Boolean(pendingToggle)}
        title={pendingToggle?.title || ''}
        text={pendingToggle?.text || ''}
        onConfirm={handleConfirm}
        onCancel={() => setPendingToggle(null)}
      />
    </>
  );
}

export function AdminBrandLinkFields({ brandLinks, onChange }) {
  return (
    <div className="admin-brand-links">
      {BRAND_LINK_FIELDS.map((field) => {
        const preset = SOCIAL_LINK_PRESETS[field.id];
        if (!preset) return null;

        return (
          <label key={field.id} className="admin-brand-links__row" htmlFor={`brand-link-${field.id}`}>
            <span className="admin-brand-links__label">
              <span
                className={`admin-brand-links__icon social-btn--${field.id}`}
                dangerouslySetInnerHTML={{ __html: preset.icon }}
                aria-hidden="true"
              />
              {field.label}
            </span>
            <input
              id={`brand-link-${field.id}`}
              type="text"
              className="admin-form__input admin-brand-links__input"
              value={brandLinks[field.id] || ''}
              onChange={(event) => onChange({
                brandLinks: {
                  ...brandLinks,
                  [field.id]: event.target.value,
                },
              })}
              placeholder={field.id === 'mail' ? 'mailto:…' : 'https://…'}
            />
          </label>
        );
      })}
    </div>
  );
}
