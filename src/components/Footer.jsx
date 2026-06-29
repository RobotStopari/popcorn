import { FOOTER_ICON_SIZE } from '../data/icons';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { resolveFooterSocialLinks, resolveSiteBranding } from '../utils/site-branding';

function resizeIcon(svg, size) {
  return svg.replace(/width="\d+"/, `width="${size}"`).replace(/height="\d+"/, `height="${size}"`);
}

export default function Footer() {
  const { settings } = useSiteSettings();
  const branding = resolveSiteBranding(settings);
  const footerSocials = resolveFooterSocialLinks(settings);

  return (
    <footer className="footer">
      <div className="container footer__inner">
        {footerSocials.length > 0 && (
          <div className="footer__socials">
            {footerSocials.map((social) => (
              <a
                key={social.id}
                href={social.href}
                className={`footer__social-link footer__social-link--${social.id}`}
                aria-label={social.label}
                target={social.href.startsWith('mailto:') ? undefined : '_blank'}
                rel={social.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                dangerouslySetInnerHTML={{ __html: resizeIcon(social.icon, FOOTER_ICON_SIZE) }}
              />
            ))}
          </div>
        )}
        <div className="footer__brand">
          <img src={branding.logo} alt={branding.logoAlt} className="footer__logo" />
          <p className="footer__year">{branding.footer.year}</p>
        </div>
        <div className="footer__contact">
          <p>{branding.footer.contactLabel}</p>
          <a href={`mailto:${branding.footer.contactEmail}`}>{branding.footer.contactEmail}</a>
        </div>
      </div>
    </footer>
  );
}
