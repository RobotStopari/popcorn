import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { eventUrl } from '../data/events';
import {
  createEmptyOrganiser,
  createEmptyParticipant,
  eventToFormState,
  formStateToPayload,
  isEventPublishable,
  isValidHttpsUrl,
} from '../utils/event-format';
import { isEventPast, suggestEndDate, validateDateRange } from '../utils/event-dates';
import {
  isCompleteOrganiser,
  organiserFromPreset,
  presetDisplayLabel,
} from '../utils/organiser';
import {
  deleteOrganiserPreset,
  saveOrganiserPreset,
  subscribeOrganiserPresets,
} from '../services/organiser-presets';
import RichTextEditor from './RichTextEditor';
import EventCategorySelect from './EventCategorySelect';
import { isExternalEventCategory } from '../data/event-categories';
import SortableParticipantList from './SortableParticipantList';
import AdminEventSharingTab from './AdminEventSharingTab';
import AdminModalPanel from './AdminModalPanel';
import EventCoverUpload from './EventCoverUpload';
import EventImageUploadList from './EventImageUploadList';
import {
  EVENT_PROMO_MAX,
  EVENT_PROMO_UPLOAD_HINT,
  EVENT_GALLERY_PICKS_MAX,
  EVENT_GALLERY_PICKS_UPLOAD_HINT,
} from '../data/event-images';

const MAX_ORGANISERS = 10;

function Icon({ svg }) {
  return (
    <span
      className="admin-form__icon"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function TabBlock({ title, hint, children }) {
  return (
    <section className="admin-event-block">
      {title && <h3 className="admin-event-block__title">{title}</h3>}
      {hint && <p className="admin-event-block__hint">{hint}</p>}
      <div className="admin-event-block__content">{children}</div>
    </section>
  );
}

function FieldGroup({ label, required = false, children, hint }) {
  return (
    <div className="admin-form__group">
      {label && (
        <label className="admin-form__label">
          {label}
          {required && <span className="admin-form__required">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="admin-form__hint">{hint}</p>}
    </div>
  );
}

const PARTICIPANTS_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';

const TABS = [
  { id: 'basic', label: 'Základní' },
  { id: 'organisers', label: 'Organizátoři' },
  { id: 'registration', label: 'Přihlašování' },
  { id: 'past', label: 'Po akci' },
  { id: 'sharing', label: 'Sdílení' },
];

function organiserHasContent(item) {
  return Boolean(
    item.name.trim()
    || item.email.trim()
    || item.nick.trim()
    || item.phone.trim()
    || item.instagram.trim()
    || item.facebook.trim(),
  );
}

function isOrganisersSectionEmpty(form) {
  return form.organisers.length === 0 || !form.organisers.some(organiserHasContent);
}

function isRegistrationSectionEmpty(form) {
  return !form.registrationLink.trim()
    && !form.participants.some((participant) => participant.name.trim());
}

function getUnvisitedEmptyTabs(visitedTabs, form) {
  const tabs = [];

  if (!visitedTabs.has('organisers') && isOrganisersSectionEmpty(form)) {
    tabs.push('organisers');
  }

  if (!visitedTabs.has('registration') && isRegistrationSectionEmpty(form)) {
    tabs.push('registration');
  }

  return tabs;
}

function buildIncompleteTabsMessage(tabIds) {
  const labels = tabIds.map((id) => TABS.find((tab) => tab.id === id)?.label).filter(Boolean);

  if (labels.length === 2) {
    return 'Nepracovali jste se záložkami Organizátoři a Přihlašování a obě jsou prázdné. Opravdu chcete akci uložit?';
  }

  if (labels.length === 1) {
    return `Nepracovali jste se záložkou ${labels[0]} a je prázdná. Opravdu chcete akci uložit?`;
  }

  return 'Opravdu chcete akci uložit?';
}

function EventFormTabs({ activeTab, onChange, attentionTabs = new Set(), tabs = TABS }) {
  return (
    <div className="admin-event-tabs" role="tablist" aria-label="Sekce formuláře akce">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`event-tab-${tab.id}`}
          aria-selected={activeTab === tab.id}
          aria-controls={`event-panel-${tab.id}`}
          className={`admin-event-tabs__tab${activeTab === tab.id ? ' admin-event-tabs__tab--active' : ''}${attentionTabs.has(tab.id) ? ' admin-event-tabs__tab--attention' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function TabPanel({ id, activeTab, children }) {
  if (activeTab !== id) return null;

  return (
    <div
      id={`event-panel-${id}`}
      role="tabpanel"
      aria-labelledby={`event-tab-${id}`}
      className="admin-event-tabs__panel"
    >
      {children}
    </div>
  );
}

export default function AdminEventFormModal({
  open,
  event,
  onClose,
  onSave,
  onEnsureDraft,
  shareMode = false,
  fullPage = false,
  shareId = null,
}) {
  const [form, setForm] = useState(eventToFormState());
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [organiserPresets, setOrganiserPresets] = useState([]);
  const [presetMessage, setPresetMessage] = useState('');
  const [presetBusyId, setPresetBusyId] = useState('');
  const [presetPendingDelete, setPresetPendingDelete] = useState(null);
  const [focusParticipantId, setFocusParticipantId] = useState(null);
  const [visitedTabs, setVisitedTabs] = useState(() => new Set(['basic']));
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [pendingIncompleteTabs, setPendingIncompleteTabs] = useState([]);
  const [attentionTabs, setAttentionTabs] = useState(() => new Set());
  const [saveSuccessOpen, setSaveSuccessOpen] = useState(false);
  const panelRef = useRef(null);
  const skipFormResetRef = useRef(false);
  const formRef = useRef(form);
  const navigate = useNavigate();
  const { mounted, visible } = useAnimatedPresence(open, 240);
  const eventId = event?.id ?? null;
  const eventFormSyncKey = event
    ? [
      event.id,
      event.updatedAt?.toMillis?.() ?? event.updatedAt?.seconds ?? '',
      event.category,
      event.externalPageEnabled,
      event.externalPageUrl ?? '',
      event.calendarOnly,
    ].join(':')
    : 'new';

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const visibleTabs = shareMode
    ? TABS.filter((tab) => tab.id !== 'sharing')
    : TABS;

  useEffect(() => {
    if (!open) {
      setSaveSuccessOpen(false);
      return;
    }

    if (skipFormResetRef.current) {
      skipFormResetRef.current = false;
      return;
    }

    setForm(eventToFormState(event));
    setActiveTab('basic');
    setError('');
    setPresetMessage('');
    setPresetPendingDelete(null);
    setVisitedTabs(new Set(['basic']));
    setSaveConfirmOpen(false);
    setPendingIncompleteTabs([]);
    setAttentionTabs(new Set());
    setSaveSuccessOpen(false);
  }, [open, event, eventFormSyncKey]);

  useEffect(() => {
    if (open && form.calendarOnly) {
      setActiveTab('basic');
    }
  }, [open, form.calendarOnly]);

  useEffect(() => {
    if (!open || shareMode) return undefined;

    const unsubscribe = subscribeOrganiserPresets(
      setOrganiserPresets,
      () => setPresetMessage('Nepodařilo se načíst předvolby organizátorů.'),
    );

    return unsubscribe;
  }, [open, shareMode]);

  useEffect(() => {
    if (!open || fullPage) return undefined;

    const onKeydown = (keyEvent) => {
      if (keyEvent.key !== 'Escape') return;
      if (saveConfirmOpen) {
        setSaveConfirmOpen(false);
        return;
      }
      onClose();
    };

    document.body.classList.add('admin-modal-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('admin-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [mounted, onClose, open, fullPage, saveConfirmOpen]);

  useEffect(() => {
    if (!fullPage || !open) return undefined;

    const onKeydown = (keyEvent) => {
      if (keyEvent.key !== 'Escape' || !saveConfirmOpen) return;
      setSaveConfirmOpen(false);
    };

    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [fullPage, open, saveConfirmOpen]);

  useEffect(() => {
    if (!fullPage || (!saveConfirmOpen && !saveSuccessOpen)) return undefined;

    document.body.classList.add('admin-modal-open');
    return () => document.body.classList.remove('admin-modal-open');
  }, [fullPage, saveConfirmOpen, saveSuccessOpen]);

  if (!fullPage && !mounted) return null;
  if (!open) return null;

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (category) => {
    setForm((prev) => ({
      ...prev,
      category,
      ...(isExternalEventCategory(category)
        ? {}
        : { externalPageEnabled: false, externalPageUrl: '', calendarOnly: false }),
    }));
  };

  const handleStartDateChange = (value) => {
    setForm((prev) => ({
      ...prev,
      dateStart: value,
      dateEnd: suggestEndDate(value),
    }));
  };

  const handleStartTimeChange = (value) => {
    setForm((prev) => ({
      ...prev,
      timeStart: value,
      ...(!prev.timeEnd?.trim() ? { timeEnd: value } : {}),
    }));
  };

  const updateOrganiser = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      organisers: prev.organisers.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  };

  const addOrganiser = () => {
    setForm((prev) => {
      if (prev.organisers.length >= MAX_ORGANISERS) return prev;
      return {
        ...prev,
        organisers: [...prev.organisers, createEmptyOrganiser()],
      };
    });
  };

  const removeOrganiser = (index) => {
    setForm((prev) => ({
      ...prev,
      organisers: prev.organisers.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const addOrganiserFromPreset = (preset) => {
    if (form.organisers.length >= MAX_ORGANISERS) {
      setPresetMessage(`Akce může mít maximálně ${MAX_ORGANISERS} organizátorů.`);
      return;
    }

    const email = preset.email.trim().toLowerCase();
    const alreadyAdded = form.organisers.some(
      (item) => item.email.trim().toLowerCase() === email,
    );

    if (alreadyAdded) {
      setPresetMessage(`${presetDisplayLabel(preset)} je v akci už přidaný.`);
      return;
    }

    setForm((prev) => ({
      ...prev,
      organisers: [...prev.organisers, organiserFromPreset(preset)],
    }));
    setPresetMessage(`${presetDisplayLabel(preset)} přidán do akce.`);
  };

  const handleSaveOrganiserPreset = async (index) => {
    const organiser = form.organisers[index];
    if (!isCompleteOrganiser(organiser)) {
      setPresetMessage('Pro uložení předvolby vyplňte jméno a e-mail.');
      return;
    }

    setPresetBusyId(`save-${index}`);
    setPresetMessage('');

    try {
      await saveOrganiserPreset(organiser);
      setPresetMessage(`Předvolba „${presetDisplayLabel(organiser)}“ uložena.`);
    } catch {
      setPresetMessage('Uložení předvolby se nezdařilo.');
    } finally {
      setPresetBusyId('');
    }
  };

  const requestDeleteOrganiserPreset = (preset) => {
    setPresetPendingDelete(preset);
    setPresetMessage('');
  };

  const handleDeleteOrganiserPreset = async () => {
    if (!presetPendingDelete) return;

    const preset = presetPendingDelete;
    setPresetBusyId(preset.id);
    setPresetMessage('');

    try {
      await deleteOrganiserPreset(preset.id);
      setPresetPendingDelete(null);
      setPresetMessage(`Předvolba „${presetDisplayLabel(preset)}“ odstraněna.`);
    } catch {
      setPresetMessage('Smazání předvolby se nezdařilo.');
    } finally {
      setPresetBusyId('');
    }
  };

  const updateParticipant = (index, value) => {
    setForm((prev) => ({
      ...prev,
      participants: prev.participants.map((item, itemIndex) => (
        itemIndex === index ? { ...item, name: value } : item
      )),
    }));
  };

  const addParticipant = () => {
    const participant = createEmptyParticipant();
    setFocusParticipantId(participant.clientId);
    setForm((prev) => ({
      ...prev,
      participants: [...prev.participants, participant],
    }));
  };

  const removeParticipant = (index) => {
    setForm((prev) => ({
      ...prev,
      participants: prev.participants.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const reorderParticipants = (participants) => {
    setForm((prev) => ({ ...prev, participants }));
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setVisitedTabs((prev) => new Set(prev).add(tabId));
    setAttentionTabs((prev) => {
      if (!prev.has(tabId)) return prev;
      const next = new Set(prev);
      next.delete(tabId);
      return next;
    });
  };

  const performSave = async () => {
    setSaving(true);
    setError('');

    const currentForm = formRef.current;
    const published = isEventPublishable(currentForm);
    const ok = await onSave(formStateToPayload(currentForm), {
      published,
      eventId: event?.id ?? null,
    });
    setSaving(false);

    if (ok) {
      if (fullPage) {
        setSaveSuccessOpen(true);
        setError('');
      } else {
        onClose();
      }
    } else {
      setError('Uložení akce se nezdařilo.');
    }
  };

  const handleEnsureEventId = async () => {
    if (event?.id) return event.id;
    if (!onEnsureDraft) {
      throw new Error('Akci se nepodařilo připravit ke sdílení.');
    }

    skipFormResetRef.current = true;
    return onEnsureDraft(formStateToPayload(formRef.current));
  };

  const handleAddInfoFromConfirm = () => {
    setSaveConfirmOpen(false);
    setActiveTab('basic');
    setAttentionTabs(new Set(pendingIncompleteTabs));
    panelRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

    window.setTimeout(() => {
      setAttentionTabs(new Set());
    }, 2400);
  };

  const handleConfirmSaveAnyway = async () => {
    setSaveConfirmOpen(false);
    await performSave();
  };

  const validateForm = () => {
    const calendarOnlyMode = form.calendarOnly === true;
    const publishing = isEventPublishable(form);

    if (!publishing) {
      if (form.title.trim().length > 200) {
        return { message: 'Název může mít maximálně 200 znaků.', tab: 'basic' };
      }
      if (form.place.trim().length > 200) {
        return { message: 'Místo může mít maximálně 200 znaků.', tab: 'basic' };
      }

      const hasAnyDate = form.dateStart || form.timeStart || form.dateEnd || form.timeEnd;
      if (hasAnyDate) {
        const rangeError = validateDateRange(form);
        if (rangeError) return { message: rangeError, tab: 'basic' };
      }
    } else {
      if (!form.title.trim()) {
        return { message: 'Název akce je povinný.', tab: 'basic' };
      }
      if (form.title.trim().length > 200) {
        return { message: 'Název může mít maximálně 200 znaků.', tab: 'basic' };
      }
      if (form.place.trim().length > 200) {
        return { message: 'Místo může mít maximálně 200 znaků.', tab: 'basic' };
      }

      const rangeError = validateDateRange(form);
      if (rangeError) return { message: rangeError, tab: 'basic' };
    }

    if (
      isExternalEventCategory(form.category)
      && form.externalPageEnabled
      && !isValidHttpsUrl(form.externalPageUrl)
    ) {
      return {
        message: 'Vyplňte platný odkaz na web akce (https://…), nebo vypněte přepínač externí stránky.',
        tab: 'basic',
      };
    }

    if (calendarOnlyMode && !isValidHttpsUrl(form.externalPageUrl)) {
      return {
        message: 'Pro režim pouze kalendář je povinný platný externí odkaz (https://…).',
        tab: 'basic',
      };
    }

    if (calendarOnlyMode) {
      return null;
    }

    if (form.organisers.length > MAX_ORGANISERS) {
      return {
        message: `Akce může mít maximálně ${MAX_ORGANISERS} organizátorů.`,
        tab: 'organisers',
      };
    }

    const incompleteOrganiser = form.organisers.find((item) => {
      const hasAny = Boolean(
        item.name.trim()
        || item.email.trim()
        || item.nick.trim()
        || item.phone.trim()
        || item.instagram.trim()
        || item.facebook.trim(),
      );
      const hasRequired = item.name.trim() && item.email.trim();
      return hasAny && !hasRequired;
    });

    if (incompleteOrganiser) {
      return {
        message: 'U každého organizátora vyplňte jméno i e-mail, nebo prázdný záznam odeberte.',
        tab: 'organisers',
      };
    }

    return null;
  };

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError.message);
      handleTabChange(validationError.tab);
      return;
    }

    const publishing = isEventPublishable(form);
    const eventIsPast = isEventPast(form);
    if (publishing && !eventIsPast && !form.calendarOnly) {
      const incompleteTabs = getUnvisitedEmptyTabs(visitedTabs, form);
      if (incompleteTabs.length > 0) {
        setPendingIncompleteTabs(incompleteTabs);
        setSaveConfirmOpen(true);
        return;
      }
    }

    await performSave();
  };

  const formBody = (
    <>
      <AdminModalPanel ref={panelRef} className="admin-modal__panel--wide" bare={fullPage}>
        <header className="admin-event-modal__header">
          <div>
            <p className="admin-event-modal__eyebrow">
              {shareMode ? 'Sdílený odkaz' : event ? 'Úprava akce' : 'Vytvoření akce'}
            </p>
            <h2 id="admin-event-form-title" className="admin-modal__title admin-event-modal__title">
              {shareMode ? 'Upravit akci' : event ? 'Upravit akci' : 'Nová akce'}
            </h2>
            {shareMode && (
              <p className="admin-event-modal__share-note">
                Upravujete akci přes zabezpečený odkaz. Změny se uloží přímo na web.
              </p>
            )}
          </div>
        </header>

        <form className={`admin-form admin-form--event${form.calendarOnly ? ' admin-form--event-calendar-only' : ''}`} onSubmit={handleSubmit}>
          {!form.calendarOnly && (
            <EventFormTabs
              activeTab={activeTab}
              onChange={handleTabChange}
              attentionTabs={attentionTabs}
              tabs={visibleTabs}
            />
          )}

          <div className="admin-event-tabs__panels">
            <TabPanel id="basic" activeTab={form.calendarOnly ? 'basic' : activeTab}>
              <div className="admin-event-tab">
                <TabBlock>
                  <FieldGroup label="Název akce" required>
                    <input
                      type="text"
                      className="admin-form__input"
                      value={form.title}
                      maxLength={200}
                      onChange={(e) => updateField('title', e.target.value)}
                      placeholder="Např. Letní setkání Popcorn"
                      required
                    />
                  </FieldGroup>
                  <FieldGroup label="Kategorie akce">
                    <EventCategorySelect
                      id="event-category"
                      value={form.category}
                      onChange={handleCategoryChange}
                      disabled={saving}
                    />
                  </FieldGroup>

                  {isExternalEventCategory(form.category) && (
                    <div className="admin-event-external-page">
                      <FieldGroup label="Externí web akce">
                        <label className="admin-toggle admin-event-external-page__toggle">
                          <input
                            type="checkbox"
                            checked={form.externalPageEnabled}
                            disabled={saving}
                            onChange={(event) => {
                              const enabled = event.target.checked;
                              setForm((prev) => ({
                                ...prev,
                                externalPageEnabled: enabled,
                                ...(enabled ? {} : { externalPageUrl: '', calendarOnly: false }),
                              }));
                            }}
                          />
                          <span className="admin-toggle__track" aria-hidden="true">
                            <span className="admin-toggle__thumb" />
                          </span>
                          <span className="admin-toggle__label">Akce vede na externí stránku</span>
                        </label>
                      </FieldGroup>

                      {form.externalPageEnabled && (
                        <>
                          <FieldGroup
                            label="Odkaz na web akce"
                            required
                            hint="Odkaz se zobrazí na stránce akce jako tlačítko."
                          >
                            <input
                              type="url"
                              className="admin-form__input"
                              value={form.externalPageUrl}
                              onChange={(e) => updateField('externalPageUrl', e.target.value)}
                              placeholder="https://example.com/akce"
                              inputMode="url"
                              required
                            />
                          </FieldGroup>

                          <FieldGroup label="Viditelnost">
                            <label className="admin-toggle admin-event-external-page__toggle">
                              <input
                                type="checkbox"
                                checked={form.calendarOnly}
                                disabled={saving}
                                onChange={(event) => {
                                  setForm((prev) => ({
                                    ...prev,
                                    calendarOnly: event.target.checked,
                                  }));
                                }}
                              />
                              <span className="admin-toggle__track" aria-hidden="true">
                                <span className="admin-toggle__thumb" />
                              </span>
                              <span className="admin-toggle__label">Zobrazovat pouze v kalendáři</span>
                            </label>
                            <p className="admin-form__hint">
                              Akce se zobrazí pouze v kalendáři. Po kliknutí na ni přesměruje uživatele na externí odkaz.
                            </p>
                          </FieldGroup>
                        </>
                      )}
                    </div>
                  )}
                </TabBlock>

                <TabBlock title="Termín">
                  <div className="admin-form__row admin-form__row--dates">
                    <FieldGroup label="Datum začátku" required>
                      <input
                        type="date"
                        className="admin-form__input"
                        value={form.dateStart}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        required
                      />
                    </FieldGroup>
                    <FieldGroup label="Čas začátku" required>
                      <input
                        type="time"
                        className="admin-form__input"
                        value={form.timeStart}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        required
                      />
                    </FieldGroup>
                    <FieldGroup label="Datum konce" required>
                      <input
                        type="date"
                        className="admin-form__input"
                        value={form.dateEnd}
                        onChange={(e) => updateField('dateEnd', e.target.value)}
                        required
                      />
                    </FieldGroup>
                    <FieldGroup label="Čas konce" required>
                      <input
                        type="time"
                        className="admin-form__input"
                        value={form.timeEnd}
                        onChange={(e) => updateField('timeEnd', e.target.value)}
                        required
                      />
                    </FieldGroup>
                  </div>
                </TabBlock>

                {!form.calendarOnly && (
                  <>
                <TabBlock title="Místo a cena">
                  <div className="admin-form__row">
                    <FieldGroup label="Místo">
                      <input
                        type="text"
                        className="admin-form__input"
                        value={form.place}
                        maxLength={200}
                        onChange={(e) => updateField('place', e.target.value)}
                        placeholder="Adresa nebo název místa"
                      />
                    </FieldGroup>
                    <FieldGroup label="Cena (Kč)">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="admin-form__input"
                        value={form.price}
                        onChange={(e) => updateField('price', e.target.value)}
                        placeholder="0"
                      />
                    </FieldGroup>
                  </div>
                </TabBlock>

                <TabBlock title="Popis" hint="Text pro nadcházející akce — formátování, odkazy a seznamy včetně vnořených úrovní.">
                  <RichTextEditor
                    id="event-description"
                    value={form.description}
                    onChange={(value) => updateField('description', value)}
                    tone="content"
                    features="eventDescription"
                  />
                </TabBlock>

                <TabBlock title="Titulní fotka" hint="Zobrazí se na kartě akce. Bez fotky se použije automatická textura.">
                  <EventCoverUpload
                    coverImage={form.coverImage}
                    coverPublicId={form.coverPublicId}
                    previewSeed={event?.id || form.title || 'event-draft'}
                    onChange={({ coverImage, coverPublicId }) => {
                      setForm((prev) => ({
                        ...prev,
                        coverImage,
                        coverPublicId,
                      }));
                    }}
                    disabled={saving}
                  />
                </TabBlock>

                <TabBlock title="Propagační materiály" hint="Obrázky pro nadcházející akci — zobrazí se v galerii na stránce akce vedle titulní fotky.">
                  <EventImageUploadList
                    images={form.promoImages}
                    maxCount={EVENT_PROMO_MAX}
                    uploadLabel="Nahrát propagační materiály"
                    hint={EVENT_PROMO_UPLOAD_HINT}
                    presetType="promo"
                    disabled={saving}
                    onChange={(promoImages) => {
                      setForm((prev) => ({ ...prev, promoImages }));
                    }}
                  />
                </TabBlock>
                  </>
                )}
              </div>
            </TabPanel>

            {!form.calendarOnly && (
            <>
            <TabPanel id="organisers" activeTab={activeTab}>
              <div className="admin-event-tab">
                <p className="admin-event-tab__intro">
                  Volitelně přidejte organizátory (0–{MAX_ORGANISERS}). U vyplněného záznamu jsou jméno a e-mail povinné.
                </p>

                {!shareMode && organiserPresets.length > 0 && (
                  <div className="admin-form__presets">
                    {presetPendingDelete ? (
                      <div className="admin-form__preset-delete-confirm">
                        <span>
                          Smazat předvolbu <strong>{presetDisplayLabel(presetPendingDelete)}</strong>?
                        </span>
                        <div className="admin-form__preset-delete-actions">
                          <button
                            type="button"
                            className="btn btn--outline btn--small"
                            onClick={() => setPresetPendingDelete(null)}
                            disabled={presetBusyId === presetPendingDelete.id}
                          >
                            Zrušit
                          </button>
                          <button
                            type="button"
                            className="btn btn--secondary btn--small"
                            onClick={handleDeleteOrganiserPreset}
                            disabled={presetBusyId === presetPendingDelete.id}
                          >
                            {presetBusyId === presetPendingDelete.id ? 'Mažu…' : 'Smazat'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="admin-form__presets-label">Předvolby</span>
                        <div className="admin-form__preset-chips">
                          {organiserPresets.map((preset) => (
                            <div key={preset.id} className="admin-form__preset-chip">
                              <button
                                type="button"
                                className="admin-form__preset-add"
                                onClick={() => addOrganiserFromPreset(preset)}
                                disabled={form.organisers.length >= MAX_ORGANISERS}
                                title={`Přidat ${presetDisplayLabel(preset)}`}
                              >
                                {presetDisplayLabel(preset)}
                              </button>
                              <button
                                type="button"
                                className="admin-form__preset-remove"
                                aria-label={`Smazat předvolbu ${presetDisplayLabel(preset)}`}
                                onClick={() => requestDeleteOrganiserPreset(preset)}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {!shareMode && presetMessage && (
                  <p className="admin-form__preset-message" role="status">{presetMessage}</p>
                )}

                <div className="admin-form__repeatable">
                  <div className="admin-form__repeatable-head">
                    <span className="admin-form__repeatable-count">
                      {form.organisers.length} organizátor{form.organisers.length === 1 ? '' : 'ů'}
                    </span>
                    <button
                      type="button"
                      className="btn btn--outline btn--small"
                      onClick={addOrganiser}
                      disabled={form.organisers.length >= MAX_ORGANISERS}
                    >
                      + Přidat organizátora
                    </button>
                  </div>

                  {!form.organisers.length && (
                    <p className="admin-form__participants-empty">
                      Zatím žádní organizátoři. Můžete je přidat, nebo akci uložit bez nich.
                    </p>
                  )}

                  {form.organisers.map((organiser, index) => (
                    <div key={`organiser-${index}`} className="admin-form__repeatable-item admin-form__repeatable-item--people">
                      <div className="admin-form__card-badge">#{index + 1}</div>
                      <div className="admin-form__row">
                        <FieldGroup label="Jméno" required>
                          <input
                            type="text"
                            className="admin-form__input"
                            value={organiser.name}
                            onChange={(e) => updateOrganiser(index, 'name', e.target.value)}
                          />
                        </FieldGroup>
                        <FieldGroup label="Přezdívka">
                          <input
                            type="text"
                            className="admin-form__input"
                            value={organiser.nick}
                            onChange={(e) => updateOrganiser(index, 'nick', e.target.value)}
                          />
                        </FieldGroup>
                      </div>
                      <div className="admin-form__row">
                        <FieldGroup label="E-mail" required>
                          <input
                            type="email"
                            className="admin-form__input"
                            value={organiser.email}
                            onChange={(e) => updateOrganiser(index, 'email', e.target.value)}
                          />
                        </FieldGroup>
                        <FieldGroup label="Telefon">
                          <input
                            type="text"
                            className="admin-form__input"
                            value={organiser.phone}
                            onChange={(e) => updateOrganiser(index, 'phone', e.target.value)}
                          />
                        </FieldGroup>
                      </div>
                      <div className="admin-form__row">
                        <FieldGroup label="Instagram">
                          <input
                            type="text"
                            className="admin-form__input"
                            value={organiser.instagram}
                            onChange={(e) => updateOrganiser(index, 'instagram', e.target.value)}
                            placeholder="@uzivatel"
                          />
                        </FieldGroup>
                        <FieldGroup label="Facebook">
                          <input
                            type="text"
                            className="admin-form__input"
                            value={organiser.facebook}
                            onChange={(e) => updateOrganiser(index, 'facebook', e.target.value)}
                            placeholder="facebook.com/..."
                          />
                        </FieldGroup>
                      </div>
                      <div className="admin-form__organiser-actions">
                        {!shareMode && isCompleteOrganiser(organiser) && (
                          <button
                            type="button"
                            className="admin-form__save-preset"
                            onClick={() => handleSaveOrganiserPreset(index)}
                            disabled={presetBusyId === `save-${index}`}
                          >
                            {presetBusyId === `save-${index}` ? 'Ukládám…' : 'Uložit jako předvolbu'}
                          </button>
                        )}
                        {form.organisers.length > 0 && (
                          <button
                            type="button"
                            className="admin-form__remove"
                            onClick={() => removeOrganiser(index)}
                          >
                            Odebrat organizátora
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabPanel>

            <TabPanel id="registration" activeTab={activeTab}>
              <div className="admin-event-tab">
                <TabBlock title="Přihláška" hint="Externí odkaz pro tlačítko Přihlásit se.">
                  <FieldGroup label="Odkaz na přihlášku">
                    <input
                      type="url"
                      className="admin-form__input"
                      value={form.registrationLink}
                      onChange={(e) => updateField('registrationLink', e.target.value)}
                      placeholder="https://forms.google.com/..."
                    />
                  </FieldGroup>
                </TabBlock>

                <TabBlock title="Účastníci" hint="Volitelný seznam jmen pro zobrazení na stránce akce. Pořadí přetáhněte za úchyt.">
                  <div className="admin-form__repeatable admin-form__repeatable--participants">
                    <div className="admin-form__repeatable-head">
                      <span className="admin-form__repeatable-count admin-form__repeatable-count--participants">
                        <Icon svg={PARTICIPANTS_ICON} />
                        {form.participants.length
                          ? `${form.participants.length} ${form.participants.length === 1 ? 'účastník' : form.participants.length < 5 ? 'účastníci' : 'účastníků'}`
                          : 'Žádní účastníci'}
                      </span>
                      <button type="button" className="btn btn--outline btn--small" onClick={addParticipant}>
                        + Přidat účastníka
                      </button>
                    </div>

                    {!form.participants.length && (
                      <p className="admin-form__participants-empty">
                        Zatím žádní účastníci. Přidejte jména, která se zobrazí na stránce akce.
                      </p>
                    )}

                    {form.participants.length > 0 && (
                      <SortableParticipantList
                        participants={form.participants}
                        onReorder={reorderParticipants}
                        onUpdate={updateParticipant}
                        onRemove={removeParticipant}
                        onAdd={addParticipant}
                        focusParticipantId={focusParticipantId}
                        onFocusHandled={() => setFocusParticipantId(null)}
                      />
                    )}
                  </div>
                </TabBlock>
              </div>
            </TabPanel>

            <TabPanel id="past" activeTab={activeTab}>
              <div className="admin-event-tab">
                <TabBlock title="Zápis z akce" hint="Obsah pro proběhlé akce — formátování, seznamy, odkazy a YouTube videa.">
                  <RichTextEditor
                    id="event-report"
                    value={form.report}
                    onChange={(value) => updateField('report', value)}
                    tone="past"
                    features="eventReport"
                  />
                </TabBlock>

                <TabBlock title="Galerie" hint="Odkaz na složku s fotografiemi z akce a výběr nejlepších fotek pro stránku proběhlé akce.">
                  <FieldGroup label="Odkaz na galerii">
                    <input
                      type="url"
                      className="admin-form__input"
                      value={form.galleryLink}
                      onChange={(e) => updateField('galleryLink', e.target.value)}
                      placeholder="https://drive.google.com/..."
                    />
                  </FieldGroup>

                  <FieldGroup label="Výběr z galerie">
                    <EventImageUploadList
                      images={form.galleryPicks}
                      maxCount={EVENT_GALLERY_PICKS_MAX}
                      uploadLabel="Nahrát fotky z galerie"
                      hint={EVENT_GALLERY_PICKS_UPLOAD_HINT}
                      presetType="gallery"
                      disabled={saving}
                      onChange={(galleryPicks) => {
                        setForm((prev) => ({ ...prev, galleryPicks }));
                      }}
                    />
                  </FieldGroup>
                </TabBlock>
              </div>
            </TabPanel>

            {!shareMode && (
              <TabPanel id="sharing" activeTab={activeTab}>
                <AdminEventSharingTab
                  eventId={event?.id}
                  isDraft={event?.isDraft}
                  onEnsureEventId={handleEnsureEventId}
                />
              </TabPanel>
            )}
            </>
            )}
          </div>

          {error && <p className="admin-error admin-form__error">{error}</p>}

          <div className="admin-modal__actions admin-event-modal__actions">
            {!fullPage && (
              <button type="button" className="btn btn--outline" onClick={onClose} disabled={saving}>
                Zrušit
              </button>
            )}
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Ukládám…' : 'Uložit akci'}
            </button>
          </div>
        </form>
      </AdminModalPanel>
    </>
  );

  const saveConfirmDialog = saveConfirmOpen ? (
    <div
      className="admin-modal admin-modal--confirm admin-modal--visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-event-save-confirm-title"
    >
      <div className="admin-modal__backdrop" aria-hidden="true" />
      <AdminModalPanel className="admin-modal__panel--compact">
        <h2 id="admin-event-save-confirm-title" className="admin-modal__title">
          Uložit neúplnou akci?
        </h2>
        <p className="admin-modal__text">
          {buildIncompleteTabsMessage(pendingIncompleteTabs)}
        </p>
        <div className="admin-modal__actions">
          <button
            type="button"
            className="btn btn--outline"
            onClick={handleConfirmSaveAnyway}
            disabled={saving}
          >
            {saving ? 'Ukládám…' : 'Ano, uložit'}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleAddInfoFromConfirm}
            disabled={saving}
          >
            Ne, doplnit údaje
          </button>
        </div>
      </AdminModalPanel>
    </div>
  ) : null;

  const saveSuccessDialog = saveSuccessOpen ? (
    <div
      className="admin-modal admin-modal--confirm admin-modal--visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-event-save-success-title"
    >
      <div
        className="admin-modal__backdrop"
        onClick={() => setSaveSuccessOpen(false)}
        aria-hidden="true"
      />
      <AdminModalPanel className="admin-save-success-dialog">
        <div className="admin-save-success-dialog__icon" aria-hidden="true">
          ✓
        </div>
        <h2 id="admin-event-save-success-title" className="admin-modal__title">
          Změny uloženy
        </h2>
        <p className="admin-modal__text">
          Vaše úpravy akce byly úspěšně uloženy.
        </p>
        <div className="admin-save-success-dialog__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              if (event?.id) navigate(eventUrl(event.id));
            }}
          >
            Zobrazit akci na webu
          </button>
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => setSaveSuccessOpen(false)}
          >
            Pokračovat v úpravách
          </button>
        </div>
      </AdminModalPanel>
    </div>
  ) : null;

  if (fullPage) {
    return (
      <>
        <div className="event-share-form">{formBody}</div>
        {saveConfirmDialog && createPortal(saveConfirmDialog, document.body)}
        {saveSuccessDialog && createPortal(saveSuccessDialog, document.body)}
      </>
    );
  }

  return createPortal(
    <div
      className={`admin-modal admin-modal--wide${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-event-form-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      {formBody}
      {saveConfirmDialog}
    </div>,
    document.body,
  );
}
