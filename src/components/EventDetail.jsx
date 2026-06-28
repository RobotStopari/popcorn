import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEvents } from '../contexts/EventsContext';
import { ICONS } from '../data/icons';
import { buildGoogleCalendarUrl } from '../utils/google-calendar';
import { transformRichTextForDisplay } from '../utils/rich-text-embeds';
import EventCategoryLabel from './EventCategoryLabel';
import EventGallery from './EventGallery';

const CONTACT_ICONS = {
  email: ICONS.email,
  phone: ICONS.phone,
  instagram: ICONS.instagram,
  facebook: ICONS.facebook,
};

const FIELD_ICONS = {
  Sraz: ICONS.eventSraz,
  Návrat: ICONS.eventNavrat,
  Místo: ICONS.eventMisto,
  Cena: ICONS.eventCena,
};

function InfoField({ label, value }) {
  const icon = FIELD_ICONS[label];

  return (
    <div className="event-detail__field">
      <div className="event-detail__field-head">
        {icon && (
          <span className="event-detail__field-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: icon }} />
        )}
        <div className="event-detail__field-copy">
          <dt className="event-detail__field-label">{label}</dt>
          <dd className="event-detail__field-value">{value}</dd>
        </div>
      </div>
    </div>
  );
}

function FieldPart({ label, value }) {
  const icon = FIELD_ICONS[label];

  return (
    <div className="event-detail__field-part">
      <div className="event-detail__field-head">
        {icon && (
          <span className="event-detail__field-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: icon }} />
        )}
        <div className="event-detail__field-copy">
          <dt className="event-detail__field-label">{label}</dt>
          <dd className="event-detail__field-value event-detail__field-value--compact">{value}</dd>
        </div>
      </div>
    </div>
  );
}

function ScheduleRow({ event }) {
  const calendarUrl = buildGoogleCalendarUrl(event);

  return (
    <div className="event-detail__schedule-row">
      <div className="event-detail__field event-detail__field--combined">
        <FieldPart label="Sraz" value={event.sraz} />
        <div className="event-detail__field-divider" aria-hidden="true" />
        <FieldPart label="Návrat" value={event.navrat} />
      </div>
      <a
        href={calendarUrl}
        className="event-detail__calendar-btn btn btn--outline"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="event-detail__calendar-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS.eventCalendar }} />
        <span className="event-detail__calendar-label">Přidat do kalendáře</span>
      </a>
    </div>
  );
}

function ContactIcon({ type }) {
  const icon = CONTACT_ICONS[type];
  if (!icon) return null;

  return (
    <span
      className="event-detail__organiser-link-icon"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: icon }}
    />
  );
}

function OrganiserInitials({ name }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length > 1
    ? `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`
    : (parts[0]?.charAt(0) || '?');

  return <span className="event-detail__organiser-avatar">{initials.toUpperCase()}</span>;
}

function OrganiserContactLink({ type, href, label, tooltip, external = false }) {
  const linkRef = useRef(null);
  const tooltipRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  if (!href) return null;

  const tip = tooltip || label;
  const className = `event-detail__organiser-link event-detail__organiser-link--${type}`;

  const updatePosition = () => {
    const link = linkRef.current;
    const tipEl = tooltipRef.current;
    if (!link) return;

    const rect = link.getBoundingClientRect();
    const margin = 12;
    let left = rect.left + rect.width / 2;
    const top = rect.top - 8;

    if (tipEl) {
      const half = tipEl.offsetWidth / 2;
      left = Math.max(margin + half, Math.min(left, window.innerWidth - margin - half));
    }

    setPosition({ top, left });
  };

  const showTooltip = () => {
    setOpen(true);
  };

  const hideTooltip = () => {
    setVisible(false);
    setOpen(false);
  };

  useLayoutEffect(() => {
    if (!open) {
      setVisible(false);
      return undefined;
    }

    updatePosition();

    let showFrame = 0;
    const measureFrame = requestAnimationFrame(() => {
      updatePosition();
      showFrame = requestAnimationFrame(() => setVisible(true));
    });

    return () => {
      cancelAnimationFrame(measureFrame);
      cancelAnimationFrame(showFrame);
    };
  }, [open, tip]);

  useEffect(() => {
    if (!open) return undefined;

    const onReposition = () => updatePosition();
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);

    return () => {
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [open]);

  const linkProps = {
    ref: linkRef,
    className,
    'aria-label': label,
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip,
  };

  return (
    <>
      {external ? (
        <a {...linkProps} href={href} target="_blank" rel="noopener noreferrer">
          <ContactIcon type={type} />
        </a>
      ) : (
        <a {...linkProps} href={href}>
          <ContactIcon type={type} />
        </a>
      )}
      {open && createPortal(
        <span
          ref={tooltipRef}
          className={`event-detail__organiser-tooltip${visible ? ' event-detail__organiser-tooltip--visible' : ''}`}
          role="tooltip"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {tip}
        </span>,
        document.body,
      )}
    </>
  );
}

function Organisers({ organisers }) {
  return (
    <section className="event-detail__block event-detail__block--inline reveal">
      <h2 className="event-detail__block-title">{organisers.label}</h2>
      <ul className="event-detail__organisers">
        {organisers.contacts.map((contact) => (
          <li key={`${contact.name}-${contact.email}`} className="event-detail__organiser-card">
            <div className="event-detail__organiser-head">
              <OrganiserInitials name={contact.name} />
              <div className="event-detail__organiser-copy">
                <strong className="event-detail__organiser-name">{contact.name}</strong>
                {contact.nick && (
                  <span className="event-detail__organiser-nick">({contact.nick})</span>
                )}
              </div>
            </div>

            <div className="event-detail__organiser-links">
              <OrganiserContactLink
                type="email"
                href={contact.email ? `mailto:${contact.email}` : ''}
                label={contact.email}
              />
              <OrganiserContactLink
                type="phone"
                href={contact.phone ? `tel:${contact.phone.replace(/\s+/g, '')}` : ''}
                label={contact.phone}
              />
              <OrganiserContactLink
                type="instagram"
                href={contact.instagramHref}
                label="Instagram"
                tooltip={contact.instagram}
                external
              />
              <OrganiserContactLink
                type="facebook"
                href={contact.facebookHref}
                label="Facebook"
                tooltip={contact.facebook}
                external
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Participants({ participants }) {
  return (
    <section className="event-detail__block reveal">
      <h2 className="event-detail__block-title">Přihlášení účastníci</h2>
      <ul className="event-detail__participants">
        {participants.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </section>
  );
}

function RichTextBlock({ title, html }) {
  const displayHtml = useMemo(() => transformRichTextForDisplay(html), [html]);
  if (!displayHtml) return null;

  return (
    <div className="event-detail__rich-text reveal">
      {title && <h2 className="event-detail__section-label">{title}</h2>}
      <div
        className="event-detail__description event-detail__description--rich"
        dangerouslySetInnerHTML={{ __html: displayHtml }}
      />
    </div>
  );
}

function UpcomingDetail({ event }) {
  const hasMainContent = event.hasDescription || event.organisersBlock;

  return (
    <>
      <div className={`event-detail__columns reveal-stagger${hasMainContent ? '' : ' event-detail__columns--single'}`}>
        {hasMainContent && (
          <div className="event-detail__main reveal">
            {event.hasDescription && (
              <RichTextBlock title="Popis:" html={event.description} />
            )}
            {event.organisersBlock && <Organisers organisers={event.organisersBlock} />}
          </div>
        )}

        <aside className="event-detail__sidebar reveal">
          <div className="event-detail__fields">
            <EventCategoryLabel
              category={event.category}
              past={false}
              className="event-detail__sidebar-category"
              showDescription
            />
            <ScheduleRow event={event} />
            {event.hasPlace && <InfoField label="Místo" value={event.misto} />}
            {event.hasPrice && <InfoField label="Cena" value={event.cena} />}
          </div>
        </aside>
      </div>

      {event.hasParticipants && <Participants participants={event.participants} />}

      {event.hasRegistration && (
        <div className="event-detail__register reveal">
          <a href={event.registerHref} className="btn btn--primary btn--large" target="_blank" rel="noopener noreferrer">
            Přihlásit se
          </a>
        </div>
      )}

      {event.upcomingGalleryImages.length > 0 && (
        <EventGallery images={event.upcomingGalleryImages} />
      )}
    </>
  );
}

function PastDetail({ event }) {
  const reportHtml = useMemo(
    () => transformRichTextForDisplay(event.report),
    [event.report],
  );

  return (
    <>
      {event.hasReport && reportHtml && (
        <section className="event-detail__report reveal">
          <h2 className="event-detail__report-title">Zápis z akce</h2>
          <div
            className="event-detail__report-body event-detail__description--rich"
            dangerouslySetInnerHTML={{ __html: reportHtml }}
          />
        </section>
      )}

      {event.pastGalleryImages.length > 0 && (
        <EventGallery
          images={event.pastGalleryImages}
          intro="Výběr nejlepších fotek z galerie akce."
        />
      )}

      {event.hasGalleryLink && (
        <div className="event-detail__gallery-link reveal">
          <a href={event.galleryDriveHref} className="btn btn--outline" target="_blank" rel="noopener noreferrer">
            Všechny fotky z akce
          </a>
        </div>
      )}
    </>
  );
}

function BackLink({ className = 'event-detail__back' }) {
  return <a href="/" className={`${className} reveal`}>← Zpět</a>;
}

function NotFound() {
  return (
    <div className="event-detail__not-found reveal">
      <h1 className="event-detail__title">Akce nenalezena</h1>
      <p className="event-detail__date">Tato akce neexistuje nebo byla odstraněna.</p>
      <a href="/" className="btn btn--primary">Zpět na hlavní stránku</a>
    </div>
  );
}

export default function EventDetail({ id }) {
  const { getEventById, loading } = useEvents();
  const result = id ? getEventById(id) : null;

  if (loading) {
    return (
      <article className="event-detail container">
        <p className="event-detail__loading">Načítám akci…</p>
      </article>
    );
  }

  if (!result) {
    return (
      <article className="event-detail container">
        <NotFound />
      </article>
    );
  }

  const { event, past } = result;
  const dateClass = past ? 'event-detail__date event-detail__date--past' : 'event-detail__date';

  return (
    <article className="event-detail container">
      <BackLink />

      <header className="event-detail__header reveal reveal--scale">
        <h1 className="event-detail__title">{event.name}</h1>
        <time className={dateClass} dateTime={event.dateStart}>{event.dateLabel}</time>
        {past && (
          <EventCategoryLabel
            category={event.category}
            past
            className="event-detail__category"
          />
        )}
      </header>

      {event.hasExternalPage && (
        <div className="event-detail__external-page reveal">
          <a
            href={event.externalPageUrl}
            className={`btn btn--external btn--large${past ? ' btn--external--past' : ''}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Webová stránka akce
          </a>
        </div>
      )}

      {past
        ? <PastDetail event={event} />
        : <UpcomingDetail event={event} />}

      <div className="event-detail__back-bottom reveal">
        <BackLink className="event-detail__back event-detail__back--bottom" />
      </div>
    </article>
  );
}
