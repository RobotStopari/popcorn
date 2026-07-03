import { ICONS } from '../data/icons';
import { siteText } from '../utils/admin-text';
import { trackOutboundClick } from '../utils/analytics-track';

export default function UsefulLinkCard({ link, index = 0 }) {
  if (!link) return null;

  const handleClick = () => {
    trackOutboundClick(link.url, link.title);
  };

  return (
    <article className="resource-card-wrap reveal" style={{ '--reveal-delay': `${index * 0.05}s` }}>
      <a
        href={link.url}
        className="resource-card resource-card--link"
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
      >
        <div className="resource-card__body">
          <h2 className="resource-card__title">
            <span className="resource-card__title-text">{link.title}</span>
            <span
              className="resource-card__external"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: ICONS.externalLink }}
            />
          </h2>
          {link.description && (
            <p className="resource-card__description">{link.description}</p>
          )}
          {link.keywords?.length > 0 && (
            <ul className="resource-card__keywords" aria-label={siteText('usefulLinks.card.keywordsAriaLabel')}>
              {link.keywords.map((keyword) => (
                <li key={keyword} className="resource-card__keyword">{keyword}</li>
              ))}
            </ul>
          )}
        </div>
      </a>
    </article>
  );
}
