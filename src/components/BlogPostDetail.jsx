import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBlogPosts } from '../contexts/BlogPostsContext';
import { useBlogAuthoring } from '../hooks/useBlogAuthoring';
import { getBlogGalleryImages } from '../utils/blog-post-format';
import { getEventCoverStyle } from '../utils/event-cover-pattern';
import { transformRichTextForDisplay } from '../utils/rich-text-embeds';
import AdminBlogPostFormModal from './AdminBlogPostFormModal';
import AdminDeleteBlogPostDialog from './AdminDeleteBlogPostDialog';
import BlogAuthor from './BlogAuthor';
import BlogPostEngagement from './BlogPostEngagement';
import EventGallery from './EventGallery';

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

function RichTextBlock({ html }) {
  const displayHtml = useMemo(() => transformRichTextForDisplay(html), [html]);
  if (!displayHtml) return null;

  return (
    <div className="blog-detail__body reveal">
      <div dangerouslySetInnerHTML={{ __html: displayHtml }} />
    </div>
  );
}

function BlogPostCover({ post }) {
  const patternStyle = useMemo(
    () => getEventCoverStyle(post.id || post.slug),
    [post.id, post.slug],
  );

  if (post.coverImage) {
    return (
      <div
        className="blog-detail__cover blog-detail__cover--photo"
        style={{ backgroundImage: `url(${post.coverImage})` }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className="blog-detail__cover"
      style={patternStyle}
      aria-hidden="true"
    />
  );
}

function NotFound() {
  return (
    <section className="section blog-detail">
      <div className="container blog-detail__container">
        <h1 className="blog-detail__title">Příspěvek nenalezen</h1>
        <p className="blog-detail__lead">Tento blogový příspěvek neexistuje nebo byl odstraněn.</p>
        <Link to="/blog" className="btn btn--primary">Zpět na blog</Link>
      </div>
    </section>
  );
}

export default function BlogPostDetail({ slug }) {
  const navigate = useNavigate();
  const { getPostBySlug, loading } = useBlogPosts();
  const post = slug ? getPostBySlug(slug) : null;

  const {
    canManagePost,
    formOpen,
    editingPost,
    postToDelete,
    saveError,
    formAuthor,
    openEdit,
    openDelete,
    closeForm,
    closeDelete,
    handleSave,
    handleConfirmDelete,
  } = useBlogAuthoring();

  const canManage = post ? canManagePost(post) : false;

  const handleDelete = async (postId) => {
    const ok = await handleConfirmDelete(postId);
    if (ok) {
      closeDelete();
      navigate('/blog');
    }
    return ok;
  };

  if (loading) {
    return (
      <section className="section blog-detail">
        <div className="container blog-detail__container">
          <p className="section__empty">Načítám příspěvek…</p>
        </div>
      </section>
    );
  }

  if (!post) return <NotFound />;

  return (
    <article className="section blog-detail">
      <div className="container blog-detail__container">
        <div className="blog-detail__top reveal">
          <Link to="/blog" className="blog-detail__back">← Zpět na blog</Link>

          {canManage && (
            <div className="blog-detail__actions">
              <button
                type="button"
                className="blog-detail__action"
                aria-label={`Upravit příspěvek ${post.title}`}
                onClick={() => openEdit(post)}
              >
                <EditIcon />
                <span>Upravit</span>
              </button>
              <button
                type="button"
                className="blog-detail__action blog-detail__action--danger"
                aria-label={`Smazat příspěvek ${post.title}`}
                onClick={() => openDelete(post)}
              >
                <TrashIcon />
                <span>Smazat</span>
              </button>
            </div>
          )}
        </div>

        <header className="blog-detail__header reveal">
          <BlogPostCover post={post} />

          <h1 className="blog-detail__title">{post.title}</h1>

          <div className="blog-detail__byline">
            <BlogAuthor author={post.author} size="medium" />
            <time className="blog-detail__date" dateTime={post.publishedDate}>
              {post.dateTimeLabel}
            </time>
          </div>

          {post.keywords.length > 0 && (
            <ul className="blog-detail__keywords" aria-label="Klíčová slova">
              {post.keywords.map((keyword) => (
                <li key={keyword} className="blog-detail__keyword">{keyword}</li>
              ))}
            </ul>
          )}
        </header>

        <RichTextBlock html={post.body} />

        {post.galleryImages?.length > 0 && (
          <EventGallery
            images={getBlogGalleryImages(post)}
            className="event-detail__media blog-detail__gallery-grid"
          />
        )}

        <BlogPostEngagement post={post} />
      </div>

      <AdminBlogPostFormModal
        open={formOpen}
        post={editingPost}
        author={formAuthor}
        onClose={closeForm}
        onSave={handleSave}
        saveError={saveError}
      />

      <AdminDeleteBlogPostDialog
        open={Boolean(postToDelete)}
        post={postToDelete}
        onClose={closeDelete}
        onConfirm={handleDelete}
      />
    </article>
  );
}
