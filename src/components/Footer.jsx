import { FOOTER_ICON_SIZE } from '../data/icons';
import { SITE } from '../data/site';
import { SOCIALS } from '../data/socials';

function resizeIcon(svg, size) {
  return svg.replace(/width="\d+"/, `width="${size}"`).replace(/height="\d+"/, `height="${size}"`);
}

export default function Footer() {
  const footerSocials = SOCIALS.filter((s) => s.showInFooter);

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__socials">
          {footerSocials.map((social) => (
            <a
              key={social.id}
              href={social.href}
              className={`footer__social-link footer__social-link--${social.id}`}
              aria-label={social.label}
              dangerouslySetInnerHTML={{ __html: resizeIcon(social.icon, FOOTER_ICON_SIZE) }}
            />
          ))}
        </div>
        <div className="footer__brand">
          <img src={SITE.logo} alt={SITE.logoAlt} className="footer__logo" />
          <p className="footer__year">{SITE.footer.year}</p>
        </div>
        <div className="footer__contact">
          <p>{SITE.footer.contactLabel}</p>
          <a href={`mailto:${SITE.footer.contactEmail}`}>{SITE.footer.contactEmail}</a>
        </div>
      </div>
    </footer>
  );
}
