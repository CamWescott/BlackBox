import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function GlobeMap({ flights = [], height = '400px', showFlags = false, showPaths = false, userColor = '#22c55e' }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 8,
      worldCopyJump: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    if (flights.length === 0) return;

    const flownFlights = flights.filter(f => f.status === 'flown');
    const displayFlights = showPaths ? flownFlights : flights;

    if (showFlags) {
      // Show flag markers at each unique destination
      const visited = new Map();
      flownFlights.forEach(f => {
        if (!visited.has(f.destination_code)) {
          visited.set(f.destination_code, f);
        }
        if (!visited.has(f.origin_code)) {
          visited.set(f.origin_code, {
            destination_code: f.origin_code, destination_name: f.origin_name,
            destination_lat: f.origin_lat, destination_lng: f.origin_lng
          });
        }
      });

      visited.forEach((f) => {
        const flagIcon = L.divIcon({
          html: `<div style="font-size:20px; filter: drop-shadow(1px 1px 2px black);">📍</div>`,
          className: 'flag-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        });

        L.marker([f.destination_lat, f.destination_lng], { icon: flagIcon })
          .addTo(map)
          .bindPopup(`<b>${f.destination_code}</b><br>${f.destination_name}`);
      });
    }

    if (showPaths) {
      displayFlights.forEach(f => {
        // Determine colors for this flight
        const colors = [userColor];
        if (f.companions) {
          f.companions.forEach(c => {
            if (c.icon_color && !colors.includes(c.icon_color)) {
              colors.push(c.icon_color);
            }
          });
        }

        const origin = [f.origin_lat, f.origin_lng];
        const dest = [f.destination_lat, f.destination_lng];

        // Draw curved path for each color
        colors.forEach((color, idx) => {
          const offset = (idx - (colors.length - 1) / 2) * 3;
          const curvePoints = generateCurve(origin, dest, offset);

          L.polyline(curvePoints, {
            color: color,
            weight: 3,
            opacity: 0.8,
            dashArray: idx > 0 ? '8 4' : null,
          }).addTo(map);
        });

        // Airplane icon at midpoint
        const mid = getMidpoint(origin, dest);
        const angle = getAngle(origin, dest);
        const primaryColor = colors[0];

        // Build multi-color plane if shared flight
        const planeHtml = colors.length > 1
          ? `<div style="font-size:18px; transform:rotate(${angle}deg); filter: drop-shadow(0 0 3px ${primaryColor});">
              <span style="background: linear-gradient(90deg, ${colors.join(', ')}); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">✈</span>
            </div>`
          : `<div style="font-size:18px; transform:rotate(${angle}deg); color:${primaryColor}; filter: drop-shadow(0 0 3px ${primaryColor});">✈</div>`;

        const planeIcon = L.divIcon({
          html: planeHtml,
          className: 'plane-icon',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        L.marker(mid, { icon: planeIcon })
          .addTo(map)
          .bindPopup(`<b>${f.airline} ${f.flight_number}</b><br>${f.origin_code} → ${f.destination_code}<br>${f.travel_date}`);
      });
    }

    // Fit bounds
    if (displayFlights.length > 0) {
      const bounds = [];
      displayFlights.forEach(f => {
        bounds.push([f.origin_lat, f.origin_lng]);
        bounds.push([f.destination_lat, f.destination_lng]);
      });
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 5 });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [flights, showFlags, showPaths, userColor]);

  return <div ref={mapRef} style={{ height, width: '100%', borderRadius: '12px' }} />;
}

function generateCurve(origin, dest, offset = 0) {
  const points = [];
  const numPoints = 50;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = origin[0] + (dest[0] - origin[0]) * t;
    const lng = origin[1] + (dest[1] - origin[1]) * t;

    // Arc height based on distance
    const dist = Math.sqrt(Math.pow(dest[0] - origin[0], 2) + Math.pow(dest[1] - origin[1], 2));
    const arcHeight = dist * 0.15;
    const arc = Math.sin(Math.PI * t) * arcHeight;

    // Perpendicular offset for multi-color lines
    const dx = dest[1] - origin[1];
    const dy = dest[0] - origin[0];
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpLat = (-dx / len) * offset * 0.02;
    const perpLng = (dy / len) * offset * 0.02;

    points.push([lat + arc * 0.01 + perpLat, lng + perpLng]);
  }

  return points;
}

function getMidpoint(origin, dest) {
  const dist = Math.sqrt(Math.pow(dest[0] - origin[0], 2) + Math.pow(dest[1] - origin[1], 2));
  const arcHeight = dist * 0.15;
  const midLat = (origin[0] + dest[0]) / 2 + arcHeight * 0.01;
  const midLng = (origin[1] + dest[1]) / 2;
  return [midLat, midLng];
}

function getAngle(origin, dest) {
  const dLng = dest[1] - origin[1];
  const dLat = dest[0] - origin[0];
  return (Math.atan2(dLng, dLat) * 180) / Math.PI;
}
