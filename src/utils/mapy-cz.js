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

  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', trimmed);
  url.searchParams.set('limit', '1');

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Vyhledání adresy se nezdařilo.');
  }

  const data = await response.json();
  const coords = data?.features?.[0]?.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;

  const [lng, lat] = coords;
  return normalizePlaceCoords(lat, lng);
}
