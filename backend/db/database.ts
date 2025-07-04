import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../chat.db');

class Database {
  private db: sqlite3.Database | null = null;

  constructor() {
    this.connect();
  }

  private connect(): void {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error connecting to SQLite database:', err.message);
        process.exit(1);
      } else {
        console.log('✅ Connected to SQLite database:', DB_PATH);
        this.enableForeignKeys();
      }
    });
  }

  private enableForeignKeys(): void {
    if (this.db) {
      this.db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('Error enabling foreign keys:', err.message);
        } else {
          console.log('✅ Foreign keys enabled');
        }
      });
    }
  }

  public getDatabase(): sqlite3.Database {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  public async run(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as T);
        }
      });
    });
  }

  public async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  public async initializeDatabase(): Promise<void> {
    console.log('🔄 Initializing database...');
    
    try {
      const { default: migrationRunner } = await import('./migrations/migrationRunner');
      await migrationRunner.runMigrations();
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  public close(): void {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('✅ Database connection closed');
        }
      });
    }
  }
}

const database = new Database();

export default database;
