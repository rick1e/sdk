// DiscardSection.js
import React from "react";

export const DiscardSection = ({ gameId, gamePhase, isMyTurn, emit, selectedCard, setSelectedCard }) => {

    const discard = () => {
        if (!selectedCard) return;
        emit('discard_card', { gameId, card: selectedCard }, (res) => {
            if (res.error) alert(res.error);
            setSelectedCard(null);
        });
    };

    return(
        <div>
            {isMyTurn && gamePhase === 'discarding' && (
                <>
                    <h4>Discard a card</h4>
                    <button onClick={discard} disabled={!selectedCard}>
                        Discard Selected
                    </button>
                </>
            )}
        </div>
    );
}