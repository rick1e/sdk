// GameControls.js
import React from "react";

export const GameControls = ({ gameId, gamePhase, discardValue, isMyTurn, emit }) => {

    const startGame = () => {
        emit('start_game', { gameId }, (res) => {
            if (res.error) alert(res.error);
        });
    };

    const addBot = () => {
        emit('add_bot', { gameId }, (res) => {
            if (res.error) alert(res.error);
        });
    };

    const drawCard = (fromDiscard = false) => {
        emit('draw_card', { gameId, fromDiscard }, (res) => {
            if (res.error) alert(res.error);
        });
    };

    return (
        <div>
            {gamePhase === 'waiting' && (
                <>
                    <button onClick={addBot}>Add Bot</button>
                    <button onClick={startGame}>Start Game</button>
                </>
            )}

            {isMyTurn && gamePhase === 'drawing' && (
                <>
                    <h4>Draw a card</h4>
                    <button onClick={() => drawCard(false)}>Draw from Deck</button>
                    <button disabled={discardValue === 'empty'} onClick={() => drawCard(true)}>
                        Draw from Discard ({discardValue})
                    </button>
                </>
            )}
        </div>
    );
};

