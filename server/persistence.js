const Database = require('./database');

class GamePersistence {
    constructor() {
        this.db = new Database();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            await this.db.initialize();
            this.initialized = true;
            console.log('Game persistence initialized successfully.');
        } catch (error) {
            console.error('Failed to initialize game persistence:', error);
            throw error;
        }
    }

    serializeGameState(gameState) {
        // Create a clean copy without non-serializable objects
        const serialized = {
            id: gameState.id,
            creatorId: gameState.creatorId,
            players: gameState.players.map(player => ({
                id: player.id,
                name: player.name,
                hand: player.hand,
                meldsToLay: player.meldsToLay,
                hasLaidDown: player.hasLaidDown,
                isBot: player.isBot || false
            })),
            deck: gameState.deck,
            discardPile: gameState.discardPile,
            phase: gameState.phase,
            currentPlayerIndex: gameState.currentPlayerIndex,
            started: gameState.started,
            melds: gameState.melds,
            winner: gameState.winner,
            callAvailable: gameState.callAvailable,
            callRequest: gameState.callRequest,
            rules: gameState.rules,
            timerState: gameState.timerState || null
        };

        return serialized;
    }

    async saveGame(gameId, gameState) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const serialized = this.serializeGameState(gameState);
            await this.db.saveGame(gameId, serialized);
            console.log(`Game ${gameId} saved successfully.`);
        } catch (error) {
            console.error(`Failed to save game ${gameId}:`, error);
            throw error;
        }
    }

    async loadGame(gameId) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const gameState = await this.db.loadGame(gameId);
            if (gameState) {
                console.log(`Game ${gameId} loaded successfully.`);
                return gameState;
            }
            return null;
        } catch (error) {
            console.error(`Failed to load game ${gameId}:`, error);
            throw error;
        }
    }

    async loadAllActiveGames() {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const games = await this.db.loadAllActiveGames();
            console.log(`Loaded ${Object.keys(games).length} active games from database.`);
            return games;
        } catch (error) {
            console.error('Failed to load active games:', error);
            throw error;
        }
    }

    async deleteGame(gameId) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            await this.db.deleteGame(gameId);
            console.log(`Game ${gameId} deleted successfully.`);
        } catch (error) {
            console.error(`Failed to delete game ${gameId}:`, error);
            throw error;
        }
    }

    async markGameInactive(gameId) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            await this.db.markGameInactive(gameId);
            console.log(`Game ${gameId} marked as inactive.`);
        } catch (error) {
            console.error(`Failed to mark game ${gameId} as inactive:`, error);
            throw error;
        }
    }

    async cleanupOldGames(daysOld = 7) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const result = await this.db.cleanupOldGames(daysOld);
            return result;
        } catch (error) {
            console.error('Failed to cleanup old games:', error);
            throw error;
        }
    }

    // Validate and sanitize reconnected game state
    validateGameState(gameState) {
        if (!gameState || !gameState.id) {
            throw new Error('Invalid game state: missing game ID');
        }

        if (!gameState.players || !Array.isArray(gameState.players)) {
            throw new Error('Invalid game state: missing or invalid players');
        }

        if (typeof gameState.currentPlayerIndex !== 'number') {
            throw new Error('Invalid game state: missing or invalid currentPlayerIndex');
        }

        // Validate timer state if present
        if (gameState.timerState) {
            const { isRunning, type, targetPlayerId, currentStage, remainingTime } = gameState.timerState;
            
            // Validate timer state structure
            if (typeof isRunning !== 'boolean') {
                throw new Error('Invalid timer state: isRunning must be boolean');
            }
            
            if (!['bot-turn', 'call-window'].includes(type)) {
                throw new Error('Invalid timer state: type must be bot-turn or call-window');
            }
            
            if (!targetPlayerId) {
                throw new Error('Invalid timer state: missing targetPlayerId');
            }
            
            if (!['pending', 'executing', 'completed'].includes(currentStage)) {
                throw new Error('Invalid timer state: currentStage must be pending, executing, or completed');
            }
            
            if (typeof remainingTime !== 'number' || remainingTime < 0) {
                throw new Error('Invalid timer state: remainingTime must be non-negative number');
            }
        }

        // Ensure all players have required properties
        gameState.players.forEach((player, index) => {
            if (!player.id || !player.name) {
                throw new Error(`Invalid game state: player ${index} missing required properties`);
            }
            
            // Ensure arrays are properly initialized
            player.hand = player.hand || [];
            player.meldsToLay = player.meldsToLay || [];
            player.hasLaidDown = player.hasLaidDown || false;
            player.isBot = player.isBot || false;
        });

        // Ensure game arrays are properly initialized
        gameState.deck = gameState.deck || [];
        gameState.discardPile = gameState.discardPile || [];
        gameState.melds = gameState.melds || [];
        gameState.callAvailable = gameState.callAvailable || false;
        gameState.callRequest = gameState.callRequest || {
            playerName: '',
            playerId: null,
            approved: null
        };

        // Initialize timer state if not present
        if (!gameState.timerState) {
            gameState.timerState = null;
        }

        return gameState;
    }

    // Handle graceful shutdown
    async shutdown() {
        if (this.initialized && this.db) {
            this.db.close();
            console.log('Game persistence shutdown complete.');
        }
    }
}

module.exports = GamePersistence;