import { useAppTexts } from '../contexts/AppTextsContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { adminText } from '../utils/admin-text';
import { resolveSiteLogo } from '../utils/site-branding';

export default function AdminBrand({ className = '', onClick }) {
  const { settings } = useSiteSettings();
  // Subscribe to text overrides so brand labels refresh after admin edits.
  const { revision } = useAppTexts();
  const logo = resolveSiteLogo(settings, { width: 128, height: 160 });
  const logoAlt = settings.logoAlt || 'Popcorn logo';

  return (
    <a
      href="/admin"
      data-text-revision={revision}
      className={`navbar__brand admin-navbar__brand${className ? ` ${className}` : ''}`}
      onClick={onClick}
    >
      <img src={logo} alt={logoAlt} className="navbar__logo admin-navbar__logo" />
      <span className="navbar__title admin-navbar__title">
        <span>{adminText('shell.brand.line1')}</span>
        <span>{adminText('shell.brand.line2')}</span>
      </span>
    </a>
  );
}
