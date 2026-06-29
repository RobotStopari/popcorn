import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminFooterSocialSlotsEditor from '../components/AdminFooterSocialSlotsEditor';
import AdminSiteOptionToggles, { AdminBrandLinkFields } from '../components/AdminSiteOptionToggles';
import PageBlockImageUpload from '../components/PageBlockImageUpload';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import {
  DEFAULT_SITE_SETTINGS,
  SITE_SETTINGS_SECTIONS,
} from '../data/site-settings';
import { subscribeSiteSettings, updateSiteSettings } from '../services/site-settings';
import { adminDocumentTitle, adminText } from '../utils/admin-text';

const FORM_ID = 'admin-settings-form';

export default function AdminSettingsPage() {
  const { canAccessAdmin, loading } = useAdminAuth();
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [listLoading, setListLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    document.title = adminDocumentTitle(adminText('settingsPage.title'));
  }, []);

  useEffect(() => {
    if (!canAccessAdmin) return undefined;

    const unsubscribe = subscribeSiteSettings(
      (data) => {
        setSettings(data);
        setListLoading(false);
      },
      () => {
        setSettings(DEFAULT_SITE_SETTINGS);
        setListLoading(false);
      },
    );

    return unsubscribe;
  }, [canAccessAdmin]);

  if (loading) {
    return (
      <div className="admin-content">
        <p className="admin-loading">{adminText('common.loading')}</p>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const updateSettings = (patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setSaveMessage('');
    setSaveError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveMessage('');

    try {
      await updateSiteSettings(settings);
      setSaveMessage(adminText('settingsPage.saved'));
    } catch (err) {
      setSaveError(err.message || adminText('settingsPage.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-content container admin-settings-page">
      <header className="admin-content__header admin-content__header--actions admin-settings-page__header">
        <div>
          <h1 className="admin-content__title">{adminText('settingsPage.title')}</h1>
          <p className="admin-content__subtitle">{adminText('settingsPage.subtitle')}</p>
        </div>
        {!listLoading && (
          <button
            type="submit"
            form={FORM_ID}
            className="btn btn--primary"
            disabled={saving}
          >
            {saving ? adminText('common.saving') : adminText('settingsPage.save')}
          </button>
        )}
      </header>

      {(saveError || saveMessage) && (
        <p
          className={`admin-settings-page__status${saveError ? ' admin-settings-page__status--error' : ''}`}
          role="status"
        >
          {saveError || saveMessage}
        </p>
      )}

      {listLoading ? (
        <p className="admin-loading">{adminText('settingsPage.loading')}</p>
      ) : (
        <form id={FORM_ID} className="admin-settings" onSubmit={handleSubmit}>
          {SITE_SETTINGS_SECTIONS.map((section) => (
            <section key={section.id} className="admin-settings__section">
              <h2 className="admin-settings__section-head">{section.title}</h2>
              <div className="admin-settings__section-body">
                {section.id === 'branding' && (
                  <>
                    <div className="admin-settings__field">
                      <label className="admin-settings__label" htmlFor="site-logo-upload">
                        Logo v navigaci a patičce
                      </label>
                      <PageBlockImageUpload
                        variant="logo"
                        imageUrl={settings.logoUrl}
                        imagePublicId={settings.logoPublicId}
                        previewSeed="site-logo"
                        uploadType="siteLogo"
                        onChange={(patch) => updateSettings({
                          logoUrl: patch.imageUrl || '',
                          logoPublicId: patch.imagePublicId || '',
                        })}
                      />
                    </div>

                    <div className="admin-settings__grid">
                      <label className="admin-settings__field" htmlFor="brand-line-1">
                        <span className="admin-settings__label">Název — první řádek</span>
                        <input
                          id="brand-line-1"
                          className="admin-form__input"
                          value={settings.brandLine1}
                          onChange={(event) => updateSettings({ brandLine1: event.target.value })}
                          required
                        />
                      </label>
                      <label className="admin-settings__field" htmlFor="brand-line-2">
                        <span className="admin-settings__label">Název — druhý řádek</span>
                        <input
                          id="brand-line-2"
                          className="admin-form__input"
                          value={settings.brandLine2}
                          onChange={(event) => updateSettings({ brandLine2: event.target.value })}
                          required
                        />
                      </label>
                    </div>

                    <label className="admin-settings__field" htmlFor="logo-alt">
                      <span className="admin-settings__label">Popis loga (alt)</span>
                      <input
                        id="logo-alt"
                        className="admin-form__input"
                        value={settings.logoAlt}
                        onChange={(event) => updateSettings({ logoAlt: event.target.value })}
                        required
                      />
                    </label>
                  </>
                )}

                {section.id === 'socials' && (
                  <>
                    <p className="admin-settings__section-hint">
                      Hlavní odkazy webu. Instagram se používá i u widgetu příspěvků.
                    </p>
                    <AdminBrandLinkFields
                      brandLinks={settings.brandLinks}
                      onChange={updateSettings}
                    />
                  </>
                )}

                {section.id === 'footer' && (
                  <>
                    <div className="admin-settings__grid">
                      <label className="admin-settings__field" htmlFor="footer-year">
                        <span className="admin-settings__label">Text pod logem</span>
                        <input
                          id="footer-year"
                          className="admin-form__input"
                          value={settings.footerYear}
                          onChange={(event) => updateSettings({ footerYear: event.target.value })}
                          required
                        />
                      </label>
                      <label className="admin-settings__field" htmlFor="footer-contact-label">
                        <span className="admin-settings__label">Kontaktní popisek</span>
                        <input
                          id="footer-contact-label"
                          className="admin-form__input"
                          value={settings.footerContactLabel}
                          onChange={(event) => updateSettings({ footerContactLabel: event.target.value })}
                          required
                        />
                      </label>
                    </div>

                    <label className="admin-settings__field" htmlFor="footer-contact-email">
                      <span className="admin-settings__label">Kontaktní e-mail</span>
                      <input
                        id="footer-contact-email"
                        type="email"
                        className="admin-form__input"
                        value={settings.footerContactEmail}
                        onChange={(event) => updateSettings({ footerContactEmail: event.target.value })}
                        required
                      />
                    </label>

                    <div className="admin-settings__field">
                      <span className="admin-settings__label">Ikony sociálních sítí v patičce</span>
                      <AdminFooterSocialSlotsEditor
                        slots={settings.footerSocialSlots}
                        onChange={(footerSocialSlots) => updateSettings({ footerSocialSlots })}
                      />
                    </div>
                  </>
                )}

                {section.id === 'options' && (
                  <AdminSiteOptionToggles settings={settings} onChange={updateSettings} />
                )}
              </div>
            </section>
          ))}
        </form>
      )}
    </div>
  );
}
