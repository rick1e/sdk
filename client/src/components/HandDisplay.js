// HandDisplay.js
import React, {useState} from "react";
import {renderCard} from "../utils/utilsRender";

export const  HandDisplay = ({ game, hand, setGame, selectedCard, setSelectedCard,hasLaidDown,
                                 meldSelection, setMeldSelection, emit, gameId, playerId,isMyTurn,
                                 selectedMeldIndex, setSelectedMeldIndex }) => {

    const [draggingIndex, setDraggingIndex] = useState(-1);


    const onDragStartHandler = (index) => {
        setDraggingIndex(index)
    }

    const onDropHandler = (index) => {
        if (draggingIndex === -1 || draggingIndex === index) return;
        const updated = [...hand];
        const [movedCard] = updated.splice(draggingIndex, 1);
        updated.splice(index, 0, movedCard);
        setGame({
            ...game,
            players: game.players.map(p =>
                p.id === playerId ? { ...p, hand: updated } : p
            )
        });
        emit('update_hand_order', {
            gameId,
            newHand: updated
        }, (res) => {
            if (res.error) {
                console.error(res.error);
                alert(res.error);
            }
        });
        setDraggingIndex(-1);
    }

    const renderCardCallbackHandler = (gamePhase,isInMeld,card) => {
        if (gamePhase === 'discarding') {
            setSelectedCard(card);
        } else {
            setMeldSelection((prev) =>
                isInMeld ? prev.filter((c) => c !== card) : [...prev, card]
            );
        }
    }

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

    const disableTackOn = () =>{
        return !(meldSelection.length > 0 && selectedMeldIndex !== null && game.phase === 'meld' && isMyTurn);
    }


    return(
        <div>
            <div className="game-section">
                <h4>🃏 Your Hand</h4>
                <div className="cards-container">
                    {hand.map((card, index) => {
                        const isSelected = selectedCard === card;
                        const isInMeld = meldSelection.includes(card);

                        return (
                            <>
                                {renderCard(card, () => {
                                        renderCardCallbackHandler(game.phase, isInMeld, card)
                                    },
                                    isSelected || isInMeld,
                                    () => {
                                        onDragStartHandler(index)
                                    },
                                    () => {
                                        onDropHandler(index)
                                    }
                                )}
                            </>
                        );
                    })}
                </div>

                <button
                    className={meldSelection.length < 1 || hasLaidDown?"btn-disabled":"lay-melds-btn"}
                    disabled={meldSelection.length < 1 || hasLaidDown}
                    onClick={() => {
                        addMeld(meldSelection);
                        setMeldSelection([]);
                    }}
                >+ Add Draft Meld</button>

                <button
                    className={disableTackOn()?"btn-disabled":"lay-melds-btn"}
                    disabled={disableTackOn()}
                    onClick={onAddToSelectedMeld}>
                    Add to Selected Meld
                </button>
            </div>
        </div>
    );
}