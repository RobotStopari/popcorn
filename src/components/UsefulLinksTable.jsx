import { ICONS } from '../data/icons';
import { siteText } from '../utils/admin-text';
import { trackOutboundClick } from '../utils/analytics-track';

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function UsefulLinkRow({ link, index }) {
  const host = hostnameFromUrl(link.url);

  return (
    <a
      href={link.url}
      className="links-table__row reveal"
      style={{ '--reveal-delay': `${Math.min(index, 12) * 0.03}s` }}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackOutboundClick(link.url, link.title)}
    >
      <span className="links-table__cell links-table__cell--title">
        <span className="links-table__title">{link.title}</span>
        {host && <span className="links-table__host">{host}</span>}
      </span>

      <span className="links-table__cell links-table__cell--description">
        {link.description || (
          <span className="links-table__empty-desc">{siteText('usefulLinks.list.noDescription')}</span>
        )}
      </span>

      <span className="links-table__cell links-table__cell--action" aria-hidden="true">
        <span
          className="links-table__external"
          dangerouslySetInnerHTML={{ __html: ICONS.externalLink }}
        />
      </span>
    </a>
  );
}

export default function UsefulLinksTable({ links }) {
  if (!links?.length) return null;

  return (
    <div className="links-table reveal">
      <div className="links-table__frame">
        <div className="links-table__head" aria-hidden="true">
          <span className="links-table__head-cell links-table__head-cell--title">
            {siteText('usefulLinks.list.columns.title')}
          </span>
          <span className="links-table__head-cell links-table__head-cell--description">
            {siteText('usefulLinks.list.columns.description')}
          </span>
          <span className="links-table__head-cell links-table__head-cell--action" />
        </div>

        <div className="links-table__body" role="list">
          {links.map((link, index) => (
            <UsefulLinkRow key={link.id} link={link} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
