const express = require('express');
const cors = require('cors');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database, then start server
getDb().then(db => {
  // Make db available to all routes via app.locals
  app.locals.db = db;

  const authRoutes = require('./routes/auth');
  const flightRoutes = require('./routes/flights');
  const friendRoutes = require('./routes/friends');
  const userRoutes = require('./routes/users');

  app.use('/api/auth', authRoutes);
  app.use('/api/flights', flightRoutes);
  app.use('/api/friends', friendRoutes);
  app.use('/api/users', userRoutes);

  app.listen(PORT, () => {
    console.log(`BlackBox server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
