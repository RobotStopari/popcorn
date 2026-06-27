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

export default function EventCard({ event, index, past = false }) {
  const pastClass = past ? ' event-card--past' : '';
  const noImageClass = ' event-card--no-image';
  const delayClass = ` reveal--delay-${index + 1}`;
  const href = eventUrl(event.id);
  const actionLabel = past ? 'Přečíst o akci' : 'Více informací';

  return (
    <a href={href} className={`event-card shine-parent${pastClass}${noImageClass}${delayClass} reveal`}>
      <EventCardPlaceholder seed={event.id || event.name} past={past} />
      <div className="event-card__body">
        <h2 className="event-card__name">{event.name}</h2>
        <time className="event-card__date" dateTime={event.dateStart}>{event.dateLabel}</time>
        <span className="btn btn--outline">{actionLabel}</span>
      </div>
    </a>
  );
}
