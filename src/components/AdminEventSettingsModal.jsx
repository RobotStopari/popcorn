import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import {
  createEmptyEventStamp,
  MAX_EVENT_STAMPS,
  normalizeEventStampItem,
  normalizeEventStampsList,
  normalizeStampIcon,
} from '../data/event-stamps';
import {
  DEFAULT_SITE_SETTINGS,
  EVENT_CATEGORY_FIELDS,
} from '../data/site-settings';
import {
  subscribeSiteSettings,
  updateEventCategorySettings,
  updateEventStamps,
} from '../services/site-settings';
import AdminModalPanel from './AdminModalPanel';
import AdminTabs, { AdminTabPanel, getAdminTabDirection } from './AdminTabs';
import { adminText } from '../utils/admin-text';

const TABS = [
  {
    id: 'categories',
    label: 'Kategorie',
    hint: 'Názvy a popisy',
    icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h10M4 17h7"/></svg>',
  },
  {
    id: 'stamps',
    label: 'Razítka',
    hint: 'Ikony na kartách',
    icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M9 12h6"/></svg>',
  },
];

const CATEGORY_SECTIONS = [
  {
    id: 'public',
    title: 'Veřejná akce',
    hint: 'Název a popis pro karty, kalendář i stránku akce.',
    accent: 'identity',
    labelField: 'eventCategoryPublicLabel',
    descriptionField: 'eventCategoryPublicDescription',
  },
  {
    id: 'private',
    title: 'Soukromá akce',
    hint: 'Název a popis pro karty, kalendář i stránku akce.',
    accent: 'copy',
    labelField: 'eventCategoryPrivateLabel',
    descriptionField: 'eventCategoryPrivateDescription',
  },
  {
    id: 'external',
    title: 'Akce mimo Popcorn',
    hint: 'Název a popis pro karty, kalendář i stránku akce.',
    accent: 'place',
    labelField: 'eventCategoryExternalLabel',
    descriptionField: 'eventCategoryExternalDescription',
  },
];

const FIELD_BY_ID = Object.fromEntries(EVENT_CATEGORY_FIELDS.map((field) => [field.id, field]));

function TabBlock({ title, hint, accent = '', children }) {
  return (
    <section className={`admin-event-block${accent ? ` admin-event-block--${accent}` : ''}`}>
      {(title || hint) && (
        <div className="admin-event-block__head">
          {title && <h3 className="admin-event-block__title">{title}</h3>}
          {hint && <p className="admin-event-block__hint">{hint}</p>}
        </div>
      )}
      <div className="admin-event-block__content">{children}</div>
    </section>
  );
}

function FieldGroup({ label, required = false, htmlFor, children }) {
  return (
    <div className="admin-form__group">
      {label && (
        <label className="admin-form__label" htmlFor={htmlFor}>
          {label}
          {required && <span className="admin-form__required">*</span>}
        </label>
      )}
      {children}
    </div>
  );
}

function stampCountLabel(count) {
  if (count === 1) return '1 razítko';
  if (count >= 2 && count <= 4) return `${count} razítka`;
  return `${count} razítek`;
}

export default function AdminEventSettingsModal({ open, onClose }) {
  const { mounted, visible } = useAnimatedPresence(open, 240);
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [stamps, setStamps] = useState([]);
  const [activeTab, setActiveTab] = useState('categories');
  const [tabDirection, setTabDirection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return undefined;

    setLoading(true);
    setError('');
    setMessage('');
    setActiveTab('categories');
    setTabDirection(0);

    const unsubscribe = subscribeSiteSettings(
      (data) => {
        setSettings(data);
        setStamps(normalizeEventStampsList(data.eventStamps).map((item) => ({ ...item })));
        setLoading(false);
      },
      () => {
        setSettings(DEFAULT_SITE_SETTINGS);
        setStamps([]);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [open]);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (event) => {
      if (event.key === 'Escape' && !saving) onClose();
    };

    document.body.classList.add('admin-modal-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('admin-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [mounted, onClose, saving]);

  if (!mounted) return null;

  const handleTabChange = (tabId) => {
    setTabDirection(getAdminTabDirection(TABS, activeTab, tabId));
    setActiveTab(tabId);
  };

  const handleChange = (fieldId, value) => {
    setSettings((prev) => ({ ...prev, [fieldId]: value }));
    setMessage('');
    setError('');
  };

  const updateStamp = (index, patch) => {
    setStamps((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    setMessage('');
    setError('');
  };

  const addStamp = () => {
    if (stamps.length >= MAX_EVENT_STAMPS) {
      setError(`Maximum je ${MAX_EVENT_STAMPS} razítek.`);
      handleTabChange('stamps');
      return;
    }
    setStamps((prev) => [...prev, createEmptyEventStamp()]);
    handleTabChange('stamps');
    setMessage('');
    setError('');
  };

  const removeStamp = (index) => {
    const label = stamps[index]?.name?.trim() || stamps[index]?.icon || 'toto razítko';
    if (!window.confirm(`Opravdu smazat razítko „${label}“?`)) return;
    setStamps((prev) => prev.filter((_, i) => i !== index));
    setMessage('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    const payload = EVENT_CATEGORY_FIELDS.reduce((acc, field) => {
      acc[field.id] = settings[field.id]?.trim() || '';
      return acc;
    }, {});

    const missingField = EVENT_CATEGORY_FIELDS.find((field) => !payload[field.id]);
    if (missingField) {
      setError('Vyplňte všechna pole kategorií akcí.');
      handleTabChange('categories');
      setSaving(false);
      return;
    }

    const normalizedStamps = stamps
      .map((item) => normalizeEventStampItem(item))
      .filter(Boolean);

    if (normalizedStamps.length !== stamps.length) {
      setError('Každé razítko musí mít ikonu (emoji nebo písmeno) a název.');
      handleTabChange('stamps');
      setSaving(false);
      return;
    }

    try {
      await updateEventCategorySettings(payload);
      await updateEventStamps(normalizedStamps);
      setStamps(normalizedStamps.map((item) => ({ ...item })));
      setMessage('Nastavení akcí uloženo.');
    } catch (err) {
      setError(err.message || 'Uložení se nezdařilo.');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (fieldId, label) => {
    const field = FIELD_BY_ID[fieldId];
    if (!field) return null;

    return (
      <FieldGroup key={field.id} label={label} htmlFor={field.id} required>
        {field.inputType === 'text' ? (
          <input
            id={field.id}
            type="text"
            className="admin-form__input"
            value={settings[field.id] || ''}
            onChange={(event) => handleChange(field.id, event.target.value)}
            required
            disabled={saving}
          />
        ) : (
          <textarea
            id={field.id}
            className="admin-form__input"
            rows={3}
            value={settings[field.id] || ''}
            onChange={(event) => handleChange(field.id, event.target.value)}
            required
            disabled={saving}
          />
        )}
      </FieldGroup>
    );
  };

  return createPortal(
    <div
      className={`admin-modal admin-modal--wide admin-modal--event-form admin-event-settings-modal${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-event-settings-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <AdminModalPanel className="admin-modal__panel--wide admin-modal__panel--event-form">
        <header className="admin-event-modal__header">
          <div className="admin-event-modal__header-copy">
            <p className="admin-event-modal__eyebrow">Akce</p>
            <h2 id="admin-event-settings-title" className="admin-modal__title admin-event-modal__title">
              Nastavení akcí
            </h2>
            <p className="admin-event-modal__lede">
              Kategorie akcí a razítka pro karty a stránky akcí.
            </p>
          </div>
        </header>

        {loading ? (
          <p className="admin-loading">{adminText('common.loading')}</p>
        ) : (
          <form id="admin-event-settings-form" className="admin-form admin-form--event" onSubmit={handleSubmit}>
            <AdminTabs
              idPrefix="event-settings"
              label="Sekce nastavení akcí"
              tabs={TABS}
              activeTab={activeTab}
              onChange={handleTabChange}
              badges={{ stamps: stamps.length }}
            />

            <div className="admin-event-tabs__panels">
              <AdminTabPanel id="categories" idPrefix="event-settings" activeTab={activeTab} direction={tabDirection}>
                <div className="admin-event-tab">
                  <p className="admin-event-tab__intro">
                    Názvy a popisy se ukazují na kartách, v kalendáři i na stránkách akcí.
                  </p>
                  {CATEGORY_SECTIONS.map((section) => (
                    <TabBlock
                      key={section.id}
                      title={section.title}
                      hint={section.hint}
                      accent={section.accent}
                    >
                      {renderField(section.labelField, 'Název')}
                      {renderField(section.descriptionField, 'Popis na stránce akce')}
                    </TabBlock>
                  ))}
                </div>
              </AdminTabPanel>

              <AdminTabPanel id="stamps" idPrefix="event-settings" activeTab={activeTab} direction={tabDirection}>
                <div className="admin-event-tab">
                  <TabBlock
                    title="Razítka"
                    hint="Jedno emoji nebo písmeno + název. Ikona se zobrazí na kartě a na stránce akce."
                    accent="identity"
                  >
                    <div className="admin-form__repeatable">
                      <div className="admin-form__repeatable-head">
                        <span className="admin-form__repeatable-count">
                          {stampCountLabel(stamps.length)}
                        </span>
                        <button
                          type="button"
                          className="btn btn--outline btn--small"
                          onClick={addStamp}
                          disabled={saving || stamps.length >= MAX_EVENT_STAMPS}
                        >
                          + Přidat razítko
                        </button>
                      </div>

                      {!stamps.length ? (
                        <p className="admin-form__participants-empty">
                          Zatím žádná razítka. Přidejte první tlačítkem výše.
                        </p>
                      ) : (
                        stamps.map((stamp, index) => (
                          <div
                            key={stamp.id}
                            className="admin-form__repeatable-item admin-form__repeatable-item--people admin-event-settings__stamp-item"
                          >
                            <div className="admin-form__card-badge">#{index + 1}</div>
                            <div className="admin-form__row">
                              <FieldGroup
                                label="Ikona"
                                htmlFor={`stamp-icon-${stamp.id}`}
                                required
                              >
                                <input
                                  id={`stamp-icon-${stamp.id}`}
                                  type="text"
                                  className="admin-form__input admin-event-settings__icon-input"
                                  value={stamp.icon}
                                  onChange={(event) => updateStamp(index, { icon: event.target.value })}
                                  onBlur={(event) => updateStamp(index, {
                                    icon: normalizeStampIcon(event.target.value),
                                  })}
                                  placeholder=""
                                  maxLength={8}
                                  disabled={saving}
                                />
                              </FieldGroup>
                              <FieldGroup
                                label="Název"
                                htmlFor={`stamp-name-${stamp.id}`}
                                required
                              >
                                <input
                                  id={`stamp-name-${stamp.id}`}
                                  type="text"
                                  className="admin-form__input"
                                  value={stamp.name}
                                  onChange={(event) => updateStamp(index, { name: event.target.value })}
                                  placeholder="např. Zapalovač"
                                  maxLength={80}
                                  disabled={saving}
                                />
                              </FieldGroup>
                            </div>
                            <button
                              type="button"
                              className="admin-form__remove"
                              onClick={() => removeStamp(index)}
                              disabled={saving}
                            >
                              Smazat razítko
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </TabBlock>
                </div>
              </AdminTabPanel>
            </div>

            {error && <p className="admin-error admin-form__error">{error}</p>}
            {message && !error && (
              <p className="admin-form__preset-message" role="status">{message}</p>
            )}

            <div className="admin-modal__actions admin-event-modal__actions">
              <button type="button" className="btn btn--outline" onClick={onClose} disabled={saving}>
                {adminText('common.cancel')}
              </button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? adminText('common.saving') : adminText('common.save')}
              </button>
            </div>
          </form>
        )}
      </AdminModalPanel>
    </div>,
    document.body,
  );
}
