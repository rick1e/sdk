// CallSection.js
import React from "react";

export const CallSection = ({ gameId, gamePhase, canCall, emit}) => {

    const handleCall = () => {
        emit('call_card', { gameId})
    };

    return(
        <div>
            {canCall && gamePhase === 'waiting on call' && (
                <>
                    <button onClick={handleCall}>
                        Call
                    </button>
                </>
            )}
        </div>
    );
}