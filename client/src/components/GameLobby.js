import React from "react";

export const GameLobby = ({ playerName, setPlayerName, setPlayerId, gameId, setGameId, setGame, emit, socketId }) => {

    const createGame = () => {
        if (!playerName) return alert('Enter name');
        emit('create_game', { gameId, playerName }, ({ gameId }) => {
            setGameId(gameId);
            emit('join_game', { gameId, playerName }, (res) => {
                if (res.error) alert(res.error);

                const url = new URL(window.location);
                url.searchParams.set('gameId', gameId);
                window.history.pushState({}, '', url);
            });
        });
    };

    const joinGame = () => {
        if (!playerName || !gameId) return alert('Enter name and game ID');
        emit('join_game', { gameId, playerName }, (res) => {
            if (res.error) alert(res.error);
        });
    };

    const rejoinGame = () => {
        if (!playerName || !gameId) return alert('Enter name and game ID');
        emit('rejoin_game', { gameId, playerName }, (res) => {
            if (res.error) return alert(res.error);
            setGame(res.game);
            setPlayerId(res.playerId); // update local ID
        });
    }

    return (
        <div className="p-4">
            <h2>Kalooki Game v2</h2>
            <input placeholder="Name" value={playerName} onChange={e => setPlayerName(e.target.value)} />
            <br />
            <input disabled={true} placeholder="Game ID" value={gameId} onChange={e => setGameId(e.target.value)} />
            <br />
            <button onClick={createGame}>Create Game</button>
            <button onClick={joinGame}>Join Game</button>
            <button onClick={rejoinGame}>Rejoin Game</button>
        </div>
    );
};