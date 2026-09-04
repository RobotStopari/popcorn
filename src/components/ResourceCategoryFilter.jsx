import { useEffect, useId, useRef, useState } from 'react';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { useResourceCategories } from '../hooks/useResourceCategories';

export default function ResourceCategoryFilter({
  type,
  value = '',
  onChange,
  allLabel = 'Všechny kategorie',
  ariaLabel = 'Filtrovat podle kategorie',
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const { mounted, visible } = useAnimatedPresence(open, 160);
  const { categories, hasCategories, getLabel } = useResourceCategories(type);
  const selectedId = typeof value === 'string' ? value : '';
  const selectedLabel = selectedId ? getLabel(selectedId) : allLabel;
  const hasSelection = Boolean(selectedId && getLabel(selectedId));

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
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

  useEffect(() => {
    if (!hasCategories && selectedId) onChange('');
  }, [hasCategories, selectedId, onChange]);

  if (!hasCategories) return null;

  const handleSelect = (nextId) => {
    onChange(nextId);
    setOpen(false);
  };

  const options = [
    { id: '', label: allLabel },
    ...categories.map((category) => ({ id: category.id, label: category.label })),
  ];

  return (
    <div
      ref={rootRef}
      className={`resource-category-filter${open ? ' resource-category-filter--open' : ''}${hasSelection ? ' resource-category-filter--selected' : ''}`}
    >
      <button
        type="button"
        className="resource-category-filter__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="resource-category-filter__label">{selectedLabel}</span>
        <span className="resource-category-filter__chevron" aria-hidden="true">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
            <path
              d="M5 7.5 10 12.5 15 7.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {mounted && (
        <ul
          id={listboxId}
          className={`resource-category-filter__menu${visible ? ' resource-category-filter__menu--visible' : ''}`}
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option) => {
            const selected = option.id === selectedId;
            return (
              <li key={option.id || 'all'} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`resource-category-filter__option${selected ? ' resource-category-filter__option--selected' : ''}${!option.id ? ' resource-category-filter__option--all' : ''}`}
                  onClick={() => handleSelect(option.id)}
                >
                  <span className="resource-category-filter__option-label">{option.label}</span>
                  {selected && (
                    <span className="resource-category-filter__check" aria-hidden="true">✓</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
