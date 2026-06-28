import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MENU_ITEM_TYPES,
  MENU_LINK_TYPES,
  MAX_DROPDOWN_ITEMS,
  createEmptyLink,
  validateMenuLink,
} from '../data/site-menu';
import { pagePath } from '../data/pages';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import PageCombobox from './PageCombobox';
import SortableList from './SortableList';
import AdminModalPanel from './AdminModalPanel';

function Toggle({ id, checked, onChange, label }) {
  return (
    <label className="admin-toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="admin-toggle__track" aria-hidden="true">
        <span className="admin-toggle__thumb" />
      </span>
      <span className="admin-toggle__label">{label}</span>
    </label>
  );
}

export default function AdminMenuLinkFormModal({
  open,
  link,
  pages,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(createEmptyLink());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { mounted, visible } = useAnimatedPresence(open, 240);

  useEffect(() => {
    if (!open) {
      setForm(createEmptyLink());
      setSaving(false);
      setError('');
      return;
    }

    if (link) {
      setForm({ ...link });
    } else {
      setForm(createEmptyLink());
    }
  }, [open, link]);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.classList.add('admin-modal-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('admin-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  const isPageLink = form.linkType === MENU_LINK_TYPES.page;

  const handleLinkTypeChange = (linkType) => {
    setForm((prev) => ({
      ...prev,
      linkType,
      external: linkType === MENU_LINK_TYPES.custom,
      pageId: linkType === MENU_LINK_TYPES.page ? prev.pageId : '',
      href: linkType === MENU_LINK_TYPES.custom ? prev.href : '',
    }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      validateMenuLink(form);
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.message || 'Uložení se nezdařilo.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className={`admin-modal${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-menu-link-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <AdminModalPanel className="admin-modal__panel--page">
        <h2 id="admin-menu-link-title" className="admin-modal__title">
          {link ? 'Upravit položku' : 'Nová položka menu'}
        </h2>

        <form className="admin-form admin-page-dialog" onSubmit={handleSubmit}>
          <div className="admin-form__group">
            <label className="admin-form__label" htmlFor="menu-link-label">
              Název v menu
            </label>
            <input
              id="menu-link-label"
              className="admin-form__input"
              value={form.label}
              onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="Např. Blog"
              required
            />
          </div>

          <div className="admin-form__group">
            <span className="admin-form__label">Typ odkazu</span>
            <div className="admin-menu-link-types" role="group" aria-label="Typ odkazu">
              <button
                type="button"
                className={`admin-menu-link-types__btn${isPageLink ? ' admin-menu-link-types__btn--active' : ''}`}
                onClick={() => handleLinkTypeChange(MENU_LINK_TYPES.page)}
              >
                Stránka webu
              </button>
              <button
                type="button"
                className={`admin-menu-link-types__btn${!isPageLink ? ' admin-menu-link-types__btn--active' : ''}`}
                onClick={() => handleLinkTypeChange(MENU_LINK_TYPES.custom)}
              >
                Vlastní odkaz
              </button>
            </div>
          </div>

          {isPageLink ? (
            <div className="admin-form__group">
              <label className="admin-form__label" htmlFor="menu-link-page">
                Stránka
              </label>
              <PageCombobox
                id="menu-link-page"
                pages={pages}
                value={form.pageId}
                onChange={(pageId) => setForm((prev) => ({ ...prev, pageId }))}
                required
              />
              {form.pageId && (
                <p className="admin-form__hint">
                  Cíl: {pagePath(pages.find((page) => page.id === form.pageId))}
                </p>
              )}
            </div>
          ) : (
            <div className="admin-form__group">
              <label className="admin-form__label" htmlFor="menu-link-href">
                URL adresa
              </label>
              <input
                id="menu-link-href"
                className="admin-form__input"
                value={form.href}
                onChange={(e) => setForm((prev) => ({ ...prev, href: e.target.value }))}
                placeholder="https://"
                required
              />
            </div>
          )}

          <div className="admin-form__group">
            <Toggle
              id="menu-link-external"
              checked={form.external}
              onChange={(external) => setForm((prev) => ({ ...prev, external }))}
              label="Otevřít v novém okně"
            />
          </div>

          {error && <p className="admin-error">{error}</p>}

          <div className="admin-modal__actions">
            <button type="button" className="btn btn--outline" onClick={onClose} disabled={saving}>
              Zrušit
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Ukládám…' : link ? 'Uložit' : 'Přidat'}
            </button>
          </div>
        </form>
      </AdminModalPanel>
    </div>,
    document.body,
  );
}

export function AdminMenuDropdownFormModal({
  open,
  dropdown,
  pages,
  onClose,
  onSave,
}) {
  const [label, setLabel] = useState('');
  const [items, setItems] = useState([]);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { mounted, visible } = useAnimatedPresence(open, 240);

  useEffect(() => {
    if (!open) {
      setLabel('');
      setItems([]);
      setLinkModalOpen(false);
      setEditingLink(null);
      setSaving(false);
      setError('');
      return;
    }

    if (dropdown) {
      setLabel(dropdown.label);
      setItems(dropdown.items.map((item) => ({ ...item })));
    } else {
      setLabel('');
      setItems([]);
    }
  }, [open, dropdown]);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (event) => {
      if (event.key === 'Escape') {
        if (linkModalOpen) {
          setLinkModalOpen(false);
          setEditingLink(null);
        } else {
          onClose();
        }
      }
    };

    document.body.classList.add('admin-modal-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('admin-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [mounted, linkModalOpen, onClose]);

  if (!mounted) return null;

  const handleSaveLink = async (link) => {
    if (editingLink) {
      setItems((prev) => prev.map((item) => (item.id === editingLink.id ? link : item)));
    } else {
      setItems((prev) => [...prev, link]);
    }
    setLinkModalOpen(false);
    setEditingLink(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      id: dropdown?.id,
      type: MENU_ITEM_TYPES.dropdown,
      label,
      items,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Uložení se nezdařilo.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <>
      <div
        className={`admin-modal admin-modal--wide${visible ? ' admin-modal--visible' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-menu-dropdown-title"
      >
        <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
        <AdminModalPanel className="admin-modal__panel--wide">
          <h2 id="admin-menu-dropdown-title" className="admin-modal__title">
            {dropdown ? 'Upravit dropdown' : 'Nový dropdown'}
          </h2>

          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form__group">
              <label className="admin-form__label" htmlFor="menu-dropdown-label">
                Název dropdownu
              </label>
              <input
                id="menu-dropdown-label"
                className="admin-form__input"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Např. Akce"
                required
              />
            </div>

            <div className="admin-menu-dropdown-items">
              <div className="admin-menu-dropdown-items__head">
                <h3 className="admin-menu-dropdown-items__title">
                  Položky ({items.length}/{MAX_DROPDOWN_ITEMS})
                </h3>
                <button
                  type="button"
                  className="btn btn--outline btn--small"
                  disabled={items.length >= MAX_DROPDOWN_ITEMS}
                  onClick={() => {
                    setEditingLink(null);
                    setLinkModalOpen(true);
                  }}
                >
                  Přidat položku
                </button>
              </div>

              {items.length > 0 ? (
                <SortableList
                  items={items}
                  onReorder={setItems}
                  listClassName="admin-menu-dropdown-items__list"
                  itemClassName="admin-menu-dropdown-items__row admin-sortable__item"
                  ghostClassName="admin-menu-dropdown-items__row"
                  handleLabel="Přesunout položku dropdownu"
                  renderItem={(item) => (
                    <>
                      <div>
                        <strong>{item.label}</strong>
                        <span className="admin-menu-dropdown-items__meta">
                          {item.linkType === MENU_LINK_TYPES.page
                            ? pagePath(pages.find((page) => page.id === item.pageId))
                            : item.href}
                          {item.external ? ' · nové okno' : ''}
                        </span>
                      </div>
                      <div className="admin-menu-dropdown-items__actions">
                        <button
                          type="button"
                          className="admin-events__action"
                          aria-label={`Upravit ${item.label}`}
                          onClick={() => {
                            setEditingLink(item);
                            setLinkModalOpen(true);
                          }}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="admin-events__action admin-events__action--danger"
                          aria-label={`Smazat ${item.label}`}
                          onClick={() => setItems((prev) => prev.filter((entry) => entry.id !== item.id))}
                        >
                          ×
                        </button>
                      </div>
                    </>
                  )}
                />
              ) : (
                <p className="admin-menu-dropdown-items__empty">Dropdown zatím nemá žádné položky.</p>
              )}
            </div>

            {error && <p className="admin-error">{error}</p>}

            <div className="admin-modal__actions">
              <button type="button" className="btn btn--outline" onClick={onClose} disabled={saving}>
                Zrušit
              </button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Ukládám…' : dropdown ? 'Uložit' : 'Vytvořit'}
              </button>
            </div>
          </form>
        </AdminModalPanel>
      </div>

      <AdminMenuLinkFormModal
        open={linkModalOpen}
        link={editingLink}
        pages={pages}
        onClose={() => {
          setLinkModalOpen(false);
          setEditingLink(null);
        }}
        onSave={handleSaveLink}
      />
    </>,
    document.body,
  );
}
