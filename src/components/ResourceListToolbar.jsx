import ResourceCategoryFilter from './ResourceCategoryFilter';
import { siteText } from '../utils/admin-text';

export default function ResourceListToolbar({
  type,
  search,
  onSearchChange,
  categoryId = '',
  onCategoryChange,
  textPrefix,
}) {
  return (
    <div className="blog-list__search-row reveal">
      <div className="blog-list__search">
        <input
          type="search"
          className="blog-list__search-input"
          placeholder={siteText(`${textPrefix}.searchPlaceholder`)}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label={siteText(`${textPrefix}.searchAriaLabel`)}
        />
      </div>

      <ResourceCategoryFilter
        type={type}
        value={categoryId}
        onChange={onCategoryChange}
        allLabel={siteText(`${textPrefix}.categoryFilterAll`)}
        ariaLabel={siteText(`${textPrefix}.categoryFilterAriaLabel`)}
      />
    </div>
  );
}
