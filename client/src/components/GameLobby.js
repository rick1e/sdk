import React,{useEffect, useState} from "react";

export const GameLobby = ({ playerName, setPlayerName, setPlayerId, gameId, setGameId, setGame, emit,version}) => {

    const [numDecks, setNumDecks] = useState(2);
    const [numSets, setNumSets] = useState(2);
    const [numRuns, setNumRuns] = useState(1);
    const [callDurationTimerSec, setCallDurationTimerSec] = useState(10);
    const [botCallTimerSec, setBotCallTimerSec] = useState(2);
    const [activeTab, setActiveTab] = useState("create");

    useEffect(() => {
        if (gameId) {
            setActiveTab("join");
        }
    }, [gameId]);

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

    const switchTab = (tabName) =>{
        setActiveTab(tabName);
    }

    return (
        <div className="p-4 space-y-3">
            <div className="header">
                <div className="card-decoration"></div>
                <h1>Kalooki Game</h1>
                <div className="version">Version {version}</div>
            </div>

            <div className="tabs-container">
                <div className="tabs">
                    <button className={`tab ${activeTab === 'create' ? "active" : ""}`} onClick={()=>switchTab('create')}>
                        <span className="icon">🎮</span>Create Game
                    </button>
                    <button className={`tab ${activeTab === 'join' ? "active" : ""}`} onClick={()=>switchTab('join')}>
                        <span className="icon">🚪</span>Join Game
                    </button>
                </div>

                {/* <!-- Create Game Tab -->*/}
                {activeTab === 'create' &&
                <div id="create-tab" className={`tab-content ${activeTab === 'create' ? "active" : ""}`}>
                    <div className="form-section">
                        <div className="input-wrapper">
                            <label htmlFor="createPlayerName">Your Name</label>
                            <input
                                type="text"
                                id="createPlayerName"
                                placeholder="Enter your name"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="section-title">
                            <span>Game Configuration</span>
                        </div>

                        <div className="input-wrapper">
                            <label htmlFor="numDecks">Number of Decks</label>
                            <input
                                type="number"
                                id="numDecks"
                                value={numDecks}
                                min={1}
                                onChange={(e) => setNumDecks(Number(e.target.value))}
                            />
                            <div className="help-text">Usually 2 for 4-6 players</div>
                        </div>


                        <div className="settings-grid">
                            <div className="input-wrapper">
                                <label htmlFor="requiredSets">Required Sets/Triples</label>
                                <input
                                    type="number"
                                    id="requiredSets"
                                    value={numSets}
                                    min={0}
                                    onChange={(e) => setNumSets(Number(e.target.value))}
                                />
                                <div className="help-text">Minimum 3 cards of same value, any suit</div>
                            </div>
                            <div className="input-wrapper">
                                <label htmlFor="requiredRuns">Required Runs/Straights</label>
                                <input
                                    type="number"
                                    id="requiredRuns"
                                    value={numRuns}
                                    min={0}
                                    onChange={(e) => setNumRuns(Number(e.target.value))}
                                />
                                <div className="help-text">Consecutive cards of same suit</div>
                            </div>
                        </div>


                    </div>

                    <div className="form-section">
                        <div className="section-title">
                            <span>Timing Settings</span>
                        </div>

                        <div className="timing-settings">
                            <div className="input-wrapper">
                                <label htmlFor="callDuration">Call Duration (seconds)</label>
                                <input
                                    type="number"
                                    id="callDuration"
                                    value={callDurationTimerSec}
                                    min={1}
                                    max={15}
                                    onChange={(e) => setCallDurationTimerSec(Number(e.target.value))}
                                />
                            </div>
                            <div className="input-wrapper">
                                <label htmlFor="botCallTime">Bot Call Time (seconds)</label>
                                <input
                                    type="number"
                                    id="botCallTime"
                                    value={botCallTimerSec}
                                    min={1}
                                    max={5}
                                    onChange={(e) => setBotCallTimerSec(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <button className="action-button btn-create" onClick={createGame}>
                        <span className="icon">🚀</span>Create New Game
                    </button>
                </div>
                }
                {/* <!-- Join Game Tab --> */}
                {activeTab === 'join' &&
                <div id="join-tab" className={`tab-content ${activeTab === 'join' ? "active" : ""}`}>
                    <div className="form-section">
                        <div className="input-wrapper">
                            <label htmlFor="joinPlayerName">Your Name</label>
                            <input
                                type="text"
                                id="joinPlayerName"
                                placeholder="Enter your name"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                            />
                        </div>

                        <div className="input-wrapper">
                            <label htmlFor="gameId">Game ID</label>
                            <input
                                type="text"
                                id="gameId"
                                placeholder="Enter the game ID to join"
                                value={gameId}
                                onChange={(e) => setGameId(e.target.value)}
                            />
                            <div className="help-text">Get this ID from the game host</div>
                        </div>
                    </div>

                    <div className="join-options">
                        <button className="action-button btn-join" onClick={joinGame}>
                            <span className="icon">🎯</span>Join Game
                        </button>
                    </div>

                    <div className="rejoin-section">
                        <h4 className="rejoin-tetxt">Already in a game?</h4>
                        <button className="btn-rejoin" onClick={rejoinGame}>
                            <span className="icon">↩️</span>Rejoin Previous Game
                        </button>
                    </div>
                </div>
                }

            </div>

            {/*
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

            {/* Settings only matter when creating a game
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
                <br/>
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
                <br/>
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
                <br/>
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
                <br/>
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
            */}
        </div>
    );
};