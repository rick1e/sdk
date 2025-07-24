// Kalooki.js (Main Container)
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import {GameLobby} from './components/GameLobby';
import {PlayerList} from './components/PlayerList';
import {GameControls} from './components/GameControls';
import {HandDisplay} from './components/HandDisplay';
import {MeldBuilder} from './components/MeldBuilder';
import {DiscardSection} from './components/DiscardSection';
import {GameFinished} from "./components/GameFinished";

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
const socket = io(backendUrl);

const Kalooki = () => {
    const [game, setGame] = useState(null);
    const [playerId, setPlayerId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [gameId, setGameId] = useState('');
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

    const myPlayer = () => game?.players?.find(p => p.id === playerId);
    const hand = myPlayer()?.hand || [];
    const meldsToLay = myPlayer()?.meldsToLay || [];

    const isMyTurn = () => {
        return game?.players?.[game.currentPlayerIndex]?.id === playerId;
    };

    const emit = (event, data, callback) => socket.emit(event, data, callback);

    if (!game) {
        return <GameLobby
            playerName={playerName}
            setPlayerName={setPlayerName}
            gameId={gameId}
            setGameId={setGameId}
            setPlayerId={setPlayerId}
            emit={emit}
            socketId={socket.id}
        />;
    }

    return (
        <div className="p-4">
            <h2>Kalooki Game</h2>
            <h2>Game ID: {game.id}</h2>
            <h3>Phase: {game.phase}</h3>
            <p><strong>Your Turn:</strong> {isMyTurn() ? 'Yes' : 'No'}</p>

            <PlayerList players={game.players} currentPlayerIndex={game.currentPlayerIndex} />

            <GameControls
                gameId={game.id}
                gamePhase={game.phase}
                isMyTurn={isMyTurn()}
                emit={emit}
                discardValue={game.discardPile.slice(-1)[0]?.rank || 'empty'}
            />

            <DiscardSection
                emit={emit}
                gameId={game.id}
                gamePhase={game.phase}
                isMyTurn={isMyTurn()}
                selectedCard={selectedCard}
                setSelectedCard={setSelectedCard}
            />

            <HandDisplay
                game={game}
                setGame={setGame}
                hand={hand}
                selectedCard={selectedCard}
                setSelectedCard={setSelectedCard}
                meldSelection={meldSelection}
                setMeldSelection={setMeldSelection}
                emit={emit}
                gameId={game.id}
                playerId={playerId}
            />

            <MeldBuilder
                meldsToLay={meldsToLay}
                meldSelection={meldSelection}
                setMeldSelection={setMeldSelection}
                hand={hand}
                emit={emit}
                gameId={game.id}
                game={game}
            />

            <GameFinished
                emit={emit}
                gameId={game.id}
                gamePhase={game.phase}
                players={game.players}
                winner={game.winner}
                setSelectedCard={setSelectedCard}
                setMeldSelection={setMeldSelection}
            />
        </div>
    );
};

export default Kalooki;