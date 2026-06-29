import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { resolveSiteBranding } from '../utils/site-branding';

export default function Loader() {
  const { settings } = useSiteSettings();
  const branding = resolveSiteBranding(settings);

  return (
    <div id="pageLoader" className="loader" role="status" aria-live="polite" aria-label="Načítání stránky">
      <div className="loader__inner">
        <div className="loader__burst" aria-hidden="true">
          <span /><span /><span /><span /><span /><span />
        </div>
        <div className="loader__logo-wrap">
          <img src={branding.logo} alt="" className="loader__logo" width="120" height="120" />
        </div>
        <p className="loader__tagline">{`${branding.brand.line1} ${branding.brand.line2}`}</p>
        <div className="loader__bar" aria-hidden="true">
          <span className="loader__bar-fill" />
        </div>
      </div>
    </div>
  );
}
