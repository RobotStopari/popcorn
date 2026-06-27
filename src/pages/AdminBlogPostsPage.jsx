import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminBlogPostFormModal from '../components/AdminBlogPostFormModal';
import AdminDeleteBlogPostDialog from '../components/AdminDeleteBlogPostDialog';
import BlogAuthor from '../components/BlogAuthor';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useBlogPosts } from '../contexts/BlogPostsContext';
import {
  filterPostsBySearch,
  getPublishTimestamp,
  resolveAuthorForDisplay,
  sortPostsByPublished,
} from '../utils/blog-post-format';
import {
  createBlogPost,
  deleteBlogPost,
  fetchAuthorSnapshot,
  isSlugTaken,
  updateBlogPost,
} from '../services/blog-posts';

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

export default function AdminBlogPostsPage() {
  const {
    canAccessAdmin,
    loading,
    profile,
    user,
    fetchAllUsers,
  } = useAdminAuth();
  const { posts, loading: postsLoading, error: postsError } = useBlogPosts();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [usersByUid, setUsersByUid] = useState({});
  const backfillStarted = useRef(false);

  useEffect(() => {
    document.title = 'Blog — Admin';
  }, []);

  useEffect(() => {
    if (!canAccessAdmin) return;

    fetchAllUsers()
      .then((users) => {
        const map = {};
        users.forEach((item) => {
          map[item.id] = item;
        });
        setUsersByUid(map);
      })
      .catch(() => {});
  }, [canAccessAdmin, fetchAllUsers]);

  useEffect(() => {
    if (!canAccessAdmin || postsLoading || backfillStarted.current) return;

    const postsMissingPhoto = posts.filter(
      (post) => post.author?.uid && !post.author?.photoURL,
    );
    if (!postsMissingPhoto.length) return;

    backfillStarted.current = true;

    (async () => {
      for (const post of postsMissingPhoto) {
        try {
          const author = await fetchAuthorSnapshot(post.author.uid);
          if (author?.photoURL) {
            await updateBlogPost(post.id, { author });
          }
        } catch {
          // ignore individual backfill failures
        }
      }
    })();
  }, [canAccessAdmin, posts, postsLoading]);

  const filteredPosts = useMemo(() => {
    const searched = filterPostsBySearch(posts, search);
    return sortPostsByPublished(searched);
  }, [posts, search]);

  const resolveAuthor = (author) => resolveAuthorForDisplay(author, {
    usersByUid,
    profile,
    user,
  });

  const adminUsers = useMemo(
    () => Object.values(usersByUid),
    [usersByUid],
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
    setEditingPost(null);
    setFormOpen(true);
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormOpen(true);
  };

  const handleSave = async (payload, { authorUid } = {}) => {
    setSaveError('');

    if (isSlugTaken(posts, payload.slug, editingPost?.id)) {
      setSaveError('URL příspěvku už používá jiný příspěvek.');
      return false;
    }

    const targetUid = authorUid || editingPost?.author?.uid || user.uid;

    try {
      const author = await fetchAuthorSnapshot(targetUid);
      if (!author) {
        setSaveError('Autora příspěvku se nepodařilo načíst.');
        return false;
      }

      if (editingPost) {
        await updateBlogPost(editingPost.id, {
          ...payload,
          author,
        });
      } else {
        await createBlogPost({
          ...payload,
          ...getPublishTimestamp(),
          author,
        });
      }
      return true;
    } catch (err) {
      setSaveError(err.message || 'Uložení příspěvku se nezdařilo.');
      return false;
    }
  };

  const handleConfirmDelete = async (postId) => {
    try {
      await deleteBlogPost(postId);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="admin-content container">
      <header className="admin-content__header admin-content__header--actions">
        <div>
          <h1 className="admin-content__title">Blog</h1>
          <p className="admin-content__subtitle">Správa blogových příspěvků</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={handleCreate}>
          Nový příspěvek
        </button>
      </header>

      <div className="admin-events__toolbar">
        <input
          type="search"
          className="admin-form__input admin-events__search"
          placeholder="Hledat podle názvu, klíčových slov, autora, data nebo textu…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {(postsError || saveError) && (
        <p className="admin-error admin-content__error">{postsError || saveError}</p>
      )}

      {postsLoading ? (
        <p className="admin-loading">Načítám příspěvky…</p>
      ) : (
        <div className="admin-events">
          <div className="admin-events__head" aria-hidden="true">
            <span>Název</span>
            <span>Autor</span>
            <span>Publikováno</span>
            <span>Akce</span>
          </div>

          <ul className="admin-events__list">
            {filteredPosts.map((post) => (
              <li key={post.id} className="admin-events__row">
                <div className="admin-events__title">{post.title}</div>
                <div className="admin-events__author">
                  <BlogAuthor author={resolveAuthor(post.author)} size="small" />
                </div>
                <div className="admin-events__date">{post.dateTimeLabel}</div>
                <div className="admin-events__actions">
                  <button
                    type="button"
                    className="admin-events__action"
                    aria-label={`Upravit příspěvek ${post.title}`}
                    onClick={() => handleEdit(post)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className="admin-events__action admin-events__action--danger"
                    aria-label={`Smazat příspěvek ${post.title}`}
                    onClick={() => setPostToDelete(post)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {!filteredPosts.length && (
            <p className="admin-loading">
              {search.trim()
                ? 'Žádné příspěvky neodpovídají hledání.'
                : 'Zatím žádné blogové příspěvky.'}
            </p>
          )}
        </div>
      )}

      <AdminBlogPostFormModal
        open={formOpen}
        post={editingPost}
        allowAuthorPick
        users={adminUsers}
        defaultAuthorUid={user.uid}
        onClose={() => {
          setSaveError('');
          setFormOpen(false);
        }}
        onSave={handleSave}
        saveError={saveError}
      />

      <AdminDeleteBlogPostDialog
        open={Boolean(postToDelete)}
        post={postToDelete}
        onClose={() => setPostToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
