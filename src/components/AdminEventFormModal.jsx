import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { eventUrl } from '../data/events';
import { useEvents } from '../contexts/EventsContext';
import {
  ensureUniqueEventSlug,
  suggestEventSlugFromTitle,
  validateEventSlug,
} from '../utils/event-slug';
import {
  createEmptyOrganiser,
  createEmptyParticipant,
  eventToFormState,
  formStateToPayload,
  isEventPublishable,
  isValidHttpsUrl,
} from '../utils/event-format';
import { eventHasMissingTimes, isEventPast, suggestEndDate, suggestEndTime, validateDateRange } from '../utils/event-dates';
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
import AdminOrganiserEmailField from './AdminOrganiserEmailField';
import AdminPlaceMapPicker from './AdminPlaceMapPicker';
import UrlInput from './UrlInput';
import EventCategorySelect from './EventCategorySelect';
import EventStampSelect from './EventStampSelect';
import SortableParticipantList from './SortableParticipantList';
import AdminEventSharingTab from './AdminEventSharingTab';
import AdminModalPanel from './AdminModalPanel';
import AdminTabs, { AdminTabPanel, getAdminTabDirection } from './AdminTabs';
import EventCoverUpload, { createCoverPatternSeed } from './EventCoverUpload';
import { resolveCoverPatternSeed } from '../utils/event-cover-pattern';
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
  {
    id: 'basic',
    label: 'Základní',
    hint: 'Název a termín',
    icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h10M4 17h7"/></svg>',
  },
  {
    id: 'organisers',
    label: 'Organizátoři',
    hint: 'Kdo akci vede',
    icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  },
  {
    id: 'registration',
    label: 'Přihlašování',
    hint: 'Odkaz a jména',
    icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  },
  {
    id: 'past',
    label: 'Po akci',
    hint: 'Zápis a fotky',
    icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></svg>',
  },
  {
    id: 'sharing',
    label: 'Sdílení',
    hint: 'Odkaz k úpravě',
    icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5"/></svg>',
  },
];

function organiserHasContent(item) {
  return Boolean(
    item.name.trim()
    || item.email.trim()
    || item.nick.trim()
    || item.zapalovacYear?.trim()
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
  const [slugTouched, setSlugTouched] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [tabDirection, setTabDirection] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [organiserPresets, setOrganiserPresets] = useState([]);
  const [presetMessage, setPresetMessage] = useState('');
  const [presetBusyId, setPresetBusyId] = useState('');
  const [presetPendingDelete, setPresetPendingDelete] = useState(null);
  const [focusParticipantId, setFocusParticipantId] = useState(null);
  const [visitedTabs, setVisitedTabs] = useState(() => new Set(['basic']));
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [timeWarningOpen, setTimeWarningOpen] = useState(false);
  const [calendarOnlyConfirmOpen, setCalendarOnlyConfirmOpen] = useState(false);
  const [pendingIncompleteTabs, setPendingIncompleteTabs] = useState([]);
  const [attentionTabs, setAttentionTabs] = useState(() => new Set());
  const [saveSuccessOpen, setSaveSuccessOpen] = useState(false);
  const panelRef = useRef(null);
  const skipFormResetRef = useRef(false);
  const formRef = useRef(form);
  const navigate = useNavigate();
  const { events } = useEvents();
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

    setForm(() => {
      const next = eventToFormState(event);
      // New drafts only — existing events must keep the public seed (id / stored).
      if (!event?.id && !next.coverPatternSeed) {
        next.coverPatternSeed = createCoverPatternSeed('event-cover');
      }
      return next;
    });
    setSlugTouched(Boolean(event?.slug && event.slug !== event?.id));
    setActiveTab('basic');
    setTabDirection(0);
    setError('');
    setPresetMessage('');
    setPresetPendingDelete(null);
    setVisitedTabs(new Set(['basic']));
    setSaveConfirmOpen(false);
    setTimeWarningOpen(false);
    setCalendarOnlyConfirmOpen(false);
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
      if (calendarOnlyConfirmOpen) {
        setCalendarOnlyConfirmOpen(false);
        return;
      }
      if (timeWarningOpen) {
        setTimeWarningOpen(false);
        return;
      }
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
  }, [mounted, onClose, open, fullPage, saveConfirmOpen, timeWarningOpen, calendarOnlyConfirmOpen]);

  useEffect(() => {
    if (!fullPage || !open) return undefined;

    const onKeydown = (keyEvent) => {
      if (keyEvent.key !== 'Escape') return;
      if (calendarOnlyConfirmOpen) {
        setCalendarOnlyConfirmOpen(false);
        return;
      }
      if (timeWarningOpen) {
        setTimeWarningOpen(false);
        return;
      }
      if (!saveConfirmOpen) return;
      setSaveConfirmOpen(false);
    };

    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [fullPage, open, saveConfirmOpen, timeWarningOpen, calendarOnlyConfirmOpen]);

  useEffect(() => {
    if (!fullPage || (!saveConfirmOpen && !saveSuccessOpen && !timeWarningOpen && !calendarOnlyConfirmOpen)) {
      return undefined;
    }

    document.body.classList.add('admin-modal-open');
    return () => document.body.classList.remove('admin-modal-open');
  }, [fullPage, saveConfirmOpen, saveSuccessOpen, timeWarningOpen, calendarOnlyConfirmOpen]);

  if (!fullPage && !mounted) return null;
  if (!open) return null;

  const updateField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && !slugTouched) {
        next.slug = suggestEventSlugFromTitle(value);
      }
      return next;
    });
  };

  const handleCategoryChange = (category) => {
    updateField('category', category);
  };

  const requestCalendarOnly = (enabled) => {
    if (!enabled) {
      updateField('calendarOnly', false);
      return;
    }
    if (!isValidHttpsUrl(formRef.current.externalPageUrl)) return;
    setCalendarOnlyConfirmOpen(true);
  };

  const handleConfirmCalendarOnly = () => {
    setCalendarOnlyConfirmOpen(false);
    updateField('calendarOnly', true);
  };

  const handleDismissCalendarOnlyConfirm = () => {
    setCalendarOnlyConfirmOpen(false);
  };

  const handleStartDateChange = (value) => {
    setForm((prev) => ({
      ...prev,
      dateStart: value,
      dateEnd: suggestEndDate(value),
    }));
  };

  const handleStartDateBlur = () => {
    setForm((prev) => {
      if (!prev.dateStart) return prev;
      const suggested = suggestEndDate(prev.dateStart);
      // Repair Friday→Sunday when end was left on the same day (missed/stale suggestion).
      if (prev.dateEnd && prev.dateEnd !== prev.dateStart) return prev;
      if (suggested === prev.dateEnd) return prev;
      return { ...prev, dateEnd: suggested };
    });
  };

  const handleStartTimeChange = (value) => {
    updateField('timeStart', value);
  };

  const handleStartTimeBlur = () => {
    setForm((prev) => {
      if (prev.timeEnd?.trim()) return prev;
      const suggested = suggestEndTime(prev.timeStart, prev.dateStart, prev.dateEnd);
      if (!suggested) return prev;
      return { ...prev, timeEnd: suggested };
    });
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
      setPresetMessage('Pro uložení předvolby vyplňte jméno.');
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
    setTabDirection(getAdminTabDirection(visibleTabs, activeTab, tabId));
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
    const slug = ensureUniqueEventSlug(
      currentForm.title,
      currentForm.slug,
      events,
      event?.id ?? '',
    );
    const payload = formStateToPayload({ ...currentForm, slug });
    const published = isEventPublishable(currentForm);
    const ok = await onSave(payload, {
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

  const continueSaveAfterChecks = async () => {
    const current = formRef.current;
    const publishing = isEventPublishable(current);
    const eventIsPast = isEventPast(current);
    // Incomplete-tab reminder only when times are set — missing times already have their own warning.
    if (
      publishing
      && !eventIsPast
      && !current.calendarOnly
      && !eventHasMissingTimes(current)
    ) {
      const incompleteTabs = getUnvisitedEmptyTabs(visitedTabs, current);
      if (incompleteTabs.length > 0) {
        setPendingIncompleteTabs(incompleteTabs);
        setSaveConfirmOpen(true);
        return;
      }
    }

    await performSave();
  };

  const handleConfirmTimeWarning = async () => {
    setTimeWarningOpen(false);
    await performSave();
  };

  const handleDismissTimeWarning = () => {
    setTimeWarningOpen(false);
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
      const slugError = validateEventSlug(form.slug);
      if (slugError) return { message: slugError, tab: 'basic' };
      if (form.title.trim().length > 200) {
        return { message: 'Název může mít maximálně 200 znaků.', tab: 'basic' };
      }
      if (form.place.trim().length > 200) {
        return { message: 'Místo může mít maximálně 200 znaků.', tab: 'basic' };
      }

      const rangeError = validateDateRange(form);
      if (rangeError) return { message: rangeError, tab: 'basic' };
    }

    if (form.externalPageEnabled && !isValidHttpsUrl(form.externalPageUrl)) {
      return {
        message: 'Vyplňte platný odkaz na webovou stránku (https://…), nebo vypněte přepínač vlastní stránky.',
        tab: 'basic',
      };
    }

    if (calendarOnlyMode && !isValidHttpsUrl(form.externalPageUrl)) {
      return {
        message: 'Pro režim pouze kalendář je povinný platný odkaz na webovou stránku (https://…).',
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
        || item.zapalovacYear?.trim()
        || item.phone.trim()
        || item.instagram.trim()
        || item.facebook.trim(),
      );
      const hasRequired = item.name.trim();
      return hasAny && !hasRequired;
    });

    if (incompleteOrganiser) {
      return {
        message: 'U každého organizátora vyplňte jméno, nebo prázdný záznam odeberte.',
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

    if (isEventPublishable(form) && eventHasMissingTimes(form)) {
      setTimeWarningOpen(true);
      return;
    }

    await continueSaveAfterChecks();
  };

  const calendarOnlyUi = form.calendarOnly === true;
  const filledOrganisers = form.organisers.filter(organiserHasContent).length;
  const filledParticipants = form.participants.filter((participant) => participant.name.trim()).length;
  const tabBadges = {
    organisers: filledOrganisers || undefined,
    registration: filledParticipants || undefined,
  };

  const formBody = (
    <>
      <AdminModalPanel ref={panelRef} className="admin-modal__panel--wide admin-modal__panel--event-form" bare={fullPage}>
        <header className="admin-event-modal__header">
          <div className="admin-event-modal__header-copy">
            <p className="admin-event-modal__eyebrow">
              {shareMode ? 'Sdílený odkaz' : event ? 'Úprava akce' : 'Vytvoření akce'}
            </p>
            <h2 id="admin-event-form-title" className="admin-modal__title admin-event-modal__title">
              {shareMode ? 'Upravit akci' : event ? 'Upravit akci' : 'Nová akce'}
            </h2>
            <p className="admin-event-modal__lede">
              {shareMode
                ? 'Upravujete akci přes zabezpečený odkaz. Změny se uloží přímo na web.'
                : 'Projděte záložky a doplňte, co návštěvníci uvidí na webu.'}
            </p>
          </div>
        </header>

        <form className={`admin-form admin-form--event${calendarOnlyUi ? ' admin-form--event-calendar-only' : ''}`} onSubmit={handleSubmit}>
          {!calendarOnlyUi && (
            <AdminTabs
              idPrefix="event"
              label="Sekce formuláře akce"
              tabs={visibleTabs}
              activeTab={activeTab}
              onChange={handleTabChange}
              attentionTabs={attentionTabs}
              badges={tabBadges}
            />
          )}

          <div className="admin-event-tabs__panels">
            <AdminTabPanel id="basic" idPrefix="event" activeTab={calendarOnlyUi ? 'basic' : activeTab} direction={tabDirection}>
              <div className="admin-event-tab">
                <TabBlock title="O akci" hint="Název, adresa, razítko a kategorie." accent="identity">
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
                  <FieldGroup
                    label="URL akce"
                    hint="Adresa pod /akce/… — jen malá písmena, čísla a pomlčky."
                    required
                  >
                    <input
                      type="text"
                      className="admin-form__input"
                      value={form.slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        updateField('slug', e.target.value);
                      }}
                      placeholder="letni-setkani-popcorn"
                      required
                    />
                  </FieldGroup>
                  <FieldGroup
                    label="Razítko"
                    hint="Volitelné. Ikona se zobrazí na kartě akce a na stránce akce."
                  >
                    <EventStampSelect
                      id="event-stamp"
                      value={form.stampId || ''}
                      onChange={(stampId) => updateField('stampId', stampId)}
                      disabled={saving}
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

                  <div className="admin-event-external-page">
                    <FieldGroup label="Vlastní webová stránka">
                      <label className="admin-toggle admin-event-external-page__toggle">
                        <input
                          type="checkbox"
                          checked={form.externalPageEnabled}
                          disabled={saving || form.calendarOnly}
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
                        <span className="admin-toggle__label">Akce má vlastní webovou stránku</span>
                      </label>
                    </FieldGroup>

                    {form.externalPageEnabled && (
                      <>
                        <FieldGroup
                          label="Odkaz na webovou stránku"
                          required
                          hint={
                            form.calendarOnly
                              ? 'Odkaz nelze měnit, dokud je zapnuté zobrazení pouze v kalendáři.'
                              : 'Odkaz se zobrazí na stránce akce jako tlačítko.'
                          }
                        >
                          <UrlInput
                            value={form.externalPageUrl}
                            onChange={(next) => updateField('externalPageUrl', next)}
                            placeholder="example.com/akce"
                            required
                            readOnly={form.calendarOnly}
                            disabled={saving || form.calendarOnly}
                          />
                        </FieldGroup>

                        <FieldGroup label="Viditelnost">
                          <label
                            className={`admin-toggle admin-event-external-page__toggle${
                              !form.calendarOnly && !isValidHttpsUrl(form.externalPageUrl)
                                ? ' admin-toggle--disabled'
                                : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={form.calendarOnly}
                              disabled={
                                saving
                                || (!form.calendarOnly && !isValidHttpsUrl(form.externalPageUrl))
                              }
                              onChange={(event) => requestCalendarOnly(event.target.checked)}
                            />
                            <span className="admin-toggle__track" aria-hidden="true">
                              <span className="admin-toggle__thumb" />
                            </span>
                            <span className="admin-toggle__label">Zobrazovat pouze v kalendáři</span>
                          </label>
                          <p className="admin-form__hint">
                            {!form.calendarOnly && !isValidHttpsUrl(form.externalPageUrl)
                              ? 'Nejdřív vyplňte platný odkaz (https://…). Pak můžete akci zobrazit jen v kalendáři.'
                              : 'Akce se nezobrazí v seznamu akcí — jen v kalendáři. Po kliknutí otevře vlastní webovou stránku.'}
                          </p>
                        </FieldGroup>
                      </>
                    )}
                  </div>
                </TabBlock>

                <TabBlock title="Termín" hint="Kdy akce začíná a končí." accent="dates">
                  <div className="admin-form__row admin-form__row--dates">
                    <FieldGroup label="Datum začátku" required>
                      <input
                        type="date"
                        className="admin-form__input"
                        value={form.dateStart}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        onBlur={handleStartDateBlur}
                        required
                      />
                    </FieldGroup>
                    <FieldGroup label="Čas začátku">
                      <input
                        type="time"
                        className="admin-form__input"
                        value={form.timeStart}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        onBlur={handleStartTimeBlur}
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
                    <FieldGroup label="Čas konce">
                      <input
                        type="time"
                        className="admin-form__input"
                        value={form.timeEnd}
                        onChange={(e) => updateField('timeEnd', e.target.value)}
                      />
                    </FieldGroup>
                  </div>
                </TabBlock>

                {!calendarOnlyUi && (
                  <>
                <TabBlock title="Místo a cena" hint="Kde se potkáte a kolik to stojí." accent="place">
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
                  <FieldGroup label="Bod na mapě (volitelné)">
                    <AdminPlaceMapPicker
                      lat={form.placeLat}
                      lng={form.placeLng}
                      disabled={saving}
                      onChange={(coords) => {
                        setForm((prev) => ({
                          ...prev,
                          placeLat: coords?.lat ?? '',
                          placeLng: coords?.lng ?? '',
                        }));
                      }}
                    />
                  </FieldGroup>
                </TabBlock>

                <TabBlock title="Popis" hint="Text pro nadcházející akce — formátování, odkazy a seznamy včetně vnořených úrovní." accent="copy">
                  <RichTextEditor
                    id="event-description"
                    value={form.description}
                    onChange={(value) => updateField('description', value)}
                    tone="content"
                    features="eventDescription"
                  />
                </TabBlock>

                <TabBlock title="Titulní fotka" hint="Zobrazí se na kartě akce. Bez fotky se použije automatická textura." accent="media">
                  <EventCoverUpload
                    coverImage={form.coverImage}
                    coverPublicId={form.coverPublicId}
                    previewSeed={resolveCoverPatternSeed(
                      form.coverPatternSeed,
                      event?.id,
                      form.title,
                      'event-draft',
                    )}
                    past={isEventPast(form)}
                    onPreviewSeedChange={(coverPatternSeed) => {
                      setForm((prev) => ({ ...prev, coverPatternSeed }));
                    }}
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

                <TabBlock title="Propagační materiály" hint="Obrázky pro nadcházející akci — zobrazí se v galerii na stránce akce vedle titulní fotky." accent="media">
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
            </AdminTabPanel>

            {!calendarOnlyUi && (
            <>
            <AdminTabPanel id="organisers" idPrefix="event" activeTab={activeTab} direction={tabDirection}>
              <div className="admin-event-tab">
                <TabBlock
                  title="Organizátoři"
                  hint={`Volitelně přidejte organizátory (0–${MAX_ORGANISERS}). U vyplněného záznamu je jméno povinné.`}
                  accent="people"
                >

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
                        <FieldGroup label="Ročník Zapalovače">
                          <input
                            type="text"
                            className="admin-form__input"
                            value={organiser.zapalovacYear || ''}
                            onChange={(e) => updateOrganiser(index, 'zapalovacYear', e.target.value)}
                            placeholder="např. 2022"
                            inputMode="numeric"
                          />
                        </FieldGroup>
                      </div>
                      <div className="admin-form__row">
                        <FieldGroup label="E-mail">
                          <AdminOrganiserEmailField
                            value={organiser.email}
                            onChange={(email) => updateOrganiser(index, 'email', email)}
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
                </TabBlock>
              </div>
            </AdminTabPanel>

            <AdminTabPanel id="registration" idPrefix="event" activeTab={activeTab} direction={tabDirection}>
              <div className="admin-event-tab">
                <TabBlock title="Přihláška" hint="Externí odkaz pro tlačítko Přihlásit se." accent="signup">
                  <FieldGroup label="Odkaz na přihlášku">
                    <UrlInput
                      value={form.registrationLink}
                      onChange={(next) => updateField('registrationLink', next)}
                      placeholder="forms.google.com/..."
                    />
                  </FieldGroup>
                </TabBlock>

                <TabBlock title="Účastníci" hint="Volitelný seznam jmen pro zobrazení na stránce akce. Pořadí přetáhněte za úchyt." accent="people">
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
            </AdminTabPanel>

            <AdminTabPanel id="past" idPrefix="event" activeTab={activeTab} direction={tabDirection}>
              <div className="admin-event-tab">
                <TabBlock title="Zápis z akce" hint="Obsah pro proběhlé akce — formátování, seznamy, odkazy a YouTube videa." accent="copy">
                  <RichTextEditor
                    id="event-report"
                    value={form.report}
                    onChange={(value) => updateField('report', value)}
                    tone="past"
                    features="eventReport"
                  />
                </TabBlock>

                <TabBlock title="Galerie" hint="Odkaz na složku s fotografiemi z akce a výběr nejlepších fotek pro stránku proběhlé akce." accent="media">
                  <FieldGroup label="Odkaz na galerii">
                    <UrlInput
                      value={form.galleryLink}
                      onChange={(next) => updateField('galleryLink', next)}
                      placeholder="drive.google.com/..."
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
            </AdminTabPanel>

            {!shareMode && (
              <AdminTabPanel id="sharing" idPrefix="event" activeTab={activeTab} direction={tabDirection}>
                <AdminEventSharingTab
                  eventId={event?.id}
                  isDraft={event?.isDraft}
                  onEnsureEventId={handleEnsureEventId}
                />
              </AdminTabPanel>
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

  const calendarOnlyConfirmDialog = calendarOnlyConfirmOpen ? (
    <div
      className="admin-modal admin-modal--confirm admin-modal--visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-event-calendar-only-title"
    >
      <div className="admin-modal__backdrop" aria-hidden="true" />
      <AdminModalPanel className="admin-modal__panel--compact">
        <h2 id="admin-event-calendar-only-title" className="admin-modal__title">
          Zobrazit akci pouze v kalendáři, ne mezi akcemi
        </h2>
        <p className="admin-modal__text">
          Akce zmizí ze seznamu akcí a zůstane jen v kalendáři. Po kliknutí otevře vlastní webovou stránku.
        </p>
        <div className="admin-modal__actions">
          <button
            type="button"
            className="btn btn--outline"
            onClick={handleDismissCalendarOnlyConfirm}
          >
            Zrušit
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleConfirmCalendarOnly}
          >
            Potvrdit
          </button>
        </div>
      </AdminModalPanel>
    </div>
  ) : null;

  const timeWarningDialog = timeWarningOpen ? (
    <div
      className="admin-modal admin-modal--confirm admin-modal--visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-event-time-warning-title"
    >
      <div className="admin-modal__backdrop" aria-hidden="true" />
      <AdminModalPanel className="admin-modal__panel--compact">
        <h2 id="admin-event-time-warning-title" className="admin-modal__title">
          Chybí čas akce
        </h2>
        <p className="admin-modal__text">
          Nemáte vyplněný čas začátku nebo konce. Akci můžete uložit, ale čas brzy doplňte.
        </p>
        <div className="admin-modal__actions">
          <button
            type="button"
            className="btn btn--outline"
            onClick={handleDismissTimeWarning}
            disabled={saving}
          >
            Zpět
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleConfirmTimeWarning}
            disabled={saving}
          >
            {saving ? 'Ukládám…' : 'Uložit bez času'}
          </button>
        </div>
      </AdminModalPanel>
    </div>
  ) : null;

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
              if (event?.id) navigate(eventUrl({ ...event, slug: form.slug || event.slug }));
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
        {timeWarningDialog && createPortal(timeWarningDialog, document.body)}
        {calendarOnlyConfirmDialog && createPortal(calendarOnlyConfirmDialog, document.body)}
        {saveSuccessDialog && createPortal(saveSuccessDialog, document.body)}
      </>
    );
  }

  return createPortal(
    <div
      className={`admin-modal admin-modal--wide admin-modal--event-form${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-event-form-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      {formBody}
      {calendarOnlyConfirmDialog}
      {timeWarningDialog}
      {saveConfirmDialog}
    </div>,
    document.body,
  );
}
