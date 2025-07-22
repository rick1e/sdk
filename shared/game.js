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
        players,
        deck,
        discardPile: [],
        phase: 'waiting', // waiting, dealing, drawing, discarding
        currentPlayerIndex: 0,
        started: false,
        melds: [],
        winner: null,
    };
}

function joinGame(game, playerId, name) {
    if (game.phase !== 'waiting') return;
    game.players.push({ id: playerId, hand: [], name });
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
    game.phase = 'discarding';
    return { success: true, card };
}

function discardCard(game, playerId, card) {
    const player = game.players[game.currentPlayerIndex];
    if (player.id !== playerId || game.phase !== 'discarding') return { error: 'Invalid discard' };

    const index = player.hand.findIndex(c => isSameCard(c, card));
    if (index === -1) return { error: 'Card not in hand' };

    game.discardPile.push(player.hand.splice(index, 1)[0]);

    // ✅ Check win condition
    if (player.hand.length === 0) {
        game.winner = playerId;
        game.phase = 'finished';
        return { success: true, winner: playerId };
    }

    // Continue game
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    game.phase = 'drawing';
    return { success: true };
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

function isValidRun(cards) {
    if (cards.length < 3) return false;
    const jokers = cards.filter(c => c.rank === 'JOKER').length;
    const nonJokers = cards.filter(c => c.rank !== 'JOKER').sort((a, b) => a.rank - b.rank);

    if (nonJokers.some((c, i, arr) => i > 0 && c.suit !== arr[0].suit)) return false;

    let expected = nonJokers[0].rank;
    for (let i = 1; i < nonJokers.length; i++) {
        expected++;
        if (nonJokers[i].rank !== expected) {
            if (jokers > 0) {
                expected--; // assume a joker is inserted
            } else {
                return false;
            }
        }
    }
    return true;
}

function layDownMeld(game, playerId, cards) {
    const player = game.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found' };

    // Ensure cards are in hand
    for (let card of cards) {
        const index = player.hand.findIndex(c => isSameCard(c, card));
        if (index === -1) return { error: 'Card not in hand' };
    }

    if (!(isValidSet(cards) || isValidRun(cards))) {
        return { error: 'Invalid meld' };
    }

    for (let card of cards) {
        const index = player.hand.findIndex(c => isSameCard(c, card));
        player.hand.splice(index, 1);
    }

    if (!game.melds) game.melds = [];
    game.melds.push({ playerId, cards });

    // ✅ Check win
    if (player.hand.length === 0) {
        game.winner = playerId;
        game.phase = 'finished';
        return { success: true, winner: playerId };
    }

    return { success: true };
}

function addToMeld(game, playerId, meldIndex, cards) {
    const player = game.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found' };
    if (!game.melds || !game.melds[meldIndex]) return { error: 'Invalid meld' };

    const meld = game.melds[meldIndex];

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
    if (player.hand.length === 0) {
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





module.exports = {
    createGame,
    joinGame,
    startGame,
    drawCard,
    discardCard,
    layDownMeld,
    addToMeld,
    resetGame
};
