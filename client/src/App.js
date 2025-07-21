import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

const socket = io(backendUrl); // Use env variable in production

function App() {
    const [playerName, setPlayerName] = useState('');
    const [gameId, setGameId] = useState('');
    const [game, setGame] = useState(null);
    const [playerId, setPlayerId] = useState('');
    const [selectedCard, setSelectedCard] = useState(null);
    const [meldSelection, setMeldSelection] = useState([]);

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

    const startGame = () => {
        socket.emit('start_game', { gameId }, (res) => {
            if (res.error) alert(res.error);
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

    const isMyTurn = () => {
        return game?.players?.[game.currentPlayerIndex]?.id === playerId;
    };

    const myPlayer = () => {
        return game?.players?.find(p => p.id === playerId);
    };

    const renderCard = (card, onClick, highlight = false) => {
        if (!card) return null;
        const label = card.rank === 'JOKER' ? '🃏' : `${card.rank}${card.suit || ''}`;
        return (
            <div
                key={label + Math.random()}
                onClick={onClick}
                style={{
                    border: highlight ? '2px solid red' : '1px solid black',
                    padding: '8px',
                    margin: '4px',
                    display: 'inline-block',
                    cursor: 'pointer',
                    background: '#fff',
                }}
            >
                {label}
            </div>
        );
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
            </div>
        );
    }

    const hand = myPlayer()?.hand || [];

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
            <div>
                {hand.map((card) => {
                    const isSelected = selectedCard === card;
                    const isInMeld = meldSelection.includes(card);
                    return renderCard(card, () => {
                        if (game.phase === 'discarding') {
                            setSelectedCard(card);
                        } else {
                            setMeldSelection((prev) =>
                                isInMeld
                                    ? prev.filter((c) => c !== card)
                                    : [...prev, card]
                            );
                        }
                    }, isSelected || isInMeld);
                })}
            </div>

            {meldSelection.length >= 3 && (
                <button onClick={() => {
                    socket.emit('lay_down_meld', { gameId, cards: meldSelection }, (res) => {
                        if (res.error) alert(res.error);
                        setMeldSelection([]);
                    });
                }}>
                    Lay Down Meld
                </button>
            )}


            <h3>Top of Discard Pile</h3>
            {renderCard(game.discardPile.slice(-1)[0])}

            <h3>Laid Down Melds</h3>
            {game.melds && game.melds.length > 0 ? (
                game.melds.map((meld, idx) => {
                    const player = game.players.find(p => p.id === meld.playerId);
                    return (
                        <div key={idx}>
                            <strong>{meld.by || 'Player'}:</strong>{' '}
                            {meld.cards.map(card => renderCard(card))}
                        </div>
                    );
                })
            ) : (
                <p>No melds yet</p>
            )}

            {game.phase === 'finished' && (
                <div style={{ padding: '1em', backgroundColor: '#dff0d8', marginTop: '1em' }}>
                    <h2>🎉 {game.players.find(p => p.id === game.winner)?.name || 'A player'} has won!</h2>
                </div>
            )}
        </div>
    );
}

export default App;
