import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildMapyCzPointUrl,
  geocodePlaceQuery,
  hasValidPlaceCoords,
  normalizePlaceCoords,
} from '../utils/mapy-cz';

const DEFAULT_CENTER = { lat: 49.8175, lng: 15.473 };
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

let leafletLoaderPromise = null;

function loadLeaflet() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.L) return Promise.resolve(window.L);

  if (!leafletLoaderPromise) {
    leafletLoaderPromise = new Promise((resolve, reject) => {
      if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = LEAFLET_CSS;
        document.head.appendChild(link);
      }

      const script = document.createElement('script');
      script.src = LEAFLET_JS;
      script.async = true;
      script.onload = () => resolve(window.L);
      script.onerror = () => reject(new Error('Mapu se nepodařilo načíst.'));
      document.head.appendChild(script);
    });
  }

  return leafletLoaderPromise;
}

export default function AdminPlaceMapPicker({
  lat,
  lng,
  onChange,
  disabled = false,
}) {
  const mapRootRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [mapReady, setMapReady] = useState(false);

  onChangeRef.current = onChange;

  const coords = normalizePlaceCoords(lat, lng);
  const hasCoords = Boolean(coords);
  const previewUrl = hasCoords ? buildMapyCzPointUrl(coords.lat, coords.lng) : '';

  const emitCoords = useCallback((nextCoords) => {
    onChangeRef.current(nextCoords);
  }, []);

  useEffect(() => {
    if (disabled) return undefined;

    let active = true;
    let mapInstance = null;

    const initMap = async () => {
      try {
        const L = await loadLeaflet();
        if (!active || !mapRootRef.current || !L) return;

        const center = coords || DEFAULT_CENTER;
        mapInstance = L.map(mapRootRef.current, {
          center: [center.lat, center.lng],
          zoom: coords ? 15 : 7,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(mapInstance);

        const updateMarker = (nextCoords) => {
          if (!nextCoords) {
            if (markerRef.current) {
              mapInstance.removeLayer(markerRef.current);
              markerRef.current = null;
            }
            return;
          }

          const position = [nextCoords.lat, nextCoords.lng];
          if (markerRef.current) {
            markerRef.current.setLatLng(position);
          } else {
            markerRef.current = L.marker(position, { draggable: true }).addTo(mapInstance);
            markerRef.current.on('dragend', () => {
              const point = markerRef.current.getLatLng();
              emitCoords(normalizePlaceCoords(point.lat, point.lng));
            });
          }
        };

        mapInstance.on('click', (event) => {
          const nextCoords = normalizePlaceCoords(event.latlng.lat, event.latlng.lng);
          if (!nextCoords) return;
          emitCoords(nextCoords);
          updateMarker(nextCoords);
        });

        updateMarker(coords);
        mapRef.current = mapInstance;
        setMapReady(true);
      } catch (err) {
        if (active) {
          setError(err.message || 'Mapu se nepodařilo načíst.');
        }
      }
    };

    initMap();

    return () => {
      active = false;
      if (mapInstance) {
        mapInstance.remove();
      }
      mapRef.current = null;
      markerRef.current = null;
      setMapReady(false);
    };
  }, [disabled, emitCoords]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const L = window.L;
    if (!L) return;

    if (!coords) {
      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      return;
    }

    const position = [coords.lat, coords.lng];
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    } else {
      markerRef.current = L.marker(position, { draggable: !disabled }).addTo(mapRef.current);
      markerRef.current.on('dragend', () => {
        const point = markerRef.current.getLatLng();
        emitCoords(normalizePlaceCoords(point.lat, point.lng));
      });
    }

    mapRef.current.setView(position, Math.max(mapRef.current.getZoom(), 14));
  }, [coords?.lat, coords?.lng, disabled, mapReady, emitCoords]);

  const handleSearch = async () => {
    if (!search.trim() || disabled || searching) return;

    setSearching(true);
    setError('');

    try {
      const result = await geocodePlaceQuery(search);
      if (!result) {
        setError('Adresa ani souřadnice nebyly rozpoznány.');
        return;
      }
      emitCoords(result);
    } catch (err) {
      setError(err.message || 'Vyhledání adresy se nezdařilo.');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopPropagation();
    handleSearch();
  };

  return (
    <div className="admin-place-map">
      <p className="admin-form__hint">
        Klikněte na mapu, vyhledejte adresu, nebo vložte souřadnice.
      </p>

      <div className="admin-place-map__search">
        <input
          type="search"
          className="admin-form__input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Adresa, místo nebo souřadnice…"
          disabled={disabled || searching}
        />
        <button
          type="button"
          className="btn btn--outline"
          disabled={disabled || searching || !search.trim()}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleSearch();
          }}
        >
          {searching ? 'Hledám…' : 'Vyhledat'}
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-place-map__canvas-wrap">
        <div ref={mapRootRef} className="admin-place-map__canvas" aria-hidden={disabled} />
      </div>

      {hasCoords && (
        <div className="admin-place-map__meta">
          <p className="admin-form__hint">
            Souřadnice: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
          <div className="admin-place-map__actions">
            <a
              href={previewUrl}
              className="btn btn--outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Otevřít na Mapy.cz
            </a>
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => emitCoords(null)}
              disabled={disabled}
            >
              Odebrat bod
            </button>
          </div>
        </div>
      )}

      {!hasCoords && hasValidPlaceCoords(lat, lng) === false && lat !== '' && lng !== '' && (
        <p className="admin-form__hint">Zadejte platné souřadnice nebo vyberte bod na mapě.</p>
      )}
    </div>
  );
}
