import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate } from 'react-router-dom';
import AdminModalPanel from '../components/AdminModalPanel';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import {
  COLOR_CATEGORIES,
  COLOR_KEYS,
  DEFAULT_COLORS,
  applyColorTokens,
  buildGradients,
  cloneColorMap,
  isValidHexColor,
  normalizeHexColor,
  rgbString,
} from '../data/colors';
import { subscribeSiteColors, updateSiteColors } from '../services/site-colors';

function LockIcon({ locked }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {locked ? (
        <>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </>
      ) : (
        <>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 7.5-1" />
        </>
      )}
    </svg>
  );
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function ColorCard({
  name,
  value,
  locked,
  onChange,
}) {
  const [copyMessage, setCopyMessage] = useState('');

  const handleCopy = async (text, label) => {
    const ok = await copyText(text);
    setCopyMessage(ok ? `${label} zkopírováno` : 'Kopírování selhalo');
    window.setTimeout(() => setCopyMessage(''), 1600);
  };

  const rgb = rgbString(value);
  const inputId = `admin-color-${name}`;

  return (
    <article className="admin-colors__card">
      <div className="admin-colors__swatch" style={{ backgroundColor: value }} aria-hidden="true" />
      <div className="admin-colors__body">
        <h3 className="admin-colors__name">{name}</h3>
        <dl className="admin-colors__values">
          <div>
            <dt>HEX</dt>
            <dd>{value}</dd>
          </div>
          <div>
            <dt>RGB</dt>
            <dd>{rgb}</dd>
          </div>
        </dl>
        <div className="admin-colors__copy-row">
          <button
            type="button"
            className="btn btn--outline btn--small"
            onClick={() => handleCopy(value, 'HEX')}
          >
            Kopírovat HEX
          </button>
          <button
            type="button"
            className="btn btn--outline btn--small"
            onClick={() => handleCopy(rgb, 'RGB')}
          >
            Kopírovat RGB
          </button>
        </div>
        {copyMessage && (
          <p className="admin-colors__copy-msg" role="status">{copyMessage}</p>
        )}
        {!locked && (
          <div className="admin-colors__edit">
            <label className="admin-form__label" htmlFor={inputId}>Upravit</label>
            <div className="admin-colors__edit-row">
              <input
                id={inputId}
                type="color"
                className="admin-colors__picker"
                value={value}
                onChange={(event) => onChange(name, event.target.value)}
                aria-label={`Barva ${name}`}
              />
              <input
                type="text"
                className="admin-form__input admin-colors__hex-input"
                value={value}
                onChange={(event) => onChange(name, event.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function WarningDialog({
  open,
  title,
  text,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  busy = false,
}) {
  if (!open) return null;

  return createPortal(
    <div
      className="admin-modal admin-modal--confirm admin-modal--visible admin-colors__dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-colors-dialog-title"
    >
      <div className="admin-modal__backdrop" aria-hidden="true" />
      <AdminModalPanel className="admin-modal__panel--compact admin-colors__dialog-panel">
        <div className="admin-colors__warning-banner" role="alert">
          <strong>Pozor!</strong>
        </div>
        <h2 id="admin-colors-dialog-title" className="admin-modal__title">{title}</h2>
        <p className="admin-modal__text">{text}</p>
        <div className="admin-modal__actions">
          <button
            type="button"
            className="btn btn--outline"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Ukládám…' : confirmLabel}
          </button>
        </div>
      </AdminModalPanel>
    </div>,
    document.body,
  );
}

export default function AdminColorsPage() {
  const { canAccessAdmin, loading } = useAdminAuth();
  const [savedColors, setSavedColors] = useState(null);
  const [draftColors, setDraftColors] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [locked, setLocked] = useState(true);
  const [unlockConfirmOpen, setUnlockConfirmOpen] = useState(false);
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    document.title = 'Barvy — Admin';
  }, []);

  useEffect(() => {
    if (!canAccessAdmin) return undefined;

    const unsubscribe = subscribeSiteColors(
      (data) => {
        setSavedColors(cloneColorMap(data.colors));
        setListLoading(false);
      },
      () => {
        setListLoading(false);
      },
    );

    return unsubscribe;
  }, [canAccessAdmin]);

  useEffect(() => {
    if (!locked && draftColors) {
      applyColorTokens({
        colors: draftColors,
        gradients: buildGradients(draftColors),
      });
    }
  }, [draftColors, locked]);

  if (loading) {
    return (
      <div className="admin-content">
        <p className="admin-loading">Načítání…</p>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const displayColors = locked ? savedColors : draftColors;
  const hasDraftChanges = savedColors && draftColors
    && COLOR_KEYS.some((key) => savedColors[key] !== draftColors[key]);

  const handleLockToggle = () => {
    if (locked) {
      setUnlockConfirmOpen(true);
      return;
    }

    setLockConfirmOpen(true);
  };

  const handleConfirmUnlock = () => {
    setDraftColors(cloneColorMap(savedColors));
    setLocked(false);
    setUnlockConfirmOpen(false);
    setSaveError('');
  };

  const handleColorChange = (name, rawValue) => {
    const next = normalizeHexColor(rawValue);
    if (!isValidHexColor(next)) {
      setDraftColors((prev) => ({ ...prev, [name]: rawValue }));
      return;
    }

    setDraftColors((prev) => ({ ...prev, [name]: next }));
    setSaveError('');
  };

  const handleRevertAndLock = () => {
    if (savedColors) {
      applyColorTokens({
        colors: savedColors,
        gradients: buildGradients(savedColors),
      });
      setDraftColors(cloneColorMap(savedColors));
    }
    setLocked(true);
    setLockConfirmOpen(false);
    setSaveError('');
  };

  const handleSaveAndLock = async () => {
    if (!draftColors) return;

    const invalidKey = COLOR_KEYS.find((key) => !isValidHexColor(draftColors[key]));
    if (invalidKey) {
      setSaveError(`Barva „${invalidKey}“ nemá platný HEX kód.`);
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      await updateSiteColors(draftColors);
      setSavedColors(cloneColorMap(draftColors));
      setLocked(true);
      setLockConfirmOpen(false);
    } catch (err) {
      setSaveError(err.message || 'Nepodařilo se uložit barvy.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    const defaults = cloneColorMap(DEFAULT_COLORS);

    setSaving(true);
    setSaveError('');

    try {
      await updateSiteColors(defaults);
      setSavedColors(defaults);
      setDraftColors(defaults);
      applyColorTokens({
        colors: defaults,
        gradients: buildGradients(defaults),
      });
      setLocked(true);
      setResetConfirmOpen(false);
    } catch (err) {
      setSaveError(err.message || 'Nepodařilo se obnovit výchozí barvy.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-content container admin-colors-page">
      <header className="admin-content__header admin-content__header--actions admin-colors-page__header">
        <div>
          <h1 className="admin-content__title">Barvy</h1>
          <p className="admin-content__subtitle">
            Paleta webu — {locked ? 'stránka je zamčená, barvy jen ke čtení' : 'režim úprav — nezapomeňte znovu zamknout a uložit'}
          </p>
        </div>
        {!listLoading && (
          <div className="admin-colors__header-actions">
            {!locked && (
              <button
                type="button"
                className="btn btn--outline admin-colors__reset"
                onClick={() => setResetConfirmOpen(true)}
                disabled={saving}
              >
                Obnovit výchozí
              </button>
            )}
            <label className={`admin-colors__lock${locked ? ' admin-colors__lock--locked' : ''}`}>
              <span className="admin-colors__lock-label">
                <LockIcon locked={locked} />
                {locked ? 'Zamčeno' : 'Odemčeno'}
              </span>
              <input
                type="checkbox"
                checked={locked}
                onChange={handleLockToggle}
                disabled={saving}
                aria-label={locked ? 'Odemknout úpravu barev' : 'Zamknout a uložit barvy'}
              />
              <span className="admin-toggle__track" aria-hidden="true">
                <span className="admin-toggle__thumb" />
              </span>
            </label>
          </div>
        )}
      </header>

      {saveError && (
        <p className="admin-error admin-content__error">{saveError}</p>
      )}

      {listLoading || !displayColors ? (
        <p className="admin-loading">Načítám barvy…</p>
      ) : (
        <div className="admin-colors__sections">
          {COLOR_CATEGORIES.map((category) => (
            <section key={category.id} className="admin-colors__section">
              <h2 className="admin-colors__section-title">{category.heading}</h2>
              <div className="admin-colors__grid">
                {category.keys.map((name) => (
                  <ColorCard
                    key={name}
                    name={name}
                    value={displayColors[name]}
                    locked={locked}
                    onChange={handleColorChange}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <WarningDialog
        open={unlockConfirmOpen}
        title="Odemknout úpravu barev?"
        text="Barvy ovlivňují celý web. Opravdu chcete přejít do režimu úprav? Změny se projeví až po opětovném zamčení stránky."
        confirmLabel="Ano, odemknout"
        cancelLabel="Zrušit"
        onConfirm={handleConfirmUnlock}
        onCancel={() => setUnlockConfirmOpen(false)}
      />

      <WarningDialog
        open={lockConfirmOpen}
        title="Uložit změny barev?"
        text={hasDraftChanges
          ? 'Máte neuložené změny palety. Uložením je zapíšete do databáze pro celý web. Vrácením změn obnovíte poslední uloženou verzi.'
          : 'Nejsou žádné změny k uložení. Stránku můžete zamknout bez uložení.'}
        confirmLabel={hasDraftChanges ? 'Uložit změny' : 'Zamknout'}
        cancelLabel={hasDraftChanges ? 'Vrátit změny' : 'Zrušit'}
        onConfirm={hasDraftChanges ? handleSaveAndLock : handleRevertAndLock}
        onCancel={hasDraftChanges ? handleRevertAndLock : () => setLockConfirmOpen(false)}
        busy={saving}
      />

      <WarningDialog
        open={resetConfirmOpen}
        title="Obnovit výchozí barvy?"
        text="Všechny barvy se vrátí na hodnoty z kódu a zapíší se do databáze pro celý web. Tuto akci nelze vrátit zpět — stránka se po obnovení zamkne."
        confirmLabel="Ano, obnovit"
        cancelLabel="Zrušit"
        onConfirm={handleResetToDefaults}
        onCancel={() => setResetConfirmOpen(false)}
        busy={saving}
      />
    </div>
  );
}
