import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { parseYoutubeVideoId } from '../utils/rich-text-embeds';
import AdminModalPanel from './AdminModalPanel';

export default function RichTextYoutubeDialog({
  open,
  initialUrl = '',
  initialTitle = '',
  onClose,
  onApply,
}) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const { mounted, visible } = useAnimatedPresence(open, 200);

  useEffect(() => {
    if (!open) return;
    setUrl(initialUrl);
    setTitle(initialTitle);
    setError('');
  }, [open, initialUrl, initialTitle]);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [mounted, onClose]);

  if (!mounted) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const videoId = parseYoutubeVideoId(url);
    if (!videoId) {
      setError('Zadejte platný odkaz na YouTube video.');
      return;
    }

    if (!title.trim()) {
      setError('Zadejte název videa.');
      return;
    }

    onApply({ videoId, title: title.trim() });
  };

  const stopBubble = (event) => {
    event.stopPropagation();
  };

  return createPortal(
    <div
      className={`admin-modal admin-modal--link${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rich-text-youtube-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <AdminModalPanel
        className="admin-modal__panel--compact rich-text-link-dialog"
        onClick={stopBubble}
        onMouseDown={stopBubble}
      >
        <h2 id="rich-text-youtube-title" className="admin-modal__title">
          Vložit YouTube video
        </h2>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form__group">
            <label className="admin-form__label" htmlFor="rich-text-youtube-url">
              Odkaz na video
            </label>
            <input
              id="rich-text-youtube-url"
              type="url"
              className="admin-form__input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              autoFocus
            />
            <p className="admin-form__hint rich-text-youtube-dialog__hint">
              Podporované formáty: youtube.com/watch, youtu.be, /shorts/…
            </p>
          </div>

          <div className="admin-form__group">
            <label className="admin-form__label" htmlFor="rich-text-youtube-title-input">
              Název videa
            </label>
            <input
              id="rich-text-youtube-title-input"
              type="text"
              className="admin-form__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Např. Jak jsme natočili reportáž"
            />
          </div>

          {error && <p className="admin-error">{error}</p>}

          <div className="admin-modal__actions">
            <button type="button" className="btn btn--outline" onClick={onClose}>
              Zrušit
            </button>
            <button type="button" className="btn btn--primary" onClick={handleSubmit}>
              Vložit video
            </button>
          </div>
        </form>
      </AdminModalPanel>
    </div>,
    document.body,
  );
}
