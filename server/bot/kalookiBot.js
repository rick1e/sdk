const { botPlayTurn, shouldLayDown } = require('./strategy');

class KalookiBot {
    constructor(io, gameId, botName = "BotPlayer-"+Math.random().toString(36).substr(2, 3)) {
        this.io = io;
        this.gameId = gameId;
        this.name = botName;
        this.socket = this.createFakeSocket();
        this.hand = [];
        this.laidDown = false;
    }

    createFakeSocket() {
        return {
            id: `bot-${Date.now()}`,
            emit: (event, payload) => {
                this.handleEvent(event, payload);
            },
            on: () => {} // No-op for bot
        };
    }

    joinGame(game) {
        if (!game) return;

        this.player = {
            id: this.socket.id,
            name: this.name,
            hand: [],
            meldsToLay: [],
            isBot: true
        };
        game.players.push(this.player);
        this.io.to(this.gameId).emit('player_joined', game.players);
    }

    handleEvent(event, payload) {
        if (event === 'your_turn') {
            setTimeout(() => this.takeTurn(payload), 1500);
        } else if (event === 'card_drawn') {
            this.hand.push(payload.card);
        }
    }

    takeTurn(gameState) {
        botPlayTurn(this.player, gameState);

        this.io.to(this.gameId).emit('game_update', gameState);

        /*

        console.log("bot move", move);

        // Optionally lay down
        if (!this.laidDown && shouldLayDown(this.hand)) {
            console.log("bot lay");
            this.io.to(this.gameId).emit('lay_down', { playerId: this.socket.id, melds: [] });
            this.laidDown = true;
        }

        // Discard
        if (move.discard) {
            console.log("bot discard");
            this.io.to(this.gameId).emit('discard_card', {
                playerId: this.socket.id,
                card: move.discard
            });
        }

         */

        // End turn
        // this.io.to(this.gameId).emit('end_turn', { playerId: this.socket.id });
    }
}

module.exports = KalookiBot;
