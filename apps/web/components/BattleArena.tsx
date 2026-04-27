'use client';

import { useState } from 'react';
import { Card } from '../lib/mockData';

type BattleResult = {
    battle_id: number;
    user_won: boolean;
    user_score: number;
    opponent_score: number;
    trophies_gained: number;
    coins_gained: number;
};

type BattleArenaProps = {
    userCard: Card;
    opponentCard: Card;
    onBattleComplete: (result: BattleResult) => void;
    onBack: () => void;
};

export function BattleArena({ userCard, opponentCard, onBattleComplete, onBack }: BattleArenaProps) {
    const [battleState, setBattleState] = useState<'ready' | 'fighting' | 'complete'>('ready');
    const [userScore, setUserScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [result, setResult] = useState<BattleResult | null>(null);
    const [attackAnim, setAttackAnim] = useState<'none' | 'user' | 'opponent'>('none');

    const calculateBattle = () => {
        setBattleState('fighting');
        
        const userBase = userCard.atk * 0.7 + userCard.def * 0.3;
        const opponentBase = opponentCard.atk * 0.7 + opponentCard.def * 0.3;
        
        const userRandom = 0.85 + Math.random() * 0.3;
        const opponentRandom = 0.85 + Math.random() * 0.3;
        
        setTimeout(() => {
            setAttackAnim('user');
        }, 500);
        
        setTimeout(() => {
            setAttackAnim('opponent');
        }, 1000);
        
        setTimeout(() => {
            const finalUserScore = Math.floor(userBase * userRandom);
            const finalOpponentScore = Math.floor(opponentBase * opponentRandom);
            
            setUserScore(finalUserScore);
            setOpponentScore(finalOpponentScore);
            
            const userWon = finalUserScore > finalOpponentScore;
            const baseTrophies = userWon ? 15 : 0;
            const baseCoins = userWon ? 100 : 25;
            
            const battleResult: BattleResult = {
                battle_id: Date.now(),
                user_won: userWon,
                user_score: finalUserScore,
                opponent_score: finalOpponentScore,
                trophies_gained: userWon ? baseTrophies : 0,
                coins_gained: userWon ? baseCoins : 0,
            };
            
            setResult(battleResult);
            setBattleState('complete');
            setAttackAnim('none');
        }, 1500);
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'Legendary': return 'border-[var(--accent-gold)] shadow-[0_0_20px_rgba(212,175,55,0.4)]';
            case 'Epic': return 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]';
            case 'Rare': return 'border-[var(--accent-smackdown)] shadow-[0_0_20px_rgba(0,91,187,0.4)]';
            default: return 'border-zinc-600';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <div className="metal-panel chrome-border relative w-full max-w-6xl overflow-hidden rounded-[32px] p-8">
                <button
                    onClick={onBack}
                    className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                >
                    ✕
                </button>

                <div className="mb-8 text-center">
                    <h2 className="font-[var(--font-display)] text-5xl uppercase tracking-[0.15em] text-white">
                        🏟️ Battle Arena
                    </h2>
                    <p className="mt-2 text-sm uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                        Choose your fighter and compete!
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    <div className={`relative aspect-[2/3] rounded-2xl border-4 bg-gradient-to-br from-zinc-800 to-black p-6 transition-transform duration-300 ${getRarityColor(userCard.rarity)} ${attackAnim === 'user' ? 'scale-105 translate-x-4' : ''}`}>
                        <div className="absolute top-4 right-4 rounded bg-[var(--accent-raw)]/20 px-3 py-1 text-xs font-bold uppercase text-[var(--accent-raw)]">
                            You
                        </div>
                        <div className="flex h-full flex-col justify-between">
                            <div>
                                <h3 className="font-[var(--font-display)] text-3xl uppercase text-white">{userCard.name}</h3>
                                <p className="mt-2 text-xs uppercase tracking-[0.15em] text-[var(--accent-gold)]">{userCard.rarity}</p>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <div className="mb-1 flex justify-between text-xs">
                                        <span className="text-[var(--text-secondary)]">ATK</span>
                                        <span className="font-bold text-red-400">{userCard.atk}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-black">
                                        <div className="h-full bg-red-500" style={{ width: `${userCard.atk}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-1 flex justify-between text-xs">
                                        <span className="text-[var(--text-secondary)]">DEF</span>
                                        <span className="font-bold text-blue-400">{userCard.def}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-black">
                                        <div className="h-full bg-[var(--accent-smackdown)]" style={{ width: `${userCard.def}%` }} />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-3">
                                <p className="text-[10px] uppercase text-[var(--text-secondary)]">Signature</p>
                                <p className="font-[var(--font-heading)] text-sm text-white">{userCard.signature}</p>
                                <p className="mt-2 text-[10px] uppercase text-[var(--text-secondary)]">Finisher</p>
                                <p className="font-[var(--font-heading)] text-sm text-white">{userCard.finisher}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                        {battleState === 'ready' && (
                            <button
                                onClick={calculateBattle}
                                className="glow-pulse rounded-full bg-gradient-to-r from-[var(--accent-raw)] to-red-700 px-12 py-6 text-xl font-bold uppercase tracking-[0.2em] text-white"
                            >
                                ⚔️ FIGHT!
                            </button>
                        )}
                        {battleState === 'fighting' && (
                            <div className="text-center">
                                <div className="text-6xl animate-bounce">💥</div>
                                <p className="mt-4 text-2xl font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">
                                    Battle in Progress...
                                </p>
                            </div>
                        )}
                        {battleState === 'complete' && result && (
                            <div className="text-center">
                                <div className="text-6xl">{result.user_won ? '🏆' : '😢'}</div>
                                <p className={`mt-4 text-3xl font-bold uppercase tracking-[0.2em] ${result.user_won ? 'text-[var(--success)]' : 'text-[var(--accent-raw)]'}`}>
                                    {result.user_won ? 'VICTORY!' : 'DEFEAT'}
                                </p>
                                <div className="mt-6 space-y-2 rounded-xl border border-white/10 bg-black/40 p-4">
                                    <p className="text-lg font-bold text-white">Score: {userScore} - {opponentScore}</p>
                                    {result.user_won && (
                                        <>
                                            <p className="text-sm text-[var(--accent-gold)]">+{result.trophies_gained} 🏆 Trophies</p>
                                            <p className="text-sm text-[var(--accent-gold)]">+{result.coins_gained} 🪙 Coins</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`relative aspect-[2/3] rounded-2xl border-4 bg-gradient-to-br from-zinc-800 to-black p-6 transition-transform duration-300 ${getRarityColor(opponentCard.rarity)} ${attackAnim === 'opponent' ? 'scale-105 -translate-x-4' : ''}`}>
                        <div className="absolute top-4 right-4 rounded bg-zinc-600/20 px-3 py-1 text-xs font-bold uppercase text-zinc-400">
                            Opponent
                        </div>
                        <div className="flex h-full flex-col justify-between">
                            <div>
                                <h3 className="font-[var(--font-display)] text-3xl uppercase text-white">{opponentCard.name}</h3>
                                <p className="mt-2 text-xs uppercase tracking-[0.15em] text-[var(--accent-gold)]">{opponentCard.rarity}</p>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <div className="mb-1 flex justify-between text-xs">
                                        <span className="text-[var(--text-secondary)]">ATK</span>
                                        <span className="font-bold text-red-400">{opponentCard.atk}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-black">
                                        <div className="h-full bg-red-500" style={{ width: `${opponentCard.atk}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-1 flex justify-between text-xs">
                                        <span className="text-[var(--text-secondary)]">DEF</span>
                                        <span className="font-bold text-blue-400">{opponentCard.def}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-black">
                                        <div className="h-full bg-[var(--accent-smackdown)]" style={{ width: `${opponentCard.def}%` }} />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-3">
                                <p className="text-[10px] uppercase text-[var(--text-secondary)]">Signature</p>
                                <p className="font-[var(--font-heading)] text-sm text-white">{opponentCard.signature}</p>
                                <p className="mt-2 text-[10px] uppercase text-[var(--text-secondary)]">Finisher</p>
                                <p className="font-[var(--font-heading)] text-sm text-white">{opponentCard.finisher}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {battleState === 'complete' && (
                    <div className="mt-8 flex justify-center gap-4">
                        <button
                            onClick={() => {
                                setBattleState('ready');
                                setUserScore(0);
                                setOpponentScore(0);
                                setResult(null);
                            }}
                            className="rounded-xl bg-[var(--accent-raw)] px-8 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white hover:bg-red-600"
                        >
                            Rematch
                        </button>
                        <button
                            onClick={() => onBattleComplete(result!)}
                            className="rounded-xl border border-[var(--accent-gold)] bg-black/30 px-8 py-3 text-sm font-bold uppercase tracking-[0.15em] text-[var(--accent-gold)] hover:bg-amber-900/40"
                        >
                            Continue
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
