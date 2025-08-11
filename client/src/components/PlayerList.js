// PlayerList.js
import React from "react";

export const PlayerList = ({ players, currentPlayerIndex }) => (
    <div>
        <h3>Players</h3>
        <ul>
            {players.map((p, i) => (
                <li key={p.id}>
                    {p.name} [{p.hand.length + p.meldsToLay.flat().length}] {i === currentPlayerIndex ? '👈 (turn)' : ''}
                </li>
            ))}
        </ul>
    </div>
);