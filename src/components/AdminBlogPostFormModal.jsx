import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { BLOG_GALLERY_MAX, BLOG_GALLERY_UPLOAD_HINT } from '../data/blog-images';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import {
  blogPostToFormState,
  buildAuthorSnapshot,
  buildExternalAuthorSnapshot,
  formStateToBlogPayload,
  suggestSlugFromTitle,
  validateBlogForm,
} from '../utils/blog-post-format';
import { adminText } from '../utils/admin-text';
import AdminBlogPostCommentsSection from './AdminBlogPostCommentsSection';
import AdminFormBlock from './AdminFormBlock';
import AdminModalPanel from './AdminModalPanel';
import BlogAuthor from './BlogAuthor';
import BlogCoverUpload, { createCoverPatternSeed } from './BlogCoverUpload';
import { resolveCoverPatternSeed } from '../utils/event-cover-pattern';
import EventImageUploadList from './EventImageUploadList';
import ResourceCategorySelect from './ResourceCategorySelect';
import RichTextEditor from './RichTextEditor';
import UserCombobox from './UserCombobox';

function FieldGroup({ label, htmlFor, required = false, children, hint }) {
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
    </div>
  );
}

export default function AdminBlogPostFormModal({
  open,
  post,
  author,
  allowAuthorPick = false,
  allowExternalPosts = false,
  users = [],
  posts = [],
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
  const [coverPatternSeed, setCoverPatternSeed] = useState(() => createCoverPatternSeed('blog-cover'));
  const { mounted, visible } = useAnimatedPresence(open, 240);

  const eligibleUsers = useMemo(
    () => users.filter((user) => user.name?.trim()),
    [users],
  );

  const previewAuthor = useMemo(() => {
    if (form.isExternal) {
      return buildExternalAuthorSnapshot(form.externalAuthorName);
    }

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
  }, [allowAuthorPick, author, authorUid, eligibleUsers, form.externalAuthorName, form.isExternal]);

  useEffect(() => {
    if (!open) return;
    setForm(blogPostToFormState(post));
    setAuthorUid(post?.author?.uid || defaultAuthorUid || '');
    setSlugTouched(Boolean(post?.slug));
    setCoverPatternSeed(
      post
        ? resolveCoverPatternSeed(post.coverPatternSeed, post.id, post.slug)
        : createCoverPatternSeed('blog-cover'),
    );
    setError('');
    setSaving(false);
  }, [open, post?.id, defaultAuthorUid]);

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

      if (field === 'title' && !slugTouched && !prev.isExternal) {
        next.slug = suggestSlugFromTitle(value);
      }

      return next;
    });
  };

  const toggleExternal = (enabled) => {
    setForm((prev) => ({
      ...prev,
      isExternal: enabled,
      ...(enabled
        ? {
          galleryImages: [],
          externalAuthorName: prev.externalAuthorName || prev.title ? '' : prev.externalAuthorName,
        }
        : {
          externalUrl: '',
          externalAuthorName: '',
        }),
    }));
  };

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();

    const validationError = validateBlogForm(form, { allowExternal: allowExternalPosts });
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!form.isExternal && allowAuthorPick && !authorUid) {
      setError(adminText('blog.form.pickAuthor'));
      return;
    }

    setSaving(true);
    setError('');

    let resolvedAuthor = previewAuthor;
    if (form.isExternal) {
      resolvedAuthor = buildExternalAuthorSnapshot(form.externalAuthorName);
    }

    const payload = formStateToBlogPayload({
      ...form,
      coverPatternSeed,
    }, {
      author: resolvedAuthor,
      posts,
      excludeId: post?.id || null,
    });

    const ok = await onSave(
      payload,
      form.isExternal
        ? { isExternal: true }
        : (allowAuthorPick ? { authorUid } : undefined),
    );
    setSaving(false);

    if (ok) onClose();
  };

  const isExternal = form.isExternal && allowExternalPosts;

  return createPortal(
    <div
      className={`admin-modal admin-modal--wide admin-modal--event-form${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-blog-post-form-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <AdminModalPanel className="admin-modal__panel--wide admin-modal__panel--event-form">
        <header className="admin-event-modal__header">
          <div className="admin-event-modal__header-copy">
            <p className="admin-event-modal__eyebrow">
              {post ? adminText('blog.form.editEyebrow') : adminText('blog.form.newEyebrow')}
            </p>
            <h2 id="admin-blog-post-form-title" className="admin-modal__title admin-event-modal__title">
              {post ? adminText('blog.form.editTitle') : adminText('blog.form.newTitle')}
            </h2>
            <p className="admin-event-modal__lede">
              {adminText('blog.form.lede')}
            </p>
          </div>
        </header>

        <form className="admin-form admin-form--event" onSubmit={handleSubmit}>
          <div className="admin-event-tab">
            <AdminFormBlock
              title={adminText('blog.form.blockPost')}
              hint={adminText('blog.form.blockPostHint')}
              accent="identity"
            >
              {allowExternalPosts && (
                <div className="admin-blog-form__toggles">
                  <label className="admin-toggle">
                    <input
                      type="checkbox"
                      checked={form.isExternal}
                      onChange={(event) => toggleExternal(event.target.checked)}
                    />
                    <span className="admin-toggle__track" aria-hidden="true">
                      <span className="admin-toggle__thumb" />
                    </span>
                    <span className="admin-toggle__label">{adminText('blog.form.externalToggle')}</span>
                  </label>
                  {isExternal && (
                    <p className="admin-form__hint">
                      {adminText('blog.form.externalHint')}
                    </p>
                  )}
                </div>
              )}

              <FieldGroup label={adminText('blog.form.titleLabel')} required>
                <input
                  type="text"
                  className="admin-form__input"
                  value={form.title}
                  maxLength={200}
                  onChange={(event) => updateField('title', event.target.value)}
                  placeholder={adminText('blog.form.titlePlaceholder')}
                  required
                />
              </FieldGroup>

              {isExternal ? (
                <FieldGroup
                  label={adminText('blog.form.externalUrlLabel')}
                  hint={adminText('blog.form.externalUrlHint')}
                  required
                >
                  <input
                    type="url"
                    className="admin-form__input"
                    value={form.externalUrl}
                    onChange={(event) => updateField('externalUrl', event.target.value)}
                    placeholder={adminText('blog.form.externalUrlPlaceholder')}
                    required
                  />
                </FieldGroup>
              ) : (
                <FieldGroup
                  label={adminText('blog.form.slugLabel')}
                  hint={adminText('blog.form.slugHint')}
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
                    placeholder={adminText('blog.form.slugPlaceholder')}
                    required
                  />
                </FieldGroup>
              )}

              <FieldGroup
                label={adminText('blog.form.categoryLabel')}
                htmlFor="blog-post-category"
              >
                <ResourceCategorySelect
                  type="blog"
                  id="blog-post-category"
                  value={form.categoryId}
                  onChange={(value) => updateField('categoryId', value)}
                  disabled={saving}
                />
              </FieldGroup>

              <FieldGroup
                label={adminText('blog.form.keywordsLabel')}
                hint={adminText('blog.form.keywordsHint')}
              >
                <input
                  type="text"
                  className="admin-form__input"
                  value={form.keywordsInput}
                  onChange={(event) => updateField('keywordsInput', event.target.value)}
                  placeholder={adminText('blog.form.keywordsPlaceholder')}
                />
              </FieldGroup>
            </AdminFormBlock>

            <AdminFormBlock
              title={adminText('blog.form.blockContent')}
              hint={adminText('blog.form.blockContentHint')}
              accent="copy"
            >
              <FieldGroup label={adminText('blog.form.coverLabel')}>
                <BlogCoverUpload
                  coverImage={form.coverImage}
                  coverPublicId={form.coverPublicId}
                  previewSeed={coverPatternSeed}
                  onPreviewSeedChange={setCoverPatternSeed}
                  disabled={saving}
                  onChange={({ coverImage, coverPublicId }) => {
                    setForm((prev) => ({
                      ...prev,
                      coverImage,
                      coverPublicId,
                    }));
                  }}
                />
              </FieldGroup>

              <FieldGroup
                label={isExternal ? adminText('blog.form.shortBodyLabel') : adminText('blog.form.bodyLabel')}
                required={!isExternal}
              >
                <RichTextEditor
                  id={post ? `blog-post-body-${post.id}` : 'blog-post-body-new'}
                  value={form.body}
                  onChange={(value) => updateField('body', value)}
                  tone="content"
                  features="full"
                />
                {isExternal && (
                  <p className="admin-form__hint">{adminText('blog.form.shortBodyHint')}</p>
                )}
              </FieldGroup>
            </AdminFormBlock>

            {(isExternal || allowAuthorPick || previewAuthor) && (
              <AdminFormBlock
                title={adminText('blog.form.blockAuthor')}
                hint={adminText('blog.form.blockAuthorHint')}
                accent="people"
              >
                {isExternal ? (
                  <FieldGroup label={adminText('blog.form.authorLabel')} required>
                    <input
                      type="text"
                      className="admin-form__input"
                      value={form.externalAuthorName}
                      onChange={(event) => updateField('externalAuthorName', event.target.value)}
                      placeholder={adminText('blog.form.authorPlaceholder')}
                      required
                    />
                  </FieldGroup>
                ) : allowAuthorPick ? (
                  <FieldGroup label={adminText('blog.form.authorLabel')} required>
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
                    <FieldGroup label={post ? adminText('blog.form.authorShort') : adminText('blog.form.authorLabel')}>
                      <BlogAuthor author={previewAuthor} size="medium" className="admin-blog-form__author" />
                    </FieldGroup>
                  )
                )}
              </AdminFormBlock>
            )}

            {!isExternal && (
              <AdminFormBlock
                title={adminText('blog.form.blockGallery')}
                hint={adminText('blog.form.blockGalleryHint')}
                accent="media"
              >
                <FieldGroup label={adminText('blog.form.galleryLabel')}>
                  <EventImageUploadList
                    images={form.galleryImages}
                    maxCount={BLOG_GALLERY_MAX}
                    uploadLabel={adminText('blog.form.galleryUpload')}
                    hint={BLOG_GALLERY_UPLOAD_HINT}
                    presetType="postGallery"
                    disabled={saving}
                    onChange={(galleryImages) => {
                      setForm((prev) => ({ ...prev, galleryImages }));
                    }}
                  />
                </FieldGroup>
              </AdminFormBlock>
            )}

            {post && allowAuthorPick && !isExternal && (
              <AdminFormBlock
                title={adminText('blog.form.blockComments')}
                hint={adminText('blog.form.blockCommentsHint')}
                accent="people"
              >
                <AdminBlogPostCommentsSection post={post} />
              </AdminFormBlock>
            )}
          </div>

          {(error || saveError) && <p className="admin-error admin-form__error">{error || saveError}</p>}

          <div className="admin-modal__actions admin-event-modal__actions">
            <button type="button" className="btn btn--outline" onClick={onClose} disabled={saving}>
              {adminText('common.cancel')}
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving
                ? adminText('common.saving')
                : (post ? adminText('common.saveChanges') : adminText('blog.form.createButton'))}
            </button>
          </div>
        </form>
      </AdminModalPanel>
    </div>,
    document.body,
  );
}
