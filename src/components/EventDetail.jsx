import { useMemo } from 'react';
import { useEvents } from '../contexts/EventsContext';
import { ICONS } from '../data/icons';
import { buildGoogleCalendarUrl } from '../utils/google-calendar';
import { transformRichTextForDisplay } from '../utils/rich-text-embeds';
import { siteText } from '../utils/admin-text';
import { trackOutboundClick } from '../utils/analytics-track';
import EventCategoryLabel from './EventCategoryLabel';
import EventGallery from './EventGallery';
import NotFoundPage from './NotFoundPage';
import PersonContactLink from './PersonContactLink';

const FIELD_ICONS = {
  departure: ICONS.eventSraz,
  return: ICONS.eventNavrat,
  place: ICONS.eventMisto,
  price: ICONS.eventCena,
};

function eventFieldLabel(fieldKey) {
  return siteText(`events.detail.fields.${fieldKey}`);
}

function InfoField({ fieldKey, value }) {
  const icon = FIELD_ICONS[fieldKey];
  const label = eventFieldLabel(fieldKey);

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

function FieldPart({ fieldKey, value }) {
  const icon = FIELD_ICONS[fieldKey];
  const label = eventFieldLabel(fieldKey);

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
        <FieldPart fieldKey="departure" value={event.sraz} />
        <div className="event-detail__field-divider" aria-hidden="true" />
        <FieldPart fieldKey="return" value={event.navrat} />
      </div>
      <a
        href={calendarUrl}
        className="event-detail__calendar-btn btn btn--outline"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackOutboundClick(calendarUrl, siteText('events.detail.addToCalendar'))}
      >
        <span className="event-detail__calendar-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS.eventCalendar }} />
        <span className="event-detail__calendar-label">{siteText('events.detail.addToCalendar')}</span>
      </a>
    </div>
  );
}

function OrganiserInitials({ name }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length > 1
    ? `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`
    : (parts[0]?.charAt(0) || '?');

  return <span className="event-detail__organiser-avatar">{initials.toUpperCase()}</span>;
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
              <PersonContactLink
                type="email"
                href={contact.email ? `mailto:${contact.email}` : ''}
                label={contact.email}
              />
              <PersonContactLink
                type="phone"
                href={contact.phone ? `tel:${contact.phone.replace(/\s+/g, '')}` : ''}
                label={contact.phone}
              />
              <PersonContactLink
                type="instagram"
                href={contact.instagramHref}
                label={siteText('common.contact.instagram')}
                tooltip={contact.instagram}
                external
              />
              <PersonContactLink
                type="facebook"
                href={contact.facebookHref}
                label={siteText('common.contact.facebook')}
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
      <h2 className="event-detail__block-title">{siteText('events.detail.participantsTitle')}</h2>
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
              <RichTextBlock title={siteText('events.detail.descriptionTitle')} html={event.description} />
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
            {event.hasPlace && <InfoField fieldKey="place" value={event.misto} />}
            {event.hasPrice && <InfoField fieldKey="price" value={event.cena} />}
          </div>
        </aside>
      </div>

      {event.hasParticipants && <Participants participants={event.participants} />}

      {event.hasRegistration && (
        <div className="event-detail__register reveal">
          <a
            href={event.registerHref}
            className="btn btn--primary btn--large"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackOutboundClick(event.registerHref, siteText('events.detail.register'))}
          >
            {siteText('events.detail.register')}
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
          <h2 className="event-detail__report-title">{siteText('events.detail.reportTitle')}</h2>
          <div
            className="event-detail__report-body event-detail__description--rich"
            dangerouslySetInnerHTML={{ __html: reportHtml }}
          />
        </section>
      )}

      {event.pastGalleryImages.length > 0 && (
        <EventGallery
          images={event.pastGalleryImages}
          intro={siteText('events.detail.galleryIntro')}
        />
      )}

      {event.hasGalleryLink && (
        <div className="event-detail__gallery-link reveal">
          <a
            href={event.galleryDriveHref}
            className="btn btn--outline"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackOutboundClick(event.galleryDriveHref, siteText('events.detail.allPhotos'))}
          >
            {siteText('events.detail.allPhotos')}
          </a>
        </div>
      )}
    </>
  );
}

function BackLink({ className = 'event-detail__back' }) {
  return <a href="/" className={`${className} reveal`}>{siteText('events.detail.back')}</a>;
}

export default function EventDetail({ slug }) {
  const { getEventBySlugOrId, loading } = useEvents();
  const result = slug ? getEventBySlugOrId(slug) : null;

  if (loading) {
    return (
      <article className="event-detail container">
        <p className="event-detail__loading">{siteText('events.detail.loading')}</p>
      </article>
    );
  }

  if (!result) {
    return <NotFoundPage />;
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
            onClick={() => trackOutboundClick(event.externalPageUrl, siteText('events.detail.externalPage'))}
          >
            {siteText('events.detail.externalPage')}
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
