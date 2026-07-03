import { Link } from 'react-router-dom';
import AdminAvatar from './AdminAvatar';
import { blogAuthorUrl, getAuthorNameParts } from '../utils/blog-post-format';

export default function BlogAuthor({
  author,
  size = 'small',
  className = '',
  linkable = true,
}) {
  if (!author) return null;

  const { name, nick } = getAuthorNameParts(author);
  const authorHref = linkable ? blogAuthorUrl(author) : '';

  const content = (
    <>
      <AdminAvatar
        photoURL={author.photoURL}
        name={author.name || author.label}
        email={author.email || ''}
        size="small"
        className="blog-author__avatar"
      />
      <span className="blog-author__name">
        {name}
        {nick && <span className="blog-author__nick"> – {nick}</span>}
      </span>
    </>
  );

  if (!authorHref) {
    return (
      <div className={`blog-author blog-author--${size} ${className}`.trim()}>
        {content}
      </div>
    );
  }

  return (
    <Link
      to={authorHref}
      className={`blog-author blog-author--${size} blog-author--link ${className}`.trim()}
      onClick={(event) => event.stopPropagation()}
    >
      {content}
    </Link>
  );
}
