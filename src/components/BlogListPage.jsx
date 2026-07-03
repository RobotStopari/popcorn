import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pagePath, getPageIntro } from '../data/pages';
import AdminBlogPostFormModal from './AdminBlogPostFormModal';
import AdminDeleteBlogPostDialog from './AdminDeleteBlogPostDialog';
import BlogKeywordFilter from './BlogKeywordFilter';
import BlogPageToolbar from './BlogPageToolbar';
import BlogPostCard from './BlogPostCard';
import EventsPagination from './EventsPagination';
import SectionLabel from './SectionLabel';
import { useBlogPosts } from '../contexts/BlogPostsContext';
import { useBlogAuthoring } from '../hooks/useBlogAuthoring';
import { filterPostsBySearch } from '../utils/blog-post-format';
import { siteDocumentTitle, siteText } from '../utils/admin-text';

const PAGE_SIZE = 20;

export default function BlogListPage({ page }) {
  const intro = getPageIntro(page);
  const { posts, loading } = useBlogPosts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const knownPostIdsRef = useRef(new Set());
  const basePath = page ? pagePath(page) : '/blog';

  const {
    canAuthor,
    canManagePost,
    allowExternalPosts,
    formOpen,
    editingPost,
    postToDelete,
    saveError,
    formAuthor,
    openCreate,
    openEdit,
    openDelete,
    closeForm,
    closeDelete,
    handleSave,
    handleConfirmDelete,
  } = useBlogAuthoring();

  const filteredPosts = useMemo(
    () => filterPostsBySearch(posts, search),
    [posts, search],
  );

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, totalPages)
    : 1;

  const pagePosts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPosts.slice(start, start + PAGE_SIZE);
  }, [filteredPosts, currentPage]);

  useEffect(() => {
    posts.forEach((post) => {
      if (post?.id) knownPostIdsRef.current.add(post.id);
    });
  }, [posts]);

  useEffect(() => {
    if (!page?.title) return;
    document.title = siteDocumentTitle(page.title);
  }, [page?.title]);

  useEffect(() => {
    if (!Number.isFinite(requestedPage) || requestedPage < 1) {
      setSearchParams({}, { replace: true });
      return;
    }

    if (requestedPage > totalPages) {
      if (totalPages === 1) {
        setSearchParams({}, { replace: true });
      } else {
        setSearchParams({ page: String(totalPages) }, { replace: true });
      }
    }
  }, [requestedPage, totalPages, setSearchParams]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, page?.id]);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('page');
      return next;
    }, { replace: true });
  }, [search, setSearchParams]);

  if (!page) return null;

  return (
    <section className="section events-list blog-list">
      <div className="container">
        <div className="blog-list__top reveal">
          <SectionLabel label={page.title} />
          <BlogPageToolbar canCreate={canAuthor} onCreate={openCreate} />
        </div>

        <p className="events-list__intro reveal">{intro}</p>

        <BlogKeywordFilter
          posts={posts}
          search={search}
          onSearchChange={setSearch}
        />

        {loading ? (
          <p className="section__empty">{siteText('blog.list.loading')}</p>
        ) : pagePosts.length > 0 ? (
          <div className="blog-grid reveal-stagger">
            {pagePosts.map((post, index) => (
              <BlogPostCard
                key={post.id}
                post={post}
                index={index}
                initiallyVisible={knownPostIdsRef.current.has(post.id)}
                canManage={canManagePost(post)}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ))}
          </div>
        ) : (
          <p className="section__empty">
            {search.trim()
              ? siteText('blog.list.emptySearch')
              : siteText('blog.list.empty')}
          </p>
        )}

        {!loading && filteredPosts.length > 0 && (
          <EventsPagination
            basePath={basePath}
            page={currentPage}
            totalPages={totalPages}
          />
        )}
      </div>

      <AdminBlogPostFormModal
        open={formOpen}
        post={editingPost}
        author={formAuthor}
        allowExternalPosts={allowExternalPosts}
        posts={posts}
        onClose={closeForm}
        onSave={handleSave}
        saveError={saveError}
      />

      <AdminDeleteBlogPostDialog
        open={Boolean(postToDelete)}
        post={postToDelete}
        onClose={closeDelete}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
}
