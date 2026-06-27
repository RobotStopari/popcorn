import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import {
  createEmptyOrganiser,
  createEmptyParticipant,
  eventToFormState,
  formStateToPayload,
} from '../utils/event-format';
import { suggestEndDate, validateDateRange } from '../utils/event-dates';
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
import SortableParticipantList from './SortableParticipantList';

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

function EventFormTabs({ activeTab, onChange, attentionTabs = new Set() }) {
  return (
    <div className="admin-event-tabs" role="tablist" aria-label="Sekce formuláře akce">
      {TABS.map((tab) => (
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

export default function AdminEventFormModal({ open, event, onClose, onSave }) {
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
  const panelRef = useRef(null);
  const { mounted, visible } = useAnimatedPresence(open, 240);

  useEffect(() => {
    if (!open) return;
    setForm(eventToFormState(event));
    setActiveTab('basic');
    setError('');
    setPresetMessage('');
    setPresetPendingDelete(null);
    setVisitedTabs(new Set(['basic']));
    setSaveConfirmOpen(false);
    setPendingIncompleteTabs([]);
    setAttentionTabs(new Set());
  }, [open, event]);

  useEffect(() => {
    if (!open) return undefined;

    const unsubscribe = subscribeOrganiserPresets(
      setOrganiserPresets,
      () => setPresetMessage('Nepodařilo se načíst předvolby organizátorů.'),
    );

    return unsubscribe;
  }, [open]);

  useEffect(() => {
    if (!mounted) return undefined;

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
  }, [mounted, onClose, saveConfirmOpen]);

  if (!mounted) return null;

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      ...(event ? {} : { timeEnd: value }),
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

    const ok = await onSave(formStateToPayload(form));
    setSaving(false);

    if (ok) onClose();
    else setError('Uložení akce se nezdařilo.');
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

    const incompleteTabs = getUnvisitedEmptyTabs(visitedTabs, form);
    if (incompleteTabs.length > 0) {
      setPendingIncompleteTabs(incompleteTabs);
      setSaveConfirmOpen(true);
      return;
    }

    await performSave();
  };

  return createPortal(
    <div
      className={`admin-modal admin-modal--wide${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-event-form-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} className="admin-modal__panel admin-modal__panel--wide">
        <header className="admin-event-modal__header">
          <div>
            <p className="admin-event-modal__eyebrow">{event ? 'Úprava akce' : 'Vytvoření akce'}</p>
            <h2 id="admin-event-form-title" className="admin-modal__title admin-event-modal__title">
              {event ? 'Upravit akci' : 'Nová akce'}
            </h2>
          </div>
        </header>

        <form className="admin-form admin-form--event" onSubmit={handleSubmit}>
          <EventFormTabs
            activeTab={activeTab}
            onChange={handleTabChange}
            attentionTabs={attentionTabs}
          />

          <div className="admin-event-tabs__panels">
            <TabPanel id="basic" activeTab={activeTab}>
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

                <TabBlock title="Popis" hint="Text pro nadcházející akce — podporuje formátování a odkazy.">
                  <RichTextEditor
                    id="event-description"
                    value={form.description}
                    onChange={(value) => updateField('description', value)}
                    tone="content"
                  />
                </TabBlock>
              </div>
            </TabPanel>

            <TabPanel id="organisers" activeTab={activeTab}>
              <div className="admin-event-tab">
                <p className="admin-event-tab__intro">
                  Volitelně přidejte organizátory (0–{MAX_ORGANISERS}). U vyplněného záznamu jsou jméno a e-mail povinné.
                </p>

                {organiserPresets.length > 0 && (
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

                {presetMessage && (
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
                        {isCompleteOrganiser(organiser) && (
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
                <TabBlock title="Zápis z akce" hint="Obsah pro proběhlé akce — text se zobrazí po skončení akce.">
                  <RichTextEditor
                    id="event-report"
                    value={form.report}
                    onChange={(value) => updateField('report', value)}
                    tone="past"
                  />
                </TabBlock>

                <TabBlock title="Galerie" hint="Odkaz na složku s fotografiemi z akce.">
                  <FieldGroup label="Odkaz na galerii">
                    <input
                      type="url"
                      className="admin-form__input"
                      value={form.galleryLink}
                      onChange={(e) => updateField('galleryLink', e.target.value)}
                      placeholder="https://drive.google.com/..."
                    />
                  </FieldGroup>
                </TabBlock>
              </div>
            </TabPanel>
          </div>

          {error && <p className="admin-error admin-form__error">{error}</p>}

          <div className="admin-modal__actions admin-event-modal__actions">
            <button type="button" className="btn btn--outline" onClick={onClose} disabled={saving}>
              Zrušit
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Ukládám…' : 'Uložit akci'}
            </button>
          </div>
        </form>
      </div>

      {saveConfirmOpen && (
        <div
          className="admin-modal admin-modal--confirm admin-modal--visible"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-event-save-confirm-title"
        >
          <div className="admin-modal__backdrop" aria-hidden="true" />
          <div className="admin-modal__panel admin-modal__panel--compact">
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
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
