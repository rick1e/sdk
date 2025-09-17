

const VALID_SET_LENGTH = 3;
const isJoker = (card) => card.rank === 'JOKER';

function isSuggestedContainsCard(needed, card) {
    return needed.some(n => {
        // skip invalid entries
        if (!n.suggestion || !card) return false;

        // special case: Joker
        if (n.suggestion.rank === 'JOKER' && card.rank === 'JOKER') {
            return true;
        }

        return n.suggestion.suit === card.suit && n.suggestion.rank === card.rank;
    });
}

function suggestNeededCards(hand, setsRequired, runsRequired,sets,runs) {
    const needed = [];

    // Track what we already have
    const byRank = {};
    const bySuit = {};

    hand.forEach((card) => {
        if (!isJoker(card)) {
            if (!byRank[card.rank]) byRank[card.rank] = [];
            byRank[card.rank].push(card.suit);

            if (!bySuit[card.suit]) bySuit[card.suit] = [];
            bySuit[card.suit].push(card.rank);
        }
    });

    // --- Check SETS ---
    if (sets.length < setsRequired) {
        for (const rank in byRank) {
            const suitsOwned = byRank[rank];
            const countOwned = suitsOwned.length;

            if (countOwned < VALID_SET_LENGTH) {
                ['♠', '♣', '♥', '♦'].forEach((suit) => {
                    needed.push({
                        type: "SET",
                        suggestion: { suit, rank: parseInt(rank, 10) }
                    });
                });
            }
        }
    }


    // --- Check RUNS ---
    if (runs.length < runsRequired) {
        for (const suit in bySuit) {
            const ranks = [...new Set(bySuit[suit])].sort((a, b) => a - b);

            if (ranks.includes(1)) ranks.push(14);

            for (let i = 0; i < ranks.length - 1; i++) {
                let current = ranks[i];
                let next = ranks[i + 1];
                let gap = next - current;

                if (gap >= 1 && gap <= 3) {
                    // Example: we have 5♥ and 7♥ → missing 6♥
                    for (let missingRank = current + 1; missingRank < next; missingRank++) {
                        const rankToAdd = missingRank === 14 ? 1 : missingRank;
                        needed.push({
                            type: "RUN",
                            suggestion: { suit, rank: rankToAdd }
                        });
                    }
                }
                if (gap <= 2){
                    if (current > 1) {
                        needed.push({type: "RUN", suggestion: {suit, rank: current - 1}});
                    }
                    if (next < 14) {
                        const nextToAdd = next + 1  === 14 ? 1 : next + 1;
                        needed.push({type: "RUN", suggestion: {suit, rank: nextToAdd}});
                    }

                }
                if (gap === 1){
                    if (current > 2) {
                        needed.push({type: "RUN", suggestion: {suit, rank: current - 2}});
                    }
                    if (next < 13) {
                        const nextToAdd = next + 2  === 14 ? 1 : next + 2;
                        needed.push({type: "RUN", suggestion: {suit, rank: nextToAdd}});
                    }

                }
            }
        }
    }

    return needed;
}

function suggestDiscardableCards(hand, setsRequired, runsRequired) {

    let rankedForSets = [];
    let rankedForRuns = [];

    if (setsRequired > 0) {
        rankedForSets = rankCardsForSets(hand);
    }

    if(runsRequired > 0) {
        rankedForRuns = rankCardsForRuns(hand);
    }


    const scoredHand = combineScores(rankedForSets, rankedForRuns);

    const lowestCards = getLowestScore(scoredHand);

    // --- Discard candidates ---
    return lowestCards.map(item => item.card);

}


function rankCardsForRuns(hand) {
    // Group by suit
    const bySuit = {};
    for (const card of hand) {
        if (!bySuit[card.suit]) bySuit[card.suit] = [];
        bySuit[card.suit].push(card.rank);
    }

    // Sort ranks inside each suit
    for (const suit in bySuit) {
        bySuit[suit].sort((a, b) => a - b);
    }

    const scores = new Map();

    for (const card of hand) {
        let score = 0;
        const ranks = bySuit[card.suit];

        // immediate neighbors
        if (ranks.includes(card.rank - 1)) score += 2;
        if (ranks.includes(card.rank + 1)) score += 2;

        // near neighbors
        if (ranks.includes(card.rank - 2)) score += 1;
        if (ranks.includes(card.rank + 2)) score += 1;

        // sandwich bonus
        if (ranks.includes(card.rank - 1) && ranks.includes(card.rank + 1)) {
            score += 3;
        }

        if(card.rank === 'JOKER'){
            score = 99;
        }

        // use stable key
        const key = card.suit + card.rank;
        scores.set(key, score);
    }

    // Return ranked cards
    const rankedHand = hand
        .slice()
        .sort((a, b) => scores.get(b.suit + b.rank) - scores.get(a.suit + a.rank))
        .map(c => ({ card: c, score: scores.get(c.suit + c.rank) }));

    return applyDuplicatePenalty(rankedHand);
}

function rankCardsForSets(hand) {
    // Group by rank (ignore suits)
    const byRank = {};
    for (const card of hand) {
        if (!byRank[card.rank]) byRank[card.rank] = 0;
        byRank[card.rank] += 1;
    }

    const scores = new Map();

    for (const card of hand) {
        const count = byRank[card.rank];
        let score = 0;

        if (count >= 3) {
            score = 5; // strong, valid set
        } else if (count === 2) {
            score = 3; // potential set
        } else {
            score = 0; // no set potential
        }

        if(card.rank === 'JOKER'){
            score = 99;
        }

        // use stable key
        const key = card.suit + card.rank;
        scores.set(key, score);
    }

    // Return ranked hand
    return hand
        .slice()
        .sort((a, b) => scores.get(b.suit + b.rank) - scores.get(a.suit + a.rank))
        .map(c => ({ card: c, score: scores.get(c.suit + c.rank) }));
}

function combineScores(arr1, arr2) {
    if (arr1.length === 0) return  arr2;
    if (arr2.length === 0) return  arr1;

    // Create a map from suit+rank to score for arr1
    const scoreMap = new Map();
    for (const item of arr1) {
        const key = item.card.suit + item.card.rank;
        scoreMap.set(key, item.score);
    }

    // Add scores from arr2
    return arr2.map(item => {
        const key = item.card.suit + item.card.rank;
        const score1 = scoreMap.get(key) || 0;
        const totalScore = score1 + item.score;
        return { card: item.card, score: totalScore };
    });

}

function getLowestScore(cards) {
    if (cards.length === 0) return [];

    let minScore = Infinity;
    let lowestCards = [];

    for (const item of cards) {
        if (item.score < minScore) {
            minScore = item.score;
            lowestCards = [item];
        } else if (item.score === minScore) {
            lowestCards.push(item);
        }
    }

    return lowestCards;
}

function applyDuplicatePenalty(rankedHand, penalty = 2) {
    const seen = new Set();

    return rankedHand.map(entry => {
        const { card, score } = entry;
        const key = card.suit + card.rank;

        if (!seen.has(key)) {
            // first occurrence keeps full score
            seen.add(key);
            return { card, score };
        } else {
            // duplicates lose points
            return { card, score: score - penalty };
        }
    });
}


module.exports = {
    suggestNeededCards,
    isSuggestedContainsCard,
    suggestDiscardableCards
};