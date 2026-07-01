import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { getEventCoverStyle } from '../utils/event-cover-pattern';
import { isCloudinaryConfigured, isCloudinaryCloudNameConfigured, uploadBlogPostGalleryImage, uploadSiteLogoImage, buildCloudinaryDisplayUrl } from '../services/cloudinary';
import { setUploadBusy } from '../utils/upload-busy';

const UPLOAD_HINT = 'JPG, PNG, WebP nebo GIF do 10 MB. Použije se preset galerie příspěvku (WebP, zachovaný poměr stran).';
const BANNER_UPLOAD_HINT = 'JPG, PNG, WebP nebo GIF do 10 MB. Doporučený široký formát pro parallax banner.';

const LOGO_UPLOAD_HINT = 'JPG, PNG, WebP nebo GIF do 10 MB. Preset popcorn_site_logo — WebP, celé logo bez ořezu.';

const UPLOAD_TYPE_CONFIG = {
  postGallery: {
    preset: 'postGallery',
    upload: uploadBlogPostGalleryImage,
    hint: UPLOAD_HINT,
    meta: 'Uloženo v Cloudinary (preset galerie příspěvku)',
    envKey: 'VITE_CLOUDINARY_PRESET_POST_GALLERY',
  },
  siteLogo: {
    preset: 'siteLogo',
    upload: uploadSiteLogoImage,
    hint: LOGO_UPLOAD_HINT,
    meta: 'Uloženo v Cloudinary (preset popcorn_site_logo)',
    envKey: 'VITE_CLOUDINARY_PRESET_SITE_LOGO',
  },
};

export default function PageBlockImageUpload({
  imageUrl = '',
  imagePublicId = '',
  previewSeed = 'page-block',
  disabled = false,
  variant = 'default',
  stacked = false,
  uploadType = 'postGallery',
  onChange,
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const patternStyle = useMemo(
    () => getEventCoverStyle(previewSeed),
    [previewSeed],
  );

  const uploadConfig = UPLOAD_TYPE_CONFIG[uploadType] || UPLOAD_TYPE_CONFIG.postGallery;
  const cloudinaryReady = isCloudinaryConfigured(uploadConfig.preset);
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
      const result = await uploadConfig.upload(file);
      onChange?.({
        imageUrl: result.url,
        imagePublicId: result.publicId,
      });
    } catch (err) {
      setError(err.message || 'Nahrání se nezdařilo.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (disabled || uploading) return;
    setError('');
    onChange?.({ imageUrl: '', imagePublicId: '' });
  };

  const handlePickClick = () => {
    if (pickDisabled) return;
    inputRef.current?.click();
  };

  const isBanner = variant === 'banner';
  const isSquare = variant === 'square';
  const isLogo = variant === 'logo';
  const useStacked = stacked || isBanner;
  const previewSrc = isLogo && imagePublicId?.trim()
    ? buildCloudinaryDisplayUrl(imagePublicId.trim(), { width: 320, height: 400 })
    : imageUrl;

  return (
    <div
      className={[
        'admin-page-block-image',
        isBanner && 'admin-page-block-image--banner',
        isSquare && 'admin-page-block-image--square',
        isLogo && 'admin-page-block-image--logo',
        useStacked && 'admin-page-block-image--stacked',
      ].filter(Boolean).join(' ')}
    >
      <div className="admin-page-block-image__preview">
        {previewSrc ? (
          <img
            src={previewSrc}
            alt="Náhled nahraného obrázku"
            className="admin-page-block-image__img"
          />
        ) : (
          <div
            className="admin-page-block-image__placeholder"
            style={patternStyle}
            aria-hidden="true"
          />
        )}
        {!isBanner && !isSquare && !isLogo && <span className="admin-page-block-image__ratio">4 : 3</span>}
        {isBanner && <span className="admin-page-block-image__ratio">Banner</span>}
        {isSquare && <span className="admin-page-block-image__ratio">1 : 1</span>}
        {isLogo && <span className="admin-page-block-image__ratio">Logo</span>}
      </div>

      <div className="admin-page-block-image__body">
        <p className="admin-page-block-image__hint">{isBanner ? BANNER_UPLOAD_HINT : uploadConfig.hint}</p>

        {!cloudinaryReady && (
          <p className="admin-error admin-page-block-image__error">
            {isCloudinaryCloudNameConfigured()
              ? (
                <>
                  Cloudinary preset není nastaven — doplňte
                  {' '}
                  <code>{uploadConfig.envKey}</code>
                  {' '}
                  do `.env.local`.
                </>
              )
              : (
                <>
                  Cloudinary není nakonfigurováno — doplňte
                  {' '}
                  <code>VITE_CLOUDINARY_CLOUD_NAME</code>
                  {' '}
                  do `.env.local` (viz README).
                </>
              )}
          </p>
        )}

        {error && <p className="admin-error admin-page-block-image__error">{error}</p>}

        <div className="admin-page-block-image__actions">
          <button
            type="button"
            className={`btn btn--outline btn--small admin-event-images__pick${pickDisabled ? ' admin-event-images__pick--disabled' : ''}`}
            disabled={pickDisabled}
            aria-controls={inputId}
            onClick={handlePickClick}
          >
            {uploading
              ? 'Nahrávám…'
              : previewSrc
                ? 'Nahrát jiný obrázek'
                : 'Nahrát obrázek'}
          </button>

          {previewSrc && (
            <button
              type="button"
              className="btn btn--outline btn--small"
              onClick={handleRemove}
              disabled={disabled || uploading}
            >
              Odstranit
            </button>
          )}

          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/*"
            className="admin-event-images__input admin-page-block-image__input"
            onChange={handleFileChange}
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        {imagePublicId && (
          <p className="admin-page-block-image__meta">{uploadConfig.meta}</p>
        )}
      </div>
    </div>
  );
}
