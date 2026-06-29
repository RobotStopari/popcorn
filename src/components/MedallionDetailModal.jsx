import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ICONS } from '../data/icons';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { buildPersonContactLinks } from '../utils/contact-links';
import { getEventCoverStyle } from '../utils/event-cover-pattern';
import { transformRichTextForDisplay } from '../utils/rich-text-embeds';

const CONTACT_ICONS = {
  email: ICONS.email,
  phone: ICONS.phone,
  instagram: ICONS.instagram,
  facebook: ICONS.facebook,
};

function MedallionPhoto({ person }) {
  if (person.imageUrl) {
    return (
      <img
        src={person.imageUrl}
        alt={person.name || ''}
        className="medallion-modal__photo-img"
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div
      className="medallion-modal__photo-pattern"
      style={getEventCoverStyle(person.id)}
      aria-hidden="true"
    />
  );
}

function MedallionContactRow({ type, href, text, external = false }) {
  const label = text?.trim();
  if (!href || !label) return null;

  const className = `medallion-modal__contact medallion-modal__contact--${type}`;
  const content = (
    <>
      <span
        className="medallion-modal__contact-icon"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: CONTACT_ICONS[type] }}
      />
      <span className="medallion-modal__contact-copy">
        <span className="medallion-modal__contact-label">
          {type === 'email' && 'E-mail'}
          {type === 'phone' && 'Telefon'}
          {type === 'instagram' && 'Instagram'}
          {type === 'facebook' && 'Facebook'}
        </span>
        <span className="medallion-modal__contact-text">{label}</span>
      </span>
    </>
  );

  if (external) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <a href={href} className={className}>
      {content}
    </a>
  );
}

function MedallionContacts({ person }) {
  const links = buildPersonContactLinks(person);
  const rows = [
    { type: 'email', href: links.emailHref, text: person.email },
    { type: 'phone', href: links.phoneHref, text: person.phone },
    { type: 'instagram', href: links.instagramHref, text: person.instagram, external: true },
    { type: 'facebook', href: links.facebookHref, text: person.facebook, external: true },
  ].filter((row) => row.href && row.text?.trim());

  if (!rows.length) return null;

  return (
    <section className="medallion-modal__section">
      <h3 className="medallion-modal__section-title">Kontakt</h3>
      <div className="medallion-modal__contacts">
        {rows.map((row) => (
          <MedallionContactRow key={row.type} {...row} />
        ))}
      </div>
    </section>
  );
}

export default function MedallionDetailModal({ person, open, onClose }) {
  const { mounted, visible } = useAnimatedPresence(open, 220);
  const displayHtml = transformRichTextForDisplay(person?.descriptionHtml || '');

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.classList.add('medallion-modal-open');
    document.addEventListener('keydown', onKeydown);
    return () => {
      document.body.classList.remove('medallion-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [mounted, onClose]);

  if (!mounted || !person) return null;

  return createPortal(
    <div
      className={`medallion-modal${visible ? ' medallion-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="medallion-modal-title"
    >
      <button
        type="button"
        className="medallion-modal__backdrop"
        onClick={onClose}
        aria-label="Zavřít medailonek"
      />
      <div
        className="medallion-modal__panel"
        role="document"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="medallion-modal__close"
          onClick={onClose}
          aria-label="Zavřít"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <header className="medallion-modal__header">
          <div className="medallion-modal__photo">
            <MedallionPhoto person={person} />
          </div>
          <h2 id="medallion-modal-title" className="medallion-modal__name">
            {person.name}
          </h2>
          {person.nick?.trim() && (
            <p className="medallion-modal__nick">{person.nick.trim()}</p>
          )}
        </header>

        <div className="medallion-modal__scroll">
          <MedallionContacts person={person} />

          {displayHtml && (
            <section className="medallion-modal__section">
              <h3 className="medallion-modal__section-title">O osobě</h3>
              <div
                className="medallion-modal__description blog-detail__body"
                dangerouslySetInnerHTML={{ __html: displayHtml }}
              />
            </section>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
