import React from "react";

export const renderCard = (card, onClick=()=>{}, highlight = false) => {
    if (!card) return null;

    // Translate rank
    const rankMap = {
        1: 'A',
        11: 'J',
        12: 'Q',
        13: 'K'
    };
    const displayRank = rankMap[card.rank] || card.rank;

    // Determine color
    const isRed = card.suit === '♥' || card.suit === '♦';
    const label = card.rank === 'JOKER' ? '🃏' : `${displayRank}${card.suit || ''}`;

    return (
        <div
            key={label + Math.random()}
            onClick={onClick}
            style={{
                border: highlight ? '2px solid red' : '1px solid black',
                padding: '8px',
                margin: '4px',
                display: 'inline-block',
                cursor: 'pointer',
                background: '#fff',
                color: isRed ? 'red' : 'black',
                fontWeight: 'bold',
                fontSize: '16px'
            }}
        >
            {label}
        </div>
    );
};
