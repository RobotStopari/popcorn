export function hasValidPlaceCoords(lat, lng) {
  const parsedLat = typeof lat === 'number' ? lat : Number.parseFloat(lat);
  const parsedLng = typeof lng === 'number' ? lng : Number.parseFloat(lng);

  return Number.isFinite(parsedLat)
    && Number.isFinite(parsedLng)
    && parsedLat >= -90
    && parsedLat <= 90
    && parsedLng >= -180
    && parsedLng <= 180;
}

export function normalizePlaceCoords(lat, lng) {
  if (!hasValidPlaceCoords(lat, lng)) return null;

  const parsedLat = typeof lat === 'number' ? lat : Number.parseFloat(lat);
  const parsedLng = typeof lng === 'number' ? lng : Number.parseFloat(lng);

  return {
    lat: Math.round(parsedLat * 1_000_000) / 1_000_000,
    lng: Math.round(parsedLng * 1_000_000) / 1_000_000,
  };
}

/** Mapy.cz point URL — x = longitude, y = latitude; source=coor&id drops a marker */
export function buildMapyCzPointUrl(lat, lng, zoom = 16) {
  const coords = normalizePlaceCoords(lat, lng);
  if (!coords) return '';

  return `https://mapy.com/zakladni?source=coor&id=${coords.lng}%2C${coords.lat}&x=${coords.lng}&y=${coords.lat}&z=${zoom}`;
}

function parseNumberToken(token) {
  const cleaned = String(token || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(',', '.');
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : NaN;
}

function dmsPartsToDecimal(degrees, minutes = 0, seconds = 0, hemisphere = '') {
  if (!Number.isFinite(degrees)) return NaN;
  const signFromDeg = degrees < 0 ? -1 : 1;
  const absolute = Math.abs(degrees) + (Math.abs(minutes) / 60) + (Math.abs(seconds) / 3600);
  let value = absolute * signFromDeg;

  const hemi = String(hemisphere || '').trim().toUpperCase();
  if (hemi === 'S' || hemi === 'W') value = -Math.abs(value);
  if (hemi === 'N' || hemi === 'E') value = Math.abs(value);

  return value;
}

function orderLatLng(first, second) {
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;

  // Explicitly invalid combinations
  if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
    // Prefer lat,lng. If first looks like CZ longitude and second like CZ latitude, swap.
    const looksLikeLngLat = Math.abs(first) > 90
      || (first >= 10 && first <= 20 && second >= 47 && second <= 52);
    if (looksLikeLngLat && Math.abs(second) <= 90) {
      return normalizePlaceCoords(second, first);
    }
    return normalizePlaceCoords(first, second);
  }

  if (Math.abs(second) <= 90 && Math.abs(first) <= 180) {
    return normalizePlaceCoords(second, first);
  }

  return null;
}

function looksLikeHttpUrl(query) {
  return /^https?:\/\//i.test(query) || /^www\./i.test(query);
}

/**
 * Parse coordinates from free text: decimal, DM, DMS, N/S/E/W, EU decimals, etc.
 */
function parseCoordsFromText(raw) {
  const text = raw
    .replace(/\u00a0/g, ' ')
    .replace(/[′’]/g, "'")
    .replace(/[″“”]/g, '"')
    .trim();

  // DMS / DM: require ° or ' or " so plain decimals are not treated as degrees.
  // Examples: 50°5'13.2"N 14°25'15.6"E | 50° 5.22' N, 14° 25.26' E
  const dmsRe = /([NSWE])?\s*(-?\d+(?:[.,]\d+)?)\s*[°º]\s*(?:(\d+(?:[.,]\d+)?)\s*['′]?)?\s*(?:(\d+(?:[.,]\d+)?)\s*["″]?)?\s*([NSWE])?/gi;
  const dmsParts = [];
  let match;
  while ((match = dmsRe.exec(text)) && dmsParts.length < 2) {
    const hemi = match[5] || match[1] || '';
    const deg = parseNumberToken(match[2]);
    const minutes = match[3] != null ? parseNumberToken(match[3]) : 0;
    const seconds = match[4] != null ? parseNumberToken(match[4]) : 0;
    const value = dmsPartsToDecimal(deg, minutes || 0, seconds || 0, hemi);
    if (Number.isFinite(value)) {
      dmsParts.push({ value, hemi: hemi.toUpperCase() });
    }
  }

  // Space-separated DMS without degree symbol: 50 05 13.2 N 14 25 15.6 E
  if (dmsParts.length < 2) {
    const spacedDmsRe = /([NSWE])?\s*(-?\d{1,3})\s+(\d{1,2}(?:[.,]\d+)?)\s+(\d{1,2}(?:[.,]\d+)?)\s*([NSWE])?/gi;
    while ((match = spacedDmsRe.exec(text)) && dmsParts.length < 2) {
      const hemi = match[5] || match[1] || '';
      const value = dmsPartsToDecimal(
        parseNumberToken(match[2]),
        parseNumberToken(match[3]),
        parseNumberToken(match[4]),
        hemi,
      );
      if (Number.isFinite(value)) {
        dmsParts.push({ value, hemi: hemi.toUpperCase() });
      }
    }
  }

  if (dmsParts.length === 2) {
    let lat = null;
    let lng = null;
    for (const part of dmsParts) {
      if (part.hemi === 'N' || part.hemi === 'S') lat = part.value;
      else if (part.hemi === 'E' || part.hemi === 'W') lng = part.value;
    }
    if (lat != null && lng != null) {
      return normalizePlaceCoords(lat, lng);
    }
    return orderLatLng(dmsParts[0].value, dmsParts[1].value);
  }

  // Decimal with hemispheres: 50.087N, 14.421E or N 50.087 E 14.421
  const hemiDecimalRe = /([NSWE])\s*(-?\d+(?:[.,]\d+)?)|(-?\d+(?:[.,]\d+)?)\s*([NSWE])/gi;
  const hemiDecimals = [];
  while ((match = hemiDecimalRe.exec(text)) && hemiDecimals.length < 2) {
    const hemi = (match[1] || match[4] || '').toUpperCase();
    const number = parseNumberToken(match[2] || match[3]);
    const value = dmsPartsToDecimal(number, 0, 0, hemi);
    if (Number.isFinite(value)) {
      hemiDecimals.push({ value, hemi });
    }
  }
  if (hemiDecimals.length === 2) {
    let lat = null;
    let lng = null;
    for (const part of hemiDecimals) {
      if (part.hemi === 'N' || part.hemi === 'S') lat = part.value;
      else if (part.hemi === 'E' || part.hemi === 'W') lng = part.value;
    }
    if (lat != null && lng != null) {
      return normalizePlaceCoords(lat, lng);
    }
  }

  // Plain decimal pair: 50.087, 14.421 | 50,087; 14,421 | 50.087 14.421
  // Prefer explicit separators so EU decimals like 50,087 work with ";"/space between values.
  const pairPatterns = [
    /(-?\d+[.,]\d+)\s*[,;/\s]\s*(-?\d+[.,]\d+)/,
    /(-?\d+)\s*[,;/\s]\s*(-?\d+[.,]\d+)/,
    /(-?\d+[.,]\d+)\s*[,;/\s]\s*(-?\d+)/,
    /^(-?\d+(?:[.,]\d+)?)\s*[ ,;/]\s*(-?\d+(?:[.,]\d+)?)$/,
  ];

  for (const pattern of pairPatterns) {
    const pair = text.match(pattern);
    if (!pair) continue;
    const parsed = orderLatLng(parseNumberToken(pair[1]), parseNumberToken(pair[2]));
    if (parsed) return parsed;
  }

  return null;
}

/**
 * Try to read coordinates from user input (plain text only — not map URLs).
 * Returns normalized { lat, lng } or null when the query is not coordinates.
 */
export function parsePlaceCoordinates(query) {
  const trimmed = String(query || '').trim();
  if (!trimmed || looksLikeHttpUrl(trimmed)) return null;
  return parseCoordsFromText(trimmed);
}

export async function geocodePlaceQuery(query) {
  const trimmed = query?.trim();
  if (!trimmed || looksLikeHttpUrl(trimmed)) return null;

  const fromCoords = parsePlaceCoordinates(trimmed);
  if (fromCoords) return fromCoords;

  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', trimmed);
  url.searchParams.set('limit', '1');

  let response;
  try {
    response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new Error('Vyhledání adresy se nezdařilo.');
  }

  if (!response.ok) {
    throw new Error('Vyhledání adresy se nezdařilo.');
  }

  const data = await response.json();
  const coords = data?.features?.[0]?.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;

  const [lng, lat] = coords;
  return normalizePlaceCoords(lat, lng);
}
