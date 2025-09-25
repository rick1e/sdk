// MeldBuilder.js
import React from "react";
import Card from "./Card";

export const MeldBuilder = ({ game, selectedMeldIndex, setSelectedMeldIndex }) => {

    return(
        <div>

            <div className="game-section">
                <h4>🏆 Laid Down Melds</h4>
                {game.melds && game.melds.length > 0 ? (
                    game.melds.map((meld, idx) => {
                        const player = game.players.find(p => p.id === meld.playerId);
                        const isSelected = selectedMeldIndex === idx;

                        return (
                            <div className="cards-container" key={idx} style={{marginBottom: '10px'}}>
                                <strong>{player?.name || 'Player'}:</strong>{' '}
                                <div
                                    style={{
                                        position: 'relative',
                                        width: `${50 + (meld.cards.length - 1) * 22}px`,
                                        height: `${70}px` // extra space for name
                                    }}
                                >
                                    {meld.cards.map((card,index) => <Card
                                        key={index}
                                        card={card}
                                        isSelected={false}
                                        onClick={()=>{}}
                                        isGroup={true}
                                        isLast={meld.cards.length -1 === index}
                                        index={index}
                                    />)}
                                </div>
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