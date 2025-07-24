import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {renderCard} from "./utils/utilsRender";
const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

const socket = io(backendUrl); // Use env variable in production

function App() {
    const [playerName, setPlayerName] = useState('');
    const [gameId, setGameId] = useState('');
    const [game, setGame] = useState(null);
    const [playerId, setPlayerId] = useState('');
    const [selectedCard, setSelectedCard] = useState(null);
    const [meldSelection, setMeldSelection] = useState([]);
    const [selectedMeldIndex, setSelectedMeldIndex] = useState(null);
    const [draggingIndex, setDraggingIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    useEffect(() => {
        const storedName = localStorage.getItem('playerName');
        const storedGameId = localStorage.getItem('gameId');

        if (storedName && storedGameId) {
            setPlayerName(storedName);
            setGameId(storedGameId);

            socket.emit('rejoin_game', {
                gameId: storedGameId,
                playerName: storedName
            }, (res) => {
                if (res.success) {
                    setGame(res.game);
                    setPlayerId(socket.id);
                }
            });
        }
    }, []);

    useEffect(() => {
        socket.on('connect', () => {
            setPlayerId(socket.id); // Identify player
        });

        socket.on('game_update', (updatedGame) => {
            setGame(updatedGame);
        });

        return () => {
            socket.off('connect');
            socket.off('game_update');
        };
    }, []);

    const createGame = () => {
        socket.emit('create_game', ({ gameId }) => {
            setGameId(gameId);
        });
    };

    const joinGame = () => {
        if (!playerName || !gameId) return alert('Enter name and game ID');
        socket.emit('join_game', { gameId, playerName }, (res) => {
            if (res.error) alert(res.error);
        });
    };

    const rejoinGame = () => {
        if (!playerName || !gameId) return alert('Enter name and game ID');
        socket.emit('rejoin_game', { gameId, playerName }, (res) => {
            if (res.error) return alert(res.error);
            setGame(res.game);
            setPlayerId(socket.id); // update local ID
        });
    }

    const startGame = () => {
        socket.emit('start_game', { gameId }, (res) => {
            if (res.error) alert(res.error);
        });
    };

    const playAgain = () => {
        socket.emit('reset_game', { gameId }, (res) => {
            if (res.error) alert(res.error);
            setSelectedCard(null);
            setMeldSelection([]);
            setSelectedMeldIndex(null);
        });
    };

    const drawCard = (fromDiscard = false) => {
        socket.emit('draw_card', { gameId, fromDiscard }, (res) => {
            if (res.error) alert(res.error);
        });
    };

    const discard = () => {
        if (!selectedCard) return;
        socket.emit('discard_card', { gameId, card: selectedCard }, (res) => {
            if (res.error) alert(res.error);
            setSelectedCard(null);
        });
    };

    const addMeld = (cards) => {
        const updatedMelds = [...meldsToLay, cards];
        const updatedHand = hand.filter(c => !cards.includes(c));

        // Let the server handle the real update
        socket.emit('update_meld_draft', {
            gameId,
            meldsToLay: updatedMelds,
            hand: updatedHand
        }, (res) => {
            if (res.error) {
                console.error(res.error);
                alert(res.error);
            }
        });
    };

    const onLayDownList = () => {

        socket.emit('lay_down_meld_list', { gameId }, (res) => {
            if (res.error) {
                alert(res.error);
            }
        });
    };

    const onLayDown = () => {
        socket.emit('lay_down_meld', { gameId, cards: meldSelection }, (res) => {
            if (res.error) alert(res.error);
            setMeldSelection([]);
        });
    };

    const isMyTurn = () => {
        return game?.players?.[game.currentPlayerIndex]?.id === playerId;
    };

    const myPlayer = () => {
        return game?.players?.find(p => p.id === playerId);
    };

    if (!game) {
        return (
            <div style={{ padding: 20 }}>
                <h2>Kalooki Game</h2>
                <input
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    placeholder="Your name"
                />
                <br />
                <input
                    value={gameId}
                    onChange={e => setGameId(e.target.value)}
                    placeholder="Game ID"
                />
                <br />
                <button onClick={createGame}>Create Game</button>
                <button onClick={joinGame}>Join Game</button>
                <button onClick={rejoinGame}>Rejoin Game</button>
            </div>
        );
    }

    const hand = myPlayer()?.hand || [];
    const meldsToLay = myPlayer()?.meldsToLay || [];

    return (
        <div style={{ padding: 20 }}>
            <h2>Kalooki Game</h2>
            <p><strong>Game ID:</strong> {game.id}</p>
            <p><strong>Phase:</strong> {game.phase}</p>
            <p><strong>Your Turn:</strong> {isMyTurn() ? 'Yes' : 'No'}</p>
            <h3>Players</h3>
            <ul>
                {game.players.map((p, i) => (
                    <li key={p.id}>
                        {p.name} {i === game.currentPlayerIndex ? '👈 (turn)' : ''}
                    </li>
                ))}
            </ul>

            {game.phase === 'waiting' && (
                <button onClick={startGame}>Start Game</button>
            )}

            {isMyTurn() && game.phase === 'drawing' && (
                <>
                    <h4>Draw a card</h4>
                    <button onClick={() => drawCard(false)}>Draw from Deck</button>
                    <button onClick={() => drawCard(true)}>
                        Draw from Discard ({game.discardPile.slice(-1)[0]?.rank || 'empty'})
                    </button>
                </>
            )}

            {isMyTurn() && game.phase === 'discarding' && (
                <>
                    <h4>Discard a card</h4>
                    <button onClick={discard} disabled={!selectedCard}>
                        Discard Selected
                    </button>
                </>
            )}

            <h3>Your Hand</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {hand.map((card, index) => {
                    const isSelected = selectedCard === card;
                    const isInMeld = meldSelection.includes(card);

                    return (
                        <div
                            key={index}
                            draggable
                            onDragStart={() => setDraggingIndex(index)}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOverIndex(index);
                            }}
                            onDrop={() => {
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
                                socket.emit('update_hand_order', {
                                    gameId,
                                    newHand: updated
                                }, (res) => {
                                    if (res.error) {
                                        console.error(res.error);
                                        alert(res.error);
                                    }
                                });
                                setDraggingIndex(null);
                                setDragOverIndex(null);
                            }}
                        >
                            {renderCard(card, () => {
                                if (game.phase === 'discarding') {
                                    setSelectedCard(card);
                                } else {
                                    setMeldSelection((prev) =>
                                        isInMeld ? prev.filter((c) => c !== card) : [...prev, card]
                                    );
                                }
                            }, isSelected || isInMeld)}
                        </div>
                    );
                })}
            </div>

            <button
                className="add-meld-btn mt-2 bg-green-500 text-white px-4 py-2 rounded"
                disabled={meldSelection.length < 3}
                onClick={() => {
                    addMeld(meldSelection);
                    setMeldSelection([]);
                }}
            >
                Add Meld
            </button>

            <div className="melds-section">
                <h3>Your Melds to Lay</h3>
                {meldsToLay.length === 0 ? <p>No melds selected yet.</p> : (

                    meldsToLay.map((meld, idx) => (
                        <div key={idx} className="meld-preview flex gap-2 mb-2">
                            {meld.map(card => renderCard(card))}
                        </div>
                    ))
                )}
            </div>

            {meldsToLay.length > 0 && (
                <button
                    className="lay-button bg-blue-600 text-white px-4 py-2 rounded"
                    onClick={onLayDownList}
                >
                    Lay All Melds
                </button>
            )}



            {meldSelection.length >= 3 && (
                <button onClick={onLayDown}>
                    Lay Down Meld
                </button>
            )}

            {meldSelection.length > 0 && selectedMeldIndex !== null && (
                <button onClick={() => {
                    socket.emit('add_to_meld', {
                        gameId,
                        meldIndex: selectedMeldIndex,
                        cards: meldSelection
                    }, (res) => {
                        if (res.error) alert(res.error);
                        setMeldSelection([]);
                        setSelectedMeldIndex(null);
                    });
                }}>
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


            {game.phase === 'finished' && (
                <div style={{ padding: '1em', backgroundColor: '#dff0d8', marginTop: '1em' }}>
                    <h2>🎉 {game.players.find(p => p.id === game.winner)?.name || 'A player'} has won!</h2>
                    <button onClick={playAgain}>
                        Play Again
                    </button>

                </div>
            )}
        </div>
    );
}

export default App;
