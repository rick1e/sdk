import React, { useState } from 'react';
import Card from "./Card";

export const CardSelectorCombo = ({hand,groups,emit,gameId,gamePhase,isMyTurn, hasLaidDown, selectedCards, setSelectedCards, selectedMeldIndex,setSelectedMeldIndex}) => {

    // const [freeCards, setFreeCards] = useState(hand);
    // const [groups, setGroups] = useState(meldsToLay);
    const [selectedCardsInGroup, setSelectedCardsInGroup] = useState([]); // indexes inside group
    const [selectedGroupId, setSelectedGroupId] = useState(null);

    const addMeld = (cards) => {
        // Let the server handle the real update
        emit('update_meld_draft_add', {
            gameId,
            cards: cards
        }, (res) => {
            if (res.error) {
                console.error(res.error);
                alert(res.error);
            }
        });
    };

    const removeMeld = (meld) => {
        emit('update_meld_draft_remove', {
            gameId,
            meld
        }, (res) => {
            if (res.error) {
                console.error(res.error);
                alert(res.error);
            }
        });
    };

    const removeMeldCard = (meldIndex,card) => {
        emit('update_meld_draft_remove_card', {
            gameId,
            meldIndex,
            card
        }, (res) => {
            if (res.error) {
                console.error(res.error);
                alert(res.error);
            }
        });
    };

    const reorderMeld = (meldIndex,meld) => {
        emit('update_meld_draft_order', {
            gameId,
            meldIndex,
            meld
        }, (res) => {
            if (res.error) {
                console.error(res.error);
                alert(res.error);
            }
        });
    };

    const addMeldCards = (meldIndex,cards) => {
        emit('update_meld_draft_add_cards', {
            gameId,
            meldIndex,
            cards
        }, (res) => {
            if (res.error) {
                console.error(res.error);
                alert(res.error);
            }
        });
    };

    const onLayDownList = () => {

        emit('lay_down_meld_list', { gameId }, (res) => {
            if (res.error) {
                alert(res.error);
            }
        });
    };

    const onAddToSelectedMeld = () => {
        emit('add_to_meld', {
            gameId,
            meldIndex: selectedMeldIndex,
            cards: selectedCards
        }, (res) => {
            if (res.error) alert(res.error);
            setSelectedCards([]);
            setSelectedMeldIndex(null);
        });
    };

    const isBlankCard = (card) => card.suit === null && card.rank === null;

    const toggleCardSelection = (index) => {
        setSelectedCards((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

    const toggleCardSelectionInGroup = (groupIndex, cardIndex) => {
        setSelectedCardsInGroup((prev) => {
            const exists = prev.some(
                (sel) => sel.groupIndex === groupIndex && sel.cardIndex === cardIndex
            );

            if (exists) {
                return prev.filter(
                    (sel) => !(sel.groupIndex === groupIndex && sel.cardIndex === cardIndex)
                );
            } else {
                return [{ groupIndex, cardIndex }];
            }
        });
    };

    const createGroup = () => {
        if (selectedCards.length < 2) return;

        addMeld(selectedCards);
        setSelectedCards([]);
    }

    const expandGroup = (groupIndex) => {
        const group = groups[groupIndex];
        if (!group) return;

        removeMeld(group);
        setSelectedGroupId(null);
    }

    const addCardsToGroup = () => {
        if (selectedGroupId === null || selectedCards.length === 0) return;

        addMeldCards(selectedGroupId, selectedCards);

        // 4. Reset state
        setSelectedGroupId(null);
        setSelectedCards([]);
    };

    const removeCardFromGroup = (groupIndex, cardIndexInGroup) => {
        const newGroups = [...groups];
        const group = [...newGroups[groupIndex]]; // copy group array
        const [removedCard] = group.splice(cardIndexInGroup, 1);

        removeMeldCard(groupIndex,removedCard);

        setSelectedCardsInGroup([]);
    };

    const moveCardInGroup = (groupIndex, fromIndex, direction) => {
        const newGroups = [...groups];
        const group = [...newGroups[groupIndex]]; // copy the group array
        const targetIndex = fromIndex + direction;

        // bounds check
        if (targetIndex < 0 || targetIndex >= group.length) return;

        // move the card
        const [movedCard] = group.splice(fromIndex, 1);
        group.splice(targetIndex, 0, movedCard);

        // update the groups state
        reorderMeld(groupIndex,group);

        // update selection indexes accordingly
        setSelectedCardsInGroup(prev =>
            prev.map(sel => {
                if (sel.groupIndex === groupIndex) {
                    if (sel.cardIndex === fromIndex) {
                        return { ...sel, cardIndex: targetIndex };
                    }
                }
                return sel;
            })
        );
    };

    const disableCanLay = () =>{
        return !(gamePhase === 'meld' && isMyTurn && groups.length > 0 && !hasLaidDown);
    }

    const disableTackOn = () =>{
        return !(selectedCards.length > 0 && selectedMeldIndex !== null && gamePhase === 'meld' && isMyTurn);
    }


    /** --- Components --- **/
    const GroupCard = ({ group, groupIndex,toggleCardSelectionInGroup }) => {

        const cardWidth = 50;
        const cardHeight = 70;
        const overlap = 22;
        const isGroupSelected = selectedGroupId === groupIndex;

        return (
            <div
                style={{
                    position: 'relative',
                    width: `${cardWidth + (group.length - 1) * overlap}px`,
                    height: `${cardHeight + 24}px` // extra space for name
                }}
            >
                {isGroupSelected && (
                    <button
                        onClick={() => expandGroup(groupIndex)}
                        style={{
                            position: 'absolute',
                            top: '-28px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            zIndex: 50
                        }}
                    >
                        Ungroup
                    </button>
                )}

                {group.map((card, cardIndexInGroup) => {
                    const isLast = cardIndexInGroup === group.length - 1;
                    const isSelected= selectedCardsInGroup.some(
                            sel => sel.groupIndex === groupIndex && sel.cardIndex === cardIndexInGroup
                        );
                    return (
                        <>
                            <GroupSingleCard
                                key={cardIndexInGroup}
                                index={cardIndexInGroup}
                                card={card}
                                isSelected={isSelected}
                                onClick={() => !isBlankCard(card) && toggleCardSelectionInGroup(groupIndex,cardIndexInGroup)}
                                overlap={overlap}
                                isLast={isLast}
                                groupIndex={groupIndex}
                            />
                        </>
                    )}
                )}


                <div
                    onClick={() =>
                        setSelectedGroupId(prev =>
                            prev === groupIndex ? null : groupIndex
                        )
                    }
                    style={{
                        position: 'absolute',
                        bottom: '-4px',
                        left: '0',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: isGroupSelected ? 'white' : '#7c3aed',
                        backgroundColor: isGroupSelected ? '#7c3aed' : '#f3e8ff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    {isGroupSelected ?"Deselect":"Select"}
                </div>
            </div>
        );
    };

    const GroupSingleCard = ({index,card,overlap,isLast,isSelected,groupIndex,onClick}) => {
        if (!card) return;
        return (
            <>
                <Card
                    key={index}
                    card={card}
                    isSelected={isSelected}
                    onClick={onClick}
                    isGroup={true}
                    isLast={isLast}
                    index={index}
                />
                {isSelected && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '-28px',
                            left: `${(index * overlap) - 6}px`,
                            display: 'flex',
                            gap: '4px',
                            zIndex: 999,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => moveCardInGroup(groupIndex, index, -1)}
                            style={{
                                width: '20px',
                                height: '20px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            ◀
                        </button>
                        <button
                            onClick={() => moveCardInGroup(groupIndex, index, 1)}
                            style={{
                                width: '20px',
                                height: '20px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            ▶
                        </button>
                        <button
                            onClick={() => removeCardFromGroup(groupIndex, index)}
                            style={{
                                width: '20px',
                                height: '20px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            ×
                        </button>
                    </div>
                )}
            </>
        );
    }


    return (
        <div className="game-section">
            <h4>🃏 Your Hand</h4>
            <div className="cards-container">

                {groups.map((group, groupIndex) => (
                    <GroupCard
                        key={groupIndex}
                        group={group}
                        groupIndex={groupIndex}
                        selectedGroupId={selectedGroupId}
                        setSelectedGroupId={setSelectedGroupId}
                        selectedCardsInGroup={selectedCardsInGroup}
                        toggleCardSelectionInGroup={toggleCardSelectionInGroup}
                        removeCardFromGroup={removeCardFromGroup}
                        moveCardInGroup={moveCardInGroup}
                    />
                ))}
                {hand.map((card, index) => (
                    <Card
                        key={index}
                        card={card}
                        isSelected={selectedCards.includes(card)}
                        onClick={() => toggleCardSelection(card)}
                        isGroup={false}
                        isLast={false}
                        index={index}
                    />
                ))}
            </div>
            <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '8px'
            }}>
                <button
                    onClick={createGroup}
                    disabled={selectedCards.length < 2}
                    className={selectedCards.length < 2?"btn-disabled":"lay-melds-btn"}
                >
                    Create Group
                </button>

                {/*
                <button
                    onClick={() => setSelectedCards([])}
                    disabled={!selectedCards.length > 0}
                    className={!selectedCards.length > 0?"btn-disabled":"lay-melds-btn"}
                >
                    Clear Selection
                </button>
                */}
                <button
                    onClick={addCardsToGroup}
                    disabled={ !(selectedGroupId != null && selectedCards.length !== 0) }
                    className={!(selectedGroupId != null && selectedCards.length !== 0)?"btn-disabled":"lay-melds-btn"}

                >
                    Add to Group
                </button>
            </div>
            <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
            }}>
                <button
                    className={disableTackOn()?"btn-disabled":"lay-melds-btn"}
                    disabled={disableTackOn()}
                    onClick={onAddToSelectedMeld}>
                    Add to Laid Meld
                </button>
                <button
                    className={disableCanLay()?"btn-disabled":"lay-melds-btn"}
                    onClick={onLayDownList}
                    disabled={disableCanLay()}
                >
                    Lay All Groups
                </button>
            </div>
        </div>
    );

};