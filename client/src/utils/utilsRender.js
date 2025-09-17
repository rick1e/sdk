import React from "react";

export const renderCard = (card, onClick=()=>{}, highlight = false,onDrag,onDrop) => {
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
            draggable
            onDragStart={onDrag}
            onDrop={onDrop}
            className={`card ${isRed? "red" : "black"}`}
            key={label + Math.random()}
            onClick={onClick}
            style={{
                border: highlight ? '2px solid red' : '1px solid black',
            }}
        >
            {label}
        </div>
    );
};
