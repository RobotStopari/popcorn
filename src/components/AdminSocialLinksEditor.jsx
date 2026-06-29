import {
  SOCIAL_LINK_PRESET_IDS,
  SOCIAL_LINK_PRESETS,
} from '../data/social-link-presets';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { getBrandLinkHref } from '../data/site-settings';
import { normalizeSocialLinkSlots } from '../utils/page-blocks';

export default function AdminSocialLinksEditor({ links = [], onChange }) {
  const { settings } = useSiteSettings();
  const slots = normalizeSocialLinkSlots(links);

  const updateSlot = (index, patch) => {
    onChange({
      links: normalizeSocialLinkSlots(
        slots.map((link, slotIndex) => (
          slotIndex === index ? { ...link, ...patch } : link
        )),
      ),
    });
  };

  return (
    <div className="admin-social-links">
      {slots.map((link, index) => {
        const preset = SOCIAL_LINK_PRESETS[link.preset];
        const displayLabel = link.label?.trim() || preset?.label || `Tlačítko ${index + 1}`;
        const settingsHref = link.preset !== 'web'
          ? getBrandLinkHref(link.preset, settings.brandLinks)
          : '';

        return (
          <article
            key={index}
            className={`admin-social-links__slot${link.enabled ? ' is-enabled' : ''}`}
          >
            <header className="admin-social-links__slot-head">
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(link.enabled)}
                className="admin-social-links__switch"
                onClick={() => updateSlot(index, { enabled: !link.enabled })}
              >
                <span className="admin-social-links__switch-ui" aria-hidden="true" />
                <span className="admin-social-links__switch-label">{displayLabel}</span>
              </button>
            </header>

            {link.enabled ? (
              <div className="admin-social-links__slot-body">
                <div className="admin-social-links__field">
                  <span className="admin-social-links__field-label" id={`social-link-${index}-type`}>
                    Typ tlačítka
                  </span>
                  <div className="admin-social-links__type-picker">
                    {preset && (
                      <span
                        className={`admin-social-links__type-icon social-btn--${link.preset}`}
                        dangerouslySetInnerHTML={{ __html: preset.icon }}
                        aria-hidden="true"
                      />
                    )}
                    <select
                      className="admin-social-links__type-select"
                      value={link.preset}
                      onChange={(event) => {
                        const nextPreset = event.target.value;
                        updateSlot(index, {
                          preset: nextPreset,
                          href: nextPreset === 'web' ? link.href : '',
                        });
                      }}
                      aria-labelledby={`social-link-${index}-type`}
                    >
                      {SOCIAL_LINK_PRESET_IDS.map((presetId) => (
                        <option key={presetId} value={presetId}>
                          {SOCIAL_LINK_PRESETS[presetId].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {link.preset === 'web' ? (
                  <label className="admin-social-links__field" htmlFor={`social-link-${index}-href`}>
                    <span className="admin-social-links__field-label">Odkaz</span>
                    <input
                      id={`social-link-${index}-href`}
                      type="text"
                      className="admin-form__input admin-social-links__input"
                      value={link.href || ''}
                      onChange={(event) => updateSlot(index, { href: event.target.value })}
                      placeholder="https://…"
                    />
                  </label>
                ) : (
                  <p className="admin-social-links__resolved-href">
                    <span className="admin-social-links__field-label">Odkaz</span>
                    <span className={`admin-social-links__resolved-value${settingsHref ? '' : ' admin-social-links__resolved-value--missing'}`}>
                      {settingsHref || 'Doplňte odkaz v Nastavení webu → Sociální sítě'}
                    </span>
                  </p>
                )}

                <label className="admin-social-links__field" htmlFor={`social-link-${index}-label`}>
                  <span className="admin-social-links__field-label">Popisek</span>
                  <input
                    id={`social-link-${index}-label`}
                    type="text"
                    className="admin-form__input admin-social-links__input"
                    value={link.label || ''}
                    onChange={(event) => updateSlot(index, { label: event.target.value })}
                    placeholder={preset?.label || 'Volitelný text tlačítka'}
                  />
                </label>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
