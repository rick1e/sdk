const {
    drawCard,
    discardCard,
    layDownMeldNew,
    addToMeld,
    VALID_RUN_LENGTH,
} = require('../../shared/game');

const {
    suggestNeededCards,
    isSuggestedContainsCard,
    suggestDiscardableCards
} =  require('./thinking');

function botPlayDraw(player, gameState) {
    console.log("bot playing draw turn");
    drawBotCard(gameState, player);
}

function botPlayMelds(player, gameState) {
    console.log("bot playing melds turn");

    if(!player.hasLaidDown) {
        console.log("bot trying to lay");
        layDownInitialMelds(player, gameState);
    }
    else {
        console.log("bot tacking on");
        extendExistingMelds(player, gameState);
    }
}

function botPlayDiscard(player, gameState) {
    console.log("bot playing discard turn");
    const botIndex = gameState.currentPlayerIndex;

    const discard = chooseWorstCard(gameState,gameState.players[botIndex].hand, gameState.players[botIndex].meldsToLay);
    discardCard(gameState, player.id, discard);
}

function botAllowCall(player, gameState){
    return  player.hasLaidDown || !botWantsDiscard(gameState, player);
}

function botMakeCall(player, gameState) {
    return botWantsDiscard(gameState, player);
}

function layDownInitialMelds(player, gameState) {

    let remainingSets = gameState.rules.requireNumberOfSetToLay;
    let remainingRuns = gameState.rules.requireNumberOfRunsToLay;

    console.log("remaining Sets", remainingSets);

    for (let i = 0; i < player.meldsToLay.length; i++) {
        if (isSet(player.meldsToLay[i])) {
            remainingSets--;
        }
        if (isRun(player.meldsToLay[i])) {
            remainingRuns--;
        }
    }

    console.log("remaining Sets", remainingSets);


    const meldsToLay = extractMeldsFromHand(player.hand,remainingSets,remainingRuns);

    player.meldsToLay = [...player.meldsToLay, ...meldsToLay];

    const cardsToRemove = meldsToLay.flat();

    player.hand = player.hand.filter(card =>
        !cardsToRemove.some(m => m.suit === card.suit && m.rank === card.rank)
    );

    if (player.meldsToLay.length >= gameState.rules?.requireNumberOfMeldsToLay) {
        layDownMeldNew(gameState, player.id);
    }
}
function extendExistingMelds(player, gameState) {
    const extensions = findMeldExtensions(player.hand, gameState.melds);
    for (const extension of extensions) {
        console.log(addToMeld(gameState, player.id, extension.meldIndex, extension.cards) );
    }
}

function drawBotCard(gameState, player) {

    if(player.hasLaidDown){
        drawCard(gameState, player.id, false);
        return;
    }

    const wantsDiscard = botWantsDiscard(gameState, player);

    if (wantsDiscard) {
        console.log("bot drawing from discard pile");
        drawCard(gameState, player.id, true);
    } else {
        console.log("bot drawing from deck");
        drawCard(gameState, player.id, false);
    }
}

function botWantsDiscard(gameState, player) {

    const topOfDiscardPile = gameState.discardPile.slice(-1)[0];
    const usedIndices = new Set();

    const runs = extractRuns(player.hand, usedIndices);
    const sets = extractSets(player.hand, usedIndices);

    let remainingSets = gameState.rules.requireNumberOfSetToLay;
    let remainingRuns = gameState.rules.requireNumberOfRunsToLay;

    for (let i = 0; i < player.meldsToLay.length; i++) {
        if (isSet(player.meldsToLay[i])) {
            remainingSets--;
        }
        if (isRun(player.meldsToLay[i])) {
            remainingRuns--;
        }
    }



    const neededCards = suggestNeededCards(
        player.hand,
        remainingSets,
        remainingRuns,
        sets,
        runs
    );

    return  isSuggestedContainsCard(neededCards,topOfDiscardPile);

}

function chooseWorstCard(gameState,hand,meldsToLay) {

    let remainingSets = gameState.rules.requireNumberOfSetToLay;
    let remainingRuns = gameState.rules.requireNumberOfRunsToLay;

    for (let i = 0; i < meldsToLay.length; i++) {
        if (isSet(meldsToLay[i])) {
            remainingSets--;
        }
        if (isRun(meldsToLay[i])) {
            remainingRuns--;
        }
    }

    const discardableCards = suggestDiscardableCards(
        hand,
        remainingSets,
        remainingRuns
    );



    const toDiscard = discardableCards.reduce((worst, card) => {
        if (!worst) return card;
        return card.rank > worst.rank ? card : worst;
    }, null);

    if( toDiscard !== null) {
        return toDiscard;
    }

    return hand.reduce((worst, card) => {
        if (!worst) return card;
        return card.rank > worst.rank ? card : worst;
    }, null);
}

function extractMeldsFromHand(hand, remainingSets, remainingRuns) {
    const usedIndices = new Set();
    let meldsFromRuns = [];
    let meldsFromSets = [];

    if(remainingRuns > 0) {
        meldsFromRuns = extractRuns(hand, usedIndices);
        meldsFromRuns = meldsFromRuns.slice(0,remainingRuns);
    }
    if(remainingSets > 0) {
        meldsFromSets = extractSets(hand, usedIndices);
        meldsFromSets = meldsFromSets.slice(0,remainingSets);
    }

    const meldsToLay = [...meldsFromSets, ...meldsFromRuns];
    return cleanMelds(meldsToLay);
}

// --- Helpers ---

const isJoker = (card) => card.rank === 'JOKER';

function groupBy(array, keyFn) {
    return array.reduce((groups, item, idx) => {
        const key = keyFn(item);
        if (!groups[key]) groups[key] = [];
        groups[key].push({ ...item, index: idx });
        return groups;
    }, {});
}

// --- 1. Extract Sets (group by rank) ---
function extractSets(hand, usedIndices) {
    const melds = [];
    const rankGroups = groupBy(hand, (card) => isJoker(card) ? 'JOKER' : card.rank);

    for (const rank in rankGroups) {
        if (rank === 'JOKER') continue;

        const jokers = (rankGroups['JOKER'] || []).filter(c => !usedIndices.has(c.index));
        const group = rankGroups[rank].filter(c => !usedIndices.has(c.index));
        const combined = [...group, ...jokers];

        if (combined.length >= 3) {
            melds.push(combined);
            combined.forEach(c => usedIndices.add(c.index));
        }
    }
    return melds;
}

// --- 2. Extract Runs (group by suit) ---
function extractRuns(hand, usedIndices) {
    const melds = [];
    const suitGroups = groupBy(hand, (card) => isJoker(card) ? 'JOKER' : card.suit);

    for (const suit in suitGroups) {
        if (suit === 'JOKER') continue;

        const jokers = (suitGroups['JOKER'] || []).filter(c => !usedIndices.has(c.index));
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
                for (let g = 1; g < gap; g++) {
                    run.push(availableJokers.pop());
                }
                run.push(cards[i]);
            } else {
                if (run.length >= VALID_RUN_LENGTH) {
                    melds.push(run);
                    run.forEach(c => usedIndices.add(c.index));
                }
                run = [cards[i]];
                availableJokers = [...jokers];
            }
        }

        while (availableJokers.length > 0) {
            run.push(availableJokers.pop());
        }

        if (run.length >= VALID_RUN_LENGTH) {
            melds.push(run);
            run.forEach(c => usedIndices.add(c.index));
        }
    }

    return melds;
}

// --- 3. Cleanup output ---
function cleanMelds(melds) {
    return melds.map(meld =>
        meld.map(({ suit, rank }) => ({ suit, rank }))
    );
}

function isRun(meld) {
    const nonJokers = meld.filter(c => c.rank !== 'JOKER');
    if (nonJokers.length === 0) return true; // all jokers = valid run

    const suit = nonJokers[0].suit;
    return nonJokers.every(c => c.suit === suit);
}

function isSet(meld) {
    const nonJokers = meld.filter(c => c.rank !== 'JOKER');
    if (nonJokers.length === 0) return true; // all jokers = valid set

    const rank = nonJokers[0].rank;
    return nonJokers.every(c => c.rank === rank);
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
    botAllowCall,
    botMakeCall,
    extractMeldsFromHand,
    isRun,
    isSet,
    getSetAdditions,
    getRunAdditions,
    findMeldExtensions,
    layDownInitialMelds,
    layDownMeldNew
};
