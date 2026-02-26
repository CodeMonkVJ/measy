const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const userDbPath = path.join(dataDir, 'user.db');
const db = new Database(userDbPath);
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
`);

const initialUserColumns = db.prepare('PRAGMA table_info(users)').all();
const hasEmailColumn = initialUserColumns.some((column) => column.name === 'email');
const hasUsernameColumn = initialUserColumns.some((column) => column.name === 'username');

if (!hasUsernameColumn) {
  db.exec('ALTER TABLE users ADD COLUMN username TEXT');
}

if (hasEmailColumn) {
  db.exec(`
    UPDATE users
    SET username = lower(trim(email))
    WHERE (username IS NULL OR trim(username) = '')
      AND email IS NOT NULL
      AND trim(email) <> '';

    UPDATE users
    SET username = 'user_' || id
    WHERE username IS NULL OR trim(username) = '';
  `);
}

db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)');

const userColumns = db.prepare('PRAGMA table_info(users)').all();
const usesLegacyEmailColumn = userColumns.some((column) => column.name === 'email');

const statements = {
  createUserModern: db.prepare(`
    INSERT INTO users (username, password_hash)
    VALUES (@username, @password_hash)
  `),
  createUserLegacy: usesLegacyEmailColumn
    ? db.prepare(`
      INSERT INTO users (username, email, password_hash)
      VALUES (@username, @email, @password_hash)
    `)
    : null,
  getUserById: db.prepare('SELECT id, username, created_at, password_hash FROM users WHERE id = ?'),
  getUserByUsername: db.prepare('SELECT id, username, created_at, password_hash FROM users WHERE username = ?'),
  createSession: db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (@token, @user_id, @expires_at)
  `),
  getSessionByToken: db.prepare(`
    SELECT
      s.id AS session_id,
      s.token,
      s.user_id,
      s.expires_at,
      u.id AS user_id_value,
      u.username
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ?
  `),
  deleteSessionByToken: db.prepare('DELETE FROM sessions WHERE token = ?'),
  deleteExpiredSessions: db.prepare('DELETE FROM sessions WHERE expires_at <= ?')
};

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password || ''), salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verifyPassword(password, passwordHash) {
  const value = String(passwordHash || '');
  const [saltHex, hashHex] = value.split(':');
  if (!saltHex || !hashHex) {
    return false;
  }

  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const candidate = crypto.scryptSync(String(password || ''), salt, expected.length);
    return expected.length === candidate.length && crypto.timingSafeEqual(expected, candidate);
  } catch (_error) {
    return false;
  }
}

function createUser(usernameRaw, passwordRaw) {
  const username = normalizeUsername(usernameRaw);
  const password = String(passwordRaw || '');
  const passwordHash = hashPassword(password);

  const result = usesLegacyEmailColumn
    ? statements.createUserLegacy.run({
      username,
      email: `${username}@measy.local`,
      password_hash: passwordHash
    })
    : statements.createUserModern.run({
      username,
      password_hash: passwordHash
    });

  return {
    id: Number(result.lastInsertRowid),
    username
  };
}

function getUserByUsername(usernameRaw) {
  const username = normalizeUsername(usernameRaw);
  return statements.getUserByUsername.get(username) || null;
}

function getUserById(userId) {
  return statements.getUserById.get(userId) || null;
}

function createSession(userId, expiresAtMs) {
  const token = crypto.randomBytes(32).toString('hex');
  statements.createSession.run({
    token,
    user_id: userId,
    expires_at: Number(expiresAtMs)
  });
  return token;
}

function getSessionUserByToken(tokenRaw) {
  const token = String(tokenRaw || '').trim();
  if (!token) {
    return null;
  }

  const session = statements.getSessionByToken.get(token);
  if (!session) {
    return null;
  }

  return {
    sessionId: session.session_id,
    token: session.token,
    userId: session.user_id,
    expiresAt: Number(session.expires_at),
    user: {
      id: Number(session.user_id_value),
      username: session.username
    }
  };
}

function deleteSessionByToken(tokenRaw) {
  const token = String(tokenRaw || '').trim();
  if (!token) {
    return;
  }
  statements.deleteSessionByToken.run(token);
}

function clearExpiredSessions(nowMs) {
  statements.deleteExpiredSessions.run(Number(nowMs));
}

module.exports = {
  normalizeUsername,
  verifyPassword,
  createUser,
  getUserByUsername,
  getUserById,
  createSession,
  getSessionUserByToken,
  deleteSessionByToken,
  clearExpiredSessions
};
