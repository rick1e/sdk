// MeldBuilder.js
import {renderCard} from "../utils/utilsRender";
import React, {useState} from "react";

export const MeldBuilder = ({ meldsToLay, emit, gameId, game, isMyTurn,selectedMeldIndex, setSelectedMeldIndex }) => {

    const removeMeld = (meld) => {
        emit('update_meld_draft_remove', {
            gameId,
            meld
        }, (res) => {
            if (res.error) {
                console.error(res.error);
                alert(res.error);
            }
        });
    };

    const onLayDownList = () => {

        emit('lay_down_meld_list', { gameId }, (res) => {
            if (res.error) {
                alert(res.error);
            }
        });
    };

    const canLay = () =>{
        return !(game.phase === 'meld' && isMyTurn);
    }
    return(
        <div>
            <div className="game-section">
                <h4>📋 Your Melds to Lay</h4>
                {meldsToLay.length === 0 ?
                    <div className="empty-state">
                        <p>No melds selected yet.</p>
                    </div> : (
                        meldsToLay.map((meld, idx) => (
                            <div key={idx} className="cards-container">
                                {meld.map(card => renderCard(card))}
                                <button
                                    className="remove-btn"
                                    onClick={() => {
                                        removeMeld(meld);
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        ))
                    )}

                {meldsToLay.length > 0 && (
                    <button
                        className={canLay()?"btn-disabled":"lay-melds-btn"}
                        onClick={onLayDownList}
                        disabled={canLay()}
                    >
                        Lay All Melds
                    </button>
                )}
            </div>



            <div className="game-section">
                <h4>🏆 Laid Down Melds</h4>
                {game.melds && game.melds.length > 0 ? (
                    game.melds.map((meld, idx) => {
                        const player = game.players.find(p => p.id === meld.playerId);
                        const isSelected = selectedMeldIndex === idx;

                        return (
                            <div className="cards-container" key={idx} style={{marginBottom: '10px'}}>
                                <strong>{player?.name || 'Player'}:</strong>{' '}
                                {meld.cards.map(card => renderCard(card))}
                                <button
                                    className="lay-melds-btn"
                                    style={{
                                        backgroundColor: isSelected ? '#007bff' : '#f0f0f0',
                                        color: isSelected ? 'white' : 'black',
                                    }}
                                    onClick={() => {
                                        setSelectedMeldIndex(isSelected ? null : idx);
                                    }}
                                >
                                    {isSelected ? 'Selected' : 'Add Here'}
                                </button>
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-state">
                        <p>No melds laid down yet</p>
                    </div>
                )}
            </div>

        </div>
    );
}