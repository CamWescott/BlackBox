const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const flightRoutes = require('./routes/flights');
const friendRoutes = require('./routes/friends');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`BlackBox server running on port ${PORT}`);
});
