import { useEffect, useId, useRef, useState } from 'react';
import { isCloudinaryConfigured, uploadEventImages } from '../services/cloudinary';
import { setUploadBusy } from '../utils/upload-busy';

function uploadButtonLabel({ uploading, uploadLabel, uploadProgress }) {
  if (!uploading) return uploadLabel;
  if (uploadProgress.total > 1) {
    return `Nahrávám ${uploadProgress.done}/${uploadProgress.total}…`;
  }
  return 'Nahrávám…';
}

function toErrorMessage(reason) {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === 'string') return reason;
  return 'Nahrání se nezdařilo.';
}

export default function EventImageUploadList({
  images = [],
  maxCount = 10,
  uploadLabel = 'Nahrát obrázky',
  hint = '',
  presetType = 'promo',
  disabled = false,
  onChange,
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const imagesRef = useRef(images);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    setUploadBusy(uploading);
    return () => setUploadBusy(false);
  }, [uploading]);

  const cloudinaryReady = isCloudinaryConfigured(presetType);
  const canAdd = images.length < maxCount;
  const remaining = maxCount - images.length;
  const pickDisabled = disabled || uploading || !canAdd || !cloudinaryReady;

  const handleFileChange = async (event) => {
    const input = event.currentTarget;
    const files = input.files ? [...input.files] : [];
    input.value = '';

    if (!files.length) {
      setError('Soubor nebyl vybrán. Zkuste to znovu.');
      return;
    }

    if (remaining <= 0) {
      setError(`Již máte maximální počet obrázků (${maxCount}).`);
      return;
    }

    if (files.length > remaining) {
      setError(
        `Vybrali jste ${files.length} obrázků, ale zbývá jen ${remaining}. `
        + 'Vyberte méně souborů nebo některé odeberte.',
      );
      return;
    }

    setError('');
    setStatus(`Vybráno ${files.length} ${files.length === 1 ? 'soubor' : 'souborů'}. Nahrávám…`);
    setUploading(true);
    setUploadProgress({ done: 0, total: files.length });

    try {
      const results = await uploadEventImages(files, presetType, {
        onProgress: (done, total) => setUploadProgress({ done, total }),
      });

      const uploaded = [];
      let failCount = 0;
      let firstError = '';

      results.forEach((result) => {
        if (!result) return;

        if (result.status === 'fulfilled') {
          uploaded.push(result.value);
          return;
        }

        failCount += 1;
        if (!firstError) {
          firstError = toErrorMessage(result.reason);
        }
      });

      if (uploaded.length) {
        onChange?.([...imagesRef.current, ...uploaded]);
        setStatus(`Nahráno ${uploaded.length} ${uploaded.length === 1 ? 'obrázek' : 'obrázků'}.`);
      } else {
        setStatus('');
      }

      if (failCount === files.length) {
        setError(firstError || 'Nahrání se nezdařilo.');
      } else if (failCount > 0) {
        setError(
          `${failCount} z ${files.length} obrázků se nepodařilo nahrát. Ostatní byly uloženy.`,
        );
      }
    } catch (err) {
      setStatus('');
      setError(toErrorMessage(err));
    } finally {
      setUploading(false);
      setUploadProgress({ done: 0, total: 0 });
    }
  };

  const handleRemove = (index) => {
    if (disabled || uploading) return;
    setStatus('');
    onChange?.(images.filter((_, itemIndex) => itemIndex !== index));
  };

  const handlePickBlocked = (event) => {
    if (!pickDisabled) return;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="admin-event-images">
      {hint && <p className="admin-form__hint admin-event-images__hint">{hint}</p>}

      {!cloudinaryReady && (
        <p className="admin-error admin-event-images__error">
          Cloudinary preset není nastaven — doplňte `.env.local` (viz README).
        </p>
      )}

      {error && <p className="admin-error admin-event-images__error">{error}</p>}
      {status && !error && <p className="admin-event-images__status">{status}</p>}

      {images.length > 0 && (
        <ul className="admin-event-images__grid">
          {images.map((image, index) => (
            <li key={image.publicId || image.url} className="admin-event-images__item">
              <img
                src={image.url}
                alt={image.alt || `Nahraný obrázek ${index + 1}`}
                className="admin-event-images__thumb"
              />
              <button
                type="button"
                className="admin-event-images__remove"
                onClick={() => handleRemove(index)}
                disabled={disabled || uploading}
                aria-label={`Odebrat obrázek ${index + 1}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="admin-event-images__footer">
        <label
          htmlFor={inputId}
          className={`btn btn--outline btn--small admin-event-images__pick${pickDisabled ? ' admin-event-images__pick--disabled' : ''}`}
          aria-disabled={pickDisabled}
          onClick={handlePickBlocked}
        >
          {uploadButtonLabel({ uploading, uploadLabel, uploadProgress })}
        </label>
        <span className="admin-event-images__count">
          {images.length} / {maxCount}
        </span>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        className="admin-event-images__input"
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
