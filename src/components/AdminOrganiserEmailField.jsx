import { useEffect, useId, useMemo, useState } from 'react';

export const ORGANISER_EMAIL_DOMAINS = [
  'gmail.com',
  'komunitapopcorn.cz',
  'kurzzapalovac.cz',
  'skaut.cz',
  'oddiltitio.cz',
];

const CUSTOM_VALUE = '__custom__';
const DEFAULT_DOMAIN = ORGANISER_EMAIL_DOMAINS[0];

function normalizeDomain(domain) {
  return String(domain || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase();
}

export function parseOrganiserEmail(email) {
  const trimmed = String(email || '').trim();
  const at = trimmed.lastIndexOf('@');

  if (at <= 0) {
    return {
      local: trimmed,
      domain: DEFAULT_DOMAIN,
      hasAt: false,
      custom: false,
    };
  }

  const local = trimmed.slice(0, at);
  const domain = normalizeDomain(trimmed.slice(at + 1));

  if (!domain) {
    return {
      local,
      domain: '',
      hasAt: true,
      custom: true,
    };
  }

  const preset = ORGANISER_EMAIL_DOMAINS.includes(domain);
  return {
    local,
    domain,
    hasAt: true,
    custom: !preset,
  };
}

export function composeOrganiserEmail(local, domain) {
  const localPart = String(local || '').trim();
  const domainPart = normalizeDomain(domain);
  if (!localPart) return '';
  if (!domainPart) return `${localPart}@`;
  return `${localPart}@${domainPart}`;
}

export default function AdminOrganiserEmailField({
  value = '',
  onChange,
  disabled = false,
}) {
  const localId = useId();
  const domainId = useId();
  const parsed = useMemo(() => parseOrganiserEmail(value), [value]);
  const [forceCustom, setForceCustom] = useState(parsed.custom);
  const [customDomain, setCustomDomain] = useState(
    () => (parsed.custom ? parsed.domain : ''),
  );

  useEffect(() => {
    const next = parseOrganiserEmail(value);
    if (next.custom) {
      setForceCustom(true);
      setCustomDomain(next.domain);
      return;
    }
    if (next.hasAt && ORGANISER_EMAIL_DOMAINS.includes(next.domain)) {
      setForceCustom(false);
    }
  }, [value]);

  const customMode = forceCustom || parsed.custom;
  const presetDomain = ORGANISER_EMAIL_DOMAINS.includes(parsed.domain)
    ? parsed.domain
    : DEFAULT_DOMAIN;

  const emit = (local, domain) => {
    onChange?.(composeOrganiserEmail(local, domain));
  };

  const handleLocalChange = (event) => {
    const nextLocal = event.target.value.replace(/@/g, '');
    emit(nextLocal, customMode ? customDomain : presetDomain);
  };

  const handleDomainSelect = (event) => {
    const next = event.target.value;
    if (next === CUSTOM_VALUE) {
      setForceCustom(true);
      setCustomDomain('');
      emit(parsed.local, '');
      return;
    }
    setForceCustom(false);
    emit(parsed.local, next);
  };

  const handleCustomDomainChange = (event) => {
    const nextDomain = normalizeDomain(event.target.value);
    setCustomDomain(nextDomain);
    emit(parsed.local, nextDomain);
  };

  return (
    <div className={`admin-email-domain${customMode ? ' admin-email-domain--custom' : ''}`}>
      <div className="admin-email-domain__shell">
        <input
          id={localId}
          type="text"
          className="admin-form__input admin-email-domain__local"
          value={parsed.local}
          onChange={handleLocalChange}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="none"
          placeholder="jmeno"
          aria-label="Část e-mailu před @"
        />
        <span className="admin-email-domain__at" aria-hidden="true">@</span>
        {customMode ? (
          <input
            id={domainId}
            type="text"
            className="admin-form__input admin-email-domain__domain"
            value={customDomain}
            onChange={handleCustomDomainChange}
            disabled={disabled}
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="none"
            placeholder="vlastni-domena.cz"
            aria-label="Vlastní e-mailová doména"
          />
        ) : (
          <select
            id={domainId}
            className="admin-form__input admin-email-domain__select"
            value={presetDomain}
            onChange={handleDomainSelect}
            disabled={disabled}
            aria-label="E-mailová koncovka"
          >
            {ORGANISER_EMAIL_DOMAINS.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
            <option value={CUSTOM_VALUE}>vlastní…</option>
          </select>
        )}
      </div>
      {customMode && (
        <button
          type="button"
          className="admin-email-domain__back"
          onClick={() => {
            setForceCustom(false);
            emit(parsed.local, DEFAULT_DOMAIN);
          }}
          disabled={disabled}
          title="Vybrat přednastavenou koncovku"
          aria-label="Vybrat přednastavenou koncovku"
        >
          ←
        </button>
      )}
    </div>
  );
}
