import { useEffect, useId, useMemo, useState } from 'react';
import {
  BLOG_COVER_ASPECT_RATIO,
  BLOG_COVER_HEIGHT,
  BLOG_COVER_UPLOAD_HINT,
  BLOG_COVER_WIDTH,
} from '../data/blog-images';
import { getEventCoverStyle } from '../utils/event-cover-pattern';
import { isCloudinaryConfigured, uploadBlogPostCover } from '../services/cloudinary';
import { setUploadBusy } from '../utils/upload-busy';

export default function BlogCoverUpload({
  coverImage = '',
  coverPublicId = '',
  previewSeed = 'blog-post',
  disabled = false,
  onChange,
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const patternStyle = useMemo(
    () => getEventCoverStyle(previewSeed),
    [previewSeed],
  );

  const cloudinaryReady = isCloudinaryConfigured('post');
  const pickDisabled = disabled || uploading || !cloudinaryReady;

  useEffect(() => {
    setUploadBusy(uploading);
    return () => setUploadBusy(false);
  }, [uploading]);

  const handleFileChange = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      setError('Soubor nebyl vybrán. Zkuste to znovu.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const result = await uploadBlogPostCover(file);
      onChange?.(result);
    } catch (err) {
      setError(err.message || 'Nahrání se nezdařilo.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (disabled || uploading) return;
    setError('');
    onChange?.({ coverImage: '', coverPublicId: '' });
  };

  const handlePickBlocked = (event) => {
    if (!pickDisabled) return;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="admin-event-cover">
      <div className="admin-event-cover__preview admin-event-cover__preview--blog">
        {coverImage ? (
          <img
            src={coverImage}
            alt="Náhled titulní fotky příspěvku"
            className="admin-event-cover__image"
          />
        ) : (
          <div
            className="admin-event-cover__pattern"
            style={patternStyle}
            aria-hidden="true"
          />
        )}
        <span className="admin-event-cover__ratio">{BLOG_COVER_ASPECT_RATIO}</span>
      </div>

      <div className="admin-event-cover__body">
        <p className="admin-form__hint admin-event-cover__hint">
          {BLOG_COVER_UPLOAD_HINT}
        </p>

        {!cloudinaryReady && (
          <p className="admin-error admin-event-cover__error">
            Cloudinary preset není nastaven — doplňte `.env.local` (viz README).
          </p>
        )}

        {error && <p className="admin-error admin-event-cover__error">{error}</p>}

        <div className="admin-event-cover__actions">
          <label
            htmlFor={inputId}
            className={`btn btn--outline btn--small admin-event-images__pick${pickDisabled ? ' admin-event-images__pick--disabled' : ''}`}
            aria-disabled={pickDisabled}
            onClick={handlePickBlocked}
          >
            {uploading
              ? 'Nahrávám…'
              : coverImage
                ? 'Nahrát jiný obrázek'
                : 'Nahrát titulní fotku'}
          </label>

          {coverImage && (
            <button
              type="button"
              className="btn btn--outline btn--small"
              onClick={handleRemove}
              disabled={disabled || uploading}
            >
              Odstranit fotku
            </button>
          )}
        </div>

        {coverPublicId && (
          <p className="admin-event-cover__meta">
            Uloženo v Cloudinary jako WebP {BLOG_COVER_WIDTH}×{BLOG_COVER_HEIGHT} px
          </p>
        )}

        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="admin-event-images__input"
          onChange={handleFileChange}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
