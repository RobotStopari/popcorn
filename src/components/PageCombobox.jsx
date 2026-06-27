import { useEffect, useMemo, useRef, useState } from 'react';
import { pagePath } from '../data/pages';

export default function PageCombobox({
  id,
  pages,
  value,
  onChange,
  required = false,
  disabled = false,
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedPage = pages.find((page) => page.id === value);

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...pages].sort((a, b) => a.title.localeCompare(b.title, 'cs'));

    if (!q) return sorted;

    return sorted.filter((page) => {
      const hay = `${page.title} ${page.slug} ${pagePath(page)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [pages, query]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const displayValue = open
    ? query
    : (selectedPage ? `${selectedPage.title} (${pagePath(selectedPage)})` : '');

  const handleActivate = () => {
    if (disabled) return;
    if (!open) setQuery('');
    setOpen(true);
  };

  return (
    <div
      ref={rootRef}
      className={`admin-combobox${open ? ' admin-combobox--open' : ''}`}
    >
      <input
        id={id}
        type="text"
        className="admin-form__input admin-combobox__input"
        value={displayValue}
        placeholder="Hledat stránku…"
        readOnly={!open}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={handleActivate}
        onClick={handleActivate}
        required={required && !value}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
      />

      {open && (
        <ul
          id={`${id}-listbox`}
          className="admin-combobox__list"
          role="listbox"
        >
          {filteredPages.length > 0 ? (
            filteredPages.map((page) => (
              <li key={page.id} role="option" aria-selected={page.id === value}>
                <button
                  type="button"
                  className={`admin-combobox__option${page.id === value ? ' admin-combobox__option--active' : ''}`}
                  onClick={() => {
                    onChange(page.id);
                    setQuery('');
                    setOpen(false);
                  }}
                >
                  <span className="admin-combobox__option-title">{page.title}</span>
                  <span className="admin-combobox__option-path">{pagePath(page)}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="admin-combobox__empty">Žádná stránka neodpovídá hledání.</li>
          )}
        </ul>
      )}
    </div>
  );
}
