const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Haversine formula for distance in miles between two lat/lng points
function haversine(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Helper to attach companions to flights
function attachCompanions(db, flights) {
  return flights.map(flight => {
    const companions = db.prepare(`
      SELECT fc.*, u.name as user_name, u.icon_color
      FROM flight_companions fc
      LEFT JOIN users u ON fc.user_id = u.id
      WHERE fc.flight_id = ?
    `).all(flight.id);
    return { ...flight, companions };
  });
}

// Get all flights for the current user
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const flights = db.prepare(`
    SELECT * FROM flights WHERE user_id = ? ORDER BY travel_date DESC, leg_order ASC
  `).all(req.userId);
  res.json(attachCompanions(db, flights));
});

// Get flights for a friend
router.get('/friend/:friendId', (req, res) => {
  const db = req.app.locals.db;
  const friendId = Number(req.params.friendId);

  const friendship = db.prepare(`
    SELECT * FROM friends
    WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
    AND status = 'accepted'
  `).get(req.userId, friendId, friendId, req.userId);

  if (!friendship) {
    return res.status(403).json({ error: 'Not friends with this user' });
  }

  const flights = db.prepare(`
    SELECT * FROM flights WHERE user_id = ? ORDER BY travel_date DESC
  `).all(friendId);
  res.json(attachCompanions(db, flights));
});

// Get travel stats
router.get('/stats', (req, res) => {
  const db = req.app.locals.db;
  const flights = db.prepare(`
    SELECT * FROM flights WHERE user_id = ? AND status = 'flown'
  `).all(req.userId);

  // Total miles
  let totalMiles = 0;
  flights.forEach(f => {
    totalMiles += haversine(f.origin_lat, f.origin_lng, f.destination_lat, f.destination_lng);
  });

  // Most visited airports
  const airportCounts = {};
  flights.forEach(f => {
    airportCounts[f.origin_code] = (airportCounts[f.origin_code] || 0) + 1;
    airportCounts[f.destination_code] = (airportCounts[f.destination_code] || 0) + 1;
  });
  const topAirports = Object.entries(airportCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => ({ code, count }));

  // Most flown airlines
  const airlineCounts = {};
  flights.forEach(f => {
    airlineCounts[f.airline] = (airlineCounts[f.airline] || 0) + 1;
  });
  const topAirlines = Object.entries(airlineCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([airline, count]) => ({ airline, count }));

  // Yearly breakdown
  const yearlyFlights = {};
  flights.forEach(f => {
    const year = f.travel_date.substring(0, 4);
    if (!yearlyFlights[year]) yearlyFlights[year] = { flights: 0, miles: 0 };
    yearlyFlights[year].flights += 1;
    yearlyFlights[year].miles += haversine(f.origin_lat, f.origin_lng, f.destination_lat, f.destination_lng);
  });

  // Monthly heatmap (flight count per month for all years)
  const monthlyHeatmap = {};
  flights.forEach(f => {
    const month = f.travel_date.substring(0, 7); // YYYY-MM
    monthlyHeatmap[month] = (monthlyHeatmap[month] || 0) + 1;
  });

  // Cabin class breakdown
  const cabinCounts = {};
  flights.forEach(f => {
    const cabin = f.cabin_class || 'economy';
    cabinCounts[cabin] = (cabinCounts[cabin] || 0) + 1;
  });

  res.json({
    totalFlights: flights.length,
    totalMiles: Math.round(totalMiles),
    totalKm: Math.round(totalMiles * 1.60934),
    uniqueAirports: new Set([...flights.map(f => f.origin_code), ...flights.map(f => f.destination_code)]).size,
    uniqueAirlines: new Set(flights.map(f => f.airline)).size,
    topAirports,
    topAirlines,
    yearlyFlights,
    monthlyHeatmap,
    cabinCounts,
  });
});

// Add a new flight (or multi-leg trip)
router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const { legs, companions: sharedCompanions, ...singleFlight } = req.body;

  // Multi-leg trip
  if (legs && legs.length > 1) {
    const tripName = `${legs[0].origin_code} → ${legs[legs.length - 1].destination_code}`;
    const tripResult = db.prepare('INSERT INTO trips (user_id, name) VALUES (?, ?)').run(req.userId, tripName);
    const tripId = tripResult.lastInsertRowid;

    const createdFlights = [];
    legs.forEach((leg, index) => {
      const result = db.prepare(`
        INSERT INTO flights (user_id, trip_id, leg_order, airline, flight_number, origin_code, origin_name, origin_lat, origin_lng,
          destination_code, destination_name, destination_lat, destination_lng, seat_number, cabin_class, notes, travel_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.userId, tripId, index, leg.airline, leg.flight_number,
        leg.origin_code, leg.origin_name, leg.origin_lat, leg.origin_lng,
        leg.destination_code, leg.destination_name, leg.destination_lat, leg.destination_lng,
        leg.seat_number, leg.cabin_class || 'economy', leg.notes || null,
        leg.travel_date, leg.status || 'booked'
      );

      const flightId = result.lastInsertRowid;

      // Add shared companions to each leg
      if (sharedCompanions && sharedCompanions.length > 0) {
        for (const companion of sharedCompanions) {
          let companionUserId = null;
          if (companion.email) {
            const user = db.prepare('SELECT id FROM users WHERE email = ?').get(companion.email);
            if (user) companionUserId = user.id;
          }
          db.prepare('INSERT INTO flight_companions (flight_id, user_id, name, seat_number) VALUES (?, ?, ?, ?)')
            .run(flightId, companionUserId, companion.name, companion.seat_number || null);
        }
      }

      const flight = db.prepare('SELECT * FROM flights WHERE id = ?').get(flightId);
      createdFlights.push(flight);
    });

    res.json(attachCompanions(db, createdFlights));
    return;
  }

  // Single flight
  const {
    airline, flight_number, origin_code, origin_name, origin_lat, origin_lng,
    destination_code, destination_name, destination_lat, destination_lng,
    seat_number, cabin_class, notes, travel_date, status, companions
  } = req.body;

  if (!airline || !flight_number || !origin_code || !destination_code || !travel_date) {
    return res.status(400).json({ error: 'Missing required flight information' });
  }

  const result = db.prepare(`
    INSERT INTO flights (user_id, airline, flight_number, origin_code, origin_name, origin_lat, origin_lng,
      destination_code, destination_name, destination_lat, destination_lng, seat_number, cabin_class, notes, travel_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.userId, airline, flight_number, origin_code, origin_name, origin_lat, origin_lng,
    destination_code, destination_name, destination_lat, destination_lng,
    seat_number, cabin_class || 'economy', notes || null, travel_date, status || 'booked'
  );

  const flightId = result.lastInsertRowid;

  if (companions && companions.length > 0) {
    for (const companion of companions) {
      let companionUserId = null;
      if (companion.email) {
        const user = db.prepare('SELECT id FROM users WHERE email = ?').get(companion.email);
        if (user) companionUserId = user.id;
      }
      db.prepare('INSERT INTO flight_companions (flight_id, user_id, name, seat_number) VALUES (?, ?, ?, ?)')
        .run(flightId, companionUserId, companion.name, companion.seat_number || null);
    }
  }

  const flight = db.prepare('SELECT * FROM flights WHERE id = ?').get(flightId);
  res.json(attachCompanions(db, [flight])[0]);
});

// Delete a flight
router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  const id = Number(req.params.id);

  const flight = db.prepare('SELECT * FROM flights WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!flight) {
    return res.status(404).json({ error: 'Flight not found' });
  }

  db.prepare('DELETE FROM flight_companions WHERE flight_id = ?').run(id);
  db.prepare('DELETE FROM flights WHERE id = ?').run(id);
  res.json({ success: true });
});

// Update flight status (booked -> flown)
router.patch('/:id/status', (req, res) => {
  const db = req.app.locals.db;
  const id = Number(req.params.id);
  const { status } = req.body;

  const flight = db.prepare('SELECT * FROM flights WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!flight) {
    return res.status(404).json({ error: 'Flight not found' });
  }

  db.prepare('UPDATE flights SET status = ? WHERE id = ?').run(status, id);
  res.json({ ...flight, status });
});

module.exports = router;
