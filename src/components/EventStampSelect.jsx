import { useEffect, useRef, useState } from 'react';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { getEventStampById } from '../data/event-stamps';

const EMPTY_LABEL = 'Bez razítka';

export default function EventStampSelect({
  id = 'event-stamp',
  value = '',
  onChange,
  disabled = false,
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const { settings } = useSiteSettings();
  const stamps = settings?.eventStamps || [];
  const selected = getEventStampById(stamps, value);
  const selectedId = selected?.id || '';
  const hasSelection = Boolean(selected);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeydown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeydown);
    };
  }, [open]);

  if (!stamps.length) {
    return (
      <p className="admin-form__hint">
        Zatím nejsou žádná razítka. Přidejte je v Nastavení akcí.
      </p>
    );
  }

  const handleSelect = (nextId) => {
    onChange?.(nextId);
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`event-stamp-select${open ? ' event-stamp-select--open' : ''}${hasSelection ? ' event-stamp-select--selected' : ''}`}
    >
      <button
        type="button"
        id={id}
        className="event-stamp-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        {hasSelection ? (
          <span className="event-stamp-select__icon" aria-hidden="true">{selected.icon}</span>
        ) : (
          <span className="event-stamp-select__icon event-stamp-select__icon--empty" aria-hidden="true">
            ○
          </span>
        )}
        <span className="event-stamp-select__label">
          {hasSelection ? selected.name : EMPTY_LABEL}
        </span>
        <span className="event-stamp-select__chevron" aria-hidden="true">▾</span>
      </button>

      {open && (
        <ul className="event-stamp-select__menu" role="listbox" aria-labelledby={id}>
          <li role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={!hasSelection}
              className={`event-stamp-select__option event-stamp-select__option--empty${!hasSelection ? ' event-stamp-select__option--selected' : ''}`}
              onClick={() => handleSelect('')}
            >
              <span className="event-stamp-select__icon event-stamp-select__icon--empty" aria-hidden="true">
                ○
              </span>
              <span className="event-stamp-select__option-label">{EMPTY_LABEL}</span>
            </button>
          </li>
          {stamps.map((stamp) => {
            const isSelected = stamp.id === selectedId;
            return (
              <li key={stamp.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`event-stamp-select__option${isSelected ? ' event-stamp-select__option--selected' : ''}`}
                  onClick={() => handleSelect(stamp.id)}
                >
                  <span className="event-stamp-select__icon" aria-hidden="true">{stamp.icon}</span>
                  <span className="event-stamp-select__option-label">{stamp.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
