import { useEffect, useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import {
  buildShareUrl,
  formatShareExpiry,
  formatShareUses,
  SHARE_LINK_EXPIRY_MODES,
} from '../utils/event-share-link-format';
import {
  createEventShareLink,
  revokeEventShareLink,
  subscribeEventShareLinks,
} from '../services/event-share-links';

function isVisibleShareLink(link) {
  if (!link.active) return false;
  if (link.expiresAt && link.expiresAt.getTime() <= Date.now()) return false;
  if (link.maxUses != null && link.openCount >= link.maxUses) return false;
  return true;
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ShareFormFields({
  label,
  setLabel,
  expiryMode,
  setExpiryMode,
  durationValue,
  setDurationValue,
  durationUnit,
  setDurationUnit,
  expiresAtLocal,
  setExpiresAtLocal,
  maxUsesEnabled,
  setMaxUsesEnabled,
  maxUses,
  setMaxUses,
  creating,
  onCreate,
}) {
  return (
    <>
      <div className="admin-form__group">
        <label className="admin-form__label" htmlFor="share-label">Poznámka (volitelné)</label>
        <input
          id="share-label"
          type="text"
          className="admin-form__input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Např. pro organizátora Jana"
        />
      </div>

      <fieldset className="admin-event-sharing__fieldset">
        <legend className="admin-form__label">Platnost odkazu</legend>
        <label className="admin-event-sharing__radio">
          <input
            type="radio"
            name="share-expiry"
            checked={expiryMode === SHARE_LINK_EXPIRY_MODES.permanent}
            onChange={() => setExpiryMode(SHARE_LINK_EXPIRY_MODES.permanent)}
          />
          <span>Trvalý (výchozí)</span>
        </label>
        <label className="admin-event-sharing__radio">
          <input
            type="radio"
            name="share-expiry"
            checked={expiryMode === SHARE_LINK_EXPIRY_MODES.duration}
            onChange={() => setExpiryMode(SHARE_LINK_EXPIRY_MODES.duration)}
          />
          <span>Po uplynutí doby</span>
        </label>
        {expiryMode === SHARE_LINK_EXPIRY_MODES.duration && (
          <div className="admin-form__row admin-event-sharing__duration">
            <input
              type="number"
              min="1"
              className="admin-form__input"
              value={durationValue}
              onChange={(e) => setDurationValue(e.target.value)}
            />
            <select
              className="admin-form__input"
              value={durationUnit}
              onChange={(e) => setDurationUnit(e.target.value)}
            >
              <option value="hours">hodin</option>
              <option value="days">dnů</option>
            </select>
          </div>
        )}
        <label className="admin-event-sharing__radio">
          <input
            type="radio"
            name="share-expiry"
            checked={expiryMode === SHARE_LINK_EXPIRY_MODES.datetime}
            onChange={() => setExpiryMode(SHARE_LINK_EXPIRY_MODES.datetime)}
          />
          <span>Konkrétní datum a čas</span>
        </label>
        {expiryMode === SHARE_LINK_EXPIRY_MODES.datetime && (
          <input
            type="datetime-local"
            className="admin-form__input"
            value={expiresAtLocal}
            onChange={(e) => setExpiresAtLocal(e.target.value)}
          />
        )}
      </fieldset>

      <fieldset className="admin-event-sharing__fieldset">
        <legend className="admin-form__label">Počet otevření</legend>
        <label className="admin-event-sharing__radio">
          <input
            type="radio"
            name="share-uses"
            checked={!maxUsesEnabled}
            onChange={() => setMaxUsesEnabled(false)}
          />
          <span>Neomezeně (výchozí)</span>
        </label>
        <label className="admin-event-sharing__radio">
          <input
            type="radio"
            name="share-uses"
            checked={maxUsesEnabled}
            onChange={() => setMaxUsesEnabled(true)}
          />
          <span>Maximální počet otevření</span>
        </label>
        {maxUsesEnabled && (
          <input
            type="number"
            min="1"
            className="admin-form__input admin-event-sharing__max-uses"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
          />
        )}
      </fieldset>

      <button
        type="button"
        className="btn btn--primary btn--small"
        disabled={creating}
        onClick={onCreate}
      >
        {creating ? 'Generuji…' : 'Vygenerovat odkaz'}
      </button>
    </>
  );
}

export default function AdminEventSharingTab({ eventId, onEnsureEventId, isDraft = false }) {
  const { user } = useAdminAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(Boolean(eventId));
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState('');
  const [revokingId, setRevokingId] = useState('');

  const [expiryMode, setExpiryMode] = useState(SHARE_LINK_EXPIRY_MODES.permanent);
  const [durationValue, setDurationValue] = useState('7');
  const [durationUnit, setDurationUnit] = useState('days');
  const [expiresAtLocal, setExpiresAtLocal] = useState('');
  const [maxUsesEnabled, setMaxUsesEnabled] = useState(false);
  const [maxUses, setMaxUses] = useState('5');
  const [label, setLabel] = useState('');

  const visibleLinks = links.filter(isVisibleShareLink);

  useEffect(() => {
    if (!eventId) {
      setLinks([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = subscribeEventShareLinks(
      eventId,
      (data) => {
        setLinks(data);
        setLoading(false);
        setError('');
      },
      (err) => {
        setError(err.message || 'Nepodařilo se načíst sdílecí odkazy.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [eventId]);

  const handleCopyUrl = async (url, id) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(''), 2000);
    } catch {
      setError('Kopírování se nezdařilo.');
    }
  };

  const handleCreate = async () => {

    setCreating(true);
    setError('');

    try {
      let resolvedEventId = eventId;
      if (!resolvedEventId) {
        if (!onEnsureEventId) {
          throw new Error('Akci se nepodařilo připravit ke sdílení.');
        }
        resolvedEventId = await onEnsureEventId();
      }

      await createEventShareLink({
        eventId: resolvedEventId,
        createdBy: user?.uid || '',
        expiryMode,
        durationValue,
        durationUnit,
        expiresAtLocal,
        maxUses: maxUsesEnabled ? maxUses : null,
        label,
      });

      setLabel('');
    } catch (err) {
      setError(err.message || 'Vytvoření odkazu se nezdařilo.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (shareId) => {
    setRevokingId(shareId);
    setError('');

    try {
      await revokeEventShareLink(shareId);
    } catch (err) {
      setError(err.message || 'Zrušení odkazu se nezdařilo.');
    } finally {
      setRevokingId('');
    }
  };

  return (
    <div className="admin-event-tab admin-event-sharing">
      {!eventId && (
        <div className="admin-event-sharing__intro">
          <p className="admin-event-sharing__intro-eyebrow">Sdílení konceptu</p>
          <h4 className="admin-event-sharing__intro-title">Nechte někoho jiného akci doplnit</h4>
          <p className="admin-event-sharing__intro-text">
            Odkaz můžete vygenerovat i pro akci, která ještě není uložená. Vytvoří se prázdný
            koncept v administraci — na webu se nezobrazí, dokud někdo nevyplní název a termín.
          </p>
        </div>
      )}

      {isDraft && eventId && (
        <div className="admin-event-sharing__draft-note">
          Tato akce je zatím koncept a není veřejně viditelná. Po vyplnění povinných údajů se
          automaticky zobrazí na webu.
        </div>
      )}

      <section className="admin-event-block">
        <h3 className="admin-event-block__title">Nový sdílecí odkaz</h3>
        <p className="admin-event-block__hint">
          Odkaz obsahuje neuhodnutelný kód. Kdokoli s odkazem může upravit tuto akci bez přihlášení.
          Neposkytuje přístup do administrace ani k jiným akcím.
        </p>

        <div className="admin-event-sharing__form">
          <ShareFormFields
            label={label}
            setLabel={setLabel}
            expiryMode={expiryMode}
            setExpiryMode={setExpiryMode}
            durationValue={durationValue}
            setDurationValue={setDurationValue}
            durationUnit={durationUnit}
            setDurationUnit={setDurationUnit}
            expiresAtLocal={expiresAtLocal}
            setExpiresAtLocal={setExpiresAtLocal}
            maxUsesEnabled={maxUsesEnabled}
            setMaxUsesEnabled={setMaxUsesEnabled}
            maxUses={maxUses}
            setMaxUses={setMaxUses}
            creating={creating}
            onCreate={handleCreate}
          />
        </div>
      </section>

      {eventId && (
        <section className="admin-event-block">
          <h3 className="admin-event-block__title">Existující odkazy</h3>

          {loading ? (
            <p className="admin-event-sharing__empty">Načítám odkazy…</p>
          ) : visibleLinks.length === 0 ? (
            <p className="admin-event-sharing__empty">Zatím žádné sdílecí odkazy.</p>
          ) : (
            <ul className="admin-event-sharing__list">
              {visibleLinks.map((link) => {
                const url = buildShareUrl(link.id);
                return (
                  <li key={link.id} className="admin-event-sharing__item">
                    <div className="admin-event-sharing__item-head">
                      <strong>{link.label || 'Sdílecí odkaz'}</strong>
                      <span className="admin-event-sharing__status">Aktivní</span>
                    </div>
                    <p className="admin-event-sharing__meta">
                      {formatShareExpiry(link)} · {formatShareUses(link)}
                    </p>
                    <div className="admin-event-sharing__url-row">
                      <input type="text" className="admin-form__input" value={url} readOnly />
                      <button
                        type="button"
                        className="btn btn--outline btn--small admin-event-sharing__copy"
                        onClick={() => handleCopyUrl(url, link.id)}
                      >
                        <CopyIcon />
                        {copiedId === link.id ? 'Zkopírováno' : 'Kopírovat'}
                      </button>
                      <button
                        type="button"
                        className="btn btn--outline btn--small admin-event-sharing__revoke"
                        onClick={() => handleRevoke(link.id)}
                        disabled={revokingId === link.id}
                      >
                        {revokingId === link.id ? 'Ruším…' : 'Zrušit'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {error && <p className="admin-error">{error}</p>}
    </div>
  );
}
