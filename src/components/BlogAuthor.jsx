import AdminAvatar from './AdminAvatar';
import { getAuthorNameParts } from '../utils/blog-post-format';

export default function BlogAuthor({
  author,
  size = 'small',
  className = '',
}) {
  if (!author) return null;

  const { name, nick } = getAuthorNameParts(author);

  return (
    <div className={`blog-author blog-author--${size} ${className}`.trim()}>
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
    </div>
  );
}
