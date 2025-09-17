// GameControls.js
import React from "react";

export const GameControls = ({ gameId, gamePhase, debugMode, toggleDebugMode, emit }) => {


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

    return (
        <div>
            <div className="debug-toggle">
                <div className={`toggle-switch ${debugMode ? "active" : ""}`} onClick={toggleDebugMode}></div>
                <label>Debug Mode</label>
            </div>

            {gamePhase === 'waiting' && (
                <>
                    <div className="actions-section">
                        <button className="action-btn btn-secondary" onClick={addBot}>
                            🤖 Add Bot
                        </button>
                        <button className="action-btn btn-primary" onClick={startGame}>
                            🚀 Start Game
                        </button>
                    </div>
                </>
            )}

        </div>
    );
};

