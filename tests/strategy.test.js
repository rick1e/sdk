jest.mock('../server/bot/strategy', () => {
    // grab the real module first
    const originalModule = jest.requireActual('../server/bot/strategy');
    return {
        ...originalModule, // keep the real layDownInitialMelds
        // isSet: jest.fn(),
        // isRun: jest.fn(),
        // extractMeldsFromHand: jest.fn(),
        // layDownMeldNew: jest.fn(),
    };
});

const { layDownInitialMelds,botPlayMelds } = require('../server/bot/strategy');

describe('layDownInitialMelds', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('adds extracted melds to player.meldsToLay, removes cards from hand, and calls layDownMeldNew when requirements are met', () => {
        //11♣, 11♦, 11♠, 11♥, 13♥, 13♠, 13♣
        //♣, ♦, ♠, ♥

        const player = {
            id: 'p1',
            hand: [
                { suit: '♦', rank: 2 },
                { suit: '♥', rank: 2 },
                { suit: '♥', rank: 13 },
                { suit: '♠', rank: 13 },
                { suit: '♣', rank: 13 },
            ],
            meldsToLay: [
                [
                    { suit: '♦', rank: 11 },
                    { suit: '♥', rank: 11 },
                    { rank: 'JOKER'},
                    { suit: '♠', rank: 11 }
                ]
            ],
        };

        const gameState = {
            players: [player],
            discardPile: [],
            phase: 'waiting', // waiting, dealing, drawing, discarding
            currentPlayerIndex: 0,
            started: false,
            melds: [],
            winner: null,
            callAvailable: false,
            callTimeout: null,
            callRequest: {
                playerName: '',
                playerId: null,      // ID of player who called
                approved: null,      // true = allowed, false = denied, null = pending
            },
            rules: {
                requireNumberOfMeldsToLay: 2,
                requireNumberOfRunsToLay: 1,
                requireNumberOfSetToLay: 1
            },
        };

        // Mock behaviors
        // isSet.mockReturnValue(false);
        // isRun.mockReturnValue(false);

        const extractedMelds = [[
            { suit: '♦', rank: 11 },
            { suit: '♥', rank: 11 },
            { rank: 'JOKER'},
            { suit: '♠', rank: 11 }
        ]];

        // extractMeldsFromHand.mockReturnValue(extractedMelds);

        // Run
        layDownInitialMelds(player, gameState);

        // ✅ meldsToLay updated
        expect(player.meldsToLay).toEqual(extractedMelds);

        // ✅ hand updated (removed melded cards)
        expect(player.hand).toEqual([
            { suit: '♦', rank: 2 },
            { suit: '♥', rank: 2 },
            { suit: '♥', rank: 13 },
            { suit: '♠', rank: 13 },
            { suit: '♣', rank: 13 }
        ]);

        // ✅ layDownMeldNew called
        // expect(layDownMeldNew).toHaveBeenCalledWith(gameState, 'p1');
    });

    //Hand: 2♠, 8♠, 4♠, 8♥, 1♥
    // Melds: 3♠, 3♣, JOKERundefined, 7♥, 7♣, 7♠

    it('boot scenario 2', () => {
        const player = {
            id: 'p2',
            hand: [
                { suit: '♥', rank: 7 },
                { suit: '♣', rank: 7 },
                { suit: '♠', rank: 7 },
                { suit: '♠', rank: 2 },
                { suit: '♠', rank: 8 },
                { suit: '♠', rank: 4 },
                { suit: '♥', rank: 8 },
                { suit: '♥', rank: 1 },
            ],
            meldsToLay: [
                [
                    { suit: '♠', rank: 3 },
                    { suit: '♣', rank: 3 },
                    { rank: 'JOKER' }
                ]
            ],
        };

        const gameState = {
            rules: {
                requireNumberOfSetToLay: 1,
                requireNumberOfRunsToLay: 1,
                requireNumberOfMeldsToLay: 2,
            },
        };

        // extractMeldsFromHand.mockReturnValue([]);

        layDownInitialMelds(player, gameState);

        expect(player.hand).toEqual([
            { suit: '♥', rank: 7 },
            { suit: '♣', rank: 7 },
            { suit: '♠', rank: 7 },
            { suit: '♠', rank: 2 },
            { suit: '♠', rank: 8 },
            { suit: '♠', rank: 4 },
            { suit: '♥', rank: 8 },
            { suit: '♥', rank: 1 },
        ]);


    });

    it('boot scenario 3', () => {
        const player = {
            id: 'p2',
            hasLaidDown:true,
            hand: [
                { suit: '♥', rank: 7 },
                { suit: '♣', rank: 7 },
                { suit: '♠', rank: 7 },
                { suit: '♠', rank: 2 },
                { suit: '♠', rank: 8 },
                { suit: '♠', rank: 4 },
                { suit: '♥', rank: 8 },
                { suit: '♥', rank: 1 },
            ],
            meldsToLay: [
                [
                    { suit: '♠', rank: 3 },
                    { suit: '♣', rank: 3 },
                    { rank: 'JOKER' }
                ]
            ],
        };

        const gameState = {
            rules: {
                requireNumberOfSetToLay: 1,
                requireNumberOfRunsToLay: 1,
                requireNumberOfMeldsToLay: 2,
            },
            melds:[
                {
                    playerId: 'p1',
                    cards: [
                        { suit: '♥', rank: 7 },
                        { suit: '♣', rank: 7 },
                        { rank: 'JOKER' }
                    ],
                }
            ],
            players:[
                {
                    id:'p1',
                    name:'layer 1'
                },
                player
            ]
        };

        // extractMeldsFromHand.mockReturnValue([]);

        botPlayMelds(player, gameState);

        expect(player.hand).toEqual([
            { suit: '♠', rank: 2 },
            { suit: '♠', rank: 8 },
            { suit: '♠', rank: 4 },
            { suit: '♥', rank: 8 },
            { suit: '♥', rank: 1 },
        ]);


    });
});
