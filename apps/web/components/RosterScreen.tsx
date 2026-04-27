'use client';

import { useState } from 'react';
import { TopNavigation } from './TopNavigation';
import { MOCK_CARDS, Card } from '../lib/mockData';

export function RosterScreen() {
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const ownedCards = MOCK_CARDS.filter(c => (c.owned && c.owned > 0));

    return (
        <main className="page-shell min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative">
            <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-6 pt-4 lg:px-6">
                <TopNavigation />

                <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="font-[var(--font-heading)] text-4xl uppercase text-white">My Roster</h2>
                        <p className="mt-1 text-sm text-[var(--text-secondary)] uppercase tracking-[0.2em]">{ownedCards.length} Cards Collected</p>
                    </div>
                    <div className="mt-4 flex gap-3 md:mt-0">
                        <input type="text" placeholder="Search roster..." className="chrome-border rounded-xl bg-black/40 px-4 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[var(--accent-raw)] text-white" />
                        <select className="chrome-border rounded-xl bg-black/40 px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none">
                            <option>All Rarities</option>
                            <option>Legendary</option>
                            <option>Gold</option>
                            <option>Rare</option>
                            <option>Common</option>
                        </select>
                    </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {ownedCards.map(card => (
                        <button
                            key={card.id}
                            onClick={() => setSelectedCard(card)}
                            className="group relative flex flex-col text-left transition hover:-translate-y-2 focus:outline-none"
                        >
                            <div className={`relative aspect-[2/3] w-full overflow-hidden rounded-xl border-2 bg-gradient-to-br from-zinc-800 to-black ${
                                card.rarity === 'Legendary' ? 'border-[var(--accent-gold)] shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.6)]' :
                                card.rarity === 'Gold' ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]' :
                                card.rarity === 'Rare' ? 'border-[var(--accent-smackdown)] group-hover:shadow-[0_0_20px_rgba(0,91,187,0.5)]' :
                                'border-zinc-600 group-hover:border-zinc-400'
                            }`}>
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-10" />
                                {/* Placeholder logic: if image is present we'd render <img />, otherwise use this gradient placeholder */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                    <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div className="absolute bottom-4 left-0 right-0 text-center flex flex-col items-center">
                                    <span className="mb-1 rounded bg-black/60 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[var(--accent-gold)]">
                                        {card.type}
                                    </span>
                                    <p className="font-[var(--font-display)] text-xl uppercase tracking-wider drop-shadow-lg text-white">{card.name}</p>
                                </div>
                                {card.owned! > 1 && (
                                    <span className="absolute right-2 top-2 rounded bg-black/80 px-2 py-0.5 text-xs font-bold text-white border border-white/20">
                                        x{card.owned}
                                    </span>
                                )}
                            </div>
                            <div className="mt-3 flex justify-between px-1">
                                <div className="flex gap-2 text-xs">
                                    <span className="font-bold text-red-500">ATK {card.atk}</span>
                                    <span className="font-bold text-blue-500">DEF {card.def}</span>
                                </div>
                                <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider flex items-center">
                                    {card.rarity === 'Legendary' ? '★★★★★' : card.rarity === 'Gold' ? '★★★★' : card.rarity === 'Rare' ? '★★★' : '★'}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Card Detail Modal */}
            {selectedCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
                    <div className="metal-panel chrome-border relative w-full max-w-4xl overflow-hidden rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <button onClick={() => setSelectedCard(null)} className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                            ✕
                        </button>
                        <div className="flex flex-col gap-8 md:flex-row">
                            <div className={`relative aspect-[2/3] w-full md:w-1/2 flex-shrink-0 rounded-2xl border-4 ${
                                selectedCard.rarity === 'Legendary' ? 'border-[var(--accent-gold)]' :
                                selectedCard.rarity === 'Gold' ? 'border-purple-500' :
                                selectedCard.rarity === 'Rare' ? 'border-[var(--accent-smackdown)]' :
                                'border-zinc-500'
                            } bg-zinc-900`}>
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end p-8">
                                    <h3 className="font-[var(--font-display)] text-5xl uppercase drop-shadow-2xl text-white">{selectedCard.name}</h3>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className={`w-max rounded px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${
                                    selectedCard.rarity === 'Legendary' ? 'bg-[var(--accent-gold)]/20 text-[var(--accent-gold)]' :
                                    selectedCard.rarity === 'Gold' ? 'bg-purple-500/20 text-purple-400' :
                                    selectedCard.rarity === 'Rare' ? 'bg-[var(--accent-smackdown)]/20 text-[var(--accent-smackdown)]' :
                                    'bg-zinc-500/20 text-zinc-300'
                                }`}>{selectedCard.rarity} Rarity</span>
                                <div className="mt-8 grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Attack</p>
                                        <div className="h-3 w-full max-w-[200px] overflow-hidden rounded-full bg-black">
                                            <div className="h-full bg-red-500" style={{ width: `${selectedCard.atk}%` }} />
                                        </div>
                                        <p className="font-bold text-red-500">{selectedCard.atk}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Defense</p>
                                        <div className="h-3 w-full max-w-[200px] overflow-hidden rounded-full bg-black">
                                            <div className="h-full bg-[var(--accent-smackdown)]" style={{ width: `${selectedCard.def}%` }} />
                                        </div>
                                        <p className="font-bold text-[var(--accent-smackdown)]">{selectedCard.def}</p>
                                    </div>
                                </div>
                                <div className="mt-8 space-y-4 rounded-xl border border-white/10 bg-black/40 p-5">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--text-secondary)]">Signature Move</p>
                                        <p className="font-[var(--font-heading)] text-xl text-white">{selectedCard.signature}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--text-secondary)]">Finisher</p>
                                        <p className="font-[var(--font-heading)] text-xl text-white">{selectedCard.finisher}</p>
                                    </div>
                                </div>
                                <div className="mt-10 flex gap-4">
                                    <button className="flex-1 rounded-xl bg-[var(--accent-raw)] py-4 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-red-600">
                                        SET AS ACTIVE
                                    </button>
                                    <button className="rounded-xl border border-[var(--accent-gold)] bg-black/30 px-6 py-4 text-sm font-bold uppercase tracking-[0.1em] text-[var(--accent-gold)] transition hover:bg-amber-900/40">
                                        SELL
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
