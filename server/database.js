const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor(dbPath = './data/kalooki.db') {
        this.dbPath = dbPath;
        this.db = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            // Ensure data directory exists
            const fs = require('fs');
            const dir = path.dirname(this.dbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database.');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            const createGamesTable = `
                CREATE TABLE IF NOT EXISTS games (
                    game_id TEXT PRIMARY KEY,
                    game_state TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1
                )
            `;

            this.db.run(createGamesTable, (err) => {
                if (err) {
                    console.error('Error creating games table:', err.message);
                    reject(err);
                } else {
                    console.log('Games table created or already exists.');
                    resolve();
                }
            });
        });
    }

    async saveGame(gameId, gameState) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const serializedState = JSON.stringify(gameState);
            const sql = `
                INSERT OR REPLACE INTO games (game_id, game_state, updated_at, is_active)
                VALUES (?, ?, CURRENT_TIMESTAMP, ?)
            `;

            this.db.run(sql, [gameId, serializedState, gameState.phase !== 'finished'], function(err) {
                if (err) {
                    console.error('Error saving game:', err.message);
                    reject(err);
                } else {
                    resolve({ gameId, changes: this.changes });
                }
            });
        });
    }

    async loadGame(gameId) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const sql = 'SELECT game_state FROM games WHERE game_id = ? AND is_active = 1';
            
            this.db.get(sql, [gameId], (err, row) => {
                if (err) {
                    console.error('Error loading game:', err.message);
                    reject(err);
                } else if (!row) {
                    resolve(null);
                } else {
                    try {
                        const gameState = JSON.parse(row.game_state);
                        resolve(gameState);
                    } catch (parseErr) {
                        console.error('Error parsing game state:', parseErr.message);
                        reject(parseErr);
                    }
                }
            });
        });
    }

    async loadAllActiveGames() {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const sql = 'SELECT game_id, game_state FROM games WHERE is_active = 1';
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('Error loading all games:', err.message);
                    reject(err);
                } else {
                    const games = {};
                    rows.forEach(row => {
                        try {
                            games[row.game_id] = JSON.parse(row.game_state);
                        } catch (parseErr) {
                            console.error(`Error parsing game ${row.game_id}:`, parseErr.message);
                        }
                    });
                    resolve(games);
                }
            });
        });
    }

    async deleteGame(gameId) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM games WHERE game_id = ?';
            
            this.db.run(sql, [gameId], function(err) {
                if (err) {
                    console.error('Error deleting game:', err.message);
                    reject(err);
                } else {
                    resolve({ gameId, changes: this.changes });
                }
            });
        });
    }

    async markGameInactive(gameId) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const sql = 'UPDATE games SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE game_id = ?';
            
            this.db.run(sql, [gameId], function(err) {
                if (err) {
                    console.error('Error marking game inactive:', err.message);
                    reject(err);
                } else {
                    resolve({ gameId, changes: this.changes });
                }
            });
        });
    }

    async cleanupOldGames(daysOld = 7) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const sql = `
                DELETE FROM games 
                WHERE is_active = 0 AND updated_at < datetime('now', '-${daysOld} days')
            `;
            
            this.db.run(sql, [], function(err) {
                if (err) {
                    console.error('Error cleaning up old games:', err.message);
                    reject(err);
                } else {
                    console.log(`Cleaned up ${this.changes} old games.`);
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed.');
                }
            });
        }
    }
}

module.exports = Database;