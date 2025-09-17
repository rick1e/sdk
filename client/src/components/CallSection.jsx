// CallSection.js
import React from "react";
import CountdownBar from "./ContdownBar";

export const CallSection = ({ game, canCall, emit, callRequest, callResponse}) => {

    const handleCall = () => {
        const gameId = game.id;
        emit('call_card', { gameId })
    };

    return(
        <div className="game-section" >
            <h4>☎️ Making a Call </h4>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }} >

            <button
                className={!canCall?"btn-disabled":"lay-melds-btn"}
                disabled={!canCall}
                onClick={handleCall}
            >
                Call
            </button>
            {(game.phase === 'waiting on call' && !callRequest && !callResponse) && (
                    <CountdownBar duration={(game.rules?.callDurationTimerSec - 0.5)}/>)
            }


            </div>
        </div>
    );
}