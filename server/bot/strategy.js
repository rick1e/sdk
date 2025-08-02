const {
    drawCard,
    discardCard,
    layDownMeldNew,
    addToMeld,
} = require('../../shared/game');

function botPlayTurn(player, gameState) {
    console.log("bot playing turn");
    const hand = player.hand;
    const botIndex = gameState.currentPlayerIndex;
    console.log("bot hand", hand);

    const meldsToLay = extractMeldsFromHand(hand)
    console.log("bot melds", meldsToLay);
    if (meldsToLay.length > 0 ){
        player.meldsToLay = meldsToLay;

        // Flatten melds into a list of cards to remove
        const cardsToRemove = meldsToLay.flat();

        // Remove each card from hand by matching suit + rank
        player.hand = hand.filter(card =>
            !cardsToRemove.some(m => m.suit === card.suit && m.rank === card.rank)
        );

        console.log("bot hand after melds", player.hand);

        layDownMeldNew(gameState, player.id);
    }

    console.log("table melds:", JSON.stringify(gameState.melds, null, 2));
    console.log("hand:", gameState.players[botIndex].hand);

    const extensions = findMeldExtensions(gameState.players[botIndex].hand, gameState.melds);

    console.log("extensions:", JSON.stringify(extensions));

    if (extensions.length > 0 ) {
        for (const extension of extensions) {

            console.log("meldIndex:", extension.meldIndex);
            console.log("cards:", extension.cards);
            addToMeld(gameState, player.id, extension.meldIndex, extension.cards);
        }
    }

    // Draw from deck if no good discard
    const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];
    const wants = Math.random() > 0.5; // Randomized desire for discard

    if (wants) {
        console.log("bot drawing from discard pile");
        drawCard(gameState, player.id, true);
        console.log("bot hand:",gameState.players[botIndex].hand);
    } else {
        console.log("bot drawing from deck");
        drawCard(gameState, player.id, false);
        console.log("bot hand:",gameState.players[botIndex].hand);
    }





    // Choose discard: highest rank not in set/sequence
    const discard = chooseWorstCard(gameState.players[botIndex].hand);
    console.log("bot discarding :", discard);

    discardCard(gameState, player.id, discard);
    console.log("bot hand:",gameState.players[botIndex].hand);

}

function chooseWorstCard(hand) {
    return hand.reduce((worst, card) => {
        if (!worst) return card;
        return card.rank > worst.rank ? card : worst;
    }, null);
}

function shouldLayDown(hand) {
    return hand.length < 8; // Naive condition
}


function extractMeldsFromHand(hand) {
    const meldsToLay = [];
    const usedIndices = new Set();

    // --- FIND SETS (3+ same rank, diff suits) ---
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

    // --- FIND RUNS (3+ consecutive same suit) ---
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
            if (
                run.length === 0 ||
                cards[i].rank === run[run.length - 1].rank + 1
            ) {
                run.push(cards[i]);
            } else if (cards[i].rank === run[run.length - 1].rank) {
                continue; // skip duplicate ranks in same suit
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
        if (
            !usedCardIndexes.has(index) &&
            card.rank === rank
        ) {
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

    // Create a set for fast lookup
    const runSet = new Set(runRanks);

    let extended = true;
    while (extended) {
        extended = false;

        // Look for cards that can extend the beginning
        const low = Math.min(...runRanks);
        const prepend = botHand.find((card, index) =>
            !usedIndexes.has(index) &&
            card.suit === suit &&
            card.rank === low - 1
        );

        if (prepend) {
            runRanks.unshift(prepend.rank);
            cardsToAdd.push(prepend);
            usedIndexes.add(botHand.indexOf(prepend));
            extended = true;
        }

        // Look for cards that can extend the end
        const high = Math.max(...runRanks);
        const append = botHand.find((card, index) =>{

            return !usedIndexes.has(index) &&
            card.suit === suit &&
            card.rank === high + 1
        }
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
    botPlayTurn,
    shouldLayDown,
    extractMeldsFromHand,
    isRun,
    isSet,
    getSetAdditions,
    getRunAdditions,
    findMeldExtensions
};
