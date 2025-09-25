import React from "react";

const getRankLabel = (rank) => {
    if (rank === null) return '';
    if (rank === 11) return 'J';
    if (rank === 12) return 'Q';
    if (rank === 13) return 'K';
    if (rank === 1) return 'A';
    return rank;
};

const getSuitColor = (suit) => {
    if (suit === '♦' || suit === '♥') return 'red';
    if (suit === '♠' || suit === '♣') return 'black';
    return 'gray';
};

const isBlankCard = (card) => card.suit === null && card.rank === null;

const Card = ({ card, isSelected, onClick, isGroup ,index, isLast }) => {
    if(!card) return;
    const overlap = 22;

    const blank = isBlankCard(card);
    const color = getSuitColor(card.suit);
    const singleStyle = {
        // width: '64px',
        // height: '96px',
        // border: '2px solid',
        borderColor: blank ? '#d1d5db' : isSelected ? '#3b82f6' : '#9ca3af',
        // borderRadius: '8px',
        // display: 'flex',
        // flexDirection: 'column',
        // alignItems: 'center',
        // justifyContent: 'center',
        // backgroundColor: blank ? '#f3f4f6' : 'white',
        // cursor: blank ? 'default' : 'pointer',
        boxShadow: isSelected ? '0 0 0 4px rgba(59,130,246,0.3)' : 'none',
        transform: isSelected ? 'translateY(-8px)' : 'none',
        transition: 'all 0.2s ease'
    }

    const groupStyle = {
        position: 'absolute',
        // width: `${cardWidth}px`,
        // height: `${cardHeight}px`,
        // border: '2px solid',
        borderColor: isSelected ? '#3b82f6' : '#8b5cf6',
        // borderRadius: '8px',
        backgroundColor: 'white',
        left: `${index * overlap}px`,
        zIndex: index,
        display: 'flex',
        flexDirection: 'row',
        alignItems: isLast ? 'center' : 'flex-start',
        justifyContent: isLast ? 'center' : 'flex-start',
        padding: '4px',
        boxShadow: isSelected ? '0 0 0 4px rgba(59,130,246,0.3)' : 'none',
        transform: isSelected ? 'translateY(-16px)' : 'none',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        overflow: 'hidden'
    }

    // style={isGroup?groupStyle:singleStyle}
    /*
    style={{
                            fontWeight: 'bold',
                            fontSize: '14px',
                            color: color === 'red' ? '#dc2626' : '#000'
                        }}
     */
    /*
    style={{
                            fontSize: '18px',
                            color: color === 'red' ? '#dc2626' : '#000'
                        }}
     */

    const label = card.rank === 'JOKER' ? '🃏' : `${getRankLabel(card.rank)}${card.suit || ''}`;

    return (
        <div
            role="button"
            aria-pressed={isSelected}
            onClick={onClick}
            className={"card "+color}
            style={isGroup?groupStyle:singleStyle}
        >
            {!blank && (
                <>
                    {label}
                </>
            )}
        </div>
    );
};

export default Card;