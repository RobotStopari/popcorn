import { adminText } from '../utils/admin-text';

export function AdminListStarIcon({ filled = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      className="admin-list-star__icon"
    >
      <path
        d="M12 2.5l2.86 5.79 6.39.93-4.62 4.5 1.09 6.36L12 17.77l-5.72 3.01 1.09-6.36-4.62-4.5 6.39-.93L12 2.5z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AdminListStarButton({
  starred = false,
  label,
  onToggle,
}) {
  return (
    <button
      type="button"
      className={`admin-list-star${starred ? ' admin-list-star--active' : ''}`}
      aria-label={adminText(starred ? 'common.stars.unstarAria' : 'common.stars.starAria', { title: label })}
      aria-pressed={starred}
      onClick={onToggle}
    >
      <AdminListStarIcon filled={starred} />
    </button>
  );
}

export function AdminListStarFilter({ active = false, onToggle }) {
  return (
    <button
      type="button"
      className={`admin-list-star-filter${active ? ' admin-list-star-filter--active' : ''}`}
      aria-pressed={active}
      aria-label={adminText('common.stars.filterAria')}
      onClick={onToggle}
    >
      <AdminListStarIcon filled={active} />
      <span>{adminText('common.stars.filter')}</span>
    </button>
  );
}
