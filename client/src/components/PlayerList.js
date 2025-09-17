// PlayerList.js
import React from "react";

export const PlayerList = ({ players, currentPlayerIndex, debugMode }) => (

    <>
        <div className="players-section">
            <div className="players-list">
                <h4>👥 Players</h4>
                {players.map((p, i) => (
                <div className="player-item">
                    <div className="player-info">
                        <span className="player-name">{p.name}</span>
                        <span className="card-count">{p.hand.length + p.meldsToLay.flat().length}</span>
                    </div>
                    {i === currentPlayerIndex ?
                    <div className="turn-indicator">👑 Turn</div>:null}

                    {p.isBot && debugMode && (
                        <div>
                            <div>Hand: {p.hand.map(card => `${card.rank}${card.suit}`).join(", ")}</div>
                            {
                                //<div>Melds: {p.meldsToLay.flat().map(card => `${card.rank}${card.suit}`).join(", ")}</div>
                            }
                            <div>Melds: {
                                p.meldsToLay.map(meld =>
                                    meld.map(card =>
                                        card.suit === 'JOKER' ? 'JOKER' : `${card.rank}${card.suit}`
                                    )
                                )
                            }</div>
                        </div>
                    )}

                </div>
                ))}
            </div>
        </div>
    </>
)
;