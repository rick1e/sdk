const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class Database {
    constructor() {
        // Check if Supabase credentials are available
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            console.warn('⚠️  Supabase credentials not found in environment variables.');
            console.warn('Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
            console.warn('See .env.example for configuration template');
            this.supabase = null;
        } else {
            // Initialize Supabase client
            this.supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_ANON_KEY
            );
        }
    }

    async initialize() {
        if (!this.supabase) {
            console.warn('⚠️  Supabase not configured. Database operations will fail.');
            return Promise.resolve();
        }

        try {
            // Test the connection by checking if the table exists
            const { error } = await this.supabase
                .from('games')
                .select('count')
                .limit(1);
            
            if (error && error.code !== 'PGRST116') {
                // PGRST116 means table doesn't exist, which is ok for first run
                console.error('Error connecting to Supabase:', error.message);
                throw error;
            }
            
            console.log('Connected to Supabase database.');
            return Promise.resolve();
        } catch (error) {
            console.error('Failed to initialize Supabase database:', error);
            throw error;
        }
    }

    async createTables() {
        // In Supabase, tables are created via the dashboard or SQL editor
        // This method is kept for compatibility but doesn't need to do anything
        console.log('Tables should be created in Supabase dashboard. See SQL in docs.');
        return Promise.resolve();
    }

    async saveGame(gameId, gameState) {
        if (!this.supabase) {
            throw new Error('Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in environment variables.');
        }

        try {
            const { data, error } = await this.supabase
                .from('games')
                .upsert({
                    game_id: gameId,
                    game_state: gameState, // JSONB auto-serialized
                    updated_at: new Date().toISOString(),
                    is_active: gameState.phase !== 'finished'
                }, {
                    onConflict: 'game_id' // Upsert on game_id conflict
                });
            
            if (error) {
                console.error('Error saving game:', error.message);
                throw error;
            }
            
            return { gameId, changes: 1 };
        } catch (error) {
            console.error('Failed to save game:', error);
            throw error;
        }
    }

    async loadGame(gameId) {
        if (!this.supabase) {
            throw new Error('Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in environment variables.');
        }

        try {
            const { data, error } = await this.supabase
                .from('games')
                .select('game_state')
                .eq('game_id', gameId)
                .eq('is_active', true)
                .single();
            
            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned, game not found
                    return null;
                }
                console.error('Error loading game:', error.message);
                throw error;
            }
            
            return data?.game_state || null;
        } catch (error) {
            console.error('Failed to load game:', error);
            throw error;
        }
    }

    async loadAllActiveGames() {
        if (!this.supabase) {
            console.warn('⚠️  Supabase not configured. Returning empty games object.');
            return {};
        }

        try {
            const { data, error } = await this.supabase
                .from('games')
                .select('game_id, game_state')
                .eq('is_active', true);
            
            if (error) {
                console.error('Error loading all games:', error.message);
                throw error;
            }
            
            const games = {};
            data.forEach(row => {
                games[row.game_id] = row.game_state;
            });
            return games;
        } catch (error) {
            console.error('Failed to load all active games:', error);
            throw error;
        }
    }

    async deleteGame(gameId) {
        try {
            const { data, error } = await this.supabase
                .from('games')
                .delete()
                .eq('game_id', gameId);
            
            if (error) {
                console.error('Error deleting game:', error.message);
                throw error;
            }
            
            return { gameId, changes: 1 };
        } catch (error) {
            console.error('Failed to delete game:', error);
            throw error;
        }
    }

    async markGameInactive(gameId) {
        try {
            const { data, error } = await this.supabase
                .from('games')
                .update({ 
                    is_active: false, 
                    updated_at: new Date().toISOString() 
                })
                .eq('game_id', gameId);
            
            if (error) {
                console.error('Error marking game inactive:', error.message);
                throw error;
            }
            
            return { gameId, changes: 1 };
        } catch (error) {
            console.error('Failed to mark game inactive:', error);
            throw error;
        }
    }

    async cleanupOldGames(daysOld = 7) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const { data, error } = await this.supabase
                .from('games')
                .delete()
                .eq('is_active', false)
                .lt('updated_at', cutoffDate.toISOString());
            
            if (error) {
                console.error('Error cleaning up old games:', error.message);
                throw error;
            }
            
            const deletedCount = Array.isArray(data) ? data.length : 0;
            console.log(`Cleaned up ${deletedCount} old games.`);
            return { changes: deletedCount };
        } catch (error) {
            console.error('Failed to cleanup old games:', error);
            throw error;
        }
    }

    close() {
        // Supabase client doesn't need explicit closing like SQLite
        console.log('Supabase client connection closed.');
    }
}

module.exports = Database;