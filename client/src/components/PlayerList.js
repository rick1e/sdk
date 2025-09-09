// PlayerList.js
import React from "react";

export const PlayerList = ({ players, currentPlayerIndex, debugMode }) => (
    <div>
        <h3>Players</h3>
        <ul>
            {players.map((p, i) => (
                <li key={p.id}>
                    {p.name} [{p.hand.length + p.meldsToLay.flat().length}] {i === currentPlayerIndex ? '👈 (turn)' : ''}
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
                </li>
            ))}
        </ul>
    </div>
);