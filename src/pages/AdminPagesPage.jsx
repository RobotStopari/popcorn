import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminDeletePageDialog from '../components/AdminDeletePageDialog';
import AdminPageFormModal from '../components/AdminPageFormModal';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { usePages } from '../contexts/PagesContext';
import {
  canDeletePage,
  filterAndGroupPages,
  pagePath,
} from '../data/pages';
import {
  createPage,
  deletePage,
  ensureDefaultPages,
  updatePage,
} from '../services/pages';

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

function PageRow({ page, onEdit, onDelete }) {
  return (
    <li className="admin-pages__row">
      <div className="admin-pages__title">{page.title}</div>
      <div className="admin-pages__slug">{pagePath(page)}</div>
      <div className="admin-pages__actions">
        <button
          type="button"
          className="admin-events__action"
          aria-label={`Upravit stránku ${page.title}`}
          onClick={() => onEdit(page)}
        >
          <EditIcon />
        </button>
        {canDeletePage(page) ? (
          <button
            type="button"
            className="admin-events__action admin-events__action--danger"
            aria-label={`Smazat stránku ${page.title}`}
            onClick={() => onDelete(page)}
          >
            <TrashIcon />
          </button>
        ) : (
          <span className="admin-pages__protected" title="Tuto stránku nelze smazat">—</span>
        )}
      </div>
    </li>
  );
}

export default function AdminPagesPage() {
  const { canAccessAdmin, loading } = useAdminAuth();
  const { pages, loading: pagesLoading, error: pagesError } = usePages();
  const [seedLoading, setSeedLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [pageToDelete, setPageToDelete] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'Stránky — Admin';
  }, []);

  useEffect(() => {
    if (!canAccessAdmin) return undefined;

    let active = true;

    const seed = async () => {
      setSeedLoading(true);
      try {
        await ensureDefaultPages();
      } catch (err) {
        if (active) {
          setSaveError(err.message || 'Nepodařilo se inicializovat stránky.');
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

  const { pinned, rest } = useMemo(
    () => filterAndGroupPages(pages, search),
    [pages, search],
  );

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
    setEditingPage(null);
    setFormOpen(true);
    setSaveError('');
  };

  const handleEdit = (page) => {
    setEditingPage(page);
    setFormOpen(true);
    setSaveError('');
  };

  const handleSave = async (payload) => {
    setSaveError('');

    if (editingPage) {
      await updatePage(pages, editingPage, payload);
      return;
    }

    await createPage(pages, payload);
  };

  const handleConfirmDelete = async (pageId) => {
    const page = pages.find((item) => item.id === pageId);
    if (!page) return;
    await deletePage(page);
  };

  const listLoading = seedLoading || pagesLoading;
  const hasResults = pinned.length > 0 || rest.length > 0;
  const showDivider = pinned.length > 0 && rest.length > 0;

  return (
    <div className="admin-content container">
      <header className="admin-content__header admin-content__header--actions">
        <div>
          <h1 className="admin-content__title">Stránky</h1>
          <p className="admin-content__subtitle">Správa veřejných stránek webu</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={handleCreate}>
          Nová stránka
        </button>
      </header>

      {(pagesError || saveError) && (
        <p className="admin-error admin-content__error">{pagesError || saveError}</p>
      )}

      {listLoading ? (
        <p className="admin-loading">Načítám stránky…</p>
      ) : (
        <>
          <div className="admin-pages__toolbar">
            <input
              type="search"
              className="admin-form__input admin-pages__search"
              placeholder="Hledat podle názvu nebo URL…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="admin-pages">
            <div className="admin-pages__head" aria-hidden="true">
              <span>Název</span>
              <span>URL</span>
              <span>Akce</span>
            </div>

            <ul className="admin-pages__list">
              {pinned.map((page) => (
                <PageRow
                  key={page.id}
                  page={page}
                  onEdit={handleEdit}
                  onDelete={setPageToDelete}
                />
              ))}

              {showDivider && <li className="admin-pages__divider" aria-hidden="true" />}

              {rest.map((page) => (
                <PageRow
                  key={page.id}
                  page={page}
                  onEdit={handleEdit}
                  onDelete={setPageToDelete}
                />
              ))}

              {!hasResults && (
                <li className="admin-pages__empty">
                  {search.trim() ? 'Žádná stránka neodpovídá hledání.' : 'Zatím žádné stránky.'}
                </li>
              )}
            </ul>
          </div>
        </>
      )}

      <AdminPageFormModal
        open={formOpen}
        page={editingPage}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <AdminDeletePageDialog
        open={Boolean(pageToDelete)}
        page={pageToDelete}
        onClose={() => setPageToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
