import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { useAutosaveRunner } from '../hooks/useAutosaveRunner';
import { getAutosaveFormHandlers, nextDraftFlag } from '../utils/autosave';
import {
  formStateToPublicationPayload,
  getDefaultPublicationFormState,
  MAX_PUBLICATION_DESCRIPTION,
  publicationToFormState,
  validatePublicationForm,
} from '../utils/publication-format';
import { MAX_KEYWORDS } from '../utils/keywords-format';
import { adminText } from '../utils/admin-text';
import AdminFormBlock from './AdminFormBlock';
import AdminModalPanel from './AdminModalPanel';
import AutosaveStatus from './AutosaveStatus';
import ResourceCategorySelect from './ResourceCategorySelect';

function FieldGroup({ label, htmlFor, required = false, children, hint, error }) {
  return (
    <div className="admin-form__group">
      {label && (
        <label className="admin-form__label" htmlFor={htmlFor}>
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

export default function AdminPublicationFormModal({
  open,
  publication,
  onClose,
  onSave,
  saveError = '',
}) {
  const [form, setForm] = useState(getDefaultPublicationFormState());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const skipFormResetRef = useRef(false);
  const formRef = useRef(form);
  const { run: runAutosave, remember: rememberAutosave, status: autosaveStatus } = useAutosaveRunner();
  const { mounted, visible } = useAnimatedPresence(open, 240);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    if (!open) return;
    if (skipFormResetRef.current) {
      skipFormResetRef.current = false;
      return;
    }
    const next = publication ? publicationToFormState(publication) : getDefaultPublicationFormState();
    setForm(next);
    formRef.current = next;
    rememberAutosave(formStateToPublicationPayload(next));
    setErrors({});
    setSaving(false);
  }, [open, publication?.id, rememberAutosave]);

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
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      formRef.current = next;
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const persistPublication = async ({ close = false } = {}) => {
    const current = formRef.current;
    if (close) {
      const nextErrors = validatePublicationForm(current);
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return false;
      }
    }

    const payload = {
      ...formStateToPublicationPayload(current),
      draft: nextDraftFlag(publication, { close }),
    };
    skipFormResetRef.current = true;
    if (close) setSaving(true);
    const ok = await runAutosave(payload, () => onSave(payload, { silent: !close }));
    if (close) setSaving(false);
    if (close && ok) onClose();
    return ok;
  };

  const persistSoon = () => {
    persistPublication();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await persistPublication({ close: true });
  };

  return createPortal(
    <div
      className={`admin-modal admin-modal--wide admin-modal--event-form admin-modal--resource-form${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-publication-form-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <AdminModalPanel className="admin-modal__panel--wide admin-modal__panel--event-form">
        <header className="admin-event-modal__header">
          <div className="admin-event-modal__header-copy">
            <p className="admin-event-modal__eyebrow">
              {publication
                ? adminText('publications.form.editEyebrow')
                : adminText('publications.form.newEyebrow')}
            </p>
            <h2 id="admin-publication-form-title" className="admin-modal__title admin-event-modal__title">
              {publication
                ? adminText('publications.form.editTitle')
                : adminText('publications.form.newTitle')}
            </h2>
            <p className="admin-event-modal__lede">
              {adminText('publications.form.lede')}
            </p>
          </div>
        </header>

        <form
          className="admin-form admin-form--event"
          onSubmit={handleSubmit}
          {...getAutosaveFormHandlers(persistSoon)}
        >
          <div className="admin-event-tab">
            <AdminFormBlock
              title={adminText('publications.form.blockBook')}
              hint={adminText('publications.form.blockBookHint')}
              accent="identity"
            >
              <FieldGroup label={adminText('publications.form.titleLabel')} required error={errors.title}>
                <input
                  type="text"
                  className="admin-form__input"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder={adminText('publications.form.titlePlaceholder')}
                  maxLength={120}
                />
              </FieldGroup>

              <FieldGroup label={adminText('publications.form.authorLabel')} error={errors.author}>
                <input
                  type="text"
                  className="admin-form__input"
                  value={form.author}
                  onChange={(e) => updateField('author', e.target.value)}
                  placeholder={adminText('publications.form.authorPlaceholder')}
                  maxLength={120}
                />
              </FieldGroup>
            </AdminFormBlock>

            <AdminFormBlock
              title={adminText('publications.form.blockCopy')}
              hint={adminText('publications.form.blockCopyHint')}
              accent="copy"
            >
              <FieldGroup label={adminText('publications.form.descriptionLabel')} error={errors.description}>
                <textarea
                  className="admin-form__input admin-form__textarea"
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder={adminText('publications.form.descriptionPlaceholder')}
                  maxLength={MAX_PUBLICATION_DESCRIPTION}
                  rows={4}
                />
              </FieldGroup>
            </AdminFormBlock>

            <AdminFormBlock
              title={adminText('publications.form.blockMeta')}
              hint={adminText('publications.form.blockMetaHint')}
              accent="place"
            >
              <FieldGroup
                label={adminText('publications.form.categoryLabel')}
                htmlFor="publication-category"
              >
                <ResourceCategorySelect
                  type="publication"
                  id="publication-category"
                  value={form.categoryId}
                  onChange={(value) => {
                    updateField('categoryId', value);
                    persistSoon();
                  }}
                  disabled={saving}
                />
              </FieldGroup>

              <FieldGroup
                label={adminText('publications.form.keywordsLabel')}
                hint={adminText('publications.form.keywordsHint', { max: MAX_KEYWORDS })}
                error={errors.keywordsInput}
              >
                <input
                  type="text"
                  className="admin-form__input"
                  value={form.keywordsInput}
                  onChange={(e) => updateField('keywordsInput', e.target.value)}
                  placeholder={adminText('publications.form.keywordsPlaceholder')}
                />
              </FieldGroup>
            </AdminFormBlock>
          </div>

          {(saveError || Object.keys(errors).length > 0) && (
            <p className="admin-error admin-form__error">{saveError || adminText('publications.form.validationFailed')}</p>
          )}

          <div className="admin-modal__actions admin-event-modal__actions">
            <AutosaveStatus status={autosaveStatus} />
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
