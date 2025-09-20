import {GameFinished} from "./GameFinished";
import {PlayerList} from "./PlayerList";
import CallConfirmModal from "./CallConfirmModal";
import {GameControls} from "./GameControls";
import {CallSection} from "./CallSection";
import {DiscardSection} from "./DiscardSection";
import {HandDisplay} from "./HandDisplay";
import {MeldBuilder} from "./MeldBuilder";
import React, {useEffect, useState} from "react";
import {DrawSection} from "./DrawSection";
import {DiscardPile} from "./DiscardPile";


const Game = ({socket, emit, playerId, setPlayerId, game, setGame,version}) => {
    const [selectedCard, setSelectedCard] = useState(null);
    const [selectedMeldIndex, setSelectedMeldIndex] = useState(null);
    const [meldSelection, setMeldSelection] = useState([]);
    const [callRequest, setCallRequest] = useState(null);
    const [callResponse, setCallResponse] = useState(null);
    const [debugMode, setDebugMode] = useState(false);


    useEffect(() => {
        socket.on('connect', () => {
            setPlayerId(socket.id); // Identify player
        });

        socket.on('game_update', (updatedGame) => {
            setGame(updatedGame);
        });

        socket.on('call_requested', ({ callerName, callerId, gameId }) => {
            setCallRequest({ callerName, callerId, gameId });
        });

        socket.on('call_approved', ({ callerName, callerId}) => {
            if(socket.id === callerId) {
                setCallResponse('Your call was approved. You received the card and a penalty card.');
            }else{
                setCallResponse(`${callerName}'s call was approved.`);
            }
            setCallRequest(null);
            setTimeout(() => {
                setCallResponse(null);
            },5000)
        });

        socket.on('call_denied', ({ callerName, callerId}) => {
            if (socket.id === callerId) {
                setCallResponse('Your call was denied.');
            } else {
                setCallResponse(`${callerName}'s call was denied.`);
            }
            setCallRequest(null);
            setTimeout(() => {
                setCallResponse(null);
            },5000)
        });

        return () => {
            socket.off('connect');
            socket.off('game_update');
            socket.off('call_requested');
            socket.off('call_approved');
            socket.off('call_denied');
        };
    }, [socket,setPlayerId, setGame]);

    const generateGameLink = () => {
        const url = `${window.location.origin}?gameId=${game.id}`;
        navigator.clipboard.writeText(url).then(() => {
            alert('Game link copied to clipboard!');
        });
    };

    const myPlayer = () => game?.players?.find(p => p.id === playerId);
    const hand = myPlayer()?.hand || [];
    const meldsToLay = myPlayer()?.meldsToLay || [];

    const isMyTurn = () => {
        return game?.players?.[game.currentPlayerIndex]?.id === playerId;
    };

    const hasLaidDown = () => {
        return myPlayer.hasLaidDown;
    };

    const isCanCall = () => {
        const previousPlayerIndex = (game.currentPlayerIndex - 1 + game.players.length) % game.players.length;
        const currentPlayerId = game?.players?.[game.currentPlayerIndex]?.id;
        const previousPlayerId = game?.players?.[previousPlayerIndex]?.id;
        return currentPlayerId !== playerId && previousPlayerId !== playerId && callRequest === null;
    };

    const toggleDebugMode = () => {
        setDebugMode(!debugMode);
    }

    return (
        <div className="p-4">

            <div className="header">
                <div className="header-top">
                    <h1>Kalooki Game</h1>
                    <div className="version">Version {version}</div>
                </div>
                <div className="header-top">
                    <div className="game-id-info">
                        <h3>Game ID</h3>
                        <div className="game-id">{game.id}</div>
                    </div>
                    <button className="copy-btn" onClick={generateGameLink}>
                        📋 Copy Game Link
                    </button>
                </div>

                <div className="game-settings">
                    <span>Required Sets/Triples: <strong>{game.rules?.requireNumberOfSetToLay}</strong></span>
                    <span>Required Runs/Straights: <strong>{game.rules?.requireNumberOfRunsToLay}</strong></span>
                </div>
            </div>

            <div className="main-content">
                <div className="status-section">
                    <div className={`status-card ${game.phase}`}>
                        <h3>Phase</h3>
                        <div className="status-value">
                            {game.phase}
                            <span className="phase-indicator"></span>
                        </div>
                    </div>
                    <div className={`status-card ${isMyTurn() ? "active" : ""}`}>
                        <h3>Your Turn</h3>
                        <div className="status-value">{isMyTurn() ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="status-card">
                        <h3>Players</h3>
                        <div className="status-value">{game.players.length}</div>
                    </div>
                </div>


                <GameControls
                    gameId={game.id}
                    gamePhase={game.phase}
                    debugMode={debugMode}
                    toggleDebugMode={toggleDebugMode}
                    emit={emit}
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

                    <PlayerList
                        players={game.players}
                        currentPlayerIndex={game.currentPlayerIndex}
                        debugMode={debugMode}
                    />
                {game.phase !== 'waiting' && (
                    <>
                    <DiscardPile
                        discardPile={game.discardPile}
                    />

                    <CallSection
                        emit={emit}
                        game={game}
                        canCall={isCanCall()}
                        callRequest={callRequest}
                        callResponse={callResponse}
                    />



                    {callResponse && (
                        <div className="game-section">
                            <h4>☎️ Call Response</h4>
                            <div className="empty-state">
                                <p>{callResponse}</p>
                            </div>
                        </div>
                    )}


                    {callRequest &&  (
                        <CallConfirmModal
                            emit={emit}
                            callRequest={callRequest}
                            setCallRequest={setCallRequest}
                            isMyTurn={isMyTurn()}
                        />
                    )}

                    <DrawSection
                        gameId={game.id}
                        gamePhase={game.phase}
                        isMyTurn={isMyTurn()}
                        hasLaidDown={hasLaidDown()}
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
                        isMyTurn={isMyTurn()}
                        selectedMeldIndex={selectedMeldIndex}
                        setSelectedMeldIndex={setSelectedMeldIndex}
                    />


                    <MeldBuilder
                        meldsToLay={meldsToLay}
                        meldSelection={meldSelection}
                        setMeldSelection={setMeldSelection}
                        emit={emit}
                        gameId={game.id}
                        game={game}
                        isMyTurn={isMyTurn()}
                        selectedMeldIndex={selectedMeldIndex}
                        setSelectedMeldIndex={setSelectedMeldIndex}
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
                </>
                )}
            </div>
        </div>
            );
            }

            export default Game;