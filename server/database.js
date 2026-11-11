const path = require("path");
const Database = require("better-sqlite3");

const dbPath = process.env.DB_PATH || path.join(__dirname, "taskmanager.db");
const db = new Database(dbPath);


db.pragma("foreign_keys = ON");

// Users Table
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
`).run();

// Add verification column to existing users table
const userColumns = db.prepare("PRAGMA table_info(users)").all();

if (!userColumns.some(column => column.name === "is_verified")) {
    db.prepare(`
        ALTER TABLE users
        ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 1
    `).run();
}

// Tasks Table
db.prepare(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT,
        status TEXT,
        due_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`).run();

// Email OTP Table
db.prepare(`
    CREATE TABLE IF NOT EXISTS email_otps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        purpose TEXT NOT NULL,
        otp_hash TEXT NOT NULL,
        name TEXT,
        password TEXT,
        expires_at INTEGER NOT NULL,
        attempts INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch())
    )
`).run();

console.log("Database connected and tables created!");

module.exports = db;
