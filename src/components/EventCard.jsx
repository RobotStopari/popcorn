import { useMemo } from 'react';
import { eventUrl } from '../data/events';
import { getEventCoverStyle } from '../utils/event-cover-pattern';

function EventCardPlaceholder({ seed, past }) {
  const style = useMemo(() => getEventCoverStyle(seed, { past }), [seed, past]);

  return (
    <div
      className={`event-card__placeholder shine-hover${past ? ' event-card__placeholder--past' : ''}`}
      style={style}
      aria-hidden="true"
    />
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
  const delayClass = ` reveal--delay-${index + 1}`;
  const href = eventUrl(event.id);
  const actionLabel = past ? 'Přečíst o akci' : 'Více informací';

  return (
    <a href={href} className={`event-card shine-parent${pastClass}${noImageClass}${delayClass} reveal`}>
      {hasCover ? (
        <EventCardImage event={event} />
      ) : (
        <EventCardPlaceholder seed={event.id || event.name} past={past} />
      )}
      <div className="event-card__body">
        <h2 className="event-card__name">{event.name}</h2>
        <time className="event-card__date" dateTime={event.dateStart}>{event.dateLabel}</time>
        <span className="btn btn--outline">{actionLabel}</span>
      </div>
    </a>
  );
}
