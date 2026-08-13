import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { useState, useMemo, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Color-coded custom icons by event type
const TYPE_COLORS = {
  Training: '#3b82f6',   // blue
  Race: '#ef4444',       // red
  Event: '#8b5cf6',      // violet
  Fun: '#10b981',        // emerald
  Facility: '#f59e0b',   // amber
};

function createColorIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 28px; height: 28px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

// Royal Corinthian Yacht Club, Burnham-on-Crouch
const RCYC_COORDS = [51.62362, 0.82192];

// Known location coordinates
const LOCATION_LOOKUP = {
  // Club — all refer to Royal Corinthian Yacht Club
  'royal corinthian': RCYC_COORDS,
  'corinthian': RCYC_COORDS,
  'rcyc': RCYC_COORDS,
  'the club': RCYC_COORDS,
  'club': RCYC_COORDS,
  'clubhouse': RCYC_COORDS,
  'yacht club': RCYC_COORDS,
  'burnham': RCYC_COORDS,
  'burnham on crouch': RCYC_COORDS,
  'burnham-on-crouch': RCYC_COORDS,
  // Other Essex / East Anglia sailing spots
  'mersea': [51.7779, 0.9261],
  'west mersea': [51.7779, 0.9261],
  'brightlingsea': [51.8119, 1.0191],
  'maldon': [51.7310, 0.6752],
  'river crouch': [51.6247, 0.8173],
  'crouch': [51.6247, 0.8173],
  'blackwater': [51.7500, 0.8500],
  'river blackwater': [51.7500, 0.8500],
  'tollesbury': [51.7624, 0.8476],
  'rochford': [51.5835, 0.7076],
  'southend': [51.5363, 0.7127],
  'harwich': [51.9440, 1.2598],
  'colchester': [51.8959, 0.8919],
  'chelmsford': [51.7343, 0.4691],
  'london': [51.5074, -0.1278],
  'thames estuary': [51.5000, 0.5000],
  'north sea': [51.7000, 1.5000],
};

// Static club facilities at Royal Corinthian Yacht Club, Burnham-on-Crouch
const FACILITIES = [
  { id: 'facility-1', title: 'Royal Corinthian Yacht Club', type: 'Facility', coords: RCYC_COORDS, info: 'Clubhouse — bar, changing rooms, race office. Burnham-on-Crouch, Essex' },
  { id: 'facility-2', title: 'Boat Storage', type: 'Facility', coords: [51.6244, 0.8168], info: 'Dinghy & equipment storage area' },
  { id: 'facility-3', title: 'Pontoon / Slipway', type: 'Facility', coords: [51.6245, 0.8178], info: 'Main launch point onto the Crouch' },
];

function getCoords(location) {
  if (!location) return null;
  const lower = location.toLowerCase();
  for (const [key, coords] of Object.entries(LOCATION_LOOKUP)) {
    if (lower.includes(key)) return coords;
  }
  return null;
}

export default function EventsMap({ events = [], showFacilities = true }) {
  const today = new Date().toISOString().split('T')[0];
  const [geocoded, setGeocoded] = useState({}); // location -> [lat,lng] | null

  // Only show upcoming events
  const upcomingEvents = useMemo(() =>
    events.filter(e => e.date >= today && e.location && e.location.trim()),
    [events, today]
  );

  // Geocode locations not in the known lookup (cached on device)
  useEffect(() => {
    const unknown = [...new Set(
      upcomingEvents
        .map(e => e.location.trim().toLowerCase())
        .filter(loc => !getCoords(loc))
    )].filter(loc => geocoded[loc] === undefined);
    if (unknown.length === 0) return;

    unknown.forEach(async (loc) => {
      const cacheKey = `geocode:${loc}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setGeocoded(prev => ({ ...prev, [loc]: JSON.parse(cached) }));
        return;
      }
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=gb&q=${encodeURIComponent(loc)}`);
        const data = await res.json();
        const coords = data[0] ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
        localStorage.setItem(cacheKey, JSON.stringify(coords));
        setGeocoded(prev => ({ ...prev, [loc]: coords }));
      } catch {
        setGeocoded(prev => ({ ...prev, [loc]: null }));
      }
    });
  }, [upcomingEvents, geocoded]);

  const markers = useMemo(() => {
    const evtMarkers = upcomingEvents
      .map(e => ({ ...e, coords: getCoords(e.location) || geocoded[e.location.trim().toLowerCase()] || null, isEvent: true }))
      .filter(e => e.coords);

    const facilityMarkers = showFacilities ? FACILITIES.map(f => ({ ...f, isEvent: false })) : [];

    return [...evtMarkers, ...facilityMarkers];
  }, [upcomingEvents, showFacilities, geocoded]);

  const [activeFilter, setActiveFilter] = useState('All');
  const [showFacilitiesLayer, setShowFacilitiesLayer] = useState(showFacilities);

  const filteredMarkers = useMemo(() => {
    return markers.filter(m => {
      if (!showFacilitiesLayer && !m.isEvent) return false;
      if (activeFilter === 'All') return true;
      if (activeFilter === 'Facilities') return !m.isEvent;
      return m.type === activeFilter;
    });
  }, [markers, activeFilter, showFacilitiesLayer]);

  const typeFilters = ['All', 'Training', 'Race', 'Event', 'Fun', 'Facilities'];

  const defaultCenter = RCYC_COORDS;

  // Group nearby markers to show cluster circles
  const clusters = useMemo(() => {
    const visited = new Set();
    const result = [];
    filteredMarkers.filter(m => m.isEvent).forEach((m, i) => {
      if (visited.has(i)) return;
      const group = [m];
      visited.add(i);
      filteredMarkers.forEach((other, j) => {
        if (visited.has(j) || i === j || !other.isEvent) return;
        const dist = Math.sqrt(Math.pow(m.coords[0] - other.coords[0], 2) + Math.pow(m.coords[1] - other.coords[1], 2));
        if (dist < 0.01) { group.push(other); visited.add(j); }
      });
      if (group.length > 1) {
        const lat = group.reduce((s, x) => s + x.coords[0], 0) / group.length;
        const lng = group.reduce((s, x) => s + x.coords[1], 0) / group.length;
        result.push({ coords: [lat, lng], count: group.length });
      }
    });
    return result;
  }, [filteredMarkers]);

  if (markers.filter(m => m.isEvent).length === 0 && !showFacilities) {
    return (
      <div className="w-full h-64 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
        <p className="text-white/40 text-sm">No upcoming events with locations</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        {typeFilters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
              activeFilter === f
                ? 'bg-white text-black border-white'
                : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/70'
            }`}
            style={activeFilter === f && TYPE_COLORS[f] ? { background: TYPE_COLORS[f], borderColor: TYPE_COLORS[f], color: 'white' } : {}}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: '360px' }}>
        <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          {/* Cluster halos */}
          {clusters.map((c, i) => (
            <Circle key={`c-${i}`} center={c.coords} radius={c.count * 300}
              pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.1, color: '#3b82f6', opacity: 0.2, weight: 1 }}
            />
          ))}

          {/* Markers */}
          {filteredMarkers.map((marker) => {
            const color = TYPE_COLORS[marker.type] || '#6b7280';
            return (
              <Marker key={marker.id} position={marker.coords} icon={createColorIcon(color)}>
                <Popup>
                  <div style={{ minWidth: '160px' }}>
                    <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>{marker.title}</p>
                    {marker.location && <p style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>📍 {marker.location}</p>}
                    {marker.date && <p style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>📅 {(() => { try { return format(new Date(marker.date), 'dd MMM yyyy'); } catch { return marker.date; } })()}</p>}
                    {marker.time && <p style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>🕐 {marker.time}</p>}
                    {marker.info && <p style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{marker.info}</p>}
                    <span style={{ display: 'inline-block', marginTop: '6px', padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 600, background: color, color: 'white' }}>
                      {marker.type}
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-white/40 text-[11px]">{type}</span>
          </div>
        ))}
      </div>

      {/* Upcoming events count */}
      <p className="text-white/25 text-xs px-1">
        Showing {filteredMarkers.filter(m => m.isEvent).length} upcoming event{filteredMarkers.filter(m => m.isEvent).length !== 1 ? 's' : ''} with known locations
        {showFacilitiesLayer && ` + ${FACILITIES.length} facilities`}
      </p>
    </div>
  );
}