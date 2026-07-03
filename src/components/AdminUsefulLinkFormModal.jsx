import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import {
  formStateToUsefulLinkPayload,
  getDefaultUsefulLinkFormState,
  MAX_USEFUL_LINK_DESCRIPTION,
  usefulLinkToFormState,
  validateUsefulLinkForm,
} from '../utils/useful-link-format';
import { MAX_KEYWORDS } from '../utils/keywords-format';
import { adminText } from '../utils/admin-text';
import AdminModalPanel from './AdminModalPanel';

function FieldGroup({ label, required = false, children, hint, error }) {
  return (
    <div className="admin-form__group">
      {label && (
        <label className="admin-form__label">
          {label}
          {required && <span className="admin-form__required">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="admin-form__hint">{hint}</p>}
      {error && <p className="admin-form__error">{error}</p>}
    </div>
  );
}

export default function AdminUsefulLinkFormModal({
  open,
  link,
  onClose,
  onSave,
  saveError = '',
}) {
  const [form, setForm] = useState(getDefaultUsefulLinkFormState());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { mounted, visible } = useAnimatedPresence(open, 240);

  useEffect(() => {
    if (!open) return;
    setForm(link ? usefulLinkToFormState(link) : getDefaultUsefulLinkFormState());
    setErrors({});
    setSaving(false);
  }, [open, link?.id]);

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

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateUsefulLinkForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    const ok = await onSave(formStateToUsefulLinkPayload(form));
    setSaving(false);
    if (ok) onClose();
  };

  return createPortal(
    <div
      className={`admin-modal${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-useful-link-form-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <AdminModalPanel>
        <h2 id="admin-useful-link-form-title" className="admin-modal__title">
          {link
            ? adminText('usefulLinks.form.editTitle')
            : adminText('usefulLinks.form.newTitle')}
        </h2>

        <form className="admin-form" onSubmit={handleSubmit}>
          <FieldGroup label={adminText('usefulLinks.form.titleLabel')} required error={errors.title}>
            <input
              type="text"
              className="admin-form__input"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder={adminText('usefulLinks.form.titlePlaceholder')}
              maxLength={120}
            />
          </FieldGroup>

          <FieldGroup label={adminText('usefulLinks.form.urlLabel')} required error={errors.url}>
            <input
              type="url"
              className="admin-form__input"
              value={form.url}
              onChange={(e) => updateField('url', e.target.value)}
              placeholder="https://"
              inputMode="url"
            />
            <p className="admin-form__hint">{adminText('usefulLinks.form.urlHint')}</p>
          </FieldGroup>

          <FieldGroup label={adminText('usefulLinks.form.descriptionLabel')} error={errors.description}>
            <textarea
              className="admin-form__input admin-form__textarea"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder={adminText('usefulLinks.form.descriptionPlaceholder')}
              maxLength={MAX_USEFUL_LINK_DESCRIPTION}
              rows={4}
            />
          </FieldGroup>

          <FieldGroup
            label={adminText('usefulLinks.form.keywordsLabel')}
            hint={adminText('usefulLinks.form.keywordsHint', { max: MAX_KEYWORDS })}
            error={errors.keywordsInput}
          >
            <input
              type="text"
              className="admin-form__input"
              value={form.keywordsInput}
              onChange={(e) => updateField('keywordsInput', e.target.value)}
              placeholder={adminText('usefulLinks.form.keywordsPlaceholder')}
            />
          </FieldGroup>

          {(saveError || Object.keys(errors).length > 0) && (
            <p className="admin-error">{saveError || adminText('usefulLinks.form.validationFailed')}</p>
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
      </AdminModalPanel>
    </div>,
    document.body,
  );
}
