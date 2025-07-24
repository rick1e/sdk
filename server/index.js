const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const {
    createGame,
    joinGame,
    startGame,
    drawCard,
    discardCard,
    addToMeld,
    resetGame,
    layDownMeldNew,
    isSameMeld
} = require('../shared/game');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 4000;

let games = {};  // in-memory game store

io.on('connection', socket => {
    console.log('Player connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
    });

    socket.on('create_game', (data,cb) => {
        const gameId = Math.random().toString(36).substr(2, 6);
        games[gameId] = createGame(gameId, socket.id);
        socket.join(gameId);
        cb({ gameId });
    });

    socket.on('join_game', ({ gameId, playerName }, cb) => {
        if (!games[gameId]) return cb({ error: 'Game not found' });
        joinGame(games[gameId], socket.id, playerName);
        socket.join(gameId);
        io.to(gameId).emit('game_update', games[gameId]);
        cb({ success: true });
    });

    socket.on('rejoin_game', ({ gameId, playerName }, cb) => {
        const game = games[gameId];
        if (!game) return cb({ error: 'Game not found' });

        const player = game.players.find(p => p.name === playerName);
        if (!player) return cb({ error: 'Player not found in game' });

        // Update socket ID for the rejoining player
        player.id = socket.id;

        socket.join(gameId);
        cb({ success: true, game });
    });


    socket.on('start_game', ({ gameId }, cb) => {
        const game = games[gameId];
        if (!game) return cb({ error: 'Game not found' });
        startGame(game);
        io.to(gameId).emit('game_update', game);
        cb({ success: true });
    });

    socket.on('reset_game', ({ gameId }, cb) => {
        const game = games[gameId];
        if (!game) return cb({ error: 'Game not found' });

        resetGame(game);
        io.to(gameId).emit('game_update', game);
        cb({ success: true });
    });


    socket.on('draw_card', ({ gameId, fromDiscard }, cb) => {
        const game = games[gameId];
        const result = drawCard(game, socket.id, fromDiscard);
        io.to(gameId).emit('game_update', game);
        cb(result);
    });

    socket.on('discard_card', ({ gameId, card }, cb) => {
        const game = games[gameId];
        const result = discardCard(game, socket.id, card);
        io.to(gameId).emit('game_update', game);
        cb(result);
    });

    socket.on('lay_down_meld_list', ({ gameId }, cb) => {
        const game = games[gameId];
        if (!game) return cb({ error: 'Game not found' });

        const result = layDownMeldNew(game, socket.id);
        io.to(gameId).emit('game_update', game);
        cb(result);
    });

    socket.on('update_hand_order', ({ gameId, newHand }, callback) => {
        const game = games[gameId];
        if (!game) return callback({ error: 'Game not found' });

        const player = game.players.find(p => p.id === socket.id);
        if (!player) return callback({ error: 'Player not found' });

        player.hand = newHand; // Store new order
        callback({ success: true });

        // Optionally emit game update to all players
        io.to(gameId).emit('game_update', game);
    });

    socket.on('update_meld_draft_add', ({ gameId, meldsToLay, hand }, callback) => {
        const game = games[gameId];
        if (!game) return callback({ error: 'Game not found' });

        const player = game.players.find(p => p.id === socket.id);
        if (!player) return callback({ error: 'Player not found' });

        player.hand = hand; // or validate before setting
        player.meldsToLay = meldsToLay;

        callback({ success: true });

        // Optionally emit game update to all players
        io.to(gameId).emit('game_update', game);
    });

    socket.on('update_meld_draft_remove', ({ gameId, meld }, callback) => {
        const game = games[gameId];
        if (!game) return callback({ error: 'Game not found' });

        const player = game.players.find(p => p.id === socket.id);
        if (!player) return callback({ error: 'Player not found' });

        // Find and remove the exact meld
        player.meldsToLay = player.meldsToLay.filter(existingMeld =>
            !isSameMeld(existingMeld, meld)
        );
        // Optionally restore those cards to the player's hand
        player.hand.push(...meld);

        callback({ success: true });

        // Optionally emit game update to all players
        io.to(gameId).emit('game_update', game);
    });



    socket.on('add_to_meld', ({ gameId, meldIndex, cards }, cb) => {
        const game = games[gameId];
        if (!game) return cb({ error: 'Game not found' });

        const result = addToMeld(game, socket.id, meldIndex, cards);
        io.to(gameId).emit('game_update', game);
        cb(result);
    });


});

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

if (process.env.NODE_ENV === 'production') {
    const clientPath = path.join(__dirname, '../client/build');
    app.use(express.static(clientPath));
    app.get('*', (_, res) => {
        res.sendFile(path.join(clientPath, 'index.html'));
    });
}
