import { FOOTER_SOCIAL_PRESET_IDS, SOCIAL_LINK_PRESETS } from '../data/social-link-presets';
import { FOOTER_SOCIAL_SLOT_LIMIT } from '../data/site-settings';

export default function AdminFooterSocialSlotsEditor({ slots = [], onChange }) {
  const normalized = Array.from({ length: FOOTER_SOCIAL_SLOT_LIMIT }, (_, index) => {
    const slot = slots[index] || {};
    const preset = FOOTER_SOCIAL_PRESET_IDS.includes(slot.preset) ? slot.preset : 'instagram';
    return {
      preset,
      enabled: Boolean(slot.enabled),
    };
  });

  const updateSlot = (index, patch) => {
    onChange(
      normalized.map((slot, slotIndex) => (
        slotIndex === index ? { ...slot, ...patch } : slot
      )),
    );
  };

  return (
    <div className="admin-footer-social-slots">
      <p className="admin-footer-social-slots__hint">
        Vyberte až tři ikony v patičce. Odkazy se berou z nastavení sociálních sítí výše.
      </p>
      {normalized.map((slot, index) => {
        const preset = SOCIAL_LINK_PRESETS[slot.preset];
        return (
          <article
            key={index}
            className={`admin-footer-social-slots__slot${slot.enabled ? ' is-enabled' : ''}`}
          >
            <header className="admin-footer-social-slots__head">
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(slot.enabled)}
                className="admin-social-links__switch"
                onClick={() => updateSlot(index, { enabled: !slot.enabled })}
              >
                <span className="admin-social-links__switch-ui" aria-hidden="true" />
                <span className="admin-social-links__switch-label">
                  {`Ikona ${index + 1}`}
                </span>
              </button>
            </header>

            {slot.enabled ? (
              <div className="admin-footer-social-slots__body">
                <div className="admin-social-links__field">
                  <span className="admin-social-links__field-label" id={`footer-social-${index}-type`}>
                    Typ ikony
                  </span>
                  <div className="admin-social-links__type-picker">
                    {preset && (
                      <span
                        className={`admin-social-links__type-icon social-btn--${slot.preset}`}
                        dangerouslySetInnerHTML={{ __html: preset.icon }}
                        aria-hidden="true"
                      />
                    )}
                    <select
                      className="admin-social-links__type-select"
                      value={slot.preset}
                      onChange={(event) => updateSlot(index, { preset: event.target.value })}
                      aria-labelledby={`footer-social-${index}-type`}
                    >
                      {FOOTER_SOCIAL_PRESET_IDS.map((presetId) => (
                        <option key={presetId} value={presetId}>
                          {SOCIAL_LINK_PRESETS[presetId].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
