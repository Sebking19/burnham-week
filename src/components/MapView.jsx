import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

export default function MapView({ events = [] }) {
  const [selectedMarker, setSelectedMarker] = useState(null);

  // Parse event locations and create markers
  const eventsWithLocations = useMemo(() => {
    return events.filter(e => e.location && e.location.trim());
  }, [events]);

  const RCYC = [51.62362, 0.82192];
  const locationCoords = {
    'royal corinthian': RCYC, 'corinthian': RCYC, 'rcyc': RCYC,
    'the club': RCYC, 'club': RCYC, 'clubhouse': RCYC, 'yacht club': RCYC,
    'burnham': RCYC, 'burnham on crouch': RCYC, 'burnham-on-crouch': RCYC,
    'mersea': [51.7779, 0.9261], 'brightlingsea': [51.8119, 1.0191],
    'maldon': [51.7310, 0.6752], 'crouch': RCYC, 'blackwater': [51.7500, 0.8500],
    'london': [51.5074, -0.1278],
  };

  const getCoordinates = (location) => {
    const lower = location.toLowerCase();
    for (const [key, coords] of Object.entries(locationCoords)) {
      if (lower.includes(key)) return coords;
    }
    return RCYC; // Default to RCYC
  };

  const markers = eventsWithLocations.map(event => ({
    ...event,
    coords: getCoordinates(event.location)
  }));

  // Calculate hotspots (cluster nearby events)
  const hotspots = useMemo(() => {
    if (markers.length === 0) return [];
    
    const clusters = [];
    const visited = new Set();

    markers.forEach((marker, i) => {
      if (visited.has(i)) return;
      
      const cluster = [marker];
      visited.add(i);

      markers.forEach((other, j) => {
        if (visited.has(j) || i === j) return;
        const dist = Math.sqrt(
          Math.pow(marker.coords[0] - other.coords[0], 2) +
          Math.pow(marker.coords[1] - other.coords[1], 2)
        );
        if (dist < 0.05) {
          cluster.push(other);
          visited.add(j);
        }
      });

      if (cluster.length > 0) {
        const avgLat = cluster.reduce((sum, m) => sum + m.coords[0], 0) / cluster.length;
        const avgLng = cluster.reduce((sum, m) => sum + m.coords[1], 0) / cluster.length;
        clusters.push({
          coords: [avgLat, avgLng],
          count: cluster.length,
          events: cluster
        });
      }
    });

    return clusters;
  }, [markers]);

  if (markers.length === 0) {
    return (
      <div className="w-full h-64 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
        <p className="text-white/40 text-sm">No events with locations to display</p>
      </div>
    );
  }

  const bounds = markers.map(m => m.coords);
  const defaultCenter = bounds[0] || [51.5074, -0.1278];

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10">
      <MapContainer
        center={defaultCenter}
        zoom={9}
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
          opacity={0.7}
        />

        {/* Hotspot circles */}
        {hotspots.map((hotspot, idx) => (
          <Circle
            key={`hotspot-${idx}`}
            center={hotspot.coords}
            radius={hotspot.count * 500}
            pathOptions={{
              fillColor: '#3b82f6',
              fillOpacity: 0.15,
              color: '#3b82f6',
              opacity: 0.3,
              weight: 2
            }}
          />
        ))}

        {/* Event markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.coords}
            eventHandlers={{
              click: () => setSelectedMarker(marker.id),
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{marker.title}</p>
                <p className="text-gray-600 text-xs">{marker.location}</p>
                {marker.time && <p className="text-gray-600 text-xs">{marker.time}</p>}
                {marker.type && <p className="text-gray-600 text-xs">Type: {marker.type}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Location legend */}
      <div className="bg-white/[0.03] border-t border-white/10 p-3">
        <p className="text-xs text-white/50 font-semibold mb-2">Events by Location</p>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-white/40">
          {[...new Set(markers.map(m => m.location))].slice(0, 4).map(loc => (
            <div key={loc} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span>{loc}</span>
            </div>
          ))}
          {[...new Set(markers.map(m => m.location))].length > 4 && (
            <span className="text-white/30">+{[...new Set(markers.map(m => m.location))].length - 4} more</span>
          )}
        </div>
      </div>
    </div>
  );
}