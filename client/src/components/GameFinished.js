import React from "react";

export const GameFinished = ({ gameId, gamePhase, players,winner, emit, setMeldSelection }) => {

    const playAgain = () => {
        emit('reset_game', { gameId }, (res) => {
            if (res.error) alert(res.error);
            // TODO: Find a better place to do this
            setMeldSelection([]);
        });
    };

    return(
        <div>
            {gamePhase === 'finished' && (
                <div className="game-section" style={{ padding: '1em', backgroundColor: '#dff0d8', marginTop: '1em' }}>
                    <h2>🎉 {players.find(p => p.id === winner)?.name || 'A player'} has won!</h2>
                    <button className="lay-melds-btn" onClick={playAgain}>
                        Play Again
                    </button>

                </div>
            )}
        </div>
    );
}
