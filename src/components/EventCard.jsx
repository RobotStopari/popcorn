import { useMemo } from 'react';
import { eventUrl } from '../data/events';
import { getEventCoverStyle, resolveCoverPatternSeed } from '../utils/event-cover-pattern';
import { siteText } from '../utils/admin-text';
import { trackNavClick } from '../utils/analytics-track';
import EventCategoryLabel from './EventCategoryLabel';

function EventCardPlaceholder({ seed, past }) {
  const style = useMemo(() => getEventCoverStyle(seed, { past }), [seed, past]);

  return (
    <div
      className={`event-card__placeholder shine-hover${past ? ' event-card__placeholder--past' : ''}`}
      aria-hidden="true"
    >
      <div className="event-card__placeholder-surface" style={style} />
    </div>
  );
}

function EventCardImage({ event }) {
  return (
    <div className="event-card__image-wrap img-frame shine-hover">
      <img
        src={event.coverImage}
        alt=""
        className="event-card__image"
        loading="lazy"
        decoding="async"
        onLoad={(loadEvent) => {
          loadEvent.currentTarget.parentElement?.classList.add('is-loaded');
        }}
      />
    </div>
  );
}

export default function EventCard({ event, index, past = false }) {
  const hasCover = Boolean(event.coverImage);
  const pastClass = past ? ' event-card--past' : '';
  const noImageClass = hasCover ? '' : ' event-card--no-image';
  const delayClass = ` reveal--delay-${(index % 4) + 1}`;
  const href = eventUrl(event);
  const actionLabel = past ? siteText('events.card.readPast') : siteText('events.card.moreInfo');

  return (
    <article className={`event-card-wrap${delayClass} reveal`}>
      <a
        href={href}
        className={`event-card shine-parent${pastClass}${noImageClass}`}
        onClick={() => trackNavClick(href, event.name)}
      >
        <div className="event-card__media">
          {hasCover ? (
            <EventCardImage event={event} />
          ) : (
            <EventCardPlaceholder
              seed={resolveCoverPatternSeed(event.coverPatternSeed, event.id, event.name)}
              past={past}
            />
          )}
          <EventCategoryLabel
            category={event.category}
            past={past}
            className="event-card__category-tag"
            iconSize="sm"
          />
        </div>
        <div className="event-card__body">
          <h2 className="event-card__name">{event.name}</h2>
          <time className="event-card__date" dateTime={event.dateStart}>{event.dateLabel}</time>
          <span className="btn btn--outline">{actionLabel}</span>
        </div>
      </a>
    </article>
  );
}
