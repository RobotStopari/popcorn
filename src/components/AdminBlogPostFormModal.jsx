import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import {
  blogPostToFormState,
  buildAuthorSnapshot,
  formStateToBlogPayload,
  suggestSlugFromTitle,
  validateBlogForm,
} from '../utils/blog-post-format';
import AdminBlogPostCommentsSection from './AdminBlogPostCommentsSection';
import BlogAuthor from './BlogAuthor';
import RichTextEditor from './RichTextEditor';
import UserCombobox from './UserCombobox';

function FieldGroup({ label, required = false, children, hint }) {
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
    </div>
  );
}

export default function AdminBlogPostFormModal({
  open,
  post,
  author,
  allowAuthorPick = false,
  users = [],
  defaultAuthorUid = '',
  onClose,
  onSave,
  saveError = '',
}) {
  const [form, setForm] = useState(blogPostToFormState());
  const [authorUid, setAuthorUid] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { mounted, visible } = useAnimatedPresence(open, 240);

  const eligibleUsers = useMemo(
    () => users.filter((user) => user.name?.trim()),
    [users],
  );

  const previewAuthor = useMemo(() => {
    if (allowAuthorPick && authorUid) {
      const picked = eligibleUsers.find((user) => (user.id || user.uid) === authorUid);
      if (picked) {
        return buildAuthorSnapshot(picked, {
          uid: picked.id || picked.uid,
          displayName: picked.displayName,
          photoURL: picked.photoURL,
          email: picked.email,
        });
      }
    }
    return author;
  }, [allowAuthorPick, author, authorUid, eligibleUsers]);

  useEffect(() => {
    if (!open) return;
    setForm(blogPostToFormState(post));
    setAuthorUid(post?.author?.uid || defaultAuthorUid || '');
    setSlugTouched(Boolean(post?.slug));
    setError('');
    setSaving(false);
  }, [open, post, defaultAuthorUid]);

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

      if (field === 'title' && !slugTouched) {
        next.slug = suggestSlugFromTitle(value);
      }

      return next;
    });
  };

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();

    const validationError = validateBlogForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (allowAuthorPick && !authorUid) {
      setError('Vyberte autora příspěvku.');
      return;
    }

    setSaving(true);
    setError('');

    const ok = await onSave(
      formStateToBlogPayload(form),
      allowAuthorPick ? { authorUid } : undefined,
    );
    setSaving(false);

    if (ok) onClose();
  };

  return createPortal(
    <div
      className={`admin-modal admin-modal--wide${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-blog-post-form-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="admin-modal__panel admin-modal__panel--wide">
        <header className="admin-event-modal__header">
          <div>
            <p className="admin-event-modal__eyebrow">{post ? 'Úprava příspěvku' : 'Nový příspěvek'}</p>
            <h2 id="admin-blog-post-form-title" className="admin-modal__title admin-event-modal__title">
              {post ? 'Upravit blogový příspěvek' : 'Nový blogový příspěvek'}
            </h2>
          </div>
        </header>

        <form className="admin-form admin-form--event" onSubmit={handleSubmit}>
          <div className="admin-event-tab">
            <FieldGroup label="Název příspěvku" required>
              <input
                type="text"
                className="admin-form__input"
                value={form.title}
                maxLength={200}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Např. Jak jsme prožili letní setkání"
                required
              />
            </FieldGroup>

            <FieldGroup
              label="URL příspěvku"
              hint="Adresa pod /blog/… — jen malá písmena, čísla a pomlčky."
              required
            >
              <input
                type="text"
                className="admin-form__input"
                value={form.slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  updateField('slug', event.target.value);
                }}
                placeholder="jak-jsme-prozili-letni-setkani"
                required
              />
            </FieldGroup>

            <FieldGroup
              label="Klíčová slova"
              hint="Volitelné, oddělená čárkou. Maximálně 15."
            >
              <input
                type="text"
                className="admin-form__input"
                value={form.keywordsInput}
                onChange={(event) => updateField('keywordsInput', event.target.value)}
                placeholder="komunita, setkání, inspirace"
              />
            </FieldGroup>

            <FieldGroup label="Text příspěvku" required>
              <RichTextEditor
                id={post ? `blog-post-body-${post.id}` : 'blog-post-body-new'}
                value={form.body}
                onChange={(value) => updateField('body', value)}
                tone="content"
              />
            </FieldGroup>

            {allowAuthorPick ? (
              <FieldGroup label="Autor příspěvku" required>
                <UserCombobox
                  id={post ? `blog-post-author-${post.id}` : 'blog-post-author-new'}
                  users={eligibleUsers}
                  value={authorUid}
                  onChange={setAuthorUid}
                  required
                />
              </FieldGroup>
            ) : (
              previewAuthor && (
                <FieldGroup label={post ? 'Autor' : 'Autor příspěvku'}>
                  <BlogAuthor author={previewAuthor} size="medium" className="admin-blog-form__author" />
                </FieldGroup>
              )
            )}
          </div>

          {post && (
            <AdminBlogPostCommentsSection post={post} />
          )}

          {(error || saveError) && <p className="admin-error admin-form__error">{error || saveError}</p>}

          <div className="admin-modal__actions admin-event-modal__actions">
            <button type="button" className="btn btn--outline" onClick={onClose} disabled={saving}>
              Zrušit
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Ukládám…' : post ? 'Uložit změny' : 'Vytvořit příspěvek'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
