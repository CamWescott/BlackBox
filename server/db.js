const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'blackbox.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    icon_color TEXT DEFAULT '#22c55e',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id),
    UNIQUE(user_id, friend_id)
  );

  CREATE TABLE IF NOT EXISTS flights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    airline TEXT NOT NULL,
    flight_number TEXT NOT NULL,
    origin_code TEXT NOT NULL,
    origin_name TEXT NOT NULL,
    origin_lat REAL NOT NULL,
    origin_lng REAL NOT NULL,
    destination_code TEXT NOT NULL,
    destination_name TEXT NOT NULL,
    destination_lat REAL NOT NULL,
    destination_lng REAL NOT NULL,
    seat_number TEXT,
    travel_date TEXT NOT NULL,
    status TEXT DEFAULT 'booked',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS flight_companions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_id INTEGER NOT NULL,
    user_id INTEGER,
    name TEXT NOT NULL,
    seat_number TEXT,
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

module.exports = db;
