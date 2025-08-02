const { extractMeldsFromHand } = require('../server/bot/strategy'); // Adjust path accordingly


describe('extractMeldsFromHand', () => {
    it('should extract valid sets and runs from the hand', () => {
        const hand = [
            { suit: 'hearts', rank: 4 },
            { suit: 'clubs', rank: 4 },
            { suit: 'diamonds', rank: 4 }, // set of 4s

            { suit: 'spades', rank: 6 },
            { suit: 'spades', rank: 7 },
            { suit: 'spades', rank: 8 }, // run of spades 6–7–8

            { suit: 'clubs', rank: 10 }, // not part of any meld
        ];

        const result = extractMeldsFromHand(hand);

        expect(result).toHaveLength(2);

        expect(result).toEqual(
            expect.arrayContaining([
                [
                    { suit: 'hearts', rank: 4 },
                    { suit: 'clubs', rank: 4 },
                    { suit: 'diamonds', rank: 4 }
                ],
                [
                    { suit: 'spades', rank: 6 },
                    { suit: 'spades', rank: 7 },
                    { suit: 'spades', rank: 8 }
                ]
            ])
        );
    });

    it('should return an empty array if there are no melds', () => {
        const hand = [
            { suit: 'hearts', rank: 2 },
            { suit: 'clubs', rank: 5 },
            { suit: 'spades', rank: 9 },
            { suit: 'diamonds', rank: 11 }
        ];

        const result = extractMeldsFromHand(hand);

        expect(result).toEqual([]);
    });

    it('bot-example', () => {
        const hand =[
        { suit: '♦', rank: 1 },
        { suit: '♠', rank: 11 },
        { suit: '♣', rank: 7 },
        { suit: '♠', rank: 2 },
        { suit: '♠', rank: 7 },
        { suit: '♣', rank: 12 },
        { suit: '♣', rank: 9 },
        { suit: '♠', rank: 3 },
        { suit: '♦', rank: 13 },
        { suit: '♦', rank: 5 },
        { suit: '♥', rank: 6 },
        { suit: '♦', rank: 2 },
        { suit: '♦', rank: 3 },
        { suit: '♠', rank: 4 }
    ];
        const result = extractMeldsFromHand(hand);

        expect(result).toEqual([
            [
                { suit: '♦', rank: 1 },
                { suit: '♦', rank: 2 },
                { suit: '♦', rank: 3 }
            ],
            [
                { suit: '♠', rank: 2 },
                { suit: '♠', rank: 3 },
                { suit: '♠', rank: 4 }
            ]
        ]);
    });

});
