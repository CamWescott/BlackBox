const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get all friends
router.get('/', (req, res) => {
  const friends = db.prepare(`
    SELECT u.id, u.email, u.name, u.icon_color, f.status, f.id as friendship_id,
      CASE WHEN f.user_id = ? THEN 'sent' ELSE 'received' END as direction
    FROM friends f
    JOIN users u ON (CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END) = u.id
    WHERE f.user_id = ? OR f.friend_id = ?
  `).all(req.userId, req.userId, req.userId, req.userId);

  res.json(friends);
});

// Send friend request by email
router.post('/request', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const friend = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!friend) {
    return res.status(404).json({ error: 'No user found with that email' });
  }

  if (friend.id === req.userId) {
    return res.status(400).json({ error: 'Cannot add yourself as a friend' });
  }

  const existing = db.prepare(`
    SELECT * FROM friends
    WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
  `).get(req.userId, friend.id, friend.id, req.userId);

  if (existing) {
    return res.status(409).json({ error: 'Friend request already exists' });
  }

  db.prepare('INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)').run(req.userId, friend.id, 'pending');
  res.json({ success: true, message: 'Friend request sent' });
});

// Accept friend request
router.patch('/:id/accept', (req, res) => {
  const friendship = db.prepare('SELECT * FROM friends WHERE id = ? AND friend_id = ?').get(req.params.id, req.userId);
  if (!friendship) {
    return res.status(404).json({ error: 'Friend request not found' });
  }

  db.prepare('UPDATE friends SET status = ? WHERE id = ?').run('accepted', req.params.id);
  res.json({ success: true });
});

// Decline / remove friend
router.delete('/:id', (req, res) => {
  const friendship = db.prepare(`
    SELECT * FROM friends WHERE id = ? AND (user_id = ? OR friend_id = ?)
  `).get(req.params.id, req.userId, req.userId);

  if (!friendship) {
    return res.status(404).json({ error: 'Friendship not found' });
  }

  db.prepare('DELETE FROM friends WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
