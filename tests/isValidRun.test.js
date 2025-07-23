// test/isValidRun.test.js
const { isValidRun } = require('../shared/game');

describe('isValidRun', () => {
    it('valid run without jokers', () => {
        const cards = [
            { rank: 4, suit: '♠' },
            { rank: 5, suit: '♠' },
            { rank: 6, suit: '♠' }
        ];
        expect(isValidRun(cards)).toBe(true);
    });

    it('valid run without A K Q', () => {
        const cards = [
            { rank: 1, suit: '♠' },
            { rank: 13, suit: '♠' },
            { rank: 12, suit: '♠' }
        ];
        expect(isValidRun(cards)).toBe(true);
    });
    it('valid run without jokers', () => {
        const cards = [
            { rank: 4, suit: '♠' },
            { rank: 5, suit: '♠' },
            { rank: 6, suit: '♠' }
        ];
        expect(isValidRun(cards)).toBe(true);
    });

    it('valid run with one joker in middle', () => {
        const cards = [
            { rank: 4, suit: '♠' },
            { rank: 'JOKER' },
            { rank: 6, suit: '♠' }
        ];
        expect(isValidRun(cards)).toBe(true);
    });

    it('valid run with joker at start', () => {
        const cards = [
            { rank: 'JOKER' },
            { rank: 2, suit: '♥' },
            { rank: 3, suit: '♥' }
        ];
        expect(isValidRun(cards)).toBe(true);
    });

    it('invalid run with different suits', () => {
        const cards = [
            { rank: 3, suit: '♣' },
            { rank: 4, suit: '♠' },
            { rank: 5, suit: '♠' }
        ];
        expect(isValidRun(cards)).toBe(false);
    });

    it('invalid run with gap too large for jokers', () => {
        const cards = [
            { rank: 4, suit: '♠' },
            { rank: 'JOKER' },
            { rank: 8, suit: '♠' }
        ];
        expect(isValidRun(cards)).toBe(false);
    });

    it('valid run with multiple jokers filling gaps', () => {
        const cards = [
            { rank: 3, suit: '♦' },
            { rank: 'JOKER' },
            { rank: 'JOKER' },
            { rank: 6, suit: '♦' }
        ];
        expect(isValidRun(cards)).toBe(true);
    });

    it('invalid run with not enough jokers to fill gaps', () => {
        const cards = [
            { rank: 3, suit: '♦' },
            { rank: 5, suit: '♦' },
            { rank: 'JOKER' },
            { rank: 7, suit: '♦' }
        ];
        expect(isValidRun(cards)).toBe(false);
    });

    it('invalid: only jokers', () => {
        const cards = [
            { rank: 'JOKER' },
            { rank: 'JOKER' },
            { rank: 'JOKER' }
        ];
        expect(isValidRun(cards)).toBe(false);
    });
});
