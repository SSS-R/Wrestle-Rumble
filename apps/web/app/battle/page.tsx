'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopNavigation } from '../../components/TopNavigation';
import { BattleArena } from '../../components/BattleArena';
import { fetchApi } from '../../lib/api';

type Card = {
    id: number;
    name: string;
    rarity: string;
    atk: number;
    def: number;
    signature: string | null;
    finisher: string | null;
    quantity?: number;
    is_active?: boolean;
};

type BattleResult = {
    match_id: number;
    user_won: boolean;
    user_score: number;
    opponent_score: number;
    trophies_gained: number;
    coins_gained: number;
    duration: number;
    events: any[];
    opponent_card_id: number;
    opponent_card_name: string;
    opponent_card_rarity: string;
    opponent_card_att: number;
    opponent_card_def: number;
    opponent_card_signature?: string;
    opponent_card_finisher?: string;
};

export default function BattlePage() {
    const router = useRouter();
    const [battleMode, setBattleMode] = useState<'practice' | 'multiplayer'>('practice');
    const [phase, setPhase] = useState<'select' | 'searching' | 'prematch' | 'battle' | 'complete'>('select');
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [opponentCard, setOpponentCard] = useState<Card | null>(null);
    const [searchProgress, setSearchProgress] = useState(0);
    const [countdown, setCountdown] = useState(10);
    const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
    const [userCards, setUserCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [playerId, setPlayerId] = useState<number | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('wr_user');
        if (stored) {
            const data = JSON.parse(stored);
            const id = data.user?.id || data.player?.id;
            if (id) {
                setPlayerId(id);
            }
        }
    }, []);

    useEffect(() => {
        if (playerId) {
            loadUserCards();
        }
    }, [playerId]);

    const loadUserCards = async () => {
        try {
            const data = await fetchApi(`/player/${playerId}/inventory`);
            const cards = data.cards.map((c: any) => ({
                id: c.id,
                name: c.name,
                rarity: c.rarity,
                atk: c.att,
                def: c.def_,
                signature: c.signature,
                finisher: c.finisher,
                quantity: c.quantity,
                is_active: c.is_active,
            }));
            setUserCards(cards);
        } catch (err) {
            console.error('Failed to load cards:', err);
            setError('Failed to load your cards. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const selectCard = (card: Card) => {
        setSelectedCard(card);
    };

    const startMatchmaking = () => {
        if (!selectedCard) return;
        
        if (battleMode === 'practice') {
            setPhase('searching');
            setSearchProgress(0);
            
            const searchInterval = setInterval(() => {
                setSearchProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(searchInterval);
                        findPracticeOpponent();
                        return 100;
                    }
                    return prev + 2;
                });
            }, 50);
        } else {
            setPhase('searching');
            setSearchProgress(0);
            
            const searchInterval = setInterval(() => {
                setSearchProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(searchInterval);
                        startMultiplayerBattle();
                        return 100;
                    }
                    return prev + 2;
                });
            }, 50);
        }
    };
    
    const findPracticeOpponent = () => {
        const availableOpponents = userCards.filter(c => c.id !== selectedCard?.id);
        if (availableOpponents.length === 0) {
            setError('No opponent cards available');
            return;
        }
        const randomOpponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
        setOpponentCard(randomOpponent);
        setPhase('prematch');
        startCountdown();
    };
    
    const startMultiplayerBattle = async () => {
        try {
            // First, fetch random opponent from other players
            const opponentRes = await fetchApi(`/combat/opponent/random?player_id=${playerId}`);
            
            setOpponentCard({
                id: opponentRes.card_id,
                name: opponentRes.name,
                rarity: opponentRes.rarity,
                atk: opponentRes.att,
                def: opponentRes.def,
                signature: opponentRes.signature,
                finisher: opponentRes.finisher,
            });
            
            // Battle will start automatically in BattleArena component
            setPhase('prematch');
            startCountdown();
        } catch (err: any) {
            setError(err.message || 'Failed to find opponent');
            setPhase('select');
        }
    };

    const startCountdown = () => {
        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    setPhase('battle');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleBattleComplete = (result: BattleResult) => {
        setBattleResult(result);
        setPhase('complete');
    };

    const cancelMatchmaking = () => {
        setPhase('select');
        setSearchProgress(0);
    };

    const getRarityBorder = (rarity: string) => {
        switch (rarity) {
            case 'Legendary':
                return 'border-[var(--accent-gold)] shadow-[0_0_20px_rgba(212,175,55,0.4)]';
            case 'Gold':
                return 'border-[var(--accent-gold)] shadow-[0_0_20px_rgba(212,175,55,0.3)]';
            case 'Rare':
                return 'border-[var(--accent-smackdown)] shadow-[0_0_20px_rgba(0,91,187,0.4)]';
            default:
                return 'border-zinc-600';
        }
    };

    if (loading) {
        return (
            <main className="page-shell min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
                <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col items-center justify-center px-4">
                    <div className="text-center">
                        <div className="text-6xl animate-pulse">⚔️</div>
                        <p className="mt-4 text-lg uppercase tracking-wider text-[var(--text-secondary)]">
                            Loading your cards...
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="page-shell min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
                <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col items-center justify-center px-4">
                    <div className="text-center">
                        <div className="text-6xl">😢</div>
                        <p className="mt-4 text-lg text-[var(--accent-raw)]">{error}</p>
                        <button
                            onClick={loadUserCards}
                            className="mt-6 rounded-xl bg-[var(--accent-raw)] px-8 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white hover:bg-red-600"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="page-shell min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-6 pt-4 lg:px-6">
                <TopNavigation />

                {phase === 'select' && (
                    <>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="font-[var(--font-display)] text-4xl uppercase tracking-[0.15em] text-white">
                                    ⚔️ Battle Arena
                                </h2>
                                <p className="mt-1 text-sm uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                                    {battleMode === 'practice' ? 'Practice with your cards' : 'Fight other players cards'}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/40 p-1.5">
                                <button
                                    onClick={() => setBattleMode('practice')}
                                    className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-colors ${
                                        battleMode === 'practice'
                                            ? 'bg-[var(--accent-raw)] text-white shadow-[0_0_15px_rgba(226,26,44,0.4)]'
                                            : 'text-[var(--text-secondary)] hover:text-white'
                                    }`}
                                >
                                    🎯 Practice
                                </button>
                                <button
                                    onClick={() => setBattleMode('multiplayer')}
                                    className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-colors ${
                                        battleMode === 'multiplayer'
                                            ? 'bg-[var(--accent-gold)] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                                            : 'text-[var(--text-secondary)] hover:text-white'
                                    }`}
                                >
                                    ⚡ Multiplayer
                                </button>
                            </div>
                        </div>

                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">Your Cards</p>
                                <p className="text-2xl font-bold text-white">{userCards.length} Available</p>
                            </div>
                        </div>

                        {userCards.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">🃏</div>
                                <p className="text-lg text-[var(--text-secondary)]">No cards in your collection</p>
                                <p className="text-sm text-[var(--text-muted)] mt-2">
                                    Visit the store or claim your daily gift to get cards
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                {userCards.map(card => (
                                    <button
                                        key={card.id}
                                        onClick={() => selectCard(card)}
                                        className={`group relative flex flex-col text-left transition hover:-translate-y-2 focus:outline-none ${
                                            selectedCard?.id === card.id ? 'ring-2 ring-[var(--accent-raw)] ring-offset-2 ring-offset-black' : ''
                                        }`}
                                    >
                                        <div className={`relative aspect-[2/3] w-full overflow-hidden rounded-xl border-2 bg-gradient-to-br from-zinc-800 to-black ${getRarityBorder(card.rarity)}`}>
                                            <div className="absolute bottom-4 left-0 right-0 text-center">
                                                <p className="font-[var(--font-display)] text-xl uppercase tracking-wider drop-shadow-lg text-white">{card.name}</p>
                                            </div>
                                            {selectedCard?.id === card.id && (
                                                <div className="absolute top-2 right-2 rounded-full bg-[var(--accent-raw)] px-3 py-1 text-xs font-bold uppercase text-white">
                                                    Selected
                                                </div>
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                                                <div className="rounded-full bg-[var(--accent-raw)]/90 px-6 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white">
                                                    Select
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex justify-between px-1">
                                            <div className="flex gap-2 text-xs">
                                                <span className="font-bold text-red-500">ATK {card.atk}</span>
                                                <span className="font-bold text-blue-500">DEF {card.def}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedCard && (
                            <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[var(--bg-secondary)]/95 p-6 backdrop-blur">
                                <div className="mx-auto flex max-w-4xl items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`rounded-lg border-2 px-4 py-2 ${getRarityBorder(selectedCard.rarity)}`}>
                                            <span className="font-bold text-white">{selectedCard.name}</span>
                                        </div>
                                        <div className="text-sm text-[var(--text-secondary)]">
                                            <span className="text-red-400">ATK {selectedCard.atk}</span>
                                            <span className="mx-2">•</span>
                                            <span className="text-blue-400">DEF {selectedCard.def}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={startMatchmaking}
                                        className="glow-pulse rounded-full bg-gradient-to-r from-[var(--accent-raw)] to-red-700 px-12 py-4 text-lg font-bold uppercase tracking-[0.2em] text-white transition-transform hover:scale-105"
                                    >
                                        ⚡ Find Opponent
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {phase === 'searching' && (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="metal-panel chrome-border w-full max-w-lg rounded-[32px] p-8 text-center">
                            <div className="mb-8 flex items-center justify-center gap-8">
                                <div className={`aspect-[2/3] w-48 rounded-2xl border-4 bg-gradient-to-br from-zinc-800 to-black p-4 ${getRarityBorder(selectedCard!.rarity)}`}>
                                    <p className="mt-2 font-[var(--font-display)] text-lg uppercase text-white">{selectedCard?.name}</p>
                                </div>
                                <div className="text-6xl font-[var(--font-display)] uppercase tracking-[0.2em] text-[var(--accent-raw)] animate-pulse">
                                    VS
                                </div>
                                <div className="aspect-[2/3] w-48 rounded-2xl border-4 border-dashed border-zinc-600 bg-gradient-to-br from-zinc-800 to-black p-4">
                                    <div className="flex h-full items-center justify-center">
                                        <span className="text-4xl text-zinc-500">?</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4 text-2xl font-bold uppercase tracking-[0.2em] text-white">
                                {battleMode === 'multiplayer' ? '🔍 Finding opponent...' : '🤖 Preparing match...'}
                            </div>

                            <div className="mb-6 h-3 overflow-hidden rounded-full bg-black">
                                <div
                                    className="h-full bg-gradient-to-r from-[var(--accent-raw)] to-red-500 transition-all duration-100"
                                    style={{ width: `${searchProgress}%` }}
                                />
                            </div>

                            <button
                                onClick={cancelMatchmaking}
                                className="rounded-xl border border-zinc-600 bg-transparent px-8 py-3 text-sm font-bold uppercase tracking-[0.15em] text-zinc-400 hover:border-white hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {phase === 'prematch' && opponentCard && (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="metal-panel chrome-border w-full max-w-5xl rounded-[32px] p-8">
                            <div className="mb-8 text-center">
                                <h3 className="font-[var(--font-display)] text-4xl uppercase tracking-[0.2em] text-white">
                                    ⚡ Match Found! ⚡
                                </h3>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className={`rounded-2xl border-4 bg-gradient-to-br from-zinc-800 to-black p-6 ${getRarityBorder(selectedCard!.rarity)}`}>
                                    <div className="mb-4 text-center">
                                        <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Your Fighter</p>
                                        <h4 className="font-[var(--font-display)] text-2xl uppercase text-white">{selectedCard?.name}</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-[var(--text-secondary)]">Attack</span>
                                                <span className="font-bold text-red-400">{selectedCard?.atk}</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-black">
                                                <div className="h-full bg-red-500" style={{ width: `${selectedCard?.atk}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-[var(--text-secondary)]">Defense</span>
                                                <span className="font-bold text-blue-400">{selectedCard?.def}</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-black">
                                                <div className="h-full bg-[var(--accent-smackdown)]" style={{ width: `${selectedCard?.def}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={`rounded-2xl border-4 bg-gradient-to-br from-zinc-800 to-black p-6 ${getRarityBorder(opponentCard.rarity)}`}>
                                    <div className="mb-4 text-center">
                                        <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Opponent</p>
                                        <h4 className="font-[var(--font-display)] text-2xl uppercase text-white">{opponentCard.name}</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-[var(--text-secondary)]">Attack</span>
                                                <span className="font-bold text-red-400">{opponentCard.atk}</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-black">
                                                <div className="h-full bg-red-500" style={{ width: `${opponentCard.atk}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-[var(--text-secondary)]">Defense</span>
                                                <span className="font-bold text-blue-400">{opponentCard.def}</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-black">
                                                <div className="h-full bg-[var(--accent-smackdown)]" style={{ width: `${opponentCard.def}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <div className="mb-4 flex items-center justify-center gap-4">
                                    <div className="text-6xl font-bold text-[var(--accent-gold)]">{countdown}</div>
                                </div>
                                <p className="text-sm uppercase tracking-wider text-[var(--text-secondary)]">
                                    Match starts in
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {phase === 'battle' && selectedCard && opponentCard && (
                    <BattleArena
                        userCard={selectedCard}
                        opponentCard={opponentCard}
                        onBattleComplete={handleBattleComplete}
                        onBack={() => router.push('/lobby')}
                        opponentPlayerId={null}
                        isMultiplayer={battleMode === 'multiplayer'}
                    />
                )}

                {phase === 'complete' && battleResult && (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="metal-panel chrome-border w-full max-w-2xl rounded-[32px] p-8 text-center">
                            <div className="text-8xl">{battleResult.user_won ? '🏆' : '😢'}</div>
                            <h2 className={`mt-6 text-5xl font-bold uppercase tracking-[0.2em] ${battleResult.user_won ? 'text-[var(--success)]' : 'text-[var(--accent-raw)]'}`}>
                                {battleResult.user_won ? 'VICTORY!' : 'DEFEAT'}
                            </h2>

                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <div className="rounded-xl border border-white/10 bg-black/40 p-6">
                                    <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Your Score</p>
                                    <p className="text-4xl font-bold text-white">{battleResult.user_score}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-black/40 p-6">
                                    <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Opponent Score</p>
                                    <p className="text-4xl font-bold text-white">{battleResult.opponent_score}</p>
                                </div>
                            </div>

                            {battleResult.user_won ? (
                                <div className="mt-6 text-center">
                                    <p className="text-3xl font-bold text-[var(--accent-gold)]">🏆 +{battleResult.trophies_gained}</p>
                                    <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Trophies Earned</p>
                                </div>
                            ) : (
                                <div className="mt-6 text-center">
                                    <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Better luck next time</p>
                                </div>
                            )}

                            <div className="mt-8">
                                <button
                                    onClick={() => {
                                        setPhase('select');
                                        setSelectedCard(null);
                                        setOpponentCard(null);
                                        setCountdown(10);
                                    }}
                                    className="rounded-xl bg-[var(--accent-raw)] px-8 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white hover:bg-red-600 transition-colors"
                                >
                                    Battle Again
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </main>
    );
}
