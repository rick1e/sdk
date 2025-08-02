const {
    isRun,
    isSet,
    getSetAdditions,
    getRunAdditions,
    findMeldExtensions } = require('../server/bot/strategy')

describe('findMeldExtensionsOld', () => {
    it('should find cards that extend sets and runs using suit symbols and numeric ranks add multiple', () => {
        const botHand =  [
                { suit: '♥', rank: 3 },
                { suit: '♣', rank: 8 },
                { suit: '♣', rank: 1 },
                { suit: '♣', rank: 5 },
                { suit: '♠', rank: 5 },
                { suit: '♦', rank: 8 },
                { suit: '♦', rank: 6 }
            ];

        const tableMelds = [{
            // Set of 5
            cards: [
                {
                    "suit": "♠",
                    "rank": 5
                },
                {
                    "suit": "♥",
                    "rank": 5
                },
                {
                    "suit": "♦",
                    "rank": 5
                }
            ]

        }];

        const result = findMeldExtensions(botHand, tableMelds);

        expect(result).toEqual([{"meldIndex":0 ,"cards":[{"suit":"♣","rank":5},{"suit":"♠","rank":5}]}]);
    });
    it('should find cards that extend sets and runs using suit symbols and numeric ranks', () => {
        const botHand = [
            { suit: '♦', rank: 8 },
            { suit: '♣', rank: 4 },
            { suit: '♦', rank: 4 },
            { suit: '♦', rank: 9 },
            { suit: '♦', rank: 3 },
            { suit: '♠', rank: 5 } // doesn't match
        ];

        const tableMelds = [
            // Set of 4s
            {
                // Set of 5
                cards:[
                { suit: '♥', rank: 4 },
                { suit: '♠', rank: 4 },
                { suit: '♠', rank: 4 }
            ]},
            // Run of ♦ 5-6-7
            {
                // Set of 5
                cards:[
                { suit: '♦', rank: 5 },
                { suit: '♦', rank: 6 },
                { suit: '♦', rank: 7 }
            ]}
        ];

        const result = findMeldExtensions(botHand, tableMelds);

        expect(result).toEqual([
            {
                meldIndex: 0,
                cards: [
                    { suit: '♣', rank: 4 },
                    { suit: '♦', rank: 4 }
                ]
            },
            {
                meldIndex: 1,
                cards: [
                    { suit: '♦', rank: 8 },
                    { suit: '♦', rank: 9 }
                ]
            }
        ]);
    });

    it('should return an empty array if there are no valid extensions', () => {
        const botHand = [
            { suit: '♣', rank: 2 },
            { suit: '♥', rank: 9 }
        ];

        const tableMelds = [
            [
                { suit: '♠', rank: 5 },
                { suit: '♠', rank: 6 },
                { suit: '♠', rank: 7 }
            ]
        ];

        const result = findMeldExtensions(botHand, tableMelds);

        expect(result).toEqual([]);
    });
});

describe('getSetAdditionsOld', () => {
    it('returns valid additions from hand to set meld', () => {
        const hand = [
            { suit: '♦', rank: 8 },
            { suit: '♣', rank: 4 },
            { suit: '♦', rank: 4 },
            { suit: '♦', rank: 9 },
            { suit: '♦', rank: 3 },
            { suit: '♠', rank: 5 } // doesn't match
        ];
        const meld = [
            { suit: '♥', rank: 4 },
            { suit: '♠', rank: 4 }
        ];

        const used = new Set();

        const result = getSetAdditions(hand, meld, used);
        expect(result).toEqual([
            { suit: '♣', rank: 4 },
            { suit: '♦', rank: 4 },
        ]);
    });
});

describe('getRunAdditionsOLD', () => {
    it('returns cards that extend a run from hand', () => {
        const hand = [
            { suit: '♦', rank: 3 },
            { suit: '♦', rank: 6 },
            { suit: '♠', rank: 5 },
        ];
        const meld = [
            { suit: '♦', rank: 4 },
            { suit: '♦', rank: 5 },
        ];
        const used = new Set();

        const result = getRunAdditions(hand, meld, used);
        expect(result).toEqual([
            { suit: '♦', rank: 3 },
            { suit: '♦', rank: 6 },
        ]);
    });

    it('ignores wrong suit and used cards', () => {
        const hand = [
            { suit: '♦', rank: 3 },
            { suit: '♠', rank: 6 },
        ];
        const meld = [
            { suit: '♦', rank: 4 },
            { suit: '♦', rank: 5 },
        ];
        const used = new Set([0]); // mark index 0 as used

        const result = getRunAdditions(hand, meld, used);
        expect(result).toEqual([]);
    });
});


describe('isRun', () => {
    it('returns true for same suit', () => {
        const meld = [
            { suit: '♣', rank: 3 },
            { suit: '♣', rank: 4 },
            { suit: '♣', rank: 5 },
        ];
        expect(isRun(meld)).toBe(true);
    });

    it('returns false for mixed suits', () => {
        const meld = [
            { suit: '♣', rank: 3 },
            { suit: '♠', rank: 4 },
            { suit: '♣', rank: 5 },
        ];
        expect(isRun(meld)).toBe(false);
    });
});

describe('isSet', () => {
    it('returns true for same rank', () => {
        const meld = [
            { suit: '♣', rank: 7 },
            { suit: '♦', rank: 7 },
            { suit: '♠', rank: 7 },
        ];
        expect(isSet(meld)).toBe(true);
    });

    it('returns false for different ranks', () => {
        const meld = [
            { suit: '♣', rank: 7 },
            { suit: '♦', rank: 8 },
            { suit: '♠', rank: 7 },
        ];
        expect(isSet(meld)).toBe(false);
    });
});

describe('getSetAdditions', () => {
    it('returns valid additions from hand to set meld', () => {
        const hand = [
            { suit: '♥', rank: 3 },
            { suit: '♣', rank: 8 },
            { suit: '♣', rank: 1 },
            { suit: '♣', rank: 5 },
            { suit: '♠', rank: 5 },
            { suit: '♦', rank: 8 },
            { suit: '♦', rank: 6 }
        ];
        const meld = [
            {
                "suit": "♠",
                "rank": 5
            },
            {
                "suit": "♥",
                "rank": 5
            },
            {
                "suit": "♦",
                "rank": 5
            }
        ];
        const used = new Set();

        const result = getSetAdditions(hand, meld, used);
        expect(result).toEqual([
            { suit: '♣', rank: 5 },
            { suit: '♠', rank: 5 },
        ]);
    });
});

describe('getRunAdditions', () => {
    it('returns cards that extend a run from hand', () => {
        const hand = [
            { suit: '♦', rank: 3 },
            { suit: '♦', rank: 6 },
            { suit: '♦', rank: 7 },
            { suit: '♠', rank: 5 },
        ];
        const meld = [
            { suit: '♦', rank: 4 },
            { suit: '♦', rank: 5 },
        ];
        const used = new Set();

        const result = getRunAdditions(hand, meld, used);
        expect(result).toEqual([
            { suit: '♦', rank: 3 },
            { suit: '♦', rank: 6 },
            { suit: '♦', rank: 7 }
        ]);
    });

    it('returns cards that extend a run from hand 2', () => {
        const hand = [
            { suit: '♦', rank: 8 },
            { suit: '♣', rank: 4 },
            { suit: '♦', rank: 4 },
            { suit: '♦', rank: 9 },
            { suit: '♦', rank: 3 },
            { suit: '♠', rank: 5 } // doesn't match
        ];
        const meld = [
            { suit: '♦', rank: 5 },
            { suit: '♦', rank: 6 },
            { suit: '♦', rank: 7 }
        ];
        const used = new Set();
        used.add(2);

        const result = getRunAdditions(hand, meld, used);
        expect(result).toEqual([
            { suit: '♦', rank: 8 },
            { suit: '♦', rank: 9 }
        ]);
    });

    it('ignores wrong suit and used cards', () => {
        const hand = [
            { suit: '♦', rank: 3 },
            { suit: '♠', rank: 6 },
        ];
        const meld = [
            { suit: '♦', rank: 4 },
            { suit: '♦', rank: 5 },
        ];
        const used = new Set([0]); // mark index 0 as used

        const result = getRunAdditions(hand, meld, used);
        expect(result).toEqual([]);
    });
});

describe('findMeldExtensions', () => {
    it('finds valid set and run extensions', () => {
        const botHand = [
            { suit: '♣', rank: 4 },
            { suit: '♦', rank: 4 },
            { suit: '♦', rank: 9 },
        ];
        const tableMelds = [
                {
                    // Set of 5
                    cards:[
                { suit: '♠', rank: 4 },
                { suit: '♥', rank: 4 },
                { suit: '♠', rank: 4 },
            ]},
            {
                // Set of 5
                cards:[
                { suit: '♦', rank: 6 },
                { suit: '♦', rank: 7 },
                { suit: '♦', rank: 8 },
            ]},
        ];

        const result = findMeldExtensions(botHand, tableMelds);

        expect(result).toEqual([
            {
                meldIndex: 0,
                cards: [
                    { suit: '♣', rank: 4 },
                    { suit: '♦', rank: 4 },
                ],
            },
            {
                meldIndex: 1,
                cards: [
                    { suit: '♦', rank: 9 },
                ],
            },
        ]);
    });
});

