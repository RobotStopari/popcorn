import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pagePath, getPageIntro } from '../data/pages';
import { filterItemsByCategory } from '../data/resource-categories';
import AdminBlogPostFormModal from './AdminBlogPostFormModal';
import AdminDeleteBlogPostDialog from './AdminDeleteBlogPostDialog';
import BlogPageToolbar from './BlogPageToolbar';
import BlogPostCard from './BlogPostCard';
import EventsPagination from './EventsPagination';
import ResourceListToolbar from './ResourceListToolbar';
import SectionLabel from './SectionLabel';
import { useBlogPosts } from '../contexts/BlogPostsContext';
import { useBlogAuthoring } from '../hooks/useBlogAuthoring';
import {
  filterPostsBySearch,
  isBlogPostVisibleOnSite,
  sortBlogPostsDraftsFirst,
} from '../utils/blog-post-format';
import { siteDocumentTitle, siteText } from '../utils/admin-text';

const PAGE_SIZE = 20;

export default function BlogListPage({ page }) {
  const intro = getPageIntro(page);
  const { posts, loading } = useBlogPosts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const knownPostIdsRef = useRef(new Set());
  const filterKeyRef = useRef(`${search}|${categoryId}`);
  const basePath = page ? pagePath(page) : '/blog';

  const {
    user,
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
    () => sortBlogPostsDraftsFirst(
      filterPostsBySearch(
        filterItemsByCategory(
          posts.filter((post) => isBlogPostVisibleOnSite(post, user)),
          categoryId,
        ),
        search,
      ),
    ),
    [posts, search, categoryId, user],
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
    if (loading) return;

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
  }, [loading, requestedPage, totalPages, setSearchParams]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, page?.id]);

  useEffect(() => {
    const key = `${search}|${categoryId}`;
    if (filterKeyRef.current === key) return;
    filterKeyRef.current = key;

    setSearchParams((prev) => {
      if (!prev.get('page')) return prev;
      const next = new URLSearchParams(prev);
      next.delete('page');
      return next;
    }, { replace: true });
  }, [search, categoryId, setSearchParams]);

  if (!page) return null;

  const hasActiveFilters = Boolean(search.trim() || categoryId);

  return (
    <section className="section events-list blog-list">
      <div className="container">
        <div className="blog-list__top reveal">
          <SectionLabel label={page.title} />
          <BlogPageToolbar canCreate={canAuthor} onCreate={openCreate} />
        </div>

        <p className="events-list__intro reveal">{intro}</p>

        <ResourceListToolbar
          type="blog"
          search={search}
          onSearchChange={setSearch}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          textPrefix="blog.list"
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
            {hasActiveFilters
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
