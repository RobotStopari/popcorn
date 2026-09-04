import { useEffect, useId, useRef, useState } from 'react';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { useResourceCategories } from '../hooks/useResourceCategories';

export default function ResourceCategorySelect({
  type,
  id,
  value = '',
  onChange,
  disabled = false,
  emptyLabel = 'Bez kategorie',
}) {
  const rootRef = useRef(null);
  const optionRefs = useRef([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const generatedId = useId();
  const listboxId = `${id || generatedId}-listbox`;
  const { mounted, visible } = useAnimatedPresence(open, 160);
  const { categories, hasCategories, getLabel } = useResourceCategories(type);
  const selectedId = typeof value === 'string' ? value : '';
  const selectedLabel = selectedId ? getLabel(selectedId) : '';
  const hasSelection = Boolean(selectedId && selectedLabel);
  const options = [
    { id: '', label: emptyLabel },
    ...categories.map((category) => ({ id: category.id, label: category.label })),
  ];

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
    if (!open) return undefined;

    const index = Math.max(0, options.findIndex((option) => option.id === selectedId));
    setActiveIndex(index);
    const frame = requestAnimationFrame(() => {
      optionRefs.current[index]?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, selectedId, categories, emptyLabel]);


  if (!hasCategories) {
    return (
      <p className="admin-form__hint">
        Zatím nejsou vytvořené žádné kategorie. Přidejte je v Nastavení.
      </p>
    );
  }

  const handleSelect = (nextId) => {
    onChange(nextId);
    setOpen(false);
  };

  const moveActive = (direction) => {
    setActiveIndex((current) => {
      const next = (current + direction + options.length) % options.length;
      optionRefs.current[next]?.focus();
      return next;
    });
  };

  return (
    <div
      ref={rootRef}
      className={`resource-category-select${open ? ' resource-category-select--open' : ''}${hasSelection ? ' resource-category-select--selected' : ''}`}
    >
      <button
        type="button"
        id={id}
        className="resource-category-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="resource-category-select__value">
          {hasSelection && (
            <span className="resource-category-select__dot" aria-hidden="true" />
          )}
          <span className="resource-category-select__label">
            {selectedLabel || emptyLabel}
          </span>
        </span>
        <span className="resource-category-select__chevron" aria-hidden="true">
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
          className={`resource-category-select__menu${visible ? ' resource-category-select__menu--visible' : ''}`}
          role="listbox"
          aria-labelledby={id}
        >
          {options.map((option, index) => {
            const selected = option.id === selectedId;
            return (
              <li key={option.id || 'empty'} role="presentation">
                <button
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="option"
                  tabIndex={activeIndex === index ? 0 : -1}
                  aria-selected={selected}
                  className={`resource-category-select__option${selected ? ' resource-category-select__option--selected' : ''}${!option.id ? ' resource-category-select__option--empty' : ''}`}
                  onClick={() => handleSelect(option.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      moveActive(1);
                    } else if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      moveActive(-1);
                    } else if (event.key === 'Home') {
                      event.preventDefault();
                      setActiveIndex(0);
                      optionRefs.current[0]?.focus();
                    } else if (event.key === 'End') {
                      event.preventDefault();
                      const last = options.length - 1;
                      setActiveIndex(last);
                      optionRefs.current[last]?.focus();
                    } else if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleSelect(option.id);
                    }
                  }}
                >
                  <span className="resource-category-select__option-label">{option.label}</span>
                  {selected && (
                    <span className="resource-category-select__check" aria-hidden="true">✓</span>
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
