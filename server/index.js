// server.js
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const KalookiBot = require('./bot/kalookiBot');
const gameLogic = require('../shared/game');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 4000;

let games = {};  // in-memory game store
const bots = {};
const timeouts = {};

const CALL_TIMER_DURATION_MS = 10000;
const BOT_TURN_TIMER_DURATION_MS = 1000;


io.on('connection', socket => {
    console.log('Player connected:', socket.id);

    socket.on('disconnect', () => console.log('Player disconnected:', socket.id));

    // --- Game Lifecycle ---
    socket.on('create_game', (data, cb) => handleCreateGame(socket, cb));
    socket.on('join_game', (data, cb) => handleJoinGame(socket, data, cb));
    socket.on('rejoin_game', (data, cb) => handleRejoinGame(socket, data, cb));
    socket.on('add_bot', (data, cb) => handleAddBot(socket, data, cb));
    socket.on('start_game', ({ gameId }, cb) => handleStartGame(gameId, cb));
    socket.on('reset_game', ({ gameId }, cb) => handleResetGame(gameId, cb));

    // --- Gameplay ---
    socket.on('draw_card', (data, cb) => handleDrawCard(socket, data, cb));
    socket.on('ready_to_discard_card', (data, cb) => handleReadyToDiscardCard(socket, data, cb));
    socket.on('discard_card', (data, cb) => handleDiscardCard(socket, data, cb));
    socket.on('lay_down_meld_list', (data, cb) => handleLayDownMeld(socket, data, cb));
    socket.on('add_to_meld', (data, cb) => handleAddToMeld(socket, data, cb));
    socket.on('update_hand_order', handleUpdateHandOrder);
    socket.on('update_meld_draft_add', handleUpdateMeldDraftAdd);
    socket.on('update_meld_draft_remove', handleUpdateMeldDraftRemove);

    // --- Call Logic ---
    socket.on('call_card', ({ gameId }) => handleCallCard(socket, gameId));
    socket.on('respond_to_call', ({ gameId, allow }) => handleCallResponse(io, gameId, allow));
});

// ================= HANDLERS =================
function handleCreateGame(socket, cb) {
    const gameId = Math.random().toString(36).substring(2, 6);
    games[gameId] = gameLogic.createGame(gameId, socket.id);
    socket.join(gameId);
    cb({ gameId });
}

function handleJoinGame(socket, { gameId, playerName }, cb) {
    const game = games[gameId];
    if (!game) return cb({ error: 'Game not found' });
    gameLogic.joinGame(game, socket.id, playerName);
    socket.join(gameId);
    io.to(gameId).emit('game_update', game);
    cb({ success: true });
}

function handleRejoinGame(socket, { gameId, playerName }, cb) {
    const game = games[gameId];
    if (!game) return cb({ error: 'Game not found' });
    const player = game.players.find(p => p.name === playerName);
    if (!player) return cb({ error: 'Player not found in game' });
    player.id = socket.id;
    socket.join(gameId);
    cb({ success: true, game, playerId: socket.id });
}

function handleAddBot(socket, { gameId }, cb) {
    const game = games[gameId];
    if (!game) return cb({ error: 'Game not found' });
    const bot = new KalookiBot(io, gameId);
    bot.joinGame(game);
    io.to(gameId).emit('game_update', game);
    if (!bots[gameId]) bots[gameId] = [];
    bots[gameId].push(bot);
    cb({ success: true });
}

function handleStartGame(gameId, cb) {
    const game = games[gameId];
    if (!game) return cb({ error: 'Game not found' });
    gameLogic.startGame(game);
    io.to(gameId).emit('game_update', game);
    cb({ success: true });
}

function handleResetGame(gameId, cb) {
    const game = games[gameId];
    if (!game) return cb({ error: 'Game not found' });
    gameLogic.resetGame(game);
    io.to(gameId).emit('game_update', game);
    cb({ success: true });
}

function handleDrawCard(socket, { gameId, fromDiscard }, cb) {
    const game = games[gameId];
    const result = gameLogic.drawCard(game, socket.id, fromDiscard);
    io.to(gameId).emit('game_update', game);
    cb(result);
}

function handleReadyToDiscardCard(socket, { gameId}, cb) {
    const game = games[gameId];
    game.phase = 'discarding';
    io.to(gameId).emit('game_update', game);
    cb({ success: true});
}

function handleDiscardCard(socket, { gameId, card }, cb) {
    const game = games[gameId];
    const result = gameLogic.discardCard(game, socket.id, card);
    if (timeouts[gameId]) clearTimeout(timeouts[gameId]);


    game.callAvailable = true;
    game.callRequest = { playerId: null, approved: null };

    if (game.phase !== 'finished') {
        startCallTimer(io, game, bots[gameId], gameId);
    }

    io.to(gameId).emit('game_update', game);
    cb(result);
}

function handleLayDownMeld(socket, { gameId }, cb) {
    const game = games[gameId];
    const result = gameLogic.layDownMeldNew(game, socket.id);
    io.to(gameId).emit('game_update', game);
    cb(result);
}

function handleAddToMeld(socket, { gameId, meldIndex, cards }, cb) {
    const game = games[gameId];
    const result = gameLogic.addToMeld(game, socket.id, meldIndex, cards);
    io.to(gameId).emit('game_update', game);
    cb(result);
}

function handleUpdateHandOrder({ gameId, newHand }, cb) {
    const game = games[gameId];
    const player = game.players.find(p => p.id === this.id);
    if (!player) return cb({ error: 'Player not found' });
    player.hand = newHand;
    io.to(gameId).emit('game_update', game);
    cb({ success: true });
}

function handleUpdateMeldDraftAdd({ gameId, cards }, cb) {
    const game = games[gameId];
    if (!game) return cb({ error: 'Game not found' });

    const player = game.players.find(p => p.id === this.id);
    if (!player) return cb({ error: 'Player not found' });

    // Make sure cards is an array
    if (!Array.isArray(cards) || cards.length === 0) {
        return cb({ error: 'No cards provided' });
    }

    // Check if the player actually has all these cards
    const tempHand = [...player.hand];
    for (let card of cards) {
        const idx = tempHand.findIndex(c => c.rank === card.rank && c.suit === card.suit);
        if (idx === -1) {
            return cb({ error: 'Invalid move: card not in hand' });
        }
        tempHand.splice(idx, 1); // remove matched card
    }

    // Move cards from hand to meldsToLay
    player.hand = tempHand;
    player.meldsToLay.push(cards);

    // Broadcast update
    io.to(gameId).emit('game_update', game);

    cb({ success: true});
}

function handleUpdateMeldDraftRemove({ gameId, meld }, cb) {
    const game = games[gameId];
    const player = game.players.find(p => p.id === this.id);
    if (!player) return cb({ error: 'Player not found' });

    const index = player.meldsToLay.findIndex(existingMeld =>
        gameLogic.isSameMeld(existingMeld, meld)
    );

    if (index === -1) {
        return cb({ error: 'Meld not found' });
    }

    const [removedMeld] = player.meldsToLay.splice(index, 1);
    player.hand.push(...removedMeld);

    io.to(gameId).emit('game_update', game);
    cb({ success: true });
}

function handleCallCard(socket, gameId) {
    const game = games[gameId];
    const current = game.players[game.currentPlayerIndex];
    if (current.id === socket.id || !game.callAvailable || game.callRequest.playerId) return;
    game.callRequest = { playerId: socket.id, approved: null };
    game.callAvailable = false;
    clearTimeout(timeouts[gameId]);

    if (current.isBot) {
        handleCallResponse(io, gameId, true);
    } else {
        io.to(current.id).emit('call_requested', { callerId: socket.id, gameId });
    }
}

function handleCallResponse(io, gameId, allow) {
    const game = games[gameId];
    const { playerId: callerId } = game.callRequest;
    if (!callerId) return;

    game.callRequest.approved = allow;
    if (allow) {
        gameLogic.giveCards(game, callerId);
        io.to(callerId).emit('call_approved');
    } else {
        io.to(callerId).emit('call_denied');
    }

    game.phase = 'drawing';
    game.callRequest = { playerId: null, approved: null };
    proceedToNextTurn(io, game, bots[gameId], gameId);
}

function proceedToNextTurn(io, game, botList, gameId) {
    if (timeouts[gameId]) clearTimeout(timeouts[gameId]);

    // If game is over, stop
    if (game.phase === 'finished') return;

    // If we're waiting on a call, don't proceed yet
    if (game.phase === 'waiting on call') {
        io.to(gameId).emit('waiting_on_call', { gameId, game });
        return;
    }

    const player = game.players[game.currentPlayerIndex];

    if (player.isBot) {
        console.log('bot player',player.name);
        const bot = botList.find(b => b.player.id === player.id);
        if (!bot) return;

        timeouts[gameId] = setTimeout(() => {
            delete timeouts[gameId];

            console.log('Proceed to next Turn Timeout');
            console.log('game Phase',game.phase);

            switch (game.phase) {
                case 'drawing':
                case 'draw':
                    bot.drawCard(game);
                    game.phase = 'meld';
                    break;

                case 'meld':
                    bot.makeMelds(game);
                    game.phase = 'discarding';
                    break;

                case 'discarding':
                    bot.discardCard(game);
                    if(game.phase !== 'finished') {
                        game.phase = 'waiting on call';
                        startCallTimer(io, game, botList, gameId);
                    }
                    return; // Don't go to next turn yet

                default:
                    break;
            }

            proceedToNextTurn(io, game, botList, gameId);
        }, BOT_TURN_TIMER_DURATION_MS);

    } else {
        io.to(gameId).emit('game_update', game);
    }
}

function startCallTimer(io, game, botList, gameId) {
    // Give players 3 seconds to call
    console.log('Start Call Timer timeout');
    timeouts[gameId] = setTimeout(() => {
        delete timeouts[gameId];
        console.log('Fire Call Timer timeout');
        game.phase = 'drawing';
        // game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        proceedToNextTurn(io, game, botList, gameId);
    }, CALL_TIMER_DURATION_MS);

    io.to(gameId).emit('call_window_open', { gameId, game });
}

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

if (process.env.NODE_ENV === 'production') {
    const clientPath = path.join(__dirname, '../client/build');
    app.use(express.static(clientPath));
    app.get('*', (_, res) => {
        res.sendFile(path.join(clientPath, 'index.html'));
    });
}
