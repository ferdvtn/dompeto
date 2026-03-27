import { createClient } from "@libsql/client"
import fs from "fs"

// Simple env parser
const env = {}
try {
	const content = fs.readFileSync(".env.local", "utf8")
	content.split("\n").forEach((line) => {
		const [key, ...val] = line.split("=")
		if (key) env[key.trim()] = val.join("=").trim()
	})
} catch (e) {
	console.error("Failed to read .env.local")
}

const db = createClient({
	url: env.TURSO_DATABASE_URL,
	authToken: env.TURSO_AUTH_TOKEN,
})

const schema = `
-- Drop existing tables to start fresh
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS daily_stats;
DROP TABLE IF EXISTS login_attempts;

-- Categories Table
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT NOT NULL, -- Lucide icon name
  type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
  is_default INTEGER DEFAULT 0,
  monthly_budget INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT (datetime('now', '+7 hours'))
);

-- Transactions Table
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER DEFAULT 1,
  raw_input TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
  category_id INTEGER REFERENCES categories(id),
  description TEXT,
  notes TEXT,
  ai_confirmed INTEGER DEFAULT 0,
  date DATETIME,
  created_at DATETIME DEFAULT (datetime('now', '+7 hours')),
  updated_at DATETIME DEFAULT (datetime('now', '+7 hours'))
);

-- Settings Table
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Daily Stats Table
CREATE TABLE daily_stats (
  date TEXT PRIMARY KEY, -- YYYY-MM-DD
  transaction_count INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  chat_used INTEGER DEFAULT 0,
  parse_used INTEGER DEFAULT 0
);

-- Login Attempts Table (Security)
CREATE TABLE login_attempts (
  ip TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0,
  last_attempt DATETIME DEFAULT (datetime('now', 'localtime'))
);

-- Initial Categories (Seeding)
INSERT INTO categories (name, icon, type, is_default) VALUES 
('Makan & Minuman', 'Utensils', 'expense', 1),
('Transport', 'Car', 'expense', 1),
('Belanja', 'ShoppingBag', 'expense', 1),
('Hiburan', 'Gamepad2', 'expense', 1),
('Kesehatan', 'HeartPulse', 'expense', 1),
('Tagihan', 'Receipt', 'expense', 1),
('Pendidikan', 'GraduationCap', 'expense', 1),
('Invest', 'TrendingUp', 'expense', 1),
('Pemasukan', 'Wallet', 'income', 1),
('Lainnya', 'MoreHorizontal', 'expense', 1);

-- Initial Settings
INSERT INTO settings (key, value) VALUES 
('salary_day', '25'),
('monthly_budget', '0');
`

async function migrate() {
	try {
		console.log("Migrating database schema for Dompeto Revamp...")
		const statements = schema
			.split(";")
			.map((s) => s.trim())
			.filter((s) => s.length > 0)

		for (const statement of statements) {
			await db.execute(statement)
		}
		console.log("Success! Database migrated and seeded.")
	} catch (e) {
		console.error("Migration failed:", e.message)
	}
}

migrate()
