const {
    drawCard,
    discardCard,
    layDownMeldNew,
    addToMeld,
} = require('../../shared/game');

function botPlayDraw(player, gameState) {
    console.log("bot playing draw turn");
    drawBotCard(gameState, player.id);
}

function botPlayMelds(player, gameState) {
    console.log("bot playing melds turn");
    const botIndex = gameState.currentPlayerIndex;

    layDownInitialMelds(player, gameState);
    extendExistingMelds(gameState.players[botIndex], gameState);
}

function botPlayDiscard(player, gameState) {
    console.log("bot playing discard turn");
    const botIndex = gameState.currentPlayerIndex;

    const discard = chooseWorstCard(gameState.players[botIndex].hand);
    discardCard(gameState, player.id, discard);
}

function layDownInitialMelds(player, gameState) {
    const meldsToLay = extractMeldsFromHand(player.hand);
    if (meldsToLay.length > 0) {
        player.meldsToLay = meldsToLay;
        const cardsToRemove = meldsToLay.flat();
        player.hand = player.hand.filter(card =>
            !cardsToRemove.some(m => m.suit === card.suit && m.rank === card.rank)
        );
        layDownMeldNew(gameState, player.id);
    }
}

function extendExistingMelds(player, gameState) {
    const extensions = findMeldExtensions(player.hand, gameState.melds);
    for (const extension of extensions) {
        addToMeld(gameState, player.id, extension.meldIndex, extension.cards);
    }
}

function drawBotCard(gameState, playerId) {
    const wantsDiscard = Math.random() > 0.5;

    if (wantsDiscard) {
        console.log("bot drawing from discard pile");
        drawCard(gameState, playerId, true);
    } else {
        console.log("bot drawing from deck");
        drawCard(gameState, playerId, false);
    }
}

function chooseWorstCard(hand) {
    return hand.reduce((worst, card) => {
        if (!worst) return card;
        return card.rank > worst.rank ? card : worst;
    }, null);
}

/*
function extractMeldsFromHand(hand) {
    const meldsToLay = [];
    const usedIndices = new Set();

    const rankGroups = {};
    hand.forEach((card, idx) => {
        if (!rankGroups[card.rank]) rankGroups[card.rank] = [];
        rankGroups[card.rank].push({ ...card, index: idx });
    });

    for (const rank in rankGroups) {
        const group = rankGroups[rank].filter(c => !usedIndices.has(c.index));
        if (group.length >= 3) {
            const meld = group.slice(0, 4).map(c => ({ suit: c.suit, rank: c.rank }));
            meldsToLay.push(meld);
            group.slice(0, meld.length).forEach(c => usedIndices.add(c.index));
        }
    }

    const suitGroups = {};
    hand.forEach((card, idx) => {
        if (!suitGroups[card.suit]) suitGroups[card.suit] = [];
        suitGroups[card.suit].push({ ...card, index: idx });
    });

    for (const suit in suitGroups) {
        const cards = suitGroups[suit]
            .filter(c => !usedIndices.has(c.index))
            .sort((a, b) => a.rank - b.rank);

        let run = [];
        for (let i = 0; i < cards.length; i++) {
            if (run.length === 0 || cards[i].rank === run[run.length - 1].rank + 1) {
                run.push(cards[i]);
            } else if (cards[i].rank === run[run.length - 1].rank) {
                // continue;
            } else {
                if (run.length >= 3) {
                    const meld = run.map(c => ({ suit: c.suit, rank: c.rank }));
                    meldsToLay.push(meld);
                    run.forEach(c => usedIndices.add(c.index));
                }
                run = [cards[i]];
            }
        }

        if (run.length >= 3) {
            const meld = run.map(c => ({ suit: c.suit, rank: c.rank }));
            meldsToLay.push(meld);
            run.forEach(c => usedIndices.add(c.index));
        }
    }

    return meldsToLay;
}
*/

function extractMeldsFromHand(hand) {
    const meldsToLay = [];
    const usedIndices = new Set();

    const isJoker = (card) => card.rank === 'JOKER';

    // --- 1. Group by rank (sets) ---
    const rankGroups = {};
    hand.forEach((card, idx) => {
        const key = isJoker(card) ? 'JOKER' : card.rank;
        if (!rankGroups[key]) rankGroups[key] = [];
        rankGroups[key].push({ ...card, index: idx });
    });

    for (const rank in rankGroups) {
        if (rank === 'JOKER') continue; // jokers are used in other groups

        const jokers = rankGroups['JOKER']?.filter(c => !usedIndices.has(c.index)) || [];
        const group = rankGroups[rank].filter(c => !usedIndices.has(c.index));

        const combined = [...group, ...jokers];

        if (combined.length >= 3) {
            meldsToLay.push(combined);
            combined.forEach(c => usedIndices.add(c.index));
        }
    }

    // --- 2. Group by suit (runs) ---
    const suitGroups = {};
    hand.forEach((card, idx) => {
        const suitKey = isJoker(card) ? 'JOKER' : card.suit;
        if (!suitGroups[suitKey]) suitGroups[suitKey] = [];
        suitGroups[suitKey].push({ ...card, index: idx });
    });

    for (const suit in suitGroups) {
        if (suit === 'JOKER') continue; // jokers don't form runs alone

        const jokers = suitGroups['JOKER']?.filter(c => !usedIndices.has(c.index)) || [];
        const cards = suitGroups[suit]
            .filter(c => !usedIndices.has(c.index) && !isJoker(c))
            .sort((a, b) => a.rank - b.rank);

        let run = [];
        let availableJokers = [...jokers];

        for (let i = 0; i < cards.length; i++) {
            if (run.length === 0) {
                run.push(cards[i]);
                continue;
            }

            let lastRank = run[run.length - 1].rank;
            let gap = cards[i].rank - lastRank;

            if (gap === 1) {
                run.push(cards[i]);
            } else if (gap > 1 && availableJokers.length >= gap - 1) {
                // Fill all missing ranks with jokers
                for (let g = 1; g < gap; g++) {
                    run.push(availableJokers.pop());
                }
                run.push(cards[i]);
            } else {
                if (run.length >= 3) {
                    meldsToLay.push(run);
                    run.forEach(c => usedIndices.add(c.index));
                }
                run = [cards[i]];
                availableJokers = [...jokers];
            }
        }

        // Append remaining jokers at the end of a run
        while (availableJokers.length > 0) {
            run.push(availableJokers.pop());
        }

        if (run.length >= 3) {
            meldsToLay.push(run);
            run.forEach(c => usedIndices.add(c.index));
        }
    }

    // --- 3. Remove index before returning ---
    return meldsToLay.map(meld =>
        meld.map(({ suit, rank }) => ({ suit, rank }))
    );
}


function isRun(meld) {
    return meld.every(c => c.suit === meld[0].suit);
}

function isSet(meld) {
    return new Set(meld.map(c => c.rank)).size === 1;
}

function getSetAdditions(botHand, meld, usedCardIndexes) {
    const additions = [];
    const rank = meld[0].rank;

    botHand.forEach((card, index) => {
        if (!usedCardIndexes.has(index) && card.rank === rank) {
            additions.push(card);
            usedCardIndexes.add(index);
        }
    });

    return additions;
}

function getRunAdditions(botHand, meld, usedIndexes) {
    const suit = meld[0].suit;
    const runRanks = meld.map(c => c.rank).sort((a, b) => a - b);
    const cardsToAdd = [];

    let extended = true;
    while (extended) {
        extended = false;

        const low = Math.min(...runRanks);
        const prepend = botHand.find((card, index) =>
            !usedIndexes.has(index) && card.suit === suit && card.rank === low - 1
        );

        if (prepend) {
            runRanks.unshift(prepend.rank);
            cardsToAdd.push(prepend);
            usedIndexes.add(botHand.indexOf(prepend));
            extended = true;
        }

        const high = Math.max(...runRanks);
        const append = botHand.find((card, index) =>
            !usedIndexes.has(index) && card.suit === suit && card.rank === high + 1
        );

        if (append) {
            runRanks.push(append.rank);
            cardsToAdd.push(append);
            usedIndexes.add(botHand.indexOf(append));
            extended = true;
        }
    }

    return cardsToAdd;
}

function findMeldExtensions(botHand, tableMelds) {
    const extensions = [];
    const usedCardIndexes = new Set();

    for (let i = 0; i < tableMelds.length; i++) {
        const meld = tableMelds[i].cards;
        if (!Array.isArray(meld) || meld.length < 3) continue;

        let cardsToAdd = [];

        if (isSet(meld)) {
            cardsToAdd = getSetAdditions(botHand, meld, usedCardIndexes);
        } else if (isRun(meld)) {
            cardsToAdd = getRunAdditions(botHand, meld, usedCardIndexes);
        }

        if (cardsToAdd.length > 0) {
            extensions.push({ meldIndex: i, cards: cardsToAdd });
        }
    }

    return extensions;
}

module.exports = {
    botPlayDraw,
    botPlayDiscard,
    botPlayMelds,
    extractMeldsFromHand,
    isRun,
    isSet,
    getSetAdditions,
    getRunAdditions,
    findMeldExtensions
};
