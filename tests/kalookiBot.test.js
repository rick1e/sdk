// Mocks for strategy functions
jest.mock('../server/bot/strategy', () => ({
    botPlayDraw: jest.fn(),
    botPlayMelds: jest.fn(),
    botPlayDiscard: jest.fn(),
    botAllowCall: jest.fn(),
    botMakeCall: jest.fn(),
}));

const {
    botPlayDraw,
    botPlayMelds,
    botPlayDiscard,
    botAllowCall,
    botMakeCall,
} = require('../server/bot/strategy');

const KalookiBot = require('../server/bot/kalookiBot');

describe('KalookiBot', () => {
    let ioMock, gameId, bot, gameState;

    beforeEach(() => {
        // Fake socket.io mock
        ioMock = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };
        gameId = 'game-123';
        bot = new KalookiBot(ioMock, gameId, 'TestBot');
        gameState = { players: [], deck: [], discardPile: [] };

        jest.clearAllMocks();
    });

    test('constructor generates default botName if not provided', () => {
        const botWithoutName = new KalookiBot(ioMock, gameId);

        expect(botWithoutName.name).toMatch(/^BotPlayer-/); // starts with "BotPlayer-"
        expect(botWithoutName.name.length).toBeGreaterThan('BotPlayer-'.length); // has random suffix
        expect(botWithoutName.id).toMatch(/^bot-/); // still sets id
    });

    test('constructor sets defaults', () => {
        expect(bot.io).toBe(ioMock);
        expect(bot.gameId).toBe(gameId);
        expect(bot.name).toBe('TestBot');
        expect(bot.id).toMatch(/^bot-/);
        expect(bot.hand).toEqual([]);
    });

    test('joinGame adds player and emits player_joined', () => {
        const game = { players: [] };
        bot.joinGame(game);

        expect(game.players).toHaveLength(1);
        expect(game.players[0]).toMatchObject({
            id: bot.id,
            name: 'TestBot',
            isBot: true,
        });
        expect(ioMock.to).toHaveBeenCalledWith(gameId);
        expect(ioMock.emit).toHaveBeenCalledWith('player_joined', game.players);
    });

    test('joinGame does nothing if no game is provided', () => {
        bot.joinGame(null);
        expect(ioMock.emit).not.toHaveBeenCalled();
    });

    test('shouldCall delegates to botMakeCall', () => {
        bot.player = { id: 'p1' };
        botMakeCall.mockReturnValue(true);

        const result = bot.shouldCall(gameState);

        expect(botMakeCall).toHaveBeenCalledWith(bot.player, gameState);
        expect(result).toBe(true);
    });

    test('decideCall delegates to botAllowCall', () => {
        bot.player = { id: 'p1' };
        botAllowCall.mockReturnValue(false);

        const result = bot.decideCall(gameState);

        expect(botAllowCall).toHaveBeenCalledWith(bot.player, gameState);
        expect(result).toBe(false);
    });

    test('drawCard calls strategy and emits game_update', () => {
        bot.player = { id: 'p1' };

        bot.drawCard(gameState);

        expect(botPlayDraw).toHaveBeenCalledWith(bot.player, gameState);
        expect(ioMock.emit).toHaveBeenCalledWith('game_update', gameState);
    });

    test('makeMelds calls strategy and emits game_update', () => {
        bot.player = { id: 'p1' };

        bot.makeMelds(gameState);

        expect(botPlayMelds).toHaveBeenCalledWith(bot.player, gameState);
        expect(ioMock.emit).toHaveBeenCalledWith('game_update', gameState);
    });

    test('discardCard calls strategy and emits game_update', () => {
        bot.player = { id: 'p1' };

        bot.discardCard(gameState);

        expect(botPlayDiscard).toHaveBeenCalledWith(bot.player, gameState);
        expect(ioMock.emit).toHaveBeenCalledWith('game_update', gameState);
    });
});
