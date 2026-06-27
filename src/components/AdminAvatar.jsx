import { useState } from 'react';

function normalizePhotoUrl(url) {
  if (!url) return '';
  if (!url.includes('googleusercontent.com')) return url;

  if (/=s\d+(-c)?$/.test(url)) {
    return url.replace(/=s\d+(-c)?$/, '=s192-c');
  }

  return `${url}=s192-c`;
}

function getInitials(name, email) {
  const source = name?.trim() || email?.trim() || '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function AdminAvatar({
  photoURL,
  name,
  email,
  className = '',
  size = 'large',
}) {
  const [failed, setFailed] = useState(false);
  const src = normalizePhotoUrl(photoURL);
  const sizeClass = size === 'small' ? 'admin-avatar--small admin-avatar--round' : 'admin-card__avatar';
  const fallbackClass = size === 'small'
    ? 'admin-avatar--small admin-avatar--round admin-avatar--fallback'
    : 'admin-card__avatar admin-card__avatar--fallback';

  if (!src || failed) {
    return (
      <div className={`${fallbackClass} ${className}`.trim()} aria-hidden="true">
        {getInitials(name, email)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={`${sizeClass} ${className}`.trim()}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
