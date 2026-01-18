// server.js
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const KalookiBot = require('./bot/kalookiBot');
const gameLogic = require('../shared/game');
const GamePersistence = require('./persistence');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 4000;

let games = {};  // in-memory game store
const bots = {};
const timeouts = {};
const persistence = new GamePersistence();

const BOT_TURN_TIMER_DURATION_MS = 2000;

// Helper function to save game state with error handling
async function saveGameState(gameId, game) {
    try {
        await persistence.saveGame(gameId, game);
    } catch (error) {
        console.error(`Failed to save game ${gameId}:`, error);
        // Continue without crashing the game
    }
}

// Initialize persistence and load existing games
async function initializeServer() {
    try {
        await persistence.initialize();
        const loadedGames = await persistence.loadAllActiveGames();
        
        // Recreate bot instances for loaded games
        for (const [gameId, gameState] of Object.entries(loadedGames)) {
            try {
                // Validate and sanitize the loaded game state
                const validatedState = persistence.validateGameState(gameState);
                games[gameId] = validatedState;
                
                // Recreate bot instances for this game
                if (validatedState.players) {
                    const botPlayers = validatedState.players.filter(p => p.isBot);
                    if (botPlayers.length > 0) {
                        bots[gameId] = [];
                        botPlayers.forEach(botPlayer => {
                            const bot = new KalookiBot(io, gameId);
                            bot.id = botPlayer.id;
                            bot.name = botPlayer.name;
                            bot.player = botPlayer;
                            bots[gameId].push(bot);
                        });
                        console.log(`Recreated ${botPlayers.length} bots for game ${gameId}`);
                    }
                }
                
                // Restore timer state if present
                if (validatedState.timerState && validatedState.timerState.isRunning) {
                    restoreTimerState(gameId, validatedState.timerState);
                }
                
                console.log(`Loaded game ${gameId} with ${validatedState.players?.length || 0} players`);
            } catch (error) {
                console.error(`Failed to load game ${gameId}:`, error);
                await persistence.markGameInactive(gameId);
            }
        }
        
        // Start periodic auto-save every 5 minutes
        // startAutoSave();
        
        console.log(`Server initialization complete. Loaded ${Object.keys(games).length} active games.`);
    } catch (error) {
        console.error('Failed to initialize server:', error);
        // Continue without persistence if initialization fails
    }
}

// Periodic auto-save every 5 minutes
function startAutoSave() {
    setInterval(async () => {
        console.log('Running periodic auto-save...');
        let savedCount = 0;
        let errorCount = 0;
        
        for (const [gameId, game] of Object.entries(games)) {
            try {
                // Capture current timer state
                if (timeouts[gameId]) {
                    game.timerState = {
                        isRunning: true,
                        type: 'bot-turn',
                        targetPlayerId: game.players[game.currentPlayerIndex]?.id,
                        currentStage: 'pending',
                        remainingTime: BOT_TURN_TIMER_DURATION_MS
                    };
                } else if (timeouts[gameId + '_bots']) {
                    game.timerState = {
                        isRunning: true,
                        type: 'call-window',
                        targetPlayerId: game.players[game.currentPlayerIndex]?.id,
                        currentStage: 'pending',
                        remainingTime: game.rules?.callDurationTimerSec * 1000 || 3000
                    };
                } else {
                    game.timerState = null;
                }
                
                await saveGameState(gameId, game);
                savedCount++;
            } catch (error) {
                console.error(`Failed to auto-save game ${gameId}:`, error);
                errorCount++;
            }
        }
        
        console.log(`Auto-save complete: ${savedCount} games saved, ${errorCount} errors`);
    }, 5 * 60 * 1000); // 5 minutes

    // Also start cleanup task to run daily
    setInterval(async () => {
        console.log('Running daily cleanup of old games...');
        try {
            const result = await persistence.cleanupOldGames(7); // Clean games older than 7 days
            console.log(`Cleanup complete: ${result.deletedCount} old games removed, ${result.errorCount} errors`);
        } catch (error) {
            console.error('Failed to run cleanup task:', error);
        }
    }, 24 * 60 * 60 * 1000); // 24 hours (daily)
}

// Restore timer state for loaded games
function restoreTimerState(gameId, timerState) {
    const game = games[gameId];
    if (!game || !timerState.isRunning) return;
    
    const { type, targetPlayerId, currentStage, remainingTime } = timerState;
    
    if (type === 'bot-turn') {
        const player = game.players.find(p => p.id === targetPlayerId);
        if (player && player.isBot) {
            const bot = bots[gameId]?.find(b => b.player.id === targetPlayerId);
            if (bot) {
                // Resume bot turn timer
                timeouts[gameId] = setTimeout(() => {
                    delete timeouts[gameId];
                    proceedToNextTurn(io, game, bots[gameId], gameId);
                }, remainingTime);
            }
        }
    } else if (type === 'call-window') {
        // Resume call window timer
        timeouts[gameId] = setTimeout(() => {
            delete timeouts[gameId];
            if (game.phase === 'waiting on call') {
                game.phase = 'drawing';
                proceedToNextTurn(io, game, bots[gameId], gameId);
            }
        }, remainingTime);
        
        // Also resume bot call timer
        timeouts[gameId + '_bots'] = setTimeout(() => {
            delete timeouts[gameId + '_bots'];
            const botList = bots[gameId];
            if (botList) {
                const previousPlayerIndex = (game.currentPlayerIndex - 1 + game.players.length) % game.players.length;
                const previousPlayer = game.players[previousPlayerIndex];
                const player = game.players[game.currentPlayerIndex];
                
                const callableBots = botList.filter(bot => 
                    bot.id !== player.id && 
                    bot.id !== previousPlayer.id && 
                    !bot.player.hasLaidDown && 
                    bot.shouldCall(game)
                );
                
                if (callableBots.length > 0) {
                    handleCallCard({ id: callableBots[0].id }, gameId);
                }
            }
        }, remainingTime / 2);
    }
}


io.on('connection', socket => {
    console.log('Player connected:', socket.id);

    socket.on('disconnect', () => console.log('Player disconnected:', socket.id));

    // --- Game Lifecycle ---
    socket.on('create_game', (data, cb) => handleCreateGame(socket, data, cb));
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
    socket.on('update_meld_draft_remove_card',handleUpdateMeldDraftRemoveCard);
    socket.on('update_meld_draft_order',handleUpdateMeldDraftOrder);
    socket.on('update_meld_draft_add_cards',handleUpdateMeldDraftAddCards);

    // --- Call Logic ---
    socket.on('call_card', ({ gameId }) => handleCallCard(socket, gameId));
    socket.on('respond_to_call', ({ gameId, allow }) => handleCallResponse(io, socket, gameId, allow));
});

// ================= HANDLERS =================
async function handleCreateGame(socket, { gameIdx, playerName, settings }, cb) {
    const gameId = Math.random().toString(36).substring(2, 6);
    games[gameId] = gameLogic.createGame(gameId, socket.id,settings);
    console.log('Created new game :', games[gameId]);
    
    // Save the newly created game
    await saveGameState(gameId, games[gameId]);
    
    socket.join(gameId);
    cb({ gameId });
}

async function handleJoinGame(socket, { gameId, playerName }, cb) {
    const game = games[gameId];
    if (!game) return cb({ error: 'Game not found' });
    gameLogic.joinGame(game, socket.id, playerName);
    socket.join(gameId);
    
    // Save game state after player joins
    await saveGameState(gameId, game);
    
    io.to(gameId).emit('game_update', game);
    cb({ success: true });
}

async function handleRejoinGame(socket, { gameId, playerName }, cb) {
    const game = games[gameId];
    if (!game) return cb({ error: 'Game not found' });
    const player = game.players.find(p => p.name === playerName);
    if (!player) return cb({ error: 'Player not found in game' });
    player.id = socket.id;
    socket.join(gameId);
    
    // Save game state after player rejoins
    await saveGameState(gameId, game);
    
    cb({ success: true, game, playerId: socket.id });
}

async function handleAddBot(socket, { gameId }, cb) {
    const game = games[gameId];
    if (!game) return cb({ error: 'Game not found' });
    const bot = new KalookiBot(io, gameId);
    bot.joinGame(game);
    
    if (!bots[gameId]) bots[gameId] = [];
    bots[gameId].push(bot);
    
    // Save game state after bot is added
    await saveGameState(gameId, game);
    
    io.to(gameId).emit('game_update', game);
    cb({ success: true });
}

async function handleStartGame(gameId, cb) {
    const game = games[gameId];
    if (!game) return cb({ error: 'Game not found' });
    gameLogic.startGame(game);
    
    // Save game state after game starts
    await saveGameState(gameId, game);
    
    io.to(gameId).emit('game_update', game);
    cb({ success: true });
}

async function handleResetGame(gameId, cb) {
    const game = games[gameId];
    if (!game) return cb({ error: 'Game not found' });
    gameLogic.resetGame(game);
    
    // Save game state after reset
    await saveGameState(gameId, game);
    
    io.to(gameId).emit('game_update', game);
    cb({ success: true });
}

async function handleDrawCard(socket, { gameId, fromDiscard }, cb) {
    const game = games[gameId];
    const result = gameLogic.drawCard(game, socket.id, fromDiscard);
    
    // Save game state after card draw
    await saveGameState(gameId, game);
    
    io.to(gameId).emit('game_update', game);
    cb(result);
}

async function handleReadyToDiscardCard(socket, { gameId}, cb) {
    const game = games[gameId];
    game.phase = 'discarding';
    
    // Save game state after phase change
    await saveGameState(gameId, game);
    
    io.to(gameId).emit('game_update', game);
    cb({ success: true});
}

async function handleDiscardCard(socket, { gameId, card }, cb) {
    const game = games[gameId];
    const result = gameLogic.discardCard(game, socket.id, card);
    if (timeouts[gameId]) clearTimeout(timeouts[gameId]);

    if (game.phase !== 'finished') {
        startCallTimer(io, game, bots[gameId], gameId);
    }

    // Save game state after card discard
    // await saveGameState(gameId, game);

    io.to(gameId).emit('game_update', game);
    cb(result);
}

async function handleLayDownMeld(socket, { gameId }, cb) {
    const game = games[gameId];
    const result = gameLogic.layDownMeldNew(game, socket.id);
    
    // Save game state after meld is laid down
    await saveGameState(gameId, game);
    
    io.to(gameId).emit('game_update', game);
    cb(result);
}

async function handleAddToMeld(socket, { gameId, meldIndex, cards }, cb) {
    const game = games[gameId];
    const result = gameLogic.addToMeld(game, socket.id, meldIndex, cards);
    
    // Save game state after adding to meld
    await saveGameState(gameId, game);
    
    io.to(gameId).emit('game_update', game);
    cb(result);
}

async function handleUpdateHandOrder({ gameId, newHand }, cb) {
    const game = games[gameId];
    const player = game.players.find(p => p.id === this.id);
    if (!player) return cb({ error: 'Player not found' });
    player.hand = newHand;
    
    // Save game state after hand reordering
    await saveGameState(gameId, game);
    
    io.to(gameId).emit('game_update', game);
    cb({ success: true });
}

async function handleUpdateMeldDraftAdd({ gameId, cards }, cb) {
    console.log('----- handling draft Add -----');
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

    // Save game state after meld draft changes
    await saveGameState(gameId, game);

    // Broadcast update
    io.to(gameId).emit('game_update', game);

    cb({ success: true});
}

async function handleUpdateMeldDraftRemove({ gameId, meld }, cb) {
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

    // Save game state after meld draft changes
    await saveGameState(gameId, game);

    io.to(gameId).emit('game_update', game);
    cb({ success: true });
}

async function handleUpdateMeldDraftOrder({ gameId, meldIndex, meld }, cb) {
    console.log('----- handling draft order -----');
    const game = games[gameId];
    const player = game.players.find(p => p.id === this.id);
    if (!player) return cb({ error: 'Player not found' });

    const existingMeld = player.meldsToLay[meldIndex];

    if (!gameLogic.isSameMeld(existingMeld, meld)) {
        return cb({ error: 'Meld not found' });
    }

    player.meldsToLay[meldIndex] = meld;

    // Save game state after meld draft changes
    await saveGameState(gameId, game);

    io.to(gameId).emit('game_update', game);
    cb({ success: true });
}

async function handleUpdateMeldDraftRemoveCard({ gameId, meldIndex, card }, cb) {
    const game = games[gameId];
    const player = game.players.find(p => p.id === this.id);
    if (!player) return cb({ error: 'Player not found' });

    const meld = player.meldsToLay[meldIndex];
    if (!meld) {
        return cb({ error: 'Meld not found' });
    }

    // find the card inside the meld
    const cardIndex = meld.findIndex(c =>
        c.suit === card.suit && c.rank === card.rank
    );
    if (cardIndex === -1) {
        return cb({ error: 'Card not found in meld' });
    }

    // remove the card from the meld
    const [removedCard] = meld.splice(cardIndex, 1);
    player.hand.push(removedCard);

    // if meld becomes empty, remove the meld itself
    if (meld.length === 1) {
        const [removedLastCard] = meld.splice(0, 1);
        player.hand.push(removedLastCard);
        player.meldsToLay.splice(meldIndex, 1);
    }

    // Save game state after meld draft changes
    await saveGameState(gameId, game);

    io.to(gameId).emit('game_update', game);
    cb({ success: true });
}

async function handleUpdateMeldDraftAddCards({ gameId, meldIndex, cards }, cb) {
    const game = games[gameId];
    const player = game.players.find(p => p.id === this.id);
    if (!player) return cb({ error: 'Player not found' });

    const meld = player.meldsToLay[meldIndex];
    if (!meld) {
        return cb({ error: 'Meld not found' });
    }

    const tempHand = [...player.hand];
    console.log('----- cards -----');
    console.log(cards);
    for (let card of cards) {
        const idx = tempHand.findIndex(c => c.rank === card.rank && c.suit === card.suit);
        if (idx === -1) {
            return cb({ error: 'Invalid move: card not in hand' });
        }
        tempHand.splice(idx, 1); // remove matched card
    }

    // Move cards from hand to meld
    player.hand = tempHand;
    meld.push(...cards);

    // Save game state after meld draft changes
    await saveGameState(gameId, game);

    io.to(gameId).emit('game_update', game);
    cb({ success: true });
}


async function handleCallCard(socket, gameId) {
    const game = games[gameId];
    const botList = bots[gameId];
    const current = game.players[game.currentPlayerIndex];
    console.log('------handleCallCard----------');
    console.log('current.id === socket.id ',current.id === socket.id);
    console.log('game.callAvailable : ',game.callAvailable);
    console.log('game.callRequest.playerId : ',game.callRequest.playerId);
    console.log('RETURN BOOL : ',current.id === socket.id || !game.callAvailable || game.callRequest.playerId);

    if (current.id === socket.id || !game.callAvailable || game.callRequest.playerId) return;


    console.log('------handleCallCard passed return----------');
    console.log(socket.id);
    console.log(game.players);
    console.log('------handleCallCard passed return----------');

    const caller = game.players.find(p => p.id === socket.id);

    game.callRequest = { playerName:caller.name, playerId: socket.id, approved: null };
    game.callAvailable = false;
    clearTimeout(timeouts[gameId]);

    // Save game state after call request
    // await saveGameState(gameId, game);

    if (current.isBot) {
        const bot = botList.find(b => b.player.id === current.id);
        const botAllow = bot.decideCall(game);
        handleCallResponse(io,{id:bot.id} , gameId, botAllow);
    } else {
        io.to(gameId).emit('call_requested', { callerName:caller.name ,callerId: socket.id, gameId });
    }
}

async function handleCallResponse(io, socket, gameId, allow) {
    const game = games[gameId];
    const { playerId: callerId } = game.callRequest;
    if (!callerId) return;

    game.callRequest.approved = allow;
    if (allow) {
        console.log("handleCallResponse allow");
        gameLogic.giveCards(game, callerId);
        console.log("handleCallResponse gave cards");
        game.phase = 'drawing after call';
        console.log(gameLogic.drawCard(game, socket.id, false));
        console.log("handleCallResponse draw cards from deck");
        io.to(gameId).emit('call_approved',{ callerName:game.callRequest.playerName ,callerId: game.callRequest.playerId});
    } else {
        console.log("handleCallResponse deny");
        game.phase = 'drawing after call';
        console.log(gameLogic.drawCard(game, socket.id, true));
        console.log("handleCallResponse draw cards from discard");
        io.to(gameId).emit('call_denied',{ callerName:game.callRequest.playerName ,callerId: game.callRequest.playerId});
    }

    if ( game.phase === 'waiting on call' ) {
        game.phase = 'drawing';
    }
    game.callRequest = { playerName:'', playerId: null, approved: null };
    
    // Save game state after call response
    // await saveGameState(gameId, game);
    
    console.log("handleCallResponse proceed to next turn");
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
                case 'discarding':
                    bot.discardCard(game);
                    if(game.phase !== 'finished') {
                        game.phase = 'waiting on call';
                        startCallTimer(io, game, botList, gameId);
                    }
                    return; // Don't go to next turn yet

                case 'meld':
                    bot.makeMelds(game);
                    game.phase = 'discarding';
                    break;

                case 'drawing':
                case 'draw':
                    bot.drawCard(game);
                    game.phase = 'meld';
                    break;

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
    if (game.phase === 'finished') return;
    timeouts[gameId+'_bots'] = setTimeout(() => {
        delete timeouts[gameId+'_bots'];
        console.log('Fire Bot Call Timer timeout');

        const previousPlayerIndex = (game.currentPlayerIndex - 1 + game.players.length) % game.players.length;
        const previousPlayer = game.players[previousPlayerIndex];
        const player = game.players[game.currentPlayerIndex];

        console.log('player.id : ',player.id);
        console.log('previousPlayer.id : ',previousPlayer.id);

        const callableBots = botList.filter(bot => bot.id !== player.id && bot.id !== previousPlayer.id && !bot.player.hasLaidDown && bot.shouldCall(game));

        if(callableBots.length < 1) return;
        console.log('callableBots IDs:', callableBots.map(b => b.id));
        handleCallCard({ id: callableBots[0].id }, gameId);


        // game.phase = 'drawing';
        // game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        // proceedToNextTurn(io, game, botList, gameId);
    }, game.rules?.botThinkTimeMs);
    timeouts[gameId] = setTimeout(() => {
        delete timeouts[gameId];
        console.log('Fire Call Timer timeout');
        game.phase = 'drawing';
        // game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        proceedToNextTurn(io, game, botList, gameId);
    }, game.rules.callDurationTimerSec * 1000);

    io.to(gameId).emit('call_window_open', { gameId, game });
}

// Start server with persistence initialization
server.listen(PORT, async () => {
    console.log(`Server listening on port ${PORT}`);
    await initializeServer();
});

// Graceful shutdown handler
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    
    // Clear all timeouts
    Object.keys(timeouts).forEach(key => {
        if (timeouts[key]) {
            clearTimeout(timeouts[key]);
            delete timeouts[key];
        }
    });
    
    // Save all active games before shutdown
    for (const [gameId, game] of Object.entries(games)) {
        try {
            // Capture current timer state before saving
            if (timeouts[gameId]) {
                game.timerState = {
                    isRunning: true,
                    type: 'bot-turn',
                    targetPlayerId: game.players[game.currentPlayerIndex]?.id,
                    currentStage: 'pending',
                    remainingTime: BOT_TURN_TIMER_DURATION_MS
                };
            } else if (timeouts[gameId + '_bots']) {
                game.timerState = {
                    isRunning: true,
                    type: 'call-window',
                    targetPlayerId: game.players[game.currentPlayerIndex]?.id,
                    currentStage: 'pending',
                    remainingTime: game.rules?.callDurationTimerSec * 1000 || 3000
                };
            } else {
                game.timerState = null;
            }
            
            await persistence.saveGame(gameId, game);
            console.log(`Saved game ${gameId} on shutdown`);
        } catch (error) {
            console.error(`Failed to save game ${gameId} on shutdown:`, error);
        }
    }
    
    // Shutdown persistence
    await persistence.shutdown();
    
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    // Same shutdown logic as SIGINT
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay for cleanup
    process.exit(0);
});

if (process.env.NODE_ENV === 'production') {
    const clientPath = path.join(__dirname, '../client/build');
    app.use(express.static(clientPath));
    app.get('*', (_, res) => {
        res.sendFile(path.join(clientPath, 'index.html'));
    });
}
