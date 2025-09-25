// Kalooki.js (Main Container)
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import {GameLobby} from './components/GameLobby';
import Game from "./components/Game";

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
const socket = io(backendUrl);
const VERSION = '0.8.0';

const Kalooki = () => {
    const [game, setGame] = useState(null);
    const [playerId, setPlayerId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [gameId, setGameId] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const initialGameId = params.get('gameId');
        if (initialGameId) {
            setGameId(initialGameId);
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
    }, [playerId]);

    const emit = (event, data, callback) => socket.emit(event, data, callback);

    if (!game) {
        return <GameLobby
            playerName={playerName}
            setPlayerName={setPlayerName}
            gameId={gameId}
            setGameId={setGameId}
            setGame={setGame}
            setPlayerId={setPlayerId}
            emit={emit}
            version={VERSION}
        />;
    }


    return <Game
        socket={socket}
        emit={emit}
        playerId={playerId}
        setPlayerId={setPlayerId}
        game={game}
        setGame={setGame}
        version={VERSION}
    />;

};

export default Kalooki;