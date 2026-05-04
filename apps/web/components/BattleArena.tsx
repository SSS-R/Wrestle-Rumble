'use client';

import { useState, useEffect, useRef } from 'react';

type BattleEvent = {
    timestamp: number;
    event_type: string;
    actor: string;
    description: string;
    damage: number | null;
    effect: string | null;
};

type BattleResult = {
    match_id: number;
    user_won: boolean;
    user_score: number;
    opponent_score: number;
    trophies_gained: number;
    coins_gained: number;
    duration: number;
    events: BattleEvent[];
};

type Card = {
    id: number;
    name: string;
    rarity: string;
    atk: number;
    def: number;
    signature: string | null;
    finisher: string | null;
};

type BattleArenaProps = {
    userCard: Card;
    opponentCard: Card;
    onBattleComplete: (result: BattleResult) => void;
    onBack: () => void;
    opponentPlayerId?: number | null;
    isMultiplayer?: boolean;
};

export function BattleArena({ userCard, opponentCard, onBattleComplete, onBack, opponentPlayerId, isMultiplayer = false }: BattleArenaProps) {
    const [battleState, setBattleState] = useState<'ready' | 'fighting' | 'complete'>('ready');
    const [currentTime, setCurrentTime] = useState(0);
    const [events, setEvents] = useState<BattleEvent[]>([]);
    const [userScore, setUserScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [result, setResult] = useState<BattleResult | null>(null);
    const [userMomentum, setUserMomentum] = useState(50);
    const [oppMomentum, setOppMomentum] = useState(50);
    const [activeEvent, setActiveEvent] = useState<BattleEvent | null>(null);
    const [pyroBurst, setPyroBurst] = useState(false);
    const [screenShake, setScreenShake] = useState(false);
    const [battleDuration, setBattleDuration] = useState(15);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const calculateDuration = (userCard: Card, opponentCard: Card): number => {
        const atkDiff = Math.abs(userCard.atk - opponentCard.atk);
        const defDiff = Math.abs(userCard.def - opponentCard.def);
        const totalDiff = atkDiff + defDiff;
        
        // Same/similar attributes (< 10 total diff) = longer battle (20-30 seconds)
        if (totalDiff < 10) {
            return Math.floor(Math.random() * 10) + 20;
        }
        
        // Normal battle (15-25 seconds)
        return Math.floor(Math.random() * 10) + 15;
    };

    const generateMockEvents = (userCard: Card, opponentCard: Card, duration: number): BattleEvent[] => {
        const events: BattleEvent[] = [];
        const numEvents = Math.floor(Math.random() * 4) + 8;
        const timeStep = duration / numEvents;
        const moveTypes = ['grapple', 'strike', 'taunt', 'signature', 'counter', 'comeback'];
        
        for (let i = 0; i < numEvents; i++) {
            const timestamp = Math.round(i * timeStep * 10) / 10;
            const isUserTurn = Math.random() > 0.5;
            const actor = isUserTurn ? userCard.name : opponentCard.name;
            const moveType = moveTypes[Math.floor(Math.random() * moveTypes.length)];
            const damage = moveType === 'taunt' ? null : Math.floor(Math.random() * 20) + 5;
            
            events.push({
                timestamp,
                event_type: moveType,
                actor,
                description: `${actor} executes ${moveType}!`,
                damage,
                effect: Math.random() > 0.7 ? ['stun', 'boost', 'critical'][Math.floor(Math.random() * 3)] : null,
            });
        }
        
        const userBase = userCard.atk * 0.7 + userCard.def * 0.3;
        const oppBase = opponentCard.atk * 0.7 + opponentCard.def * 0.3;
        const userFinal = Math.floor(userBase * (0.85 + Math.random() * 0.3));
        const oppFinal = Math.floor(oppBase * (0.85 + Math.random() * 0.3));
        const userWon = userFinal > oppFinal;
        
        events.push({
            timestamp: duration,
            event_type: 'conclusion',
            actor: 'referee',
            description: `${userWon ? userCard.name : opponentCard.name} WINS!`,
            damage: null,
            effect: null,
        });
        
        return events;
    };

    const startBattle = async () => {
        setBattleState('fighting');
        setCurrentTime(0);
        setUserMomentum(50);
        setOppMomentum(50);

        const stored = localStorage.getItem('wr_user');
        const playerId = stored ? JSON.parse(stored).user?.id || JSON.parse(stored).player?.id : 1;

        // Calculate dynamic duration based on card attributes
        const duration = calculateDuration(userCard, opponentCard);
        setBattleDuration(duration);

        // Generate battle locally for both modes (same animation/duration)
        const events = generateMockEvents(userCard, opponentCard, duration);
        const userBase = userCard.atk * 0.7 + userCard.def * 0.3;
        const oppBase = opponentCard.atk * 0.7 + opponentCard.def * 0.3;
        const userFinal = Math.floor(userBase * (0.85 + Math.random() * 0.3));
        const oppFinal = Math.floor(oppBase * (0.85 + Math.random() * 0.3));
        const userWon = userFinal > oppFinal;
        
        setEvents(events);
        const battleResult = {
            match_id: Date.now(),
            user_won: userWon,
            user_score: userFinal,
            opponent_score: oppFinal,
            trophies_gained: 0,
            coins_gained: 0,
            duration,
            events,
        };
        setResult(battleResult);
        playBattleAnimation(events, duration);

        // After animation, send result to backend for rewards (multiplayer only)
        if (isMultiplayer) {
            setTimeout(async () => {
                try {
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/combat/battle/result`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            player_id: playerId,
                            user_card_id: userCard.id,
                            opponent_card_id: opponentCard.id,
                            user_won: userWon,
                            user_score: userFinal,
                            opponent_score: oppFinal,
                        }),
                    });
                } catch (error) {
                    console.error('Result save error:', error);
                }
            }, duration * 1000 + 500);
        }
    };

    const playBattleAnimation = (battleEvents: BattleEvent[], duration: number) => {
        let eventIndex = 0;
        const totalDuration = duration * 1000;
        const timeStep = totalDuration / battleEvents.length;

        console.log('Starting battle with', battleEvents.length, 'events, duration:', duration, 's, timeStep:', timeStep, 'ms');

        const processEvent = (index: number) => {
            if (index >= battleEvents.length) {
                console.log('Battle complete');
                finishBattle();
                return;
            }

            const event = battleEvents[index];
            setCurrentTime(event.timestamp);
            setActiveEvent(event);

            if (event.event_type === 'finisher' || event.event_type === 'signature') {
                setPyroBurst(true);
                setScreenShake(true);
                setTimeout(() => {
                    setPyroBurst(false);
                    setScreenShake(false);
                }, 800);
            }

            if (event.actor === userCard.name) {
                setUserMomentum(prev => Math.min(100, prev + 5));
                setOppMomentum(prev => Math.max(0, prev - 3));
            } else {
                setOppMomentum(prev => Math.min(100, prev + 5));
                setUserMomentum(prev => Math.max(0, prev - 3));
            }

            console.log('Event', index, '/', battleEvents.length, 'at', event.timestamp, 's, next in', timeStep, 'ms');
            
            timerRef.current = setTimeout(() => {
                processEvent(index + 1);
            }, timeStep);
        };

        processEvent(0);
    };

    const finishBattle = () => {
        if (result) {
            setUserScore(result.user_score);
            setOpponentScore(result.opponent_score);
            setBattleState('complete');
            setActiveEvent(null);
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const getRarityGlow = (rarity: string) => {
        switch (rarity) {
            case 'Legendary':
                return 'shadow-[0_0_30px_rgba(212,175,55,0.6)] border-[var(--accent-gold)]';
            case 'Epic':
                return 'shadow-[0_0_30px_rgba(168,85,247,0.6)] border-purple-500';
            case 'Rare':
                return 'shadow-[0_0_30px_rgba(0,91,187,0.6)] border-[var(--accent-smackdown)]';
            default:
                return 'border-zinc-600';
        }
    };

    const getEffectBadge = (effect: string | null) => {
        if (!effect) return null;
        const effectStyles: Record<string, string> = {
            stun: 'bg-yellow-500/80 text-black',
            boost: 'bg-green-500/80 text-white',
            critical: 'bg-red-500/80 text-white animate-pulse',
            dodge: 'bg-blue-500/80 text-white',
            block: 'bg-gray-500/80 text-white',
            momentum: 'bg-orange-500/80 text-white',
        };
        return (
            <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${effectStyles[effect] || 'bg-white/20'}`}>
                {effect}
            </span>
        );
    };

    if (battleState === 'ready') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
                <div className="metal-panel chrome-border relative w-full max-w-5xl overflow-hidden rounded-[32px]">
                    <button
                        onClick={onBack}
                        className="absolute right-6 top-6 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                    >
                        ✕
                    </button>

                    <div className="relative grid md:grid-cols-2 gap-0">
                        <div className={`relative m-6 aspect-[3/4] rounded-2xl border-4 bg-gradient-to-br from-zinc-800 to-black p-6 transition-all duration-500 ${getRarityGlow(userCard.rarity)}`}>
                            <div className="absolute top-4 left-4 rounded bg-[var(--accent-raw)]/30 px-4 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent-raw)]">
                                Your Fighter
                            </div>
                            <div className="flex h-full flex-col justify-between pt-12">
                                <div>
                                    <h3 className="font-[var(--font-display)] text-4xl uppercase text-white drop-shadow-lg">{userCard.name}</h3>
                                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)]">{userCard.rarity}</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="mb-2 flex justify-between text-xs uppercase tracking-wider">
                                            <span className="text-[var(--text-secondary)]">Attack</span>
                                            <span className="font-bold text-red-400">{userCard.atk}</span>
                                        </div>
                                        <div className="h-3 overflow-hidden rounded-full bg-black">
                                            <div className="h-full bg-gradient-to-r from-red-600 to-red-400" style={{ width: `${userCard.atk}%` }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-2 flex justify-between text-xs uppercase tracking-wider">
                                            <span className="text-[var(--text-secondary)]">Defense</span>
                                            <span className="font-bold text-blue-400">{userCard.def}</span>
                                        </div>
                                        <div className="h-3 overflow-hidden rounded-full bg-black">
                                            <div className="h-full bg-gradient-to-r from-[var(--accent-smackdown)] to-blue-400" style={{ width: `${userCard.def}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-black/50 p-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Signature Move</p>
                                        <p className="font-[var(--font-heading)] text-sm text-white">{userCard.signature}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Finisher</p>
                                        <p className="font-[var(--font-heading)] text-sm text-white">{userCard.finisher}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-8">
                            <div className="mb-8 text-center">
                                <h2 className="font-[var(--font-display)] text-6xl uppercase tracking-[0.2em] text-white drop-shadow-[0_0_30px_rgba(226,26,44,0.5)]">
                                    ⚡ VS ⚡
                                </h2>
                            </div>

                            <button
                                onClick={startBattle}
                                className="glow-pulse relative overflow-hidden rounded-full bg-gradient-to-r from-[var(--accent-raw)] to-red-700 px-16 py-8 text-2xl font-bold uppercase tracking-[0.3em] text-white transition-transform hover:scale-105"
                            >
                                <span className="relative z-10">🔥 FIGHT! 🔥</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                            </button>

                            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                                ~{battleDuration} Second Battle
                            </p>

                            {isMultiplayer && (
                                <div className="mt-8 w-full max-w-xs space-y-3 rounded-xl border border-white/10 bg-black/40 p-4">
                                    <p className="text-center text-xs uppercase tracking-wider text-[var(--text-secondary)]">Battle Rewards</p>
                                    <div className="flex justify-center gap-6">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-[var(--accent-gold)]">🏆 15</p>
                                            <p className="text-[10px] uppercase text-[var(--text-secondary)]">Trophies (Win)</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-[var(--accent-gold)]">🪙 100</p>
                                            <p className="text-[10px] uppercase text-[var(--text-secondary)]">Coins (Win)</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (battleState === 'fighting') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4 overflow-hidden">
                <div className={`metal-panel chrome-border relative flex h-full max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-[32px] ${screenShake ? 'animate-shake' : ''}`}>
                    <button
                        onClick={onBack}
                        className="absolute right-6 top-6 z-50 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                    >
                        ✕
                    </button>

                    {pyroBurst && (
                        <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute h-3 w-3 rounded-full bg-gradient-to-r from-orange-500 to-yellow-400"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        animation: `pyro 0.8s ease-out ${Math.random() * 0.3}s`,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-8 py-4">
                        <div className="flex items-center gap-4">
                            <span className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Time</span>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-800">
                                    <div
                                        className="h-full bg-gradient-to-r from-[var(--accent-raw)] to-red-500 transition-all duration-300"
                                        style={{ width: `${(currentTime / 15) * 100}%` }}
                                    />
                                </div>
                                <span className="font-mono text-lg font-bold text-white">{currentTime.toFixed(1)}s</span>
                            </div>
                        </div>
                        <div className="text-2xl font-[var(--font-display)] uppercase tracking-[0.2em] text-[var(--accent-gold)]">
                            Battle Arena
                        </div>
                    </div>

                    <div className="grid flex-1 grid-cols-2 gap-0">
                        <div className="relative border-r border-white/10 p-8">
                            <div className={`relative mx-auto aspect-[3/4] w-full max-w-sm rounded-2xl border-4 bg-gradient-to-br from-zinc-800 to-black p-6 transition-all duration-300 ${getRarityGlow(userCard.rarity)} ${activeEvent?.actor === userCard.name ? 'scale-105' : ''}`}>
                                {getEffectBadge(activeEvent?.actor === userCard.name ? activeEvent?.effect : null)}
                                <div className="absolute top-4 left-4 rounded bg-[var(--accent-raw)]/30 px-4 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent-raw)]">
                                    You
                                </div>
                                <div className="flex h-full flex-col justify-between pt-12">
                                    <div>
                                        <h3 className="font-[var(--font-display)] text-3xl uppercase text-white">{userCard.name}</h3>
                                    </div>
                                    <div>
                                        <div className="mb-2">
                                            <div className="mb-1 flex justify-between text-xs">
                                                <span className="text-[var(--text-secondary)]">Momentum</span>
                                                <span className="font-bold text-orange-400">{userMomentum}%</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-black">
                                                <div
                                                    className="h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-300"
                                                    style={{ width: `${userMomentum}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative p-8">
                            <div className={`relative mx-auto aspect-[3/4] w-full max-w-sm rounded-2xl border-4 bg-gradient-to-br from-zinc-800 to-black p-6 transition-all duration-300 ${getRarityGlow(opponentCard.rarity)} ${activeEvent?.actor === opponentCard.name ? 'scale-105' : ''}`}>
                                {getEffectBadge(activeEvent?.actor === opponentCard.name ? activeEvent?.effect : null)}
                                <div className="absolute top-4 left-4 rounded bg-zinc-600/30 px-4 py-1 text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
                                    Opponent
                                </div>
                                <div className="flex h-full flex-col justify-between pt-12">
                                    <div>
                                        <h3 className="font-[var(--font-display)] text-3xl uppercase text-white">{opponentCard.name}</h3>
                                    </div>
                                    <div>
                                        <div className="mb-2">
                                            <div className="mb-1 flex justify-between text-xs">
                                                <span className="text-[var(--text-secondary)]">Momentum</span>
                                                <span className="font-bold text-orange-400">{oppMomentum}%</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-black">
                                                <div
                                                    className="h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-300"
                                                    style={{ width: `${oppMomentum}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/10 bg-black/60 p-6">
                        <div className="mx-auto max-w-4xl">
                            {activeEvent && (
                                <div className="text-center">
                                    <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                                        {activeEvent.event_type}
                                    </p>
                                    <p className="text-2xl font-bold uppercase tracking-[0.1em] text-white">
                                        {activeEvent.description}
                                    </p>
                                    {activeEvent.damage && (
                                        <p className="mt-2 text-lg font-bold text-[var(--accent-raw)]">
                                            💥 {activeEvent.damage} DMG
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <style>{`
                    @keyframes pyro {
                        0% {
                            transform: translateY(0) scale(1);
                            opacity: 1;
                        }
                        100% {
                            transform: translateY(-100px) scale(0);
                            opacity: 0;
                        }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
            <div className="metal-panel chrome-border relative w-full max-w-3xl overflow-hidden rounded-[32px] p-8">
                <div className="text-center">
                    <div className="text-8xl">{result?.user_won ? '🏆' : '😢'}</div>
                    <h2 className={`mt-6 text-5xl font-bold uppercase tracking-[0.2em] ${result?.user_won ? 'text-[var(--success)]' : 'text-[var(--accent-raw)]'}`}>
                        {result?.user_won ? 'VICTORY!' : 'DEFEAT'}
                    </h2>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="rounded-xl border border-white/10 bg-black/40 p-6">
                            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Your Score</p>
                            <p className="text-4xl font-bold text-white">{result?.user_score}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/40 p-6">
                            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Opponent Score</p>
                            <p className="text-4xl font-bold text-white">{result?.opponent_score}</p>
                        </div>
                    </div>

                    {result?.user_won && isMultiplayer && (
                        <div className="mt-6 text-center">
                            <p className="text-3xl font-bold text-[var(--accent-gold)]">🏆 +{result.trophies_gained}</p>
                            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Trophies Earned</p>
                        </div>
                    )}

                    {!result?.user_won && (
                        <div className="mt-6 text-center">
                            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Better luck next time</p>
                        </div>
                    )}

                    <div className="mt-8 flex justify-center gap-4">
                        <button
                            onClick={onBack}
                            className="rounded-xl border border-[var(--accent-gold)] bg-black/30 px-8 py-3 text-sm font-bold uppercase tracking-[0.15em] text-[var(--accent-gold)] hover:bg-amber-900/40 transition-colors"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
