import { HeartIcon, CommentBubbleIcon } from './BlogEngagementIcons';
import { siteText } from '../utils/admin-text';

export default function BlogPostStats({ likeCount = 0, commentCount = 0, className = '' }) {
  return (
    <div
      className={`blog-post-stats ${className}`.trim()}
      aria-label={siteText('blog.stats.ariaLabel', { likeCount, commentCount })}
    >
      <span className="blog-post-stats__item">
        <HeartIcon size={15} />
        <span>{likeCount}</span>
      </span>
      <span className="blog-post-stats__item">
        <CommentBubbleIcon size={15} />
        <span>{commentCount}</span>
      </span>
    </div>
  );
}
