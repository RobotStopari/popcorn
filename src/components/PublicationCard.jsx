import { siteText } from '../utils/admin-text';

export default function PublicationCard({ publication, index = 0 }) {
  if (!publication) return null;

  return (
    <article className="resource-card-wrap reveal" style={{ '--reveal-delay': `${index * 0.05}s` }}>
      <div className="resource-card resource-card--publication">
        <div className="resource-card__body">
          <h2 className="resource-card__title">{publication.title}</h2>
          {publication.author && (
            <p className="resource-card__author">{publication.author}</p>
          )}
          {publication.description && (
            <p className="resource-card__description">{publication.description}</p>
          )}
          {publication.keywords?.length > 0 && (
            <ul className="resource-card__keywords" aria-label={siteText('publications.card.keywordsAriaLabel')}>
              {publication.keywords.map((keyword) => (
                <li key={keyword} className="resource-card__keyword">{keyword}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
