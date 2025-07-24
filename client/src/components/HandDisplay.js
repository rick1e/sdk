// HandDisplay.js
import React, {useState} from "react";
import {renderCard} from "../utils/utilsRender";

export const HandDisplay = ({ game, hand, setGame, selectedCard, setSelectedCard, meldSelection, setMeldSelection, emit, gameId, playerId }) => {

    const [draggingIndex, setDraggingIndex] = useState(null);
    // const [dragOverIndex, setDragOverIndex] = useState(null);

    const onDragStartHandler = (index) => {
        setDraggingIndex(index)
    }

    const onDragOverHandler = (e,index) => {
        e.preventDefault();
        // setDragOverIndex(index);
    }

    const onDropHandler = (index) => {
        if (draggingIndex === null || draggingIndex === index) return;
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
        setDraggingIndex(null);
        // setDragOverIndex(null);
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


    return(
        <div>
            <h3>Your Hand</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {hand.map((card, index) => {
                    const isSelected = selectedCard === card;
                    const isInMeld = meldSelection.includes(card);

                    return (
                        <div
                            key={index}
                            draggable
                            onDragStart={()=>{onDragStartHandler(index)}}
                            onDragOver={(e)=>{onDragOverHandler(e,index)}}
                            onDrop={()=>{onDropHandler(index)}}
                        >
                            {renderCard(card,()=>{ renderCardCallbackHandler(game.phase,isInMeld,card) }, isSelected || isInMeld)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}