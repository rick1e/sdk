import React,{useState} from "react";

export const GameLobby = ({ playerName, setPlayerName, setPlayerId, gameId, setGameId, setGame, emit}) => {

    const [numDecks, setNumDecks] = useState(2);
    const [numSets, setNumSets] = useState(2);
    const [numRuns, setNumRuns] = useState(1);
    const [callDurationTimerSec, setCallDurationTimerSec] = useState(10);
    const [botCallTimerSec, setBotCallTimerSec] = useState(2);

    const createGame = () => {
        if (!playerName) return alert('Enter name');
        emit('create_game', { gameId, playerName, settings: { numDecks, numSets, numRuns, callDurationTimerSec } }, ({ gameId }) => {
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
        <div className="p-4 space-y-3">
            <h2 className="text-xl font-bold">Kalooki Game v0.5</h2>

            <input
                placeholder="Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="border p-1 rounded"
            />

            <input
                placeholder="Game ID"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="border p-1 rounded"
            />

            {/* Settings only matter when creating a game */}
            <div className="mt-2 space-y-1 border-t pt-2">
                <h3 className="font-semibold">Game Settings</h3>
                <label>
                    Number of Decks:
                    <input
                        type="number"
                        value={numDecks}
                        min={1}
                        onChange={(e) => setNumDecks(Number(e.target.value))}
                        className="ml-2 border p-1 rounded w-16"
                    />
                </label>
                <br />
                <label>
                    Required Sets / Triples :
                    <input
                        type="number"
                        value={numSets}
                        min={0}
                        onChange={(e) => setNumSets(Number(e.target.value))}
                        className="ml-2 border p-1 rounded w-16"
                    />
                </label>
                <br />
                <label>
                    Required Runs / Straights:
                    <input
                        type="number"
                        value={numRuns}
                        min={0}
                        onChange={(e) => setNumRuns(Number(e.target.value))}
                        className="ml-2 border p-1 rounded w-16"
                    />
                </label>
                <br />
                <label>
                    Call Duration in seconds:
                    <input
                        type="number"
                        value={callDurationTimerSec}
                        min={1}
                        max={15}
                        onChange={(e) => setCallDurationTimerSec(Number(e.target.value))}
                        className="ml-2 border p-1 rounded w-16"
                    />
                </label>
                <br />
                <label>
                    Bot time to call in seconds:
                    <input
                        type="number"
                        value={botCallTimerSec}
                        min={1}
                        max={5}
                        onChange={(e) => setBotCallTimerSec(Number(e.target.value))}
                        className="ml-2 border p-1 rounded w-16"
                    />
                </label>
            </div>

            <div className="space-x-2 mt-3">
                <button onClick={createGame} className="bg-green-500 text-white px-3 py-1 rounded">
                    Create Game
                </button>
                <button onClick={joinGame} className="bg-blue-500 text-white px-3 py-1 rounded">
                    Join Game
                </button>
                <button onClick={rejoinGame} className="bg-yellow-500 text-black px-3 py-1 rounded">
                    Rejoin Game
                </button>
            </div>
        </div>
    );
};