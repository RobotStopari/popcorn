import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  EVENT_COVER_ASPECT_RATIO,
  EVENT_COVER_HEIGHT,
  EVENT_COVER_UPLOAD_HINT,
  EVENT_COVER_WIDTH,
} from '../data/event-images';
import { getEventCoverStyle } from '../utils/event-cover-pattern';
import { isCloudinaryConfigured, uploadEventCover } from '../services/cloudinary';
import { setUploadBusy } from '../utils/upload-busy';

export default function EventCoverUpload({
  coverImage = '',
  coverPublicId = '',
  previewSeed = 'event',
  past = false,
  disabled = false,
  onChange,
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const patternStyle = useMemo(
    () => getEventCoverStyle(previewSeed, { past }),
    [previewSeed, past],
  );

  const handlePickFile = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const result = await uploadEventCover(file);
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

  const cloudinaryReady = isCloudinaryConfigured('cover');

  useEffect(() => {
    setUploadBusy(uploading);
    return () => setUploadBusy(false);
  }, [uploading]);

  return (
    <div className="admin-event-cover">
      <div className="admin-event-cover__preview">
        {coverImage ? (
          <img
            src={coverImage}
            alt="Náhled titulní fotky akce"
            className="admin-event-cover__image"
          />
        ) : (
          <div
            className="admin-event-cover__pattern"
            style={patternStyle}
            aria-hidden="true"
          />
        )}
        <span className="admin-event-cover__ratio">{EVENT_COVER_ASPECT_RATIO}</span>
      </div>

      <div className="admin-event-cover__body">
        <p className="admin-form__hint admin-event-cover__hint">
          {EVENT_COVER_UPLOAD_HINT}
        </p>

        {!cloudinaryReady && (
          <p className="admin-error admin-event-cover__error">
            Cloudinary není nastaveno — doplňte údaje v `.env.local` (viz README).
          </p>
        )}

        {error && <p className="admin-error admin-event-cover__error">{error}</p>}

        <div className="admin-event-cover__actions">
          <button
            type="button"
            className="btn btn--outline btn--small"
            onClick={handlePickFile}
            disabled={disabled || uploading || !cloudinaryReady}
          >
            {uploading
              ? 'Nahrávám…'
              : coverImage
                ? 'Nahrát jiný obrázek'
                : 'Nahrát titulní fotku'}
          </button>

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
            Uloženo v Cloudinary jako WebP {EVENT_COVER_WIDTH}×{EVENT_COVER_HEIGHT} px
          </p>
        )}

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="admin-event-cover__input"
          onChange={handleFileChange}
          disabled={disabled || uploading || !cloudinaryReady}
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
