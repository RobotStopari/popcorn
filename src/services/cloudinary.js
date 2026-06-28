const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const EXT_TO_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
};

const MAX_BYTES = 10 * 1024 * 1024;

const PRESET_ENV_KEYS = {
  cover: ['VITE_CLOUDINARY_PRESET_COVER', 'VITE_CLOUDINARY_UPLOAD_PRESET'],
  promo: ['VITE_CLOUDINARY_PRESET_PROMO'],
  gallery: ['VITE_CLOUDINARY_PRESET_GALLERY'],
  post: ['VITE_CLOUDINARY_PRESET_POST'],
  postGallery: ['VITE_CLOUDINARY_PRESET_POST_GALLERY'],
};

function getCloudName() {
  return import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
}

function getUploadPreset(type) {
  const keys = PRESET_ENV_KEYS[type] || PRESET_ENV_KEYS.cover;

  for (const key of keys) {
    const value = import.meta.env[key];
    if (value) return value;
  }

  return '';
}

export function isCloudinaryConfigured(type = 'cover') {
  return Boolean(getCloudName() && getUploadPreset(type));
}

function getFileExtension(file) {
  const parts = file.name?.split('.') ?? [];
  if (parts.length < 2) return '';
  return parts.pop().toLowerCase();
}

function resolveImageMimeType(file) {
  if (file.type && ALLOWED_TYPES.has(file.type)) {
    return file.type;
  }

  const mime = EXT_TO_MIME[getFileExtension(file)];
  if (mime) return mime;

  return '';
}

function normalizeImageFile(file) {
  if (!file) {
    throw new Error('Vyberte soubor s obrázkem.');
  }

  const mime = resolveImageMimeType(file);
  if (!mime) {
    throw new Error(
      file.name
        ? `Soubor „${file.name}“ není podporovaný (JPG, PNG, WebP, GIF, HEIC).`
        : 'Povolené formáty: JPG, PNG, WebP, GIF nebo HEIC.',
    );
  }

  if (file.size > MAX_BYTES) {
    throw new Error(`Soubor „${file.name}“ je příliš velký (max. 10 MB).`);
  }

  if (file.type === mime) return file;

  return new File([file], file.name || 'upload.jpg', {
    type: mime,
    lastModified: file.lastModified,
  });
}

function networkErrorMessage() {
  return 'Nahrání bylo zablokováno prohlížečem. V Brave vypněte Shields pro localhost, '
    + 'případně povolte api.cloudinary.com.';
}

async function uploadImage(file, type) {
  const normalizedFile = normalizeImageFile(file);

  const cloudName = getCloudName();
  const uploadPreset = getUploadPreset(type);

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary není nakonfigurováno. Doplňte VITE_CLOUDINARY_CLOUD_NAME a preset do .env.local (viz README).',
    );
  }

  const formData = new FormData();
  formData.append('file', normalizedFile);
  formData.append('upload_preset', uploadPreset);

  let response;

  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData },
    );
  } catch {
    throw new Error(networkErrorMessage());
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error?.message || 'Nahrání obrázku se nezdařilo.');
  }

  if (!payload.public_id || !payload.secure_url) {
    throw new Error('Cloudinary nevrátilo kompletní odpověď.');
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id,
    alt: '',
  };
}

export async function uploadEventCover(file) {
  const result = await uploadImage(file, 'cover');

  return {
    coverImage: result.url,
    coverPublicId: result.publicId,
  };
}

export async function uploadBlogPostCover(file) {
  const result = await uploadImage(file, 'post');

  return {
    coverImage: result.url,
    coverPublicId: result.publicId,
  };
}

export async function uploadEventPromoImage(file) {
  return uploadImage(file, 'promo');
}

export async function uploadEventGalleryPick(file) {
  return uploadImage(file, 'gallery');
}

export async function uploadBlogPostGalleryImage(file) {
  return uploadImage(file, 'postGallery');
}

export async function uploadEventImages(files, type, { concurrency = 2, onProgress } = {}) {
  if (!files.length) return [];

  const outcomes = new Array(files.length);
  let nextIndex = 0;
  let completed = 0;

  async function runWorker() {
    while (nextIndex < files.length) {
      const current = nextIndex;
      nextIndex += 1;

      try {
        outcomes[current] = {
          status: 'fulfilled',
          value: await uploadImage(files[current], type),
        };
      } catch (reason) {
        outcomes[current] = { status: 'rejected', reason };
      }

      completed += 1;
      onProgress?.(completed, files.length);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, files.length) }, () => runWorker()),
  );

  return outcomes;
}
