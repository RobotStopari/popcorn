import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';

function normalizeHref(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function RichTextLinkDialog({
  open,
  initialHref = '',
  initialText = '',
  initialNewTab = true,
  isEdit = false,
  onClose,
  onApply,
}) {
  const [href, setHref] = useState('');
  const [text, setText] = useState('');
  const [newTab, setNewTab] = useState(true);
  const [error, setError] = useState('');
  const { mounted, visible } = useAnimatedPresence(open, 200);

  useEffect(() => {
    if (!open) return;
    setHref(initialHref);
    setText(initialText);
    setNewTab(initialNewTab);
    setError('');
  }, [open, initialHref, initialText, initialNewTab]);

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
    const normalizedHref = normalizeHref(href);

    if (!normalizedHref) {
      setError('Zadejte adresu odkazu.');
      return;
    }

    if (!text.trim()) {
      setError('Zadejte text odkazu.');
      return;
    }

    onApply({
      href: normalizedHref,
      text: text.trim(),
      newTab,
    });
  };

  const stopBubble = (event) => {
    event.stopPropagation();
  };

  return createPortal(
    <div
      className={`admin-modal admin-modal--link${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rich-text-link-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="admin-modal__panel admin-modal__panel--compact rich-text-link-dialog"
        onClick={stopBubble}
        onMouseDown={stopBubble}
      >
        <h2 id="rich-text-link-title" className="admin-modal__title">
          {isEdit ? 'Upravit odkaz' : 'Vložit odkaz'}
        </h2>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form__group">
            <label className="admin-form__label" htmlFor="rich-text-link-href">
              Adresa odkazu
            </label>
            <input
              id="rich-text-link-href"
              type="url"
              className="admin-form__input"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="https://"
              autoFocus
            />
          </div>

          <div className="admin-form__group">
            <label className="admin-form__label" htmlFor="rich-text-link-text">
              Text odkazu
            </label>
            <input
              id="rich-text-link-text"
              type="text"
              className="admin-form__input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Zobrazovaný text"
            />
          </div>

          <label className="admin-toggle rich-text-link-dialog__toggle">
            <input
              type="checkbox"
              checked={newTab}
              onChange={(e) => setNewTab(e.target.checked)}
            />
            <span className="admin-toggle__track" aria-hidden="true">
              <span className="admin-toggle__thumb" />
            </span>
            <span className="admin-toggle__label">Otevřít v novém okně</span>
          </label>

          {error && <p className="admin-error">{error}</p>}

          <div className="admin-modal__actions">
            <button type="button" className="btn btn--outline" onClick={onClose}>
              Zrušit
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSubmit}
            >
              {isEdit ? 'Uložit odkaz' : 'Vložit odkaz'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
