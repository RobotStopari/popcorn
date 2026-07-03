import { useMemo } from 'react';
import { blogPostUrl } from '../data/blog-posts';
import { getEventCoverStyle } from '../utils/event-cover-pattern';
import BlogAuthor from './BlogAuthor';
import BlogPostStats from './BlogPostStats';
import { siteText } from '../utils/admin-text';
import { trackNavClick, trackOutboundClick } from '../utils/analytics-track';

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
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
        className="blog-card__cover blog-card__cover--photo shine-hover"
        style={{ backgroundImage: `url(${post.coverImage})` }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className="blog-card__cover shine-hover"
      style={patternStyle}
      aria-hidden="true"
    />
  );
}

function BlogCardContent({ post }) {
  return (
    <div className="blog-card__content">
      <div className="blog-card__meta">
        <BlogAuthor
          author={post.author}
          size="small"
          className={post.isExternal ? 'blog-author--flat' : ''}
        />
        <time className="blog-card__date" dateTime={post.publishedDate}>
          {post.dateTimeLabel}
        </time>
      </div>

      <h2 className="blog-card__title">
        <span className="blog-card__title-text">{post.title}</span>
        {post.hasExternalLink && (
          <span
            className="blog-card__external-link"
            title={siteText('blog.card.externalLinkTitle')}
            aria-hidden="true"
          >
            <ExternalLinkIcon />
          </span>
        )}
      </h2>

      {post.excerpt && (
        <p className="blog-card__excerpt">{post.excerpt}</p>
      )}

      {!post.isExternal && (
        <>
          <BlogPostStats likeCount={post.likeCount} commentCount={post.commentCount} />
          <span className="blog-card__cta btn btn--outline">{siteText('blog.card.readCta')}</span>
        </>
      )}
    </div>
  );
}

export default function BlogPostCard({
  post,
  index,
  initiallyVisible = false,
  canManage = false,
  onEdit,
  onDelete,
}) {
  const delayClass = ` reveal--delay-${(index % 4) + 1}`;
  const visibleClass = initiallyVisible ? ' reveal--visible' : '';

  return (
    <article className={`blog-card-wrap${delayClass} reveal${visibleClass}`}>
      {canManage && (
        <div className="blog-card__toolbar">
          <button
            type="button"
            className="blog-card__action"
            aria-label={siteText('blog.card.editAriaLabel', { title: post.title })}
            onClick={() => onEdit?.(post)}
          >
            <EditIcon />
          </button>
          <button
            type="button"
            className="blog-card__action blog-card__action--danger"
            aria-label={siteText('blog.card.deleteAriaLabel', { title: post.title })}
            onClick={() => onDelete?.(post)}
          >
            <TrashIcon />
          </button>
        </div>
      )}

      {post.isExternal ? (
        <a
          href={post.externalUrl}
          className="blog-card blog-card--external shine-parent"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={siteText('blog.card.externalLinkAriaLabel', { title: post.title })}
          onClick={() => trackOutboundClick(post.externalUrl, post.title)}
        >
          <BlogPostCover post={post} />
          <BlogCardContent post={post} />
        </a>
      ) : (
        <a
          href={blogPostUrl(post.slug)}
          className="blog-card shine-parent"
          onClick={() => trackNavClick(blogPostUrl(post.slug), post.title)}
        >
          <BlogPostCover post={post} />
          <BlogCardContent post={post} />
        </a>
      )}
    </article>
  );
}
