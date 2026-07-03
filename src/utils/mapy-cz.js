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

export async function geocodePlaceQuery(query) {
  const trimmed = query?.trim();
  if (!trimmed) return null;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'cz');
  url.searchParams.set('q', trimmed);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'cs',
    },
  });

  if (!response.ok) {
    throw new Error('Vyhledání adresy se nezdařilo.');
  }

  const results = await response.json();
  const match = results?.[0];
  if (!match) return null;

  return normalizePlaceCoords(match.lat, match.lon);
}
