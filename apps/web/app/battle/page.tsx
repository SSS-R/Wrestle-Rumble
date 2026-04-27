'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNavigation } from '../../components/TopNavigation';
import { BattleArena } from '../../components/BattleArena';
import { MOCK_CARDS, MOCK_USER } from '../../lib/mockData';

export default function BattlePage() {
    const router = useRouter();
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [isBattling, setIsBattling] = useState(false);
    const [opponentCard, setOpponentCard] = useState<string | null>(null);

    const userCards = MOCK_CARDS.filter(c => c.owned && c.owned > 0);

    const startBattle = (cardId: string) => {
        setSelectedCard(cardId);
        const randomOpponent = MOCK_CARDS[Math.floor(Math.random() * MOCK_CARDS.length)];
        setOpponentCard(randomOpponent.id);
        setIsBattling(true);
    };

    const handleBattleComplete = (result: { trophies_gained: number; coins_gained: number }) => {
        setIsBattling(false);
        setSelectedCard(null);
        setOpponentCard(null);
        router.push('/lobby');
    };

    const selectedCardData = userCards.find(c => c.id === selectedCard);
    const opponentCardData = MOCK_CARDS.find(c => c.id === opponentCard);

    return (
        <main className="page-shell min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary]]">
            <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-6 pt-4 lg:px-6">
                <TopNavigation />

                <div className="mb-8 text-center">
                    <h2 className="font-[var(--font-display)] text-5xl uppercase tracking-[0.15em] text-white">
                        ⚔️ Battle Arena
                    </h2>
                    <p className="mt-2 text-sm uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                        Select your champion to fight!
                    </p>
                </div>

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-[var(--text-secondary)]">Your Cards</p>
                        <p className="text-2xl font-bold text-white">{userCards.length} Available</p>
                    </div>
                    <div className="rounded-full border border-[var(--accent-gold)]/30 bg-black/40 px-4 py-2 text-sm font-bold text-[var(--accent-gold)]">
                        🪙 {MOCK_USER.coins.toLocaleString()}
                    </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {userCards.map(card => (
                        <button
                            key={card.id}
                            onClick={() => startBattle(card.id)}
                            className="group relative flex flex-col text-left transition hover:-translate-y-2 focus:outline-none"
                        >
                            <div className={`relative aspect-[2/3] w-full overflow-hidden rounded-xl border-2 bg-gradient-to-br from-zinc-800 to-black ${
                                card.rarity === 'Legendary' ? 'border-[var(--accent-gold)] shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.6)]' :
                                card.rarity === 'Epic' ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]' :
                                card.rarity === 'Rare' ? 'border-[var(--accent-smackdown)] group-hover:shadow-[0_0_20px_rgba(0,91,187,0.5)]' :
                                'border-zinc-600 group-hover:border-zinc-400'
                            }`}>
                                <div className="absolute bottom-4 left-0 right-0 text-center">
                                    <p className="font-[var(--font-display)] text-xl uppercase tracking-wider drop-shadow-lg text-white">{card.name}</p>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                                    <div className="rounded-full bg-[var(--accent-raw)]/90 px-6 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white">
                                        Fight!
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
            </div>

            {isBattling && selectedCardData && opponentCardData && (
                <BattleArena
                    userCard={selectedCardData}
                    opponentCard={opponentCardData}
                    onBattleComplete={handleBattleComplete}
                    onBack={() => {
                        setIsBattling(false);
                        setSelectedCard(null);
                        setOpponentCard(null);
                    }}
                />
            )}
        </main>
    );
}
