import React from 'react';

const CallConfirmModal = ({ emit, callRequest, setCallRequest,isMyTurn }) => {

    const handleAllow = () => {
        emit('respond_to_call', { gameId: callRequest?.gameId, allow: true },() => {});
        setCallRequest(null);
    };

    const handleDeny = () => {
        emit('respond_to_call', { gameId: callRequest?.gameId, allow: false },() => {});
        setCallRequest(null);
    };

    return (
        <div className="game-section">
            <h4>☎️ Call Request</h4>
            <div className="empty-state">
                <p className="mb-6">{callRequest?.callerName} wants to call.</p>

                {isMyTurn ? (
                    <>
                        <div className="draw-buttons">
                            <button className="draw-btn" onClick={handleAllow}>
                                🂠 Allow and Draw from Deck
                            </button>
                            <button className="draw-btn"  onClick={handleDeny}>
                                🗂️ Deny and Take Discard
                            </button>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default CallConfirmModal;
