import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import BlogPostCard from '../components/BlogPostCard';
import BlogAuthor from '../components/BlogAuthor';
import EventsPagination from '../components/EventsPagination';
import ResourceListToolbar from '../components/ResourceListToolbar';
import SectionLabel from '../components/SectionLabel';
import { filterItemsByCategory } from '../data/resource-categories';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useBlogPosts } from '../contexts/BlogPostsContext';
import {
  filterPostsByAuthor,
  filterPostsBySearch,
  formatAuthorDisplayName,
  isBlogPostVisibleOnSite,
  resolveAuthorFromPosts,
  sortBlogPostsDraftsFirst,
} from '../utils/blog-post-format';
import { siteDocumentTitle, siteText } from '../utils/admin-text';

const PAGE_SIZE = 20;

export default function BlogAuthorPage() {
  const { authorKey = '' } = useParams();
  const decodedAuthorKey = decodeURIComponent(authorKey);
  const [searchParams, setSearchParams] = useSearchParams();
  const { posts, loading } = useBlogPosts();
  const { user } = useAdminAuth();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const knownPostIdsRef = useRef(new Set());
  const filterKeyRef = useRef(`${search}|${categoryId}`);

  const allAuthorPosts = useMemo(
    () => filterPostsByAuthor(posts, decodedAuthorKey),
    [posts, decodedAuthorKey],
  );

  const authorPosts = useMemo(
    () => allAuthorPosts.filter((post) => isBlogPostVisibleOnSite(post, user)),
    [allAuthorPosts, user],
  );

  const author = useMemo(
    () => resolveAuthorFromPosts(allAuthorPosts, decodedAuthorKey),
    [allAuthorPosts, decodedAuthorKey],
  );

  const filteredPosts = useMemo(
    () => sortBlogPostsDraftsFirst(
      filterPostsBySearch(filterItemsByCategory(authorPosts, categoryId), search),
    ),
    [authorPosts, search, categoryId],
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
    if (!author) return;
    const label = formatAuthorDisplayName(author);
    document.title = siteDocumentTitle(siteText('blog.author.pageTitle', { name: label }));
  }, [author]);

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, decodedAuthorKey]);

  if (!loading && !author) {
    return (
      <section className="section events-list blog-list">
        <div className="container">
          <p className="section__empty">{siteText('blog.author.notFound')}</p>
          <p className="blog-author-page__back">
            <Link to="/blog" className="btn btn--outline">{siteText('blog.author.backToBlog')}</Link>
          </p>
        </div>
      </section>
    );
  }

  const hasActiveFilters = Boolean(search.trim() || categoryId);

  return (
    <section className="section events-list blog-list blog-author-page">
      <div className="container">
        <div className="blog-list__top reveal">
          <SectionLabel label={siteText('blog.author.heading')} />
        </div>

        {author && (
          <div className="blog-author-page__profile reveal">
            <BlogAuthor author={author} size="medium" linkable={false} />
            <p className="blog-author-page__count">
              {siteText('blog.author.postCount', { count: authorPosts.length })}
            </p>
          </div>
        )}

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
                authorLinkable={false}
              />
            ))}
          </div>
        ) : (
          <p className="section__empty">
            {hasActiveFilters
              ? siteText('blog.list.emptySearch')
              : siteText('blog.author.empty')}
          </p>
        )}

        {!loading && filteredPosts.length > 0 && totalPages > 1 && (
          <EventsPagination
            basePath={`/blog/autor/${encodeURIComponent(decodedAuthorKey)}`}
            page={currentPage}
            totalPages={totalPages}
          />
        )}

        <p className="blog-author-page__back reveal">
          <Link to="/blog" className="btn btn--outline">{siteText('blog.author.backToBlog')}</Link>
        </p>
      </div>
    </section>
  );
}
