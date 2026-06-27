import { useEffect, useRef } from 'react';
import SortableList from './SortableList';

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
    </svg>
  );
}

function ParticipantGhostContent({ participant, index }) {
  return (
    <>
      <span className="admin-form__participant-index" aria-hidden="true">
        {index + 1}
      </span>
      <span className="admin-form__participant-ghost-name">
        {participant.name || 'Jméno účastníka'}
      </span>
      <span className="admin-form__participant-remove admin-form__participant-remove--ghost" aria-hidden="true">
        <TrashIcon />
      </span>
    </>
  );
}

export default function SortableParticipantList({
  participants,
  onReorder,
  onUpdate,
  onRemove,
  onAdd,
  focusParticipantId,
  onFocusHandled,
}) {
  const inputRefs = useRef({});

  useEffect(() => {
    if (!focusParticipantId) return undefined;

    const frame = requestAnimationFrame(() => {
      const input = inputRefs.current[focusParticipantId];
      if (!input) return;
      input.focus();
      onFocusHandled?.();
    });

    return () => cancelAnimationFrame(frame);
  }, [focusParticipantId, participants.length]);

  return (
    <SortableList
      items={participants}
      onReorder={onReorder}
      getItemKey={(item) => item.clientId}
      listClassName="admin-form__participants-list"
      itemClassName="admin-form__participant-row admin-sortable__item"
      ghostClassName="admin-form__participant-row admin-sortable__ghost--flat"
      handleLabel="Přesunout účastníka"
      renderGhostItem={(participant, index) => (
        <ParticipantGhostContent participant={participant} index={index} />
      )}
      renderItem={(participant, index) => (
        <>
          <span className="admin-form__participant-index" aria-hidden="true">
            {index + 1}
          </span>
          <input
            ref={(element) => {
              if (element) {
                inputRefs.current[participant.clientId] = element;
              } else {
                delete inputRefs.current[participant.clientId];
              }
            }}
            type="text"
            className="admin-form__input"
            value={participant.name}
            onChange={(event) => onUpdate(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onAdd?.();
              }
            }}
            placeholder="Jméno účastníka"
            aria-label={`Jméno účastníka ${index + 1}`}
          />
          <button
            type="button"
            className="admin-form__participant-remove"
            aria-label={`Odebrat účastníka ${index + 1}`}
            onClick={() => onRemove(index)}
          >
            <TrashIcon />
          </button>
        </>
      )}
    />
  );
}
