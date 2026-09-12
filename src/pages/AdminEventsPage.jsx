import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminDeleteEventDialog from '../components/AdminDeleteEventDialog';
import AdminEventFormModal from '../components/AdminEventFormModal';
import AdminEventSettingsModal from '../components/AdminEventSettingsModal';
import EventCategoryBadge from '../components/EventCategoryBadge';
import EventStampBadge from '../components/EventStampBadge';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { createDraftEvent, createEvent, deleteEvent, fetchEventById, updateEvent } from '../services/events';
import { useEvents } from '../contexts/EventsContext';
import { eventHasMissingTimes, formatEventDateLabel, isEventPast, partitionAdminEventList, sortPastEvents, sortUpcomingEvents } from '../utils/event-dates';
import { getAdminEventTitle, normalizeEvent } from '../utils/event-format';
import { adminDocumentTitle, adminText } from '../utils/admin-text';
import { useAdminActivityLogger } from '../hooks/useAdminActivityLogger';
import useAdminStars from '../hooks/useAdminStars';
import { filterStarredOnly } from '../utils/admin-stars';
import { AdminListStarButton, AdminListStarFilter } from '../components/AdminListStar';

function applyEventsStarredFilter(result, starredOnly, starredIds) {
  if (!starredOnly) return result;

  if (Array.isArray(result)) {
    return filterStarredOnly(result, true, starredIds);
  }

  const drafts = filterStarredOnly(result.drafts, true, starredIds);
  const upcoming = filterStarredOnly(result.upcoming, true, starredIds);
  const past = filterStarredOnly(result.past, true, starredIds);
  const hasFutureSection = drafts.length > 0 || upcoming.length > 0;

  return {
    drafts,
    upcoming,
    past,
    showPastDivider: hasFutureSection && past.length > 0,
  };
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

const FILTERS = [
  { id: 'all', labelKey: 'all' },
  { id: 'upcoming', labelKey: 'upcoming' },
  { id: 'past', labelKey: 'past' },
];

export default function AdminEventsPage() {
  const { canAccessAdmin, loading } = useAdminAuth();
  const logActivity = useAdminActivityLogger();
  const { starredIds, isStarred, toggleStar } = useAdminStars('events');
  const { events, loading: eventsLoading, error: eventsError } = useEvents();
  const [search, setSearch] = useState('');
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortDescending, setSortDescending] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    document.title = adminDocumentTitle(adminText('events.list.title'));
  }, []);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    let list = events;

    if (statusFilter === 'upcoming') {
      list = list.filter((event) => !isEventPast(event));
    } else if (statusFilter === 'past') {
      list = list.filter((event) => isEventPast(event));
    }

    if (query) {
      list = list.filter((event) => {
        const title = getAdminEventTitle(event).toLowerCase();
        return title.includes(query)
          || event.place.toLowerCase().includes(query)
          || event.organisers.some((organiser) => (
            organiser.name.toLowerCase().includes(query)
              || organiser.nick?.toLowerCase().includes(query)
              || organiser.zapalovacYear?.toLowerCase().includes(query)
              || organiser.email.toLowerCase().includes(query)
          ));
      });
    }

    if (statusFilter === 'upcoming') {
      return filterStarredOnly(sortUpcomingEvents(list, sortDescending), showStarredOnly, starredIds);
    }

    if (statusFilter === 'past') {
      return filterStarredOnly(sortPastEvents(list, sortDescending), showStarredOnly, starredIds);
    }

    const { drafts, upcoming, past } = partitionAdminEventList(list, sortDescending);
    const hasFutureSection = drafts.length > 0 || upcoming.length > 0;
    return applyEventsStarredFilter({
      drafts,
      upcoming,
      past,
      showPastDivider: hasFutureSection && past.length > 0,
    }, showStarredOnly, starredIds);
  }, [events, search, showStarredOnly, starredIds, statusFilter, sortDescending]);

  const flatEvents = Array.isArray(filteredEvents) ? filteredEvents : [
    ...filteredEvents.drafts,
    ...filteredEvents.upcoming,
    ...filteredEvents.past,
  ];
  const showPastDivider = !Array.isArray(filteredEvents) && filteredEvents.showPastDivider;
  const pastSectionStartId = !Array.isArray(filteredEvents)
    ? filteredEvents.past[0]?.id
    : null;

  if (loading) {
    return (
      <div className="admin-content">
        <p className="admin-loading">Načítání…</p>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleCreate = () => {
    setEditingEvent(null);
    setFormOpen(true);
  };

  const handleEdit = async (event) => {
    try {
      const fresh = await fetchEventById(event.id);
      setEditingEvent(fresh || event);
    } catch {
      setEditingEvent(event);
    }
    setFormOpen(true);
  };

  const handleSave = async (payload, { published = true, eventId = null, silent = false } = {}) => {
    setSaveError('');
    try {
      const fullPayload = { ...payload, published };
      const targetId = eventId ?? editingEvent?.id;

      if (targetId) {
        await updateEvent(targetId, fullPayload);
        if (!silent) {
          await logActivity({
            action: 'update',
            targetType: 'event',
            targetId,
            summary: `Upravena akce „${fullPayload.title}“`,
          });
        }
        setEditingEvent((current) => (
          current?.id === targetId
            ? normalizeEvent({ ...current, ...fullPayload, id: targetId })
            : current
        ));
      } else {
        const newId = await createEvent(fullPayload);
        if (!silent) {
          await logActivity({
            action: 'create',
            targetType: 'event',
            targetId: newId,
            summary: `Vytvořena akce „${fullPayload.title}“`,
          });
        }
        setEditingEvent(normalizeEvent({ ...fullPayload, id: newId }));
      }
      return true;
    } catch (err) {
      setSaveError(err.message || 'Uložení akce se nezdařilo.');
      return false;
    }
  };

  const handleEnsureDraft = async (payload) => {
    if (editingEvent?.id) return editingEvent.id;

    const eventId = await createDraftEvent(payload);
    const draft = await fetchEventById(eventId);
    setEditingEvent(draft);
    return eventId;
  };

  const handleConfirmDelete = async (eventId) => {
    try {
      const title = eventToDelete?.title || getAdminEventTitle(eventToDelete) || 'akce';
      await deleteEvent(eventId);
      await logActivity({
        action: 'delete',
        targetType: 'event',
        targetId: eventId,
        summary: `Smazána akce „${title}“`,
      });
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="admin-content container">
      <header className="admin-content__header admin-content__header--actions">
        <div>
          <h1 className="admin-content__title">{adminText('events.list.title')}</h1>
          <p className="admin-content__subtitle">{adminText('events.list.subtitle')}</p>
        </div>
        <div className="admin-content__header-actions">
          <button type="button" className="btn btn--outline" onClick={() => setSettingsOpen(true)}>
            {adminText('common.settings')}
          </button>
          <button type="button" className="btn btn--primary" onClick={handleCreate}>
            {adminText('events.list.newEvent')}
          </button>
        </div>
      </header>

      <div className="admin-events__toolbar">
        <div className="admin-events__toolbar-row admin-events__toolbar-row--filters">
          <div className="admin-events__filters" role="group" aria-label={adminText('events.list.filters.aria')}>
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`admin-events__filter${statusFilter === filter.id ? ' admin-events__filter--active' : ''}`}
                aria-pressed={statusFilter === filter.id}
                onClick={() => setStatusFilter(filter.id)}
              >
                {adminText(`events.list.filters.${filter.labelKey}`)}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn--outline btn--small"
            onClick={() => setSortDescending((value) => !value)}
          >
            {sortDescending ? adminText('events.list.sortReversed') : adminText('events.list.sortNearest')}
          </button>
        </div>
        <div className="admin-events__toolbar-row admin-events__toolbar-row--search">
          <input
            type="search"
            className="admin-form__input admin-events__search"
            placeholder={adminText('events.list.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <AdminListStarFilter
            active={showStarredOnly}
            onToggle={() => setShowStarredOnly((value) => !value)}
          />
        </div>
      </div>

      {(eventsError || saveError) && (
        <p className="admin-error admin-content__error">{eventsError || saveError}</p>
      )}

      {eventsLoading ? (
        <p className="admin-loading">{adminText('events.list.loading')}</p>
      ) : (
        <div className="admin-events">
          <div className="admin-events__head" aria-hidden="true">
            <span />
            <span>{adminText('common.columns.name')}</span>
            <span>{adminText('events.list.columns.date')}</span>
            <span>{adminText('events.list.columns.category')}</span>
            <span>{adminText('common.columns.actions')}</span>
          </div>

          <ul className={`admin-events__list${showPastDivider ? ' admin-events__list--with-past-divider' : ''}`}>
            {flatEvents.map((event) => {
              const displayTitle = getAdminEventTitle(event);
              const isPastSectionStart = showPastDivider && event.id === pastSectionStartId;
              return (
                <li
                  key={event.id}
                  className={[
                    'admin-events__row',
                    event.isDraft ? 'admin-events__row--draft' : '',
                    isPastSectionStart ? 'admin-events__row--past-divider' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <AdminListStarButton
                    starred={isStarred(event.id)}
                    label={displayTitle}
                    onToggle={() => toggleStar(event.id)}
                  />
                  <div className="admin-events__title">
                    {event.calendarOnly ? (
                      <span
                        className="event-stamp admin-events__stamp admin-events__stamp--calendar"
                        title={adminText('events.list.badges.calendarOnlyTitle')}
                        aria-label={adminText('events.list.badges.calendarOnlyTitle')}
                      >
                        <span className="event-stamp__icon" aria-hidden="true">📅</span>
                      </span>
                    ) : (
                      <EventStampBadge
                        stampId={event.stampId}
                        className="admin-events__stamp"
                      />
                    )}
                    <span className="admin-events__title-text">{displayTitle}</span>
                    {eventHasMissingTimes(event) && (
                      <span
                        className="admin-events__time-warning"
                        title={adminText('events.list.badges.missingTimesTitle')}
                        aria-label={adminText('events.list.badges.missingTimesTitle')}
                      >
                        !
                      </span>
                    )}
                  </div>
                  <div className="admin-events__meta">
                    <div className="admin-events__date">{formatEventDateLabel(event)}</div>
                    <div className="admin-events__category">
                      <EventCategoryBadge category={event.category} />
                      {event.calendarOnly && (
                        <span
                          className="admin-events__badge admin-events__badge--calendar-only"
                          title={adminText('events.list.badges.calendarOnlyTitle')}
                        >
                          {adminText('events.list.badges.calendarOnly')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="admin-events__actions">
                    <button
                      type="button"
                      className="admin-events__action"
                      aria-label={`Upravit akci ${displayTitle}`}
                      onClick={() => handleEdit(event)}
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      className="admin-events__action admin-events__action--danger"
                      aria-label={`Smazat akci ${displayTitle}`}
                      onClick={() => setEventToDelete(event)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {!flatEvents.length && (
            <p className="admin-events__empty">
              {showStarredOnly
                ? adminText('common.stars.empty')
                : search.trim()
                  ? adminText('events.list.emptySearch')
                  : statusFilter === 'upcoming'
                    ? adminText('events.list.emptyUpcoming')
                    : statusFilter === 'past'
                      ? adminText('events.list.emptyPast')
                      : adminText('events.list.empty')}
            </p>
          )}
        </div>
      )}

      <AdminEventFormModal
        open={formOpen}
        event={editingEvent}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        onEnsureDraft={handleEnsureDraft}
      />

      <AdminEventSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <AdminDeleteEventDialog
        open={Boolean(eventToDelete)}
        event={eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
