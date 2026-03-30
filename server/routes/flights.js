const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get all flights for the current user
router.get('/', (req, res) => {
  const flights = db.prepare(`
    SELECT * FROM flights WHERE user_id = ? ORDER BY travel_date DESC
  `).all(req.userId);

  const flightsWithCompanions = flights.map(flight => {
    const companions = db.prepare(`
      SELECT fc.*, u.name as user_name, u.icon_color
      FROM flight_companions fc
      LEFT JOIN users u ON fc.user_id = u.id
      WHERE fc.flight_id = ?
    `).all(flight.id);
    return { ...flight, companions };
  });

  res.json(flightsWithCompanions);
});

// Get flights for a friend
router.get('/friend/:friendId', (req, res) => {
  const friendship = db.prepare(`
    SELECT * FROM friends
    WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
    AND status = 'accepted'
  `).get(req.userId, req.params.friendId, req.params.friendId, req.userId);

  if (!friendship) {
    return res.status(403).json({ error: 'Not friends with this user' });
  }

  const flights = db.prepare(`
    SELECT * FROM flights WHERE user_id = ? ORDER BY travel_date DESC
  `).all(req.params.friendId);

  const flightsWithCompanions = flights.map(flight => {
    const companions = db.prepare(`
      SELECT fc.*, u.name as user_name, u.icon_color
      FROM flight_companions fc
      LEFT JOIN users u ON fc.user_id = u.id
      WHERE fc.flight_id = ?
    `).all(flight.id);
    return { ...flight, companions };
  });

  res.json(flightsWithCompanions);
});

// Add a new flight
router.post('/', (req, res) => {
  const {
    airline, flight_number, origin_code, origin_name, origin_lat, origin_lng,
    destination_code, destination_name, destination_lat, destination_lng,
    seat_number, travel_date, status, companions
  } = req.body;

  if (!airline || !flight_number || !origin_code || !destination_code || !travel_date) {
    return res.status(400).json({ error: 'Missing required flight information' });
  }

  const result = db.prepare(`
    INSERT INTO flights (user_id, airline, flight_number, origin_code, origin_name, origin_lat, origin_lng,
      destination_code, destination_name, destination_lat, destination_lng, seat_number, travel_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.userId, airline, flight_number, origin_code, origin_name, origin_lat, origin_lng,
    destination_code, destination_name, destination_lat, destination_lng,
    seat_number, travel_date, status || 'booked'
  );

  const flightId = result.lastInsertRowid;

  if (companions && companions.length > 0) {
    const insertCompanion = db.prepare(`
      INSERT INTO flight_companions (flight_id, user_id, name, seat_number)
      VALUES (?, ?, ?, ?)
    `);

    for (const companion of companions) {
      let companionUserId = null;
      if (companion.email) {
        const user = db.prepare('SELECT id FROM users WHERE email = ?').get(companion.email);
        if (user) companionUserId = user.id;
      }
      insertCompanion.run(flightId, companionUserId, companion.name, companion.seat_number || null);
    }
  }

  const flight = db.prepare('SELECT * FROM flights WHERE id = ?').get(flightId);
  const flightCompanions = db.prepare(`
    SELECT fc.*, u.name as user_name, u.icon_color
    FROM flight_companions fc
    LEFT JOIN users u ON fc.user_id = u.id
    WHERE fc.flight_id = ?
  `).all(flightId);

  res.json({ ...flight, companions: flightCompanions });
});

// Delete a flight
router.delete('/:id', (req, res) => {
  const flight = db.prepare('SELECT * FROM flights WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!flight) {
    return res.status(404).json({ error: 'Flight not found' });
  }

  db.prepare('DELETE FROM flights WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Update flight status (booked -> flown)
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const flight = db.prepare('SELECT * FROM flights WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!flight) {
    return res.status(404).json({ error: 'Flight not found' });
  }

  db.prepare('UPDATE flights SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ...flight, status });
});

module.exports = router;
