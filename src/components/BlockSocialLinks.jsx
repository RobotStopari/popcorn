import { SOCIAL_LINK_PRESETS } from '../data/social-link-presets';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { resolveBlockSocialLinks } from '../utils/site-branding';

export default function BlockSocialLinks({ links = [] }) {
  const { settings } = useSiteSettings();
  const activeLinks = resolveBlockSocialLinks(links, settings);

  if (!activeLinks.length) return null;

  return (
    <div className="social-row reveal-stagger">
      {activeLinks.map((link, index) => {
        const preset = SOCIAL_LINK_PRESETS[link.preset];
        if (!preset) return null;

        const label = link.label?.trim() || preset.label;

        return (
          <a
            key={`${link.preset}-${index}`}
            href={link.href}
            className={`social-btn social-btn--${link.preset} shine-hover reveal`}
            aria-label={label}
            target={link.href.startsWith('mailto:') ? undefined : '_blank'}
            rel={link.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
          >
            <span dangerouslySetInnerHTML={{ __html: preset.icon }} />
            <span>{label}</span>
          </a>
        );
      })}
    </div>
  );
}
