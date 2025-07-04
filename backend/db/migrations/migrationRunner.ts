import fs from 'fs';
import path from 'path';
import database from '../database';

interface Migration {
  id: number;
  name: string;
  executed_at: string;
}

class MigrationRunner {
  private migrationsDir = path.join(__dirname, '../schemas');
  
  constructor() {
    this.initMigrationsTable();
  }

  private async initMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    try {
      await database.run(sql);
      console.log('✅ Migrations table ready');
    } catch (error) {
      console.error('❌ Error creating migrations table:', error);
    }
  }

  private async getExecutedMigrations(): Promise<string[]> {
    const migrations = await database.all<Migration>('SELECT name FROM migrations ORDER BY id');
    return migrations.map(m => m.name);
  }

  private getMigrationFiles(): string[] {
    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Orden alfabético: users.sql, messages.sql
    
    return files;
  }

  private async executeMigration(filename: string): Promise<void> {
    const filePath = path.join(this.migrationsDir, filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`🔄 Executing migration: ${filename}`);
    
    try {
      // Ejecutar el SQL del archivo
      await database.run(sql);
      
      // Marcar como ejecutada
      await database.run(
        'INSERT INTO migrations (name) VALUES (?)',
        [filename]
      );
      
      console.log(`✅ Migration completed: ${filename}`);
    } catch (error) {
      console.error(`❌ Migration failed: ${filename}`, error);
      throw error;
    }
  }

  public async runMigrations(): Promise<void> {
    console.log('🚀 Running database migrations...');
    
    try {
      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = this.getMigrationFiles();
      
      let newMigrations = 0;
      
      for (const file of migrationFiles) {
        if (!executedMigrations.includes(file)) {
          await this.executeMigration(file);
          newMigrations++;
        } else {
          console.log(`⏭️  Skipping already executed: ${file}`);
        }
      }
      
      if (newMigrations === 0) {
        console.log('✅ Database is up to date');
      } else {
        console.log(`✅ Executed ${newMigrations} new migrations`);
      }
      
    } catch (error) {
      console.error('❌ Migration process failed:', error);
      throw error;
    }
  }

  public async rollbackLastMigration(): Promise<void> {
    // Opcional: para deshacer la última migración
    console.log('🔄 Rolling back last migration...');
    
    const lastMigration = await database.get<Migration>(
      'SELECT * FROM migrations ORDER BY id DESC LIMIT 1'
    );
    
    if (lastMigration) {
      await database.run('DELETE FROM migrations WHERE id = ?', [lastMigration.id]);
      console.log(`✅ Rolled back: ${lastMigration.name}`);
    } else {
      console.log('ℹ️  No migrations to rollback');
    }
  }
}

const migrationRunner = new MigrationRunner();

export default migrationRunner;
