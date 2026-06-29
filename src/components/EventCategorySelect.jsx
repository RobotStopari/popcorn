import { useEffect, useRef, useState } from 'react';
import { useEventCategories } from '../hooks/useEventCategories';
import { normalizeEventCategory } from '../data/event-categories';
import EventCategoryIcon from './EventCategoryIcon';

export default function EventCategorySelect({
  id,
  value,
  onChange,
  disabled = false,
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const { categories, categoryIds, getLabel } = useEventCategories();
  const categoryId = normalizeEventCategory(value);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const handleSelect = (nextId) => {
    onChange(nextId);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`event-category-select${open ? ' event-category-select--open' : ''}`}>
      <button
        type="button"
        id={id}
        className={`event-category-select__trigger event-category-select__trigger--${categoryId}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <EventCategoryIcon category={categoryId} size="sm" className="event-category-select__icon" />
        <span className="event-category-select__label">{getLabel(categoryId)}</span>
        <span className="event-category-select__chevron" aria-hidden="true">▾</span>
      </button>

      {open && (
        <ul className="event-category-select__menu" role="listbox" aria-labelledby={id}>
          {categoryIds.map((optionId) => (
            <li key={optionId} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={optionId === categoryId}
                className={`event-category-select__option event-category-select__option--${optionId}${optionId === categoryId ? ' event-category-select__option--selected' : ''}`}
                onClick={() => handleSelect(optionId)}
              >
                <EventCategoryIcon category={optionId} size="sm" className="event-category-select__icon" />
                <span className="event-category-select__option-label">
                  {categories[optionId].label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
