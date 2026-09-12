import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminDeletePublicationDialog from '../components/AdminDeletePublicationDialog';
import AdminPublicationFormModal from '../components/AdminPublicationFormModal';
import AdminResourceCategoriesModal from '../components/AdminResourceCategoriesModal';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import {
  createPublication,
  deletePublication,
  fetchPublicationById,
  subscribePublications,
  updatePublication,
} from '../services/publications';
import {
  publicationMatchesSearch,
  sortPublicationsByTitle,
} from '../utils/publication-format';
import { adminDocumentTitle, adminText } from '../utils/admin-text';
import { useAdminActivityLogger } from '../hooks/useAdminActivityLogger';

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

export default function AdminPublicationsPage() {
  const { canAccessAdmin, loading } = useAdminAuth();
  const logActivity = useAdminActivityLogger();
  const [publications, setPublications] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingPublication, setEditingPublication] = useState(null);
  const [publicationToDelete, setPublicationToDelete] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    document.title = adminDocumentTitle(adminText('publications.list.title'));
  }, []);

  useEffect(() => {
    if (!canAccessAdmin) return undefined;

    const unsubscribe = subscribePublications(
      (data) => {
        setPublications(data);
        setListLoading(false);
        setListError('');
      },
      (err) => {
        setListError(err.message || adminText('publications.list.loadFailed'));
        setListLoading(false);
      },
    );

    return unsubscribe;
  }, [canAccessAdmin]);

  const filteredPublications = useMemo(() => {
    const searched = publications.filter((item) => publicationMatchesSearch(item, search));
    return sortPublicationsByTitle(searched);
  }, [publications, search]);

  if (loading) {
    return (
      <div className="admin-content">
        <p className="admin-loading">{adminText('common.loading')}</p>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleCreate = () => {
    setEditingPublication(null);
    setSaveError('');
    setFormOpen(true);
  };

  const handleEdit = async (publication) => {
    setSaveError('');
    try {
      const fresh = await fetchPublicationById(publication.id);
      setEditingPublication(fresh || publication);
    } catch {
      setEditingPublication(publication);
    }
    setFormOpen(true);
  };

  const handleSave = async (payload, { silent = false } = {}) => {
    setSaveError('');
    try {
      if (editingPublication?.id) {
        await updatePublication(editingPublication.id, payload);
        if (!silent) {
          await logActivity({
            action: 'update',
            targetType: 'publication',
            targetId: editingPublication.id,
            summary: `Upravena publikace „${payload.title}“`,
          });
        }
        setEditingPublication((current) => (
          current?.id === editingPublication.id
            ? { ...current, ...payload, id: editingPublication.id }
            : current
        ));
      } else {
        const newId = await createPublication(payload);
        if (!silent) {
          await logActivity({
            action: 'create',
            targetType: 'publication',
            targetId: newId,
            summary: `Vytvořena publikace „${payload.title}“`,
          });
        }
        setEditingPublication({ ...payload, id: newId });
      }
      return true;
    } catch (err) {
      setSaveError(err.message || adminText('publications.list.saveFailed'));
      return false;
    }
  };

  const handleConfirmDelete = async (publicationId) => {
    try {
      const title = publicationToDelete?.title || 'publikace';
      await deletePublication(publicationId);
      await logActivity({
        action: 'delete',
        targetType: 'publication',
        targetId: publicationId,
        summary: `Smazána publikace „${title}“`,
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
          <h1 className="admin-content__title">{adminText('publications.list.title')}</h1>
          <p className="admin-content__subtitle">{adminText('publications.list.subtitle')}</p>
        </div>
        <div className="admin-content__header-actions">
          <button type="button" className="btn btn--outline" onClick={() => setSettingsOpen(true)}>
            {adminText('common.settings')}
          </button>
          <button type="button" className="btn btn--primary" onClick={handleCreate}>
            {adminText('publications.list.newPublication')}
          </button>
        </div>
      </header>

      <div className="admin-blog-posts__toolbar">
        <input
          type="search"
          className="admin-form__input admin-blog-posts__search"
          placeholder={adminText('publications.list.searchPlaceholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {(listError || saveError) && (
        <p className="admin-error admin-content__error">{listError || saveError}</p>
      )}

      {listLoading ? (
        <p className="admin-loading">{adminText('publications.list.loading')}</p>
      ) : (
        <div className="admin-blog-posts admin-publications">
          <div className="admin-blog-posts__head admin-publications__head" aria-hidden="true">
            <span>{adminText('common.columns.name')}</span>
            <span>{adminText('publications.list.columns.author')}</span>
            <span>{adminText('publications.list.columns.description')}</span>
            <span>{adminText('common.columns.actions')}</span>
          </div>

          <ul className="admin-blog-posts__list">
            {filteredPublications.map((publication) => (
              <li key={publication.id} className="admin-blog-posts__row admin-publications__row">
                <div className="admin-blog-posts__title">{publication.title}</div>
                <div
                  className="admin-publications__author"
                  data-label={adminText('publications.list.columns.author')}
                >
                  {publication.author || adminText('common.emptyDash')}
                </div>
                <div
                  className="admin-publications__description"
                  data-label={adminText('publications.list.columns.description')}
                >
                  {publication.description || adminText('common.emptyDash')}
                </div>
                <div className="admin-blog-posts__actions">
                  <button
                    type="button"
                    className="admin-events__action"
                    aria-label={adminText('publications.list.editAria', { title: publication.title })}
                    onClick={() => handleEdit(publication)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className="admin-events__action admin-events__action--danger"
                    aria-label={adminText('publications.list.deleteAria', { title: publication.title })}
                    onClick={() => setPublicationToDelete(publication)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {!filteredPublications.length && (
            <p className="admin-blog-posts__empty">
              {search.trim()
                ? adminText('publications.list.emptySearch')
                : adminText('publications.list.empty')}
            </p>
          )}
        </div>
      )}

      <AdminPublicationFormModal
        open={formOpen}
        publication={editingPublication}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        saveError={saveError}
      />

      <AdminDeletePublicationDialog
        open={Boolean(publicationToDelete)}
        publication={publicationToDelete}
        onClose={() => setPublicationToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <AdminResourceCategoriesModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        type="publication"
      />
    </div>
  );
}
