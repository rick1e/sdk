const { suggestNeededCards } = require('../server/bot/thinking');
const { suggestDiscardableCards } = require('../server/bot/thinking');

describe("suggestDiscardableCards", () => {
    it("should discard isolated cards once set/run requirements are met", () => {
        const hand = [
            { rank: 3, suit: "♠" },
            { rank: 3, suit: "♥" },
            { rank: 3, suit: "♦" },  // valid set of 3s

            { rank: 5, suit: "♣" },
            { rank: 6, suit: "♣" },
            { rank: 7, suit: "♣" },  // valid run 5♣–6♣–7♣

            { rank: 9, suit: "♠" },
            { rank: 12, suit: "♥" }, // queen (isolated)
            { rank: 2, suit: "♣" }   // isolated low card
        ];

        const result = suggestDiscardableCards(hand, 1, 1);

        expect(result).toEqual([
            { rank: 9, suit: "♠" },
            { rank: 12, suit: "♥" },
            { rank: 2, suit: "♣" }
        ]);
    });

    it("bot scenario 1", () => {
        // 8♣, 2♦, 8♠, 9♠,5♦
        const hand = [
            { rank: 8, suit: "♠" },
            { rank: 8, suit: "♣" },
            { rank: 2, suit: "♦" },  // valid set of 3s

            { rank: 5, suit: "♦" },
            { rank: 9, suit: "♠" },
        ];

        const result = suggestDiscardableCards(hand, 0, 1);

        expect(result).toEqual([
            { rank: 8, suit: "♣" },
            { rank: 2, suit: "♦" },
            { rank: 5, suit: "♦" }
        ]);
    });

    it("bot scenario 2", () => {
        // 4♣, 3♦, 2♥, 4♦, 6♦
        const hand = [
            { rank: 4, suit: "♠" },
            { rank: 3, suit: "♦" },
            { rank: 2, suit: "♥" },  // valid set of 3s

            { rank: 4, suit: "♦" },
            { rank: 6, suit: "♦" },
        ];

        const result = suggestDiscardableCards(hand, 0, 1);

        expect(result).toEqual([
            { rank: 4, suit: "♠" },
            { rank: 2, suit: "♥" }
        ]);
    });

    it("bot scenario 3", () => {
        // 4♣, 3♦, 2♥, 4♦, 6♦
        const hand = [
            { rank: 4, suit: "♠" },
            { rank: 3, suit: "♦" },
            { rank: 'JOKER'},
            { rank: 2, suit: "♥" },  // valid set of 3s

            { rank: 4, suit: "♦" },
            { rank: 6, suit: "♦" },
        ];

        const result = suggestDiscardableCards(hand, 0, 1);

        expect(result).toEqual([
            { rank: 4, suit: "♠" },
            { rank: 2, suit: "♥" }
        ]);
    });


    it("bot scenario 4", () => {
        // 1♣, 1♦, 12♥, 12♣
        const hand = [
            { rank: 1, suit: "♠" },
            { rank: 1, suit: "♦" },
            { rank: 12, suit: "♥" },  // valid set of 3s
            { rank: 12, suit: "♦" },
        ];

        const result = suggestDiscardableCards(hand, 1, 0);

        expect(result).toEqual([
            { rank: 1, suit: "♠" },
            { rank: 1, suit: "♦" },
            { rank: 12, suit: "♥" },  // valid set of 3s
            { rank: 12, suit: "♦" }
        ]);
    });
    it("bot scenario 5", () => {
        // 7♥, 5♣, 6♥, 7♣
        const hand = [
            { rank: 7, suit: "♠" },
            { rank: 7, suit: "♦" },
            { rank: 5, suit: "♥" },  // valid set of 3s
            { rank: 6, suit: "♦" },
        ];

        const result = suggestDiscardableCards(hand, 1, 0);

        expect(result).toEqual([
            { rank: 5, suit: "♥" },  // valid set of 3s
            { rank: 6, suit: "♦" },
        ]);
    });
    it("bot scenario 6 Need One of Duplicate", () => {
        // 7♥, 5♣, 6♥, 7♣
        const hand = [
            { rank: 7, suit: "♠" },
            { rank: 7, suit: "♦" },
            { rank: 7, suit: "♦" },
            { rank: 5, suit: "♥" },  // valid set of 3s
            { rank: 6, suit: "♦" },
        ];

        const result = suggestDiscardableCards(hand, 0, 1);

        expect(result).toEqual([
            { rank: 7, suit: "♦" },
            { rank: 7, suit: "♠" },  // valid set of 3s
            { rank: 5, suit: "♥" },
        ]);
    });
});

describe("suggestNeededCards", () => {
    it("should suggest missing cards for a set and a run", () => {
        const hand = [
            { suit: "♥", rank: 5 },
            { suit: "♥", rank: 7 },
            { suit: "♣", rank: 9 },
            { suit: "♦", rank: 9 },
            { suit: "♠", rank: 9 },
        ];

        const setsRequired = 1;
        const runsRequired = 1;
        const sets = []; // none formed yet
        const runs = []; // none formed yet

        const result = suggestNeededCards(hand, setsRequired, runsRequired, sets, runs);

        // Expect it to suggest 6♥ for the run
        expect(result).toEqual(
            expect.arrayContaining([
                { type: "RUN", suggestion: { suit: "♥", rank: 6 } },
            ])
        );

    });

    it("should return empty list if requirements already satisfied", () => {
        const hand = [
            { suit: "♥", rank: 4 },
            { suit: "♥", rank: 5 },
            { suit: "♥", rank: 6 },
            { suit: "♥", rank: 7 },
            { suit: "♣", rank: 9 },
            { suit: "♦", rank: 9 },
            { suit: "♠", rank: 9 },
        ];

        const setsRequired = 1;
        const runsRequired = 1;
        const sets = [[
            { suit: "♣", rank: 9 },
            { suit: "♦", rank: 9 },
            { suit: "♠", rank: 9 },
        ]];
        const runs = [[
            { suit: "♥", rank: 5 },
            { suit: "♥", rank: 6 },
            { suit: "♥", rank: 7 },
        ]];

        const result = suggestNeededCards(hand, setsRequired, runsRequired, sets, runs);

        expect(result).toEqual([]); // already satisfied
    });

    it("bot scenario 1", () => {
        const hand = [
            { suit: "♥", rank: 11 },
            { suit: "♥", rank: 12 },
            { suit: "♥", rank: 13 }
        ];

        const setsRequired = 0;
        const runsRequired = 1;
        const sets = [];
        const runs = [];

        const result = suggestNeededCards(hand, setsRequired, runsRequired, sets, runs);

        expect(result).toEqual(
            expect.arrayContaining([
                { type: "RUN", suggestion: { suit: "♥", rank: 10 } },
                { type: "RUN", suggestion: { suit: "♥", rank: 1 } }
            ])
        ); // already satisfied
    });

    it("bot scenario 2", () => {
        const hand = [
            { suit: "♥", rank: 11 },
            { suit: "♥", rank: 13 }
        ];

        const setsRequired = 0;
        const runsRequired = 1;
        const sets = [];
        const runs = [];

        const result = suggestNeededCards(hand, setsRequired, runsRequired, sets, runs);

        expect(result).toEqual(
            expect.arrayContaining([
                { type: "RUN", suggestion: { suit: "♥", rank: 10 } },
                { type: "RUN", suggestion: { suit: "♥", rank: 12 }},
                { type: "RUN", suggestion: { suit: "♥", rank: 1 } }
            ])
        ); // already satisfied
    });

    it("bot scenario 3", () => {
        const hand = [
            { suit: "♥", rank: 11 },
            { suit: "♥", rank: 12 }
        ];

        const setsRequired = 0;
        const runsRequired = 1;
        const sets = [];
        const runs = [];

        const result = suggestNeededCards(hand, setsRequired, runsRequired, sets, runs);

        expect(result).toEqual(
            expect.arrayContaining([
                { type: "RUN", suggestion: { suit: "♥", rank: 9 } },
                { type: "RUN", suggestion: { suit: "♥", rank: 10 } },
                { type: "RUN", suggestion: { suit: "♥", rank: 13 } },
                { type: "RUN", suggestion: { suit: "♥", rank: 1 } }
            ])
        ); // already satisfied
    });

    it("bot scenario 4", () => {
        const hand = [
            { suit: "♥", rank: 11 },
            { suit: "♥", rank: 1 },
        ];

        const setsRequired = 0;
        const runsRequired = 1;
        const sets = [];
        const runs = [];

        const result = suggestNeededCards(hand, setsRequired, runsRequired, sets, runs);

        expect(result).toEqual(
            expect.arrayContaining([
                { type: "RUN", suggestion: { suit: "♥", rank: 12 } },
                { type: "RUN", suggestion: { suit: "♥", rank: 13 } }
            ])
        ); // already satisfied
    });
});
