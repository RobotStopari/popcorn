import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminDeleteMenuDialog from '../components/AdminDeleteMenuDialog';
import AdminMenuLinkFormModal, { AdminMenuDropdownFormModal } from '../components/AdminMenuFormModal';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { usePages } from '../contexts/PagesContext';
import { useSiteMenu } from '../contexts/SiteMenuContext';
import {
  MENU_ITEM_TYPES,
  MENU_LINK_TYPES,
  createMenuId,
} from '../data/site-menu';
import { pagePath } from '../data/pages';
import { ensureDefaultSiteMenu, updateSiteMenu } from '../services/site-menu';
import SortableList from '../components/SortableList';

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
    </svg>
  );
}

function describeItem(item, pages) {
  if (item.type === MENU_ITEM_TYPES.dropdown) {
    return `${item.items.length} položek`;
  }

  if (item.linkType === MENU_LINK_TYPES.page) {
    const page = pages.find((entry) => entry.id === item.pageId);
    return page ? pagePath(page) : '—';
  }

  return item.href || '—';
}

export default function AdminMenuPage() {
  const { canAccessAdmin, loading } = useAdminAuth();
  const { pages } = usePages();
  const { items, loading: menuLoading, error: menuError } = useSiteMenu();
  const [seedLoading, setSeedLoading] = useState(true);
  const [saveError, setSaveError] = useState('');
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [dropdownModalOpen, setDropdownModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [editingDropdown, setEditingDropdown] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    document.title = 'Menu — Admin';
  }, []);

  useEffect(() => {
    if (!canAccessAdmin) return undefined;

    let active = true;

    const seed = async () => {
      setSeedLoading(true);
      try {
        await ensureDefaultSiteMenu();
      } catch (err) {
        if (active) {
          setSaveError(err.message || 'Nepodařilo se inicializovat menu.');
        }
      } finally {
        if (active) setSeedLoading(false);
      }
    };

    seed();

    return () => {
      active = false;
    };
  }, [canAccessAdmin]);

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

  const listLoading = seedLoading || menuLoading;

  const persistItems = async (nextItems) => {
    setSaveError('');
    await updateSiteMenu(nextItems);
  };

  const handleCreateLink = () => {
    setEditingLink(null);
    setLinkModalOpen(true);
    setSaveError('');
  };

  const handleCreateDropdown = () => {
    setEditingDropdown(null);
    setDropdownModalOpen(true);
    setSaveError('');
  };

  const handleEdit = (item) => {
    setSaveError('');
    if (item.type === MENU_ITEM_TYPES.dropdown) {
      setEditingDropdown(item);
      setDropdownModalOpen(true);
      return;
    }
    setEditingLink(item);
    setLinkModalOpen(true);
  };

  const handleSaveLink = async (link) => {
    const payload = {
      ...link,
      id: editingLink?.id || createMenuId(),
      type: MENU_ITEM_TYPES.link,
    };

    const nextItems = editingLink
      ? items.map((item) => (item.id === editingLink.id ? payload : item))
      : [...items, payload];

    await persistItems(nextItems);
  };

  const handleSaveDropdown = async (dropdown) => {
    const payload = {
      ...dropdown,
      id: dropdown.id || createMenuId(),
      type: MENU_ITEM_TYPES.dropdown,
    };

    const nextItems = editingDropdown
      ? items.map((item) => (item.id === editingDropdown.id ? payload : item))
      : [...items, payload];

    await persistItems(nextItems);
  };

  const handleConfirmDelete = async (itemId) => {
    await persistItems(items.filter((item) => item.id !== itemId));
  };

  const handleReorder = async (nextItems) => {
    try {
      await persistItems(nextItems);
    } catch (err) {
      setSaveError(err.message || 'Nepodařilo se změnit pořadí.');
    }
  };

  return (
    <div className="admin-content container">
      <header className="admin-content__header admin-content__header--actions">
        <div>
          <h1 className="admin-content__title">Menu</h1>
          <p className="admin-content__subtitle">Správa navigace veřejného webu</p>
        </div>
        <div className="admin-menu-page__actions">
          <button type="button" className="btn btn--outline" onClick={handleCreateLink}>
            Nová položka
          </button>
          <button type="button" className="btn btn--primary" onClick={handleCreateDropdown}>
            Nový dropdown
          </button>
        </div>
      </header>

      {(menuError || saveError) && (
        <p className="admin-error admin-content__error">{menuError || saveError}</p>
      )}

      {listLoading ? (
        <p className="admin-loading">Načítám menu…</p>
      ) : (
        <div className="admin-pages admin-menu">
          <div className="admin-pages__head admin-menu__head" aria-hidden="true">
            <span />
            <span>Název</span>
            <span>Typ</span>
            <span>Cíl</span>
            <span>Akce</span>
          </div>

          {items.length > 0 ? (
            <SortableList
              items={items}
              onReorder={handleReorder}
              listClassName="admin-pages__list"
              itemClassName="admin-pages__row admin-menu__row admin-sortable__item"
              ghostClassName="admin-pages__row admin-menu__row"
              handleLabel="Přesunout položku menu"
              renderItem={(item) => (
                <>
                  <div className="admin-pages__title">{item.label}</div>
                  <div className="admin-menu__type">
                    {item.type === MENU_ITEM_TYPES.dropdown ? 'Dropdown' : 'Položka'}
                  </div>
                  <div className="admin-pages__slug">{describeItem(item, pages)}</div>
                  <div className="admin-pages__actions">
                    <button
                      type="button"
                      className="admin-events__action"
                      aria-label={`Upravit ${item.label}`}
                      onClick={() => handleEdit(item)}
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      className="admin-events__action admin-events__action--danger"
                      aria-label={`Smazat ${item.label}`}
                      onClick={() => setItemToDelete(item)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </>
              )}
            />
          ) : (
            <ul className="admin-pages__list">
              <li className="admin-pages__empty">Menu je prázdné. Přidejte první položku.</li>
            </ul>
          )}
        </div>
      )}

      <AdminMenuLinkFormModal
        open={linkModalOpen}
        link={editingLink}
        pages={pages}
        onClose={() => setLinkModalOpen(false)}
        onSave={handleSaveLink}
      />

      <AdminMenuDropdownFormModal
        open={dropdownModalOpen}
        dropdown={editingDropdown}
        pages={pages}
        onClose={() => setDropdownModalOpen(false)}
        onSave={handleSaveDropdown}
      />

      <AdminDeleteMenuDialog
        open={Boolean(itemToDelete)}
        item={itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
