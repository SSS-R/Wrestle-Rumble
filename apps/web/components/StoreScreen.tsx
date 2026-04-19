'use client';

import { useState } from 'react';
import { TopNavigation } from './TopNavigation';
import { MOCK_CARDS, MOCK_PACKS, MOCK_USER } from '../lib/mockData';

export function StoreScreen() {
    const [view, setView] = useState<'packs' | 'cards'>('packs');

    return (
        <main className="page-shell min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-6 pt-4 lg:px-6">
                <TopNavigation />

                <div className="mb-4 text-right">
                    <span className="rounded-full border border-[rgba(212,175,55,0.3)] bg-black/40 px-5 py-2 text-sm font-bold text-[var(--accent-gold)] shadow-[0_0_12px_rgba(212,175,55,0.15)]">
                        YOUR COINS: 🪙 {MOCK_USER.coins.toLocaleString()}
                    </span>
                </div>

                {/* Hero Featured Pack */}
                <section className="metal-panel chrome-border relative mb-8 overflow-hidden rounded-[32px] p-8 md:p-12">
                    <div className="absolute inset-x-0 bottom-0 top-0 bg-[radial-gradient(ellipse_at_top,rgba(0,91,187,0.15),transparent_70%)]" />
                    <div className="relative flex flex-col items-center justify-between gap-8 md:flex-row">
                        <div className="w-full md:w-1/2">
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent-smackdown)]">
                                ✦ Featured Package ✦
                            </p>
                            <h2 className="font-[var(--font-display)] text-5xl uppercase md:text-6xl">
                                Legends Pack
                            </h2>
                            <p className="mt-4 max-w-md text-lg text-zinc-300">
                                5 cards. 1 Guaranteed Legendary. <br />
                                Pull iconic Hall of Famers today.
                            </p>
                            <div className="mt-8 flex items-center gap-6">
                                <button className="glow-pulse rounded-2xl bg-gradient-to-r from-[var(--accent-gold)] to-amber-600 px-8 py-4 text-lg font-bold uppercase tracking-[0.15em] text-white shadow-[0_0_20px_rgba(212,175,55,0.4)] transition hover:scale-105">
                                    BUY NOW
                                </button>
                                <span className="text-xl font-bold text-[var(--accent-gold)]">🪙 1,000</span>
                            </div>
                        </div>
                        <div className="relative flex w-full justify-center md:w-1/2">
                            <div className="relative h-64 w-48 rounded-xl border-4 border-amber-500/50 bg-gradient-to-br from-purple-800 to-zinc-900 shadow-[0_0_40px_rgba(168,85,247,0.4)] animate-pulse">
                                <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PC9yZWN0Pgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMSI+PC9wYXRoPjwvc3ZnPg==')"}} />
                                <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                                    <span className="text-4xl text-amber-400">✦</span>
                                    <p className="mt-2 font-[var(--font-display)] text-2xl uppercase shadow-black drop-shadow-md text-white">
                                        LEGENDS
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* View Toggles */}
                <div className="mb-6 flex border-b border-zinc-800">
                    <button
                        onClick={() => setView('packs')}
                        className={`px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] transition ${view === 'packs' ? 'border-b-2 border-[var(--accent-raw)] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Packs Shop
                    </button>
                    <button
                        onClick={() => setView('cards')}
                        className={`px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] transition ${view === 'cards' ? 'border-b-2 border-[var(--accent-raw)] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Single Cards Market
                    </button>
                </div>

                {/* Content Grid */}
                {view === 'packs' ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {MOCK_PACKS.map(pack => (
                            <div key={pack.id} className="group metal-panel chrome-border relative flex flex-col justify-between overflow-hidden rounded-[24px] p-6 transition hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                                <div className={`absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br ${pack.accent} opacity-20 blur-3xl transition group-hover:opacity-40`} />
                                <div>
                                    <h3 className="font-[var(--font-heading)] text-3xl uppercase text-white">{pack.name}</h3>
                                    <p className="mt-2 text-sm text-zinc-400">{pack.description}</p>
                                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--accent-smackdown)]">
                                        Rare chance: {pack.rareChance}
                                    </p>
                                </div>
                                <div className="mt-8 flex items-center justify-between">
                                    <span className="text-lg font-bold text-[var(--accent-gold)]">🪙 {pack.price}</span>
                                    <button className="chrome-border rounded-xl bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white transition hover:bg-white/20">
                                        BUY
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
                        {MOCK_CARDS.map(card => (
                            <div key={card.id} className="chrome-border relative overflow-hidden rounded-2xl bg-zinc-900/60 p-4 transition hover:bg-zinc-800">
                                {card.rarity === 'Legendary' && <div className="absolute inset-x-0 top-0 h-1 bg-[var(--accent-gold)]" />}
                                {card.rarity === 'Epic' && <div className="absolute inset-x-0 top-0 h-1 bg-purple-500" />}
                                {card.rarity === 'Rare' && <div className="absolute inset-x-0 top-0 h-1 bg-[var(--accent-smackdown)]" />}
                                
                                <div className="flex items-start justify-between">
                                    <h4 className="font-bold text-white">{card.name}</h4>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                        card.rarity === 'Legendary' ? 'bg-[var(--accent-gold)]/20 text-[var(--accent-gold)]' :
                                        card.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-400' :
                                        card.rarity === 'Rare' ? 'bg-[var(--accent-smackdown)]/20 text-[var(--accent-smackdown)]' :
                                        'bg-zinc-500/20 text-zinc-400'
                                    }`}>
                                        {card.rarity}
                                    </span>
                                </div>
                                <div className="mt-4 flex gap-3 text-xs">
                                    <div>
                                        <p className="text-zinc-500">ATK</p>
                                        <p className="font-bold text-red-400">{card.atk}</p>
                                    </div>
                                    <div>
                                        <p className="text-zinc-500">DEF</p>
                                        <p className="font-bold text-blue-400">{card.def}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
                                    <span className="font-bold text-[var(--accent-gold)]">🪙 {card.price}</span>
                                    <button className="rounded bg-[var(--accent-raw)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-red-500">
                                        BUY
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
