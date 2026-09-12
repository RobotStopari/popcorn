import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  APP_TEXT_FIELDS,
  filterTextFieldGroups,
  groupFieldsByCategory,
} from '../data/app-texts-registry';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { subscribeAppTexts, updateAppTexts } from '../services/app-texts';
import { buildDraftFromOverrides } from '../utils/app-text-merge';
import { adminDocumentTitle, adminText } from '../utils/admin-text';
import { getAutosaveFormHandlers } from '../utils/autosave';
import { useAutosaveRunner } from '../hooks/useAutosaveRunner';
import AutosaveStatus from '../components/AutosaveStatus';

const FORM_ID = 'admin-ui-texts-form';

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

function TextFieldRow({ field, value, onChange, onReset }) {
  const isModified = value !== field.defaultValue;
  const inputId = `ui-text-${field.id.replace(/\./g, '-')}`;

  return (
    <div className="admin-ui-texts__field">
      <div className="admin-ui-texts__field-head">
        <label className="admin-ui-texts__field-path" htmlFor={inputId}>{field.label}</label>
        <button
          type="button"
          className="admin-ui-texts__reset"
          onClick={() => onReset(field)}
          disabled={!isModified}
          aria-label={adminText('uiTextsPage.resetFieldAria', { path: field.label })}
          title={adminText('uiTextsPage.resetField')}
        >
          <ResetIcon />
        </button>
      </div>
      <input
        id={inputId}
        type="text"
        className={`admin-form__input admin-ui-texts__input${isModified ? ' admin-ui-texts__input--modified' : ''}`}
        value={value}
        onChange={(event) => onChange(field.id, event.target.value)}
      />
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function TextCategorySection({
  group,
  isOpen,
  onToggle,
  draft,
  onChange,
  onReset,
}) {
  const sectionId = `ui-texts-section-${group.category.id}`;
  const panelId = `${sectionId}-panel`;

  return (
    <section className={`admin-ui-texts__section${isOpen ? ' admin-ui-texts__section--open' : ''}`}>
      <button
        type="button"
        className="admin-ui-texts__section-toggle"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        id={sectionId}
        aria-label={adminText('uiTextsPage.toggleSectionAria', { title: group.category.title })}
      >
        <span className="admin-ui-texts__section-head">
          <span className="admin-ui-texts__section-copy">
            <span className="admin-ui-texts__section-eyebrow">
              {group.category.scope === 'admin'
                ? adminText('uiTextsPage.categoryAdmin')
                : adminText('uiTextsPage.categorySite')}
            </span>
            <span className="admin-ui-texts__section-title">{group.category.title}</span>
            <span className="admin-ui-texts__section-description">{group.category.description}</span>
          </span>
          <span className="admin-ui-texts__section-meta">
            <span className="admin-ui-texts__section-count">{group.fields.length}</span>
            <span className="admin-ui-texts__section-chevron" aria-hidden="true">
              <ChevronIcon />
            </span>
          </span>
        </span>
      </button>

      <div
        id={panelId}
        className="admin-ui-texts__section-body"
        role="region"
        aria-labelledby={sectionId}
        aria-hidden={!isOpen}
      >
        <div className="admin-ui-texts__section-body-inner">
          <div className="admin-ui-texts__section-fields">
            {group.fields.map((field) => (
              <TextFieldRow
                key={field.id}
                field={field}
                value={draft[field.id] ?? field.defaultValue}
                onChange={onChange}
                onReset={onReset}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AdminTextsPage() {
  const { canAccessAdmin, loading } = useAdminAuth();
  const [draft, setDraft] = useState(() => buildDraftFromOverrides(APP_TEXT_FIELDS, {}));
  const [listLoading, setListLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [search, setSearch] = useState('');
  const [showModifiedOnly, setShowModifiedOnly] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState(() => new Set());
  const draftRef = useRef(draft);
  const dirtyRef = useRef(false);
  const { run: runAutosave, remember: rememberAutosave, status: autosaveStatus } = useAutosaveRunner();

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    document.title = adminDocumentTitle(adminText('uiTextsPage.title'));
  }, []);

  useEffect(() => {
    if (!canAccessAdmin) return undefined;

    const unsubscribe = subscribeAppTexts(
      (data) => {
        if (dirtyRef.current) {
          setListLoading(false);
          return;
        }
        setDraft(data.draft);
        rememberAutosave(data.draft);
        setListLoading(false);
      },
      () => {
        setDraft(buildDraftFromOverrides(APP_TEXT_FIELDS, {}));
        setListLoading(false);
      },
    );

    return unsubscribe;
  }, [canAccessAdmin, rememberAutosave]);

  const groupedFields = useMemo(() => {
    const groupsWithValues = groupFieldsByCategory(APP_TEXT_FIELDS).map((group) => ({
      ...group,
      fields: group.fields.map((field) => ({
        ...field,
        currentValue: draft[field.id] ?? field.defaultValue,
      })),
    }));

    let groups = filterTextFieldGroups(groupsWithValues, search);

    if (showModifiedOnly) {
      groups = groups
        .map((group) => ({
          ...group,
          fields: group.fields.filter((field) => {
            const currentValue = draft[field.id] ?? field.defaultValue;
            return currentValue !== field.defaultValue;
          }),
        }))
        .filter((group) => group.fields.length > 0);
    }

    return groups;
  }, [draft, search, showModifiedOnly]);

  useEffect(() => {
    if (!search.trim() && !showModifiedOnly) return;

    setCollapsedSections((prev) => {
      const next = new Set(prev);
      groupedFields.forEach((group) => next.delete(group.category.id));
      return next;
    });
  }, [search, showModifiedOnly, groupedFields]);

  const toggleSection = (categoryId) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

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

  const updateDraft = (fieldId, value) => {
    dirtyRef.current = true;
    setDraft((prev) => {
      const next = { ...prev, [fieldId]: value };
      draftRef.current = next;
      return next;
    });
    setSaveMessage('');
    setSaveError('');
  };

  const resetField = (field) => {
    updateDraft(field.id, field.defaultValue);
    persistTexts();
  };

  const persistTexts = async ({ close = false } = {}) => {
    const current = draftRef.current;
    if (close) setSaving(true);
    setSaveError('');
    const ok = await runAutosave(current, async () => {
      await updateAppTexts(current);
      dirtyRef.current = false;
      return true;
    });
    if (close) {
      setSaving(false);
      if (ok) setSaveMessage(adminText('uiTextsPage.saved'));
      else setSaveError(adminText('uiTextsPage.saveFailed'));
    }
    return ok;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await persistTexts({ close: true });
  };

  return (
    <div className="admin-content container admin-ui-texts-page">
      <header className="admin-content__header admin-ui-texts-page__header">
        <div>
          <h1 className="admin-content__title">{adminText('uiTextsPage.title')}</h1>
          <p className="admin-content__subtitle">{adminText('uiTextsPage.subtitle')}</p>
        </div>
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
        <p className="admin-loading">{adminText('uiTextsPage.loading')}</p>
      ) : (
        <form
          id={FORM_ID}
          className="admin-ui-texts"
          onSubmit={handleSubmit}
          {...getAutosaveFormHandlers(() => persistTexts())}
        >
          <div className="admin-ui-texts__sticky-bar">
            <div className="admin-ui-texts__toolbar">
              <input
                type="search"
                className="admin-form__input admin-ui-texts__search-input"
                placeholder={adminText('uiTextsPage.searchPlaceholder')}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label={adminText('uiTextsPage.searchAriaLabel')}
              />

              <div className="admin-ui-texts__toolbar-actions">
                <label className="admin-toggle admin-ui-texts__filter-toggle">
                  <input
                    type="checkbox"
                    checked={showModifiedOnly}
                    onChange={(event) => setShowModifiedOnly(event.target.checked)}
                    aria-label={adminText('uiTextsPage.showModifiedOnlyAria')}
                  />
                  <span className="admin-toggle__track" aria-hidden="true">
                    <span className="admin-toggle__thumb" />
                  </span>
                  <span className="admin-toggle__label">{adminText('uiTextsPage.showModifiedOnly')}</span>
                </label>

                <AutosaveStatus status={autosaveStatus} />
                <button
                  type="submit"
                  className="btn btn--primary admin-ui-texts__save"
                  disabled={saving}
                >
                  {saving ? adminText('common.saving') : adminText('uiTextsPage.save')}
                </button>
              </div>
            </div>
          </div>

          {groupedFields.length === 0 ? (
            <p className="admin-ui-texts__empty">
              {showModifiedOnly && !search.trim()
                ? adminText('uiTextsPage.emptyModified')
                : adminText('uiTextsPage.emptySearch')}
            </p>
          ) : (
            groupedFields.map((group) => (
              <TextCategorySection
                key={group.category.id}
                group={group}
                isOpen={!collapsedSections.has(group.category.id)}
                onToggle={() => toggleSection(group.category.id)}
                draft={draft}
                onChange={updateDraft}
                onReset={resetField}
              />
            ))
          )}
        </form>
      )}
    </div>
  );
}
