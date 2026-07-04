import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminDeleteUsefulLinkDialog from '../components/AdminDeleteUsefulLinkDialog';
import AdminUsefulLinkFormModal from '../components/AdminUsefulLinkFormModal';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import {
  createUsefulLink,
  deleteUsefulLink,
  fetchUsefulLinkById,
  subscribeUsefulLinks,
  updateUsefulLink,
} from '../services/useful-links';
import {
  sortUsefulLinksByTitle,
  usefulLinkMatchesSearch,
} from '../utils/useful-link-format';
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

export default function AdminUsefulLinksPage() {
  const { canAccessAdmin, loading } = useAdminAuth();
  const logActivity = useAdminActivityLogger();
  const [links, setLinks] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [linkToDelete, setLinkToDelete] = useState(null);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    document.title = adminDocumentTitle(adminText('usefulLinks.list.title'));
  }, []);

  useEffect(() => {
    if (!canAccessAdmin) return undefined;

    const unsubscribe = subscribeUsefulLinks(
      (data) => {
        setLinks(data);
        setListLoading(false);
        setListError('');
      },
      (err) => {
        setListError(err.message || adminText('usefulLinks.list.loadFailed'));
        setListLoading(false);
      },
    );

    return unsubscribe;
  }, [canAccessAdmin]);

  const filteredLinks = useMemo(() => {
    const searched = links.filter((item) => usefulLinkMatchesSearch(item, search));
    return sortUsefulLinksByTitle(searched);
  }, [links, search]);

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
    setEditingLink(null);
    setSaveError('');
    setFormOpen(true);
  };

  const handleEdit = async (link) => {
    setSaveError('');
    try {
      const fresh = await fetchUsefulLinkById(link.id);
      setEditingLink(fresh || link);
    } catch {
      setEditingLink(link);
    }
    setFormOpen(true);
  };

  const handleSave = async (payload) => {
    setSaveError('');
    try {
      if (editingLink?.id) {
        await updateUsefulLink(editingLink.id, payload);
        await logActivity({
          action: 'update',
          targetType: 'usefulLink',
          targetId: editingLink.id,
          summary: `Upraven odkaz „${payload.title}“`,
        });
      } else {
        const newId = await createUsefulLink(payload);
        await logActivity({
          action: 'create',
          targetType: 'usefulLink',
          targetId: newId,
          summary: `Vytvořen odkaz „${payload.title}“`,
        });
      }
      return true;
    } catch (err) {
      setSaveError(err.message || adminText('usefulLinks.list.saveFailed'));
      return false;
    }
  };

  const handleConfirmDelete = async (linkId) => {
    try {
      const title = linkToDelete?.title || 'odkaz';
      await deleteUsefulLink(linkId);
      await logActivity({
        action: 'delete',
        targetType: 'usefulLink',
        targetId: linkId,
        summary: `Smazán odkaz „${title}“`,
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
          <h1 className="admin-content__title">{adminText('usefulLinks.list.title')}</h1>
          <p className="admin-content__subtitle">{adminText('usefulLinks.list.subtitle')}</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={handleCreate}>
          {adminText('usefulLinks.list.newLink')}
        </button>
      </header>

      <div className="admin-blog-posts__toolbar">
        <input
          type="search"
          className="admin-form__input admin-blog-posts__search"
          placeholder={adminText('usefulLinks.list.searchPlaceholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {(listError || saveError) && (
        <p className="admin-error admin-content__error">{listError || saveError}</p>
      )}

      {listLoading ? (
        <p className="admin-loading">{adminText('usefulLinks.list.loading')}</p>
      ) : (
        <div className="admin-blog-posts admin-useful-links">
          <div className="admin-blog-posts__head admin-useful-links__head" aria-hidden="true">
            <span>{adminText('common.columns.name')}</span>
            <span>{adminText('common.columns.url')}</span>
            <span>{adminText('usefulLinks.list.columns.description')}</span>
            <span>{adminText('common.columns.actions')}</span>
          </div>

          <ul className="admin-blog-posts__list">
            {filteredLinks.map((link) => (
              <li key={link.id} className="admin-blog-posts__row admin-useful-links__row">
                <div className="admin-blog-posts__title">{link.title}</div>
                <div
                  className="admin-useful-links__url"
                  data-label={adminText('common.columns.url')}
                >
                  <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                </div>
                <div
                  className="admin-useful-links__description"
                  data-label={adminText('usefulLinks.list.columns.description')}
                >
                  {link.description || adminText('common.emptyDash')}
                </div>
                <div className="admin-blog-posts__actions">
                  <button
                    type="button"
                    className="admin-events__action"
                    aria-label={adminText('usefulLinks.list.editAria', { title: link.title })}
                    onClick={() => handleEdit(link)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className="admin-events__action admin-events__action--danger"
                    aria-label={adminText('usefulLinks.list.deleteAria', { title: link.title })}
                    onClick={() => setLinkToDelete(link)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {!filteredLinks.length && (
            <p className="admin-blog-posts__empty">
              {search.trim()
                ? adminText('usefulLinks.list.emptySearch')
                : adminText('usefulLinks.list.empty')}
            </p>
          )}
        </div>
      )}

      <AdminUsefulLinkFormModal
        open={formOpen}
        link={editingLink}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        saveError={saveError}
      />

      <AdminDeleteUsefulLinkDialog
        open={Boolean(linkToDelete)}
        link={linkToDelete}
        onClose={() => setLinkToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
