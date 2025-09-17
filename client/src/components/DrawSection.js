import React from "react";

export const DrawSection = ({ gameId, gamePhase, discardValue, isMyTurn, hasLaidDown, emit }) => {

    const drawCard = (fromDiscard = false) => {
        emit('draw_card', { gameId, fromDiscard }, (res) => {
            if (res.error) alert(res.error);
        });
    };

    return (
        <div>
            {isMyTurn && gamePhase === 'drawing' && (
                <>
                    <div className="draw-section">
                        <h4>🎯 Draw a Card</h4>
                        <div className="draw-buttons">
                            <button className="draw-btn" onClick={() => drawCard(false)}>
                                🂠 Draw from Deck
                            </button>
                            <button disabled={discardValue === 'empty' || hasLaidDown} className={discardValue === 'empty' || hasLaidDown?"btn-disabled":"draw-btn"} onClick={() => drawCard(true)}>
                                {hasLaidDown?"Already Laid":<>🗂️ Draw from Discard ({discardValue})</>}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

