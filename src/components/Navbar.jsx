import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { resolveSiteBranding } from '../utils/site-branding';
import NavMenu from './NavMenu';

export default function Navbar({ minimal = false }) {
  const { settings } = useSiteSettings();
  const branding = resolveSiteBranding(settings);

  return (
    <header className={`navbar${minimal ? ' navbar--minimal' : ''}`} id="navbar">
      <div className="navbar__inner container">
        <a href="/" className="navbar__brand">
          <img src={branding.logo} alt={branding.logoAlt} className="navbar__logo" />
          <span className="navbar__title">
            <span>{branding.brand.line1}</span>
            <span>{branding.brand.line2}</span>
          </span>
        </a>

        {!minimal && (
          <>
            <button className="navbar__toggle" id="navToggle" type="button" aria-label="Otevřít menu" aria-expanded="false">
              <span /><span /><span />
            </button>

            <NavMenu />
          </>
        )}
      </div>
    </header>
  );
}
