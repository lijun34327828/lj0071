import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'gym.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    gender VARCHAR(10) DEFAULT 'other',
    total_hours INTEGER NOT NULL DEFAULT 0,
    remaining_hours INTEGER NOT NULL DEFAULT 0,
    card_type VARCHAR(20) NOT NULL,
    card_package VARCHAR(50) NOT NULL,
    expire_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS checkin_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    member_name VARCHAR(50) NOT NULL,
    checkin_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    remaining_after INTEGER NOT NULL,
    FOREIGN KEY (member_id) REFERENCES members(id)
  );

  CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
  CREATE INDEX IF NOT EXISTS idx_checkin_member ON checkin_records(member_id);
`);

export default db;
