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
    const readyToDiscard = () => {
        emit('ready_to_discard_card', { gameId }, (res) => {
            if (res.error) alert(res.error);
        });
    };

    return(
        isMyTurn && (gamePhase === 'discarding' || gamePhase === 'meld') && (
        <div className="game-section">
            {isMyTurn && gamePhase === 'meld' && (
                <>
                    <h4>Discard a card</h4>
                    <button className="lay-melds-btn" onClick={readyToDiscard} >
                        Ready to discard
                    </button>
                </>
            )}
            {isMyTurn && gamePhase === 'discarding' && (
                <>
                    <h4>Discard a card</h4>
                    <button className={!selectedCard?"btn-disabled":"lay-melds-btn"} onClick={discard} disabled={!selectedCard}>
                        Discard Selected
                    </button>
                </>
            )}
        </div>
        )
    );
}