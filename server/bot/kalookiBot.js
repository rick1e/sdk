const {
    botPlayDraw,
    botPlayMelds,
    botPlayDiscard
} = require('./strategy');

class KalookiBot {
    constructor(io, gameId, botName = "BotPlayer-"+Math.random().toString(36).substring(2, 3)) {
        this.io = io;
        this.gameId = gameId;
        this.name = botName;
        this.id = `bot-${Date.now()}`;
        this.hand = [];
    }

    joinGame(game) {
        if (!game) return;

        this.player = {
            id: this.id,
            name: this.name,
            hand: [],
            meldsToLay: [],
            isBot: true
        };
        game.players.push(this.player);
        this.io.to(this.gameId).emit('player_joined', game.players);
    }

    drawCard(gameState){
        botPlayDraw(this.player,gameState);
        this.io.to(this.gameId).emit('game_update', gameState);
    }

    makeMelds(gameState){
        botPlayMelds(this.player,gameState);
        this.io.to(this.gameId).emit('game_update', gameState);
    }

    discardCard(gameState){
        botPlayDiscard(this.player,gameState);
        this.io.to(this.gameId).emit('game_update', gameState);
    }
}

module.exports = KalookiBot;
