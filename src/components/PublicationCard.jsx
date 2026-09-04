import ResourceCategoryBadge from './ResourceCategoryBadge';

export default function PublicationCard({ publication, index = 0 }) {
  if (!publication) return null;

  return (
    <article className="resource-card-wrap reveal" style={{ '--reveal-delay': `${index * 0.05}s` }}>
      <div className="resource-card resource-card--publication">
        <h2 className="resource-card__title">{publication.title}</h2>
        <div className="resource-card__body">
          <ResourceCategoryBadge
            type="publication"
            categoryId={publication.categoryId}
            className="resource-card__category"
          />
          {publication.author && (
            <p className="resource-card__author">{publication.author}</p>
          )}
          {publication.description && (
            <p className="resource-card__description">{publication.description}</p>
          )}
        </div>
      </div>
    </article>
  );
}
