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

    it('valid run without jokers', () => {
        const cards = [
            { rank: 4, suit: '♠' },
            { rank: 5, suit: '♠' },
            { rank: 6, suit: '♠' },
            { rank: 7, suit: '♠' },
            { rank: 8, suit: '♠' },
            { rank: 9, suit: '♠' },
            { rank: 10, suit: '♠' },
            { rank: 11, suit: '♠' },
            { rank: 12, suit: '♠' }
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

describe('isValidRun - Ace Flexibility', () => {
    it('valid run: Ace low (A-2-3 of ♥)', () => {
        const cards = [
            { rank: 1, suit: '♥' },
            { rank: 2, suit: '♥' },
            { rank: 3, suit: '♥' }
        ];
        expect(isValidRun(cards)).toBe(true);
    });

    it('valid run: Ace high (Q-K-A of ♠)', () => {
        const cards = [
            { rank: 12, suit: '♠' },
            { rank: 13, suit: '♠' },
            { rank: 1, suit: '♠' }
        ];
        expect(isValidRun(cards)).toBe(true);
    });

    it('valid run: Joker fills gap in A-3 of ♦', () => {
        const cards = [
            { rank: 1, suit: '♦' },
            { rank: 'JOKER' },
            { rank: 3, suit: '♦' }
        ];
        expect(isValidRun(cards)).toBe(true);
    });

    it('valid run: Joker fills gap in Q-A of ♣', () => {
        const cards = [
            { rank: 12, suit: '♣' },
            { rank: 'JOKER' },
            { rank: 1, suit: '♣' }
        ];
        expect(isValidRun(cards)).toBe(true);
    });

    it('invalid run: mixed suits (A-2-3)', () => {
        const cards = [
            { rank: 1, suit: '♥' },
            { rank: 2, suit: '♠' },
            { rank: 3, suit: '♥' }
        ];
        expect(isValidRun(cards)).toBe(false);
    });

    it('invalid run: K-A-2 is not a valid wrap-around', () => {
        const cards = [
            { rank: 13, suit: '♠' },
            { rank: 1, suit: '♠' },
            { rank: 2, suit: '♠' }
        ];
        expect(isValidRun(cards)).toBe(false);
    });

    it('invalid run: duplicate Ace (A-A-2)', () => {
        const cards = [
            { rank: 1, suit: '♣' },
            { rank: 1, suit: '♣' },
            { rank: 2, suit: '♣' }
        ];
        expect(isValidRun(cards)).toBe(false);
    });
});

