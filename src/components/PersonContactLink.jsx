import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ICONS } from '../data/icons';

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
  tooltip,
  external = false,
}) {
  const linkRef = useRef(null);
  const tooltipRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  if (!href) return null;

  const tip = tooltip || label;
  const className = `event-detail__organiser-link event-detail__organiser-link--${type}`;

  const updatePosition = () => {
    const link = linkRef.current;
    const tipEl = tooltipRef.current;
    if (!link) return;

    const rect = link.getBoundingClientRect();
    const margin = 12;
    let left = rect.left + rect.width / 2;
    const top = rect.top - 8;

    if (tipEl) {
      const half = tipEl.offsetWidth / 2;
      left = Math.max(margin + half, Math.min(left, window.innerWidth - margin - half));
    }

    setPosition({ top, left });
  };

  const showTooltip = () => {
    setOpen(true);
  };

  const hideTooltip = () => {
    setVisible(false);
    setOpen(false);
  };

  useLayoutEffect(() => {
    if (!open) {
      setVisible(false);
      return undefined;
    }

    updatePosition();

    let showFrame = 0;
    const measureFrame = requestAnimationFrame(() => {
      updatePosition();
      showFrame = requestAnimationFrame(() => setVisible(true));
    });

    return () => {
      cancelAnimationFrame(measureFrame);
      cancelAnimationFrame(showFrame);
    };
  }, [open, tip]);

  useEffect(() => {
    if (!open) return undefined;

    const onReposition = () => updatePosition();
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);

    return () => {
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [open]);

  const linkProps = {
    ref: linkRef,
    className,
    'aria-label': label,
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip,
  };

  return (
    <>
      {external ? (
        <a {...linkProps} href={href} target="_blank" rel="noopener noreferrer">
          <ContactIcon type={type} />
        </a>
      ) : (
        <a {...linkProps} href={href}>
          <ContactIcon type={type} />
        </a>
      )}
      {open && createPortal(
        <span
          ref={tooltipRef}
          className={`event-detail__organiser-tooltip${visible ? ' event-detail__organiser-tooltip--visible' : ''}`}
          role="tooltip"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {tip}
        </span>,
        document.body,
      )}
    </>
  );
}
