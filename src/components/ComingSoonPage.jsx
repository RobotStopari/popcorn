import { SOCIAL_LINK_PRESETS } from '../data/social-link-presets';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { getBrandLinkHref } from '../data/site-settings';
import { resolveSiteBranding } from '../utils/site-branding';

const COMING_SOON_SOCIAL_IDS = ['instagram', 'facebook'];

export default function ComingSoonPage() {
  const { settings } = useSiteSettings();
  const branding = resolveSiteBranding(settings);

  const socials = COMING_SOON_SOCIAL_IDS
    .map((id) => {
      const href = getBrandLinkHref(id, settings.brandLinks);
      const preset = SOCIAL_LINK_PRESETS[id];
      if (!href?.trim() || !preset) return null;
      return { id, href, label: preset.label, icon: preset.icon };
    })
    .filter(Boolean);

  return (
    <section className="coming-soon section" aria-labelledby="coming-soon-title">
      <div className="container coming-soon__inner">
        <div className="section__label reveal">
          <span className="section__label-line section__label-line--red" aria-hidden="true" />
          <h1 id="coming-soon-title" className="section__label-text">Již brzy</h1>
          <span className="section__label-line section__label-line--red" aria-hidden="true" />
        </div>

        <div className="hero coming-soon__hero reveal reveal--delay-1">
          <blockquote className="hero__quote">
            <p className="hero__text">
              <span className="hero__mark hero__mark--open" aria-hidden="true">„</span>
              Na webu právě pracujeme. Brzy tu najdeš všechny informace o Popcornu, jeho akcích a dalších aktivitách.
              <span className="hero__mark hero__mark--close" aria-hidden="true">“</span>
            </p>
          </blockquote>
        </div>

        <div className="coming-soon__card reveal reveal--delay-2">
          <img
            src={branding.logo}
            alt=""
            className="coming-soon__logo"
            aria-hidden="true"
          />
          <p className="coming-soon__brand">
            <span>{branding.brand.line1}</span>
            <span>{branding.brand.line2}</span>
          </p>
          <p className="coming-soon__text">
            Mezitím nás můžeš sledovat na sociálních sítích.
          </p>
        </div>

        {socials.length > 0 && (
          <div className="social-row coming-soon__socials reveal-stagger reveal reveal--delay-3">
            {socials.map((social, index) => (
              <a
                key={social.id}
                href={social.href}
                className={`social-btn social-btn--${social.id} shine-hover reveal reveal--delay-${Math.min(index + 1, 4)}`}
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span dangerouslySetInnerHTML={{ __html: social.icon }} />
                <span>{social.label}</span>
              </a>
            ))}
          </div>
        )}

        <div className="coming-soon__cta reveal reveal--delay-4">
          <p className="coming-soon__contact-label">{branding.footer.contactLabel}</p>
          <a
            href={`mailto:${branding.footer.contactEmail}`}
            className="btn btn--primary shine-hover"
          >
            {branding.footer.contactEmail}
          </a>
        </div>
      </div>
    </section>
  );
}
