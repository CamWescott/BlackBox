const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'blackbox.db');

let db;

// Wrapper to provide a better-sqlite3-compatible API over sql.js
const wrapper = {
  prepare(sql) {
    return {
      get(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        let row = null;
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          row = {};
          cols.forEach((c, i) => { row[c] = vals[i]; });
        }
        stmt.free();
        return row;
      },
      all(...params) {
        const rows = [];
        const stmt = db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const row = {};
          cols.forEach((c, i) => { row[c] = vals[i]; });
          rows.push(row);
        }
        stmt.free();
        return rows;
      },
      run(...params) {
        db.run(sql, params);
        const lastId = db.exec('SELECT last_insert_rowid()')[0]?.values[0][0];
        const changes = db.getRowsModified();
        wrapper._save();
        return { lastInsertRowid: lastId, changes };
      }
    };
  },
  exec(sql) {
    db.run(sql);
    wrapper._save();
  },
  _save() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
};

// Initialize synchronously using sql.js's synchronous init
function initSync() {
  const SQL = require('sql.js');

  // sql.js can be initialized synchronously when not using wasm file
  // We need to handle async init properly
  return SQL;
}

// We need async init, so we export a promise-based setup
let initPromise = null;

function getDb() {
  if (db) return Promise.resolve(wrapper);
  if (initPromise) return initPromise;

  initPromise = initSqlJs().then(SQL => {
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        icon_color TEXT DEFAULT '#22c55e',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (friend_id) REFERENCES users(id),
        UNIQUE(user_id, friend_id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS flights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        trip_id INTEGER,
        leg_order INTEGER DEFAULT 0,
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
        cabin_class TEXT DEFAULT 'economy',
        notes TEXT,
        travel_date TEXT NOT NULL,
        status TEXT DEFAULT 'booked',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS flight_companions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flight_id INTEGER NOT NULL,
        user_id INTEGER,
        name TEXT NOT NULL,
        seat_number TEXT,
        FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    wrapper._save();
    return wrapper;
  });

  return initPromise;
}

module.exports = { getDb };
