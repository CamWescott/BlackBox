const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get current user profile
router.get('/me', (req, res) => {
  const user = db.prepare('SELECT id, email, name, icon_color, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Update icon color
router.patch('/color', (req, res) => {
  const { icon_color } = req.body;
  if (!icon_color) {
    return res.status(400).json({ error: 'Color is required' });
  }

  db.prepare('UPDATE users SET icon_color = ? WHERE id = ?').run(icon_color, req.userId);
  res.json({ success: true, icon_color });
});

// Update profile
router.patch('/profile', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.userId);
  res.json({ success: true, name });
});

module.exports = router;
