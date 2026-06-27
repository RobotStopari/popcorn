import { HeartIcon, CommentBubbleIcon } from './BlogEngagementIcons';

export default function BlogPostStats({ likeCount = 0, commentCount = 0, className = '' }) {
  return (
    <div className={`blog-post-stats ${className}`.trim()} aria-label={`${likeCount} lajků, ${commentCount} komentářů`}>
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
