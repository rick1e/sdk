// MeldBuilder.js
import {renderCard} from "../utils/utilsRender";
import React, {useState} from "react";

export const MeldBuilder = ({ meldsToLay, meldSelection, setMeldSelection, emit, gameId, game, isMyTurn }) => {

    const [selectedMeldIndex, setSelectedMeldIndex] = useState(null);

    const addMeld = (cards) => {
        // Let the server handle the real update
        emit('update_meld_draft_add', {
            gameId,
            cards: cards
        }, (res) => {
            if (res.error) {
                console.error(res.error);
                alert(res.error);
            }
        });
    };

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

    const onAddToSelectedMeld = () => {
        emit('add_to_meld', {
            gameId,
            meldIndex: selectedMeldIndex,
            cards: meldSelection
        }, (res) => {
            if (res.error) alert(res.error);
            setMeldSelection([]);
            setSelectedMeldIndex(null);
        });
    };

    const canLay = () =>{
        return !(game.phase === 'meld' && isMyTurn);
    }
    return(
        <div>
            <button
                className="add-meld-btn mt-2 bg-green-500 text-white px-4 py-2 rounded"
                disabled={meldSelection.length < 1}
                onClick={() => {
                    addMeld(meldSelection);
                    setMeldSelection([]);
                }}
            >
                Add Draft Meld
            </button>

            <div className="melds-section">
                <h3>Your Melds to Lay</h3>
                {meldsToLay.length === 0 ? <p>No melds selected yet.</p> : (

                    meldsToLay.map((meld, idx) => (
                        <div key={idx} className="meld-preview flex gap-2 mb-2">
                            {meld.map(card => renderCard(card))}
                            <button
                                className="ml-2 text-red-500 underline"
                                onClick={() => {
                                    removeMeld(meld);
                                }}
                            >
                                Remove
                            </button>
                        </div>
                    ))
                )}
            </div>

            {meldsToLay.length > 0 && (
                <button
                    className="lay-button bg-blue-600 text-white px-4 py-2 rounded"
                    onClick={onLayDownList}
                    disabled={canLay()}
                >
                    Lay All Melds
                </button>
            )}

            {meldSelection.length > 0 && selectedMeldIndex !== null && (
                <button
                    disabled={canLay()}
                    onClick={onAddToSelectedMeld}>
                    Add to Selected Meld
                </button>
            )}


            <h3>Top of Discard Pile</h3>
            {renderCard(game.discardPile.slice(-1)[0])}

            <h3>Laid Down Melds</h3>
            {game.melds && game.melds.length > 0 ? (
                game.melds.map((meld, idx) => {
                    const player = game.players.find(p => p.id === meld.playerId);
                    const isSelected = selectedMeldIndex === idx;

                    return (
                        <div key={idx} style={{ marginBottom: '10px' }}>
                            <strong>{player?.name || 'Player'}:</strong>{' '}
                            {meld.cards.map(card => renderCard(card))}
                            <button
                                style={{
                                    marginLeft: '10px',
                                    backgroundColor: isSelected ? '#007bff' : '#f0f0f0',
                                    color: isSelected ? 'white' : 'black',
                                    border: '1px solid gray',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
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
                <p>No melds yet</p>
            )}
        </div>
    );
}