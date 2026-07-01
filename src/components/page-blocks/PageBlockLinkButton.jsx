import { Link } from 'react-router-dom';
import { ICONS } from '../../data/icons';
import { getPageBlockButtonColorStyle } from '../../utils/page-block-button-color';

function isInternalHref(href) {
  return href.startsWith('/') && !href.startsWith('//');
}

export default function PageBlockLinkButton({
  label,
  href,
  openInNewTab = false,
  large = false,
  color = 'orange',
}) {
  const trimmedLabel = label?.trim();
  const trimmedHref = href?.trim();
  if (!trimmedLabel || !trimmedHref) return null;

  const className = [
    'btn',
    'page-block__link-btn',
    'page-block__link-btn--accent',
    openInNewTab ? 'page-block__link-btn--external' : '',
    large ? 'btn--large' : '',
  ].filter(Boolean).join(' ');

  const style = getPageBlockButtonColorStyle(color);

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
      <Link to={trimmedHref} className={className} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <a
      href={trimmedHref}
      className={className}
      style={style}
      target={openInNewTab ? '_blank' : undefined}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
    >
      {content}
    </a>
  );
}
