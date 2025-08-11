const NUM_CARDS_IN_HAND = 13;
const JOKERS = 2;

function createDeck() {
    const suits = ['♠', '♣', '♥', '♦'];
    const ranks = [...Array(13)].map((_, i) => i + 1); // 1 (Ace) to 13 (King)
    let deck = [];

    for (let i = 0; i < 2; i++) { // 2 decks + jokers
        suits.forEach(suit => ranks.forEach(rank => {
            deck.push({ suit, rank });
        }));
    }

    // Add jokers
    for (let i = 0; i < JOKERS; i++) {
        deck.push({ rank: 'JOKER' });
    }

    return shuffle(deck);
}

function shuffle(deck) {
    return deck.sort(() => Math.random() - 0.5);
}

function dealCards(deck, numPlayers) {
    const hands = Array.from({ length: numPlayers }, () => []);
    for (let i = 0; i < NUM_CARDS_IN_HAND; i++) {
        for (let j = 0; j < numPlayers; j++) {
            hands[j].push(deck.pop());
        }
    }
    return hands;
}

function createGame(gameId, creatorId) {
    const deck = createDeck();
    // const players = [{ id: creatorId, hand: [], name: 'Host' }];
    const players = [];
    return {
        id: gameId,
        creatorId: creatorId,
        players,
        deck,
        discardPile: [],
        phase: 'waiting', // waiting, dealing, drawing, discarding
        currentPlayerIndex: 0,
        started: false,
        melds: [],
        winner: null,
        callAvailable: false,
        callTimeout: null,
        callRequest: {
            playerId: null,      // ID of player who called
            approved: null,      // true = allowed, false = denied, null = pending
        },
    };
}

function joinGame(game, playerId, name) {
    if (game.phase !== 'waiting') return;
    game.players.push({ id: playerId, hand: [], meldsToLay: [], name });
}

function startGame(game) {
    if (game.players.length < 2) return;
    const hands = dealCards(game.deck, game.players.length);
    game.players.forEach((p, idx) => (p.hand = hands[idx]));
    // Place top card in discard pile
    game.discardPile.push(game.deck.pop());
    game.started = true;
    game.phase = 'drawing';
    game.currentPlayerIndex = 0;
}

function resetGame(game) {
    const deck = createDeck();
    const hands = dealCards(deck, game.players.length);

    game.players.forEach((p, idx) => {
        p.hand = hands[idx];
    });

    game.deck = deck;
    game.discardPile = [deck.pop()];
    game.phase = 'drawing';
    game.currentPlayerIndex = 0;
    game.started = true;
    game.melds = [];
    game.winner = null;
}


function drawCard(game, playerId, fromDiscard = false) {
    const player = game.players[game.currentPlayerIndex];
    if (player.id !== playerId || game.phase !== 'drawing') return { error: 'Not your turn or wrong phase' };

    const card = fromDiscard ? game.discardPile.pop() : game.deck.pop();
    if (!card) return { error: 'No cards to draw' };

    player.hand.push(card);
    game.phase = 'meld';
    return { success: true, card };
}

function giveCards(game, playerId) {
    const player = game.players.find(p => p.id === playerId);
    if (game.phase !== 'waiting on call') return { error: 'Not your turn or wrong phase' };

    const discardedCard =  game.discardPile.pop();
    if (!discardedCard) return { error: 'No cards to draw' };

    const deckCard = game.deck.pop();
    if (!deckCard) return { error: 'No cards to draw' };

    player.hand.push(discardedCard);
    player.hand.push(deckCard);
    // game.phase = 'discarding';
    return { success: true };
}

function discardCard(game, playerId, card) {
    console.log("discarding card -1");
    const player = game.players[game.currentPlayerIndex];

    console.log("player.id",player.id);
    console.log("playa ID",playerId);
    console.log("game Phase",game.phase);

    if (player.id !== playerId || game.phase !== 'discarding') return { error: 'Invalid discard' };

    console.log("discarding card -2");
    const index = player.hand.findIndex(c => isSameCard(c, card));
    if (index === -1) return { error: 'Card not in hand' };

    console.log("discarding card -3");
    game.discardPile.push(player.hand.splice(index, 1)[0]);

    // ✅ Check win condition
    if (hasPlayerWon(player)) {
        game.winner = playerId;
        game.phase = 'finished';
        return { success: true, winner: playerId };
    }
    console.log("discarding card -4");

    // Continue game
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    game.phase = 'waiting on call';
    return { success: true };
}

function hasPlayerWon(player) {
    return player.hand.length === 0 && player.meldsToLay.length === 0;
}


function isSameCard(a, b) {
    return a.rank === b.rank && a.suit === b.suit;
}

// Optional: Check for valid melds
function isValidSet(cards) {
    if (cards.length < 3) return false;
    const ranks = cards.map(c => c.rank).filter(r => r !== 'JOKER');
    return new Set(ranks).size === 1;
}

function isValidRun(cards, minLength = 3) {
    if (cards.length < minLength) return false;

    const jokers = cards.filter(c => c.rank === 'JOKER');
    const nonJokers = cards.filter(c => c.rank !== 'JOKER');
    if (nonJokers.length === 0) return false;

    // All non-jokers must have the same suit
    const suitSet = new Set(nonJokers.map(c => c.suit));
    if (suitSet.size > 1) return false;

    // Try both Ace-low and Ace-high
    return (
        checkRunWithAce(nonJokers, jokers.length, false) || // Ace as 1
        checkRunWithAce(nonJokers, jokers.length, true)    // Ace as 14
    );
}

function checkRunWithAce(nonJokers, jokerCount, aceHigh) {
    const ranks = nonJokers.map(card => {
        if (card.rank === 1 && aceHigh) return 14;
        return card.rank;
    });

    ranks.sort((a, b) => a - b);

    let gaps = 0;
    for (let i = 1; i < ranks.length; i++) {
        const diff = ranks[i] - ranks[i - 1];
        if (diff === 0) return false; // Duplicate rank
        gaps += diff - 1;
    }

    return jokerCount >= gaps;
}

function isValidMeld(cards) {
    return (isValidSet(cards) || isValidRun(cards));
}

function layDownMeldNew(game, playerId) {
    const player = game.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found' };

    const melds = player.meldsToLay;

    // Validate melds
    const allValid = melds.every(isValidMeld); // assumes isValidMeld exists
    if (!allValid) return { error: 'One or more melds are invalid' };

    // Rule: Require 3 melds to lay down
    /*
    if (!player.hasLaidDown && game.rules?.requireThreeMeldsToLay) {
        if (melds.length < 3) {
            return { error: 'You must have at least 3 melds to lay down in this game.' };
        }
    }
     */

    // Check if all cards exist in player hand
    /*
    const allMeldCards = melds.flat();
    const handCopy = [...player.hand];

    for (const card of allMeldCards) {
        const index = handCopy.findIndex(c => c.suit === card.suit && c.rank === card.rank);
        if (index === -1) return { error: 'Card not found in hand' };
        handCopy.splice(index, 1); // remove from copy
    }

    // Commit: Remove cards and mark player

    player.hand = handCopy;
    */
    player.hasLaidDown = true;

    // Add to table
    melds.forEach(meld => {
        game.melds.push({
            playerId,
            cards: sortMeld(meld), // optional: sort for runs
        });
    });

    player.meldsToLay = [];

    if (hasPlayerWon(player)) {
        game.winner = playerId;
        game.phase = 'finished';
        return { success: true, winner: playerId };
    }

    return { success: true, game };
}


function addToMeld(game, playerId, meldIndex, cards) {
    console.log('playerId:', playerId);
    const player = game.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found' };
    if (!game.melds || !game.melds[meldIndex]) return { error: 'Invalid meld' };

    const meld = game.melds[meldIndex];
    console.log('meld:', meld);
    console.log('cards:', cards);

    // Make a copy of meld cards and add new cards
    const newMeldCards = [...meld.cards, ...cards];

    // Check validity
    if (!(isValidSet(newMeldCards) || isValidRun(newMeldCards))) {
        return { error: 'Invalid meld after adding cards' };
    }

    // Verify all cards are in hand
    for (let card of cards) {
        const index = player.hand.findIndex(c => isSameCard(c, card));
        if (index === -1) return { error: 'Card not in hand' };
    }

    // Remove cards from hand
    for (let card of cards) {
        const index = player.hand.findIndex(c => isSameCard(c, card));
        player.hand.splice(index, 1);
    }

    // Update meld
    meld.cards = sortMeld(newMeldCards);



    // Check win
    if (hasPlayerWon(player)) {
        game.winner = playerId;
        game.phase = 'finished';
        return { success: true, winner: playerId };
    }

    return { success: true };
}

function sortMeld(cards) {
    const nonJokers = cards.filter(c => c.rank !== 'JOKER');
    const jokers = cards.filter(c => c.rank === 'JOKER');

    if (nonJokers.length === 0) return jokers; // all jokers? return as-is

    const isRun = nonJokers.every(card => card.suit === nonJokers[0].suit);
    const isSet = nonJokers.every(card => card.rank === nonJokers[0].rank);

    if (isSet) {
        // Sort by suit; Jokers at end
        const sortedSet = [...nonJokers].sort((a, b) => a.suit.localeCompare(b.suit));
        return [...sortedSet, ...jokers];
    }

    if (isRun) {
        // Sort non-jokers by rank
        const sortedRun = [...nonJokers].sort((a, b) => a.rank - b.rank);

        // Insert jokers in positions where rank gaps exist
        let runWithJokers = [];
        let jokerCount = jokers.length;

        for (let i = 0; i < sortedRun.length; i++) {
            runWithJokers.push(sortedRun[i]);

            if (i < sortedRun.length - 1) {
                const currVal = sortedRun[i].rank;
                const nextVal = sortedRun[i + 1].rank;
                const gap = nextVal - currVal - 1;

                for (let g = 0; g < gap && jokerCount > 0; g++) {
                    runWithJokers.push({ rank: 'JOKER' });
                    jokerCount--;
                }
            }
        }

        // Append leftover jokers (likely at end of run)
        for (let i = 0; i < jokerCount; i++) {
            runWithJokers.push({ rank: 'JOKER' });
        }

        return runWithJokers;
    }

    // Fallback: sort non-jokers by rank and stick jokers at end
    const fallback = [...nonJokers].sort((a, b) => a.rank - b.rank);
    return [...fallback, ...jokers];
}

function isSameMeld(meldA, meldB) {
    if (meldA.length !== meldB.length) return false;
    const sortedA = [...meldA].sort(cardSort);
    const sortedB = [...meldB].sort(cardSort);
    return sortedA.every((card, i) =>
        card.rank === sortedB[i].rank && card.suit === sortedB[i].suit
    );
}

function cardSort(a, b) {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.suit.localeCompare(b.suit);
}





    module.exports = {
    createGame,
    joinGame,
    startGame,
    drawCard,
    discardCard,
    giveCards,
    layDownMeldNew,
    addToMeld,
    resetGame,
    isValidRun,
    isSameMeld
};
