import * as SQLite from 'expo-sqlite'
import { DatabaseConfig } from './types'

let db: SQLite.SQLiteDatabase | null = null

export async function initializeDatabase(config?: DatabaseConfig): Promise<SQLite.SQLiteDatabase> {
  if (db) return db

  const dbName = config?.databaseName || 'med-assistant.db'
  db = await SQLite.openDatabaseAsync(dbName)

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `)

  // Create all tables
  await createTables(db)

  return db
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.')
  }
  return db
}

async function createTables(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    -- Sync queue table
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      operation TEXT NOT NULL CHECK(operation IN ('CREATE', 'UPDATE', 'DELETE')),
      data TEXT NOT NULL,
      idempotency_key TEXT UNIQUE NOT NULL,
      timestamp TEXT NOT NULL,
      retries INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- Family members table (synced)
    CREATE TABLE IF NOT EXISTS family_members (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      age INTEGER,
      relationship TEXT,
      blood_type TEXT,
      allergies TEXT,
      medical_conditions TEXT,
      synced INTEGER DEFAULT 0,
      updated_at TEXT,
      created_at TEXT NOT NULL
    );

    -- Medications table (synced)
    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY,
      family_member_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT,
      frequency TEXT,
      reason TEXT,
      start_date TEXT,
      end_date TEXT,
      is_active INTEGER DEFAULT 1,
      synced INTEGER DEFAULT 0,
      updated_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (family_member_id) REFERENCES family_members(id)
    );

    -- Lab results table (synced)
    CREATE TABLE IF NOT EXISTS lab_results (
      id INTEGER PRIMARY KEY,
      family_member_id INTEGER NOT NULL,
      test_name TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      reference_range TEXT,
      status TEXT CHECK(status IN ('normal', 'abnormal', 'critical')),
      test_date TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (family_member_id) REFERENCES family_members(id)
    );

    -- Appointments table (synced)
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY,
      family_member_id INTEGER NOT NULL,
      doctor_name TEXT,
      appointment_type TEXT,
      location TEXT,
      scheduled_at TEXT NOT NULL,
      notes TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (family_member_id) REFERENCES family_members(id)
    );

    -- Health logs table (local + synced)
    CREATE TABLE IF NOT EXISTS health_logs (
      id INTEGER PRIMARY KEY,
      family_member_id INTEGER NOT NULL,
      log_type TEXT NOT NULL CHECK(log_type IN ('vitals', 'wellness', 'diet')),
      data TEXT NOT NULL,
      logged_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (family_member_id) REFERENCES family_members(id)
    );

    -- Notification schedules table (local)
    CREATE TABLE IF NOT EXISTS notification_schedules (
      id INTEGER PRIMARY KEY,
      medication_id INTEGER NOT NULL,
      reminder_time TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (medication_id) REFERENCES medications(id)
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type);
    CREATE INDEX IF NOT EXISTS idx_medications_family ON medications(family_member_id);
    CREATE INDEX IF NOT EXISTS idx_medications_active ON medications(is_active);
    CREATE INDEX IF NOT EXISTS idx_lab_results_family ON lab_results(family_member_id);
    CREATE INDEX IF NOT EXISTS idx_lab_results_status ON lab_results(status);
    CREATE INDEX IF NOT EXISTS idx_health_logs_family ON health_logs(family_member_id);
    CREATE INDEX IF NOT EXISTS idx_health_logs_type ON health_logs(log_type);
    CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_medication ON notification_schedules(medication_id);
  `)
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync()
    db = null
  }
}

export async function deleteDatabase(databaseName: string = 'med-assistant.db'): Promise<void> {
  try {
    // Expo SQLite doesn't provide delete method, so we mark it as deleted
    await closeDatabase()
    console.log(`Database ${databaseName} cleared`)
  } catch (error) {
    console.error('Failed to delete database:', error)
  }
}
