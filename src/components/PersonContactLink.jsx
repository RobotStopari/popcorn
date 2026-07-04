import { ICONS } from '../data/icons';
import { trackContactClick, trackOutboundClick, trackSocialClick } from '../utils/analytics-track';

const CONTACT_ICONS = {
  email: ICONS.email,
  phone: ICONS.phone,
  instagram: ICONS.instagram,
  facebook: ICONS.facebook,
};

function ContactIcon({ type }) {
  const icon = CONTACT_ICONS[type];
  if (!icon) return null;

  return (
    <span
      className="event-detail__organiser-link-icon"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: icon }}
    />
  );
}

export default function PersonContactLink({
  type,
  href,
  label,
  external = false,
}) {
  if (!href) return null;

  const className = `event-detail__organiser-link event-detail__organiser-link--${type}`;

  const handleClick = () => {
    if (type === 'email' || type === 'phone') {
      trackContactClick(type, label);
      return;
    }
    if (type === 'instagram' || type === 'facebook') {
      trackSocialClick(type, label);
      return;
    }
    trackOutboundClick(href, label);
  };

  const linkProps = {
    className,
    'aria-label': label,
    onClick: handleClick,
  };

  if (external) {
    return (
      <a {...linkProps} href={href} target="_blank" rel="noopener noreferrer">
        <ContactIcon type={type} />
      </a>
    );
  }

  return (
    <a {...linkProps} href={href}>
      <ContactIcon type={type} />
    </a>
  );
}
