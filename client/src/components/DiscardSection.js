// DiscardSection.js
import React from "react";

export const DiscardSection = ({ gameId, gamePhase, isMyTurn, emit, meldSelection,setMeldSelection }) => {

    const discard = () => {
        if (meldSelection.length !== 1) return;
        const card = meldSelection[0];

        emit('discard_card', { gameId, card: card }, (res) => {
            if (res.error) alert(res.error);
            setMeldSelection([]);
        });
    };
    const readyToDiscard = () => {
        setMeldSelection([]);
        emit('ready_to_discard_card', { gameId }, (res) => {
            if (res.error) alert(res.error);
        });
    };

    const isDisabled = meldSelection.length !== 1;

    return(
        isMyTurn && (gamePhase === 'discarding' || gamePhase === 'meld') && (
        <div className="game-section">
            {isMyTurn && gamePhase === 'meld' && (
                <>
                    <h4>Discard a card</h4>
                    <button
                        className="lay-melds-btn"
                        onClick={readyToDiscard}
                    >
                        Ready to discard
                    </button>
                </>
            )}
            {isMyTurn && gamePhase === 'discarding' && (
                <>
                    <h4>Discard a card</h4>
                    <button
                        className={isDisabled?"btn-disabled":"lay-melds-btn"}
                        onClick={discard}
                        disabled={isDisabled}
                    >
                        Discard Selected
                    </button>
                </>
            )}
        </div>
        )
    );
}