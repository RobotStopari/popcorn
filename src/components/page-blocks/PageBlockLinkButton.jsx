import { Link } from 'react-router-dom';
import { ICONS } from '../../data/icons';

function isInternalHref(href) {
  return href.startsWith('/') && !href.startsWith('//');
}

export default function PageBlockLinkButton({
  label,
  href,
  openInNewTab = false,
  large = false,
}) {
  const trimmedLabel = label?.trim();
  const trimmedHref = href?.trim();
  if (!trimmedLabel || !trimmedHref) return null;

  const className = [
    'btn',
    'page-block__link-btn',
    openInNewTab ? 'btn--external' : 'btn--primary',
    large ? 'btn--large' : '',
  ].filter(Boolean).join(' ');

  const content = (
    <>
      <span className="page-block__link-btn-label">{trimmedLabel}</span>
      {openInNewTab && (
        <span
          className="page-block__link-btn-icon nav-link__external"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: ICONS.externalLink }}
        />
      )}
    </>
  );

  if (!openInNewTab && isInternalHref(trimmedHref)) {
    return (
      <Link to={trimmedHref} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <a
      href={trimmedHref}
      className={className}
      target={openInNewTab ? '_blank' : undefined}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
    >
      {content}
    </a>
  );
}
