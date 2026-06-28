export const SHARE_LINK_EXPIRY_MODES = {
  permanent: 'permanent',
  duration: 'duration',
  datetime: 'datetime',
};

export function generateShareId() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function buildShareUrl(shareId) {
  if (typeof window === 'undefined') return `/share/event/${shareId}`;
  return `${window.location.origin}/share/event/${shareId}`;
}

export function computeShareExpiresAt({ expiryMode, durationValue, durationUnit, expiresAtLocal }) {
  if (expiryMode === SHARE_LINK_EXPIRY_MODES.permanent) {
    return null;
  }

  if (expiryMode === SHARE_LINK_EXPIRY_MODES.duration) {
    const amount = Number.parseInt(String(durationValue), 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Zadejte platnou dobu platnosti.');
    }

    const ms = durationUnit === 'hours'
      ? amount * 60 * 60 * 1000
      : amount * 24 * 60 * 60 * 1000;

    return new Date(Date.now() + ms);
  }

  if (!expiresAtLocal) {
    throw new Error('Zadejte datum a čas expirace.');
  }

  const parsed = new Date(expiresAtLocal);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Zadejte platné datum a čas expirace.');
  }

  if (parsed.getTime() <= Date.now()) {
    throw new Error('Expirace musí být v budoucnosti.');
  }

  return parsed;
}

export function normalizeShareLink(raw) {
  if (!raw?.id) return null;

  return {
    id: raw.id,
    eventId: raw.eventId || '',
    expiresAt: raw.expiresAt?.toDate?.() || null,
    maxUses: raw.maxUses ?? null,
    openCount: raw.openCount ?? 0,
    active: raw.active !== false,
    label: raw.label?.trim() || '',
    createdAt: raw.createdAt?.toDate?.() || null,
    createdBy: raw.createdBy || '',
  };
}

export function getShareLinkStatus(link, { forOpen = false } = {}, now = new Date()) {
  if (!link?.active) {
    return { valid: false, reason: 'Odkaz byl zrušen.' };
  }

  if (link.expiresAt && link.expiresAt.getTime() <= now.getTime()) {
    return { valid: false, reason: 'Platnost odkazu vypršela.' };
  }

  if (link.maxUses != null) {
    if (forOpen && link.openCount >= link.maxUses) {
      return { valid: false, reason: 'Odkaz byl použit maximální počet krát.' };
    }

    if (!forOpen && link.openCount > link.maxUses) {
      return { valid: false, reason: 'Odkaz byl použit maximální počet krát.' };
    }
  }

  return { valid: true, reason: '' };
}

export function formatShareExpiry(link) {
  if (!link.expiresAt) return 'Trvalý';
  return link.expiresAt.toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShareUses(link) {
  if (link.maxUses == null) {
    return `${link.openCount}× otevřeno · neomezeno`;
  }
  return `${link.openCount} / ${link.maxUses} otevření`;
}
