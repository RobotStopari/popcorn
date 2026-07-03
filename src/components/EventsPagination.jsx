import { Link } from 'react-router-dom';
import { siteText } from '../utils/admin-text';

function ArrowIcon({ direction }) {
  const rotate = direction === 'prev' ? 'rotate(90deg)' : 'rotate(-90deg)';

  return (
    <svg
      viewBox="0 0 12 8"
      width="14"
      height="14"
      aria-hidden="true"
      style={{ transform: rotate }}
    >
      <path
        d="M1 1.5L6 6.5L11 1.5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function EventsPagination({ basePath, page, totalPages }) {
  if (totalPages <= 1) return null;

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return (
    <nav className="events-pagination reveal" aria-label={siteText('events.pagination.navAriaLabel')}>
      {prevPage ? (
        <Link
          to={prevPage === 1 ? basePath : `${basePath}?page=${prevPage}`}
          className="events-pagination__btn"
          aria-label={siteText('events.pagination.prevAriaLabel')}
        >
          <ArrowIcon direction="prev" />
        </Link>
      ) : (
        <span className="events-pagination__btn events-pagination__btn--disabled" aria-hidden="true">
          <ArrowIcon direction="prev" />
        </span>
      )}

      <span className="events-pagination__status">
        {siteText('events.pagination.status', { page, totalPages })}
      </span>

      {nextPage ? (
        <Link
          to={`${basePath}?page=${nextPage}`}
          className="events-pagination__btn"
          aria-label={siteText('events.pagination.nextAriaLabel')}
        >
          <ArrowIcon direction="next" />
        </Link>
      ) : (
        <span className="events-pagination__btn events-pagination__btn--disabled" aria-hidden="true">
          <ArrowIcon direction="next" />
        </span>
      )}
    </nav>
  );
}
