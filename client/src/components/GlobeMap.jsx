import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function GlobeMap({ flights = [], height = '400px', showFlags = false, showPaths = false, userColor = '#22c55e', theme = 'dark' }) {
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

    const tileUrl = theme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
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
        // Collect all colors for this flight (user + companions)
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
        const curvePoints = generateCurve(origin, dest);

        // Single line with alternating color blocks
        drawColorBlockLine(map, curvePoints, colors);

        // Airplane SVG icon pointing in direction of travel
        const mid = getMidpoint(origin, dest);
        const angle = getAngle(origin, dest);

        const planeColor = colors[0];
        const planeSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="24" height="24">
            <path d="M10,1 L8,8 L2,11 L4,12 L8,10 L8,16 L6,17 L10,19 L14,17 L12,16 L12,10 L16,12 L18,11 L12,8 Z"
              fill="${planeColor}" stroke="rgba(0,0,0,0.6)" stroke-width="0.5"/>
          </svg>`;

        const planeIcon = L.divIcon({
          html: `<div style="transform:rotate(${angle}deg);transform-origin:center;width:24px;height:24px;filter:drop-shadow(0 0 3px rgba(0,0,0,0.8));">${planeSvg}</div>`,
          className: 'plane-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        // Build popup with airline info and companions
        const companionNames = (f.companions || []).map(c => c.user_name || c.name).filter(Boolean);
        let popupHtml = `<b>${f.airline} ${f.flight_number}</b><br>${f.origin_code} → ${f.destination_code}<br>${f.travel_date}`;
        if (f.cabin_class && f.cabin_class !== 'economy') {
          popupHtml += `<br><span style="text-transform:capitalize">${f.cabin_class.replace('_', ' ')}</span>`;
        }
        if (companionNames.length > 0) {
          popupHtml += `<br><i>with ${companionNames.join(', ')}</i>`;
        }

        L.marker(mid, { icon: planeIcon })
          .addTo(map)
          .bindPopup(popupHtml);

        // Airline label at midpoint
        const labelIcon = L.divIcon({
          html: `<div style="
            font-size:10px;
            font-weight:600;
            color:${theme === 'light' ? '#111' : '#fff'};
            background:${theme === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)'};
            padding:1px 5px;
            border-radius:4px;
            white-space:nowrap;
            pointer-events:none;
            transform:translateY(-18px);
          ">${f.airline}</div>`,
          className: 'airline-label',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        L.marker(mid, { icon: labelIcon, interactive: false }).addTo(map);
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
  }, [flights, showFlags, showPaths, userColor, theme]);

  return <div ref={mapRef} style={{ height, width: '100%', borderRadius: '12px' }} />;
}

function generateCurve(origin, dest) {
  const points = [];
  const numPoints = 60;
  const dist = Math.sqrt(Math.pow(dest[0] - origin[0], 2) + Math.pow(dest[1] - origin[1], 2));
  const arcHeight = dist * 0.15;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = origin[0] + (dest[0] - origin[0]) * t;
    const lng = origin[1] + (dest[1] - origin[1]) * t;
    const arc = Math.sin(Math.PI * t) * arcHeight * 0.01;
    points.push([lat + arc, lng]);
  }

  return points;
}

// Draw a single curved line with alternating color blocks
function drawColorBlockLine(map, curvePoints, colors) {
  if (colors.length === 1) {
    L.polyline(curvePoints, { color: colors[0], weight: 3, opacity: 0.9 }).addTo(map);
    return;
  }

  // Split into (colors.length * 5) blocks, cycling through colors
  const numBlocks = colors.length * 5;
  const blockSize = Math.ceil(curvePoints.length / numBlocks);

  for (let block = 0; block < numBlocks; block++) {
    const start = block * blockSize;
    const end = Math.min(start + blockSize + 1, curvePoints.length); // +1 overlap prevents gaps
    if (start >= curvePoints.length) break;

    L.polyline(curvePoints.slice(start, end), {
      color: colors[block % colors.length],
      weight: 3,
      opacity: 0.9,
    }).addTo(map);
  }
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
