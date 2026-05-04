'use client';

import { useEffect, useState } from 'react';
import { TopNavigation } from './TopNavigation';

interface RosterCard {
    id: number;
    name: string;
    att: number;
    def_: number;
    finisher: string | null;
    signature: string | null;
    image: string | null;
    rarity: string;
    type: string;
    price: number;
    quantity: number;
    is_active: boolean;
}

const rarityBorder: Record<string, string> = {
    Legendary: 'border-[var(--accent-gold)] shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.6)]',
    Gold: 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]',
    Rare: 'border-[var(--accent-smackdown)] group-hover:shadow-[0_0_20px_rgba(0,91,187,0.5)]',
    Common: 'border-zinc-600 group-hover:border-zinc-400',
};

const rarityBadge: Record<string, string> = {
    Legendary: 'bg-[var(--accent-gold)]/20 text-[var(--accent-gold)]',
    Gold: 'bg-purple-500/20 text-purple-400',
    Rare: 'bg-[var(--accent-smackdown)]/20 text-[var(--accent-smackdown)]',
    Common: 'bg-zinc-500/20 text-zinc-300',
};

export function RosterScreen() {
    const [cards, setCards] = useState<RosterCard[]>([]);
    const [filtered, setFiltered] = useState<RosterCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState<RosterCard | null>(null);
    const [search, setSearch] = useState('');
    const [rarityFilter, setRarityFilter] = useState('All Rarities');

    useEffect(() => {
        const stored = localStorage.getItem('wr_user');
        if (!stored) return;
        const data = JSON.parse(stored);
        const playerId = data.user?.id;
        if (!playerId) return;

        fetch(`http://localhost:8000/api/player/${playerId}/inventory`)
            .then(res => res.ok ? res.json() : { cards: [] })
            .then(json => {
                setCards(json.cards || []);
                setFiltered(json.cards || []);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let result = [...cards];
        if (search.trim()) {
            result = result.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
        }
        if (rarityFilter !== 'All Rarities') {
            result = result.filter(c => c.rarity === rarityFilter);
        }
        setFiltered(result);
    }, [search, rarityFilter, cards]);

    return (
        <main className="page-shell min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative">
            <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-6 pt-4 lg:px-6">
                <TopNavigation />

                <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="font-[var(--font-heading)] text-4xl uppercase text-white">My Roster</h2>
                        <p className="mt-1 text-sm text-[var(--text-secondary)] uppercase tracking-[0.2em]">
                            {loading ? 'Loading...' : `${filtered.length} Card${filtered.length !== 1 ? 's' : ''} Collected`}
                        </p>
                    </div>
                    <div className="mt-4 flex gap-3 md:mt-0">
                        <input
                            type="text"
                            placeholder="Search cards..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="chrome-border rounded-xl bg-black/40 px-4 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[var(--accent-raw)] text-white"
                        />
                        <select
                            value={rarityFilter}
                            onChange={e => setRarityFilter(e.target.value)}
                            className="chrome-border rounded-xl bg-black/40 px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                        >
                            <option>All Rarities</option>
                            <option>Legendary</option>
                            <option>Gold</option>
                            <option>Rare</option>
                            <option>Common</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-1 items-center justify-center text-[var(--text-secondary)] uppercase tracking-widest font-bold">
                        Loading Roster...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center border-2 border-dashed border-white/10 rounded-2xl bg-black/20">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold uppercase text-white mb-2">
                            {search || rarityFilter !== 'All Rarities' ? 'No Cards Match' : 'No Cards Yet'}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] max-w-sm">
                            {search || rarityFilter !== 'All Rarities'
                                ? 'Try adjusting your search or filter.'
                                : 'Your roster is empty. Visit the store to open your first pack!'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {filtered.map(card => (
                            <button
                                key={card.id}
                                onClick={() => setSelectedCard(card)}
                                className="group relative flex flex-col text-left transition hover:-translate-y-2 focus:outline-none"
                            >
                                <div className={`relative aspect-[2/3] w-full overflow-hidden rounded-xl border-2 bg-gradient-to-br from-zinc-800 to-black ${rarityBorder[card.rarity] || rarityBorder.Common}`}>
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-10" />
                                    {card.image ? (
                                        <img src={card.image} alt={card.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                            <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                                    <div className="absolute bottom-4 left-0 right-0 text-center flex flex-col items-center">
                                        <span className="mb-1 rounded bg-black/60 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[var(--accent-gold)]">
                                            {card.type}
                                        </span>
                                        <p className="font-[var(--font-display)] text-xl uppercase tracking-wider drop-shadow-lg text-white">{card.name}</p>
                                    </div>
                                    {card.quantity > 1 && (
                                        <span className="absolute right-2 top-2 rounded bg-black/80 px-2 py-0.5 text-xs font-bold text-white border border-white/20">
                                            x{card.quantity}
                                        </span>
                                    )}
                                    {card.is_active && (
                                        <span className="absolute left-2 top-2 rounded bg-emerald-500/80 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                                            Active
                                        </span>
                                    )}
                                </div>
                                <div className="mt-3 flex justify-between px-1">
                                    <div className="flex gap-2 text-xs">
                                        <span className="font-bold text-red-500">ATK {card.att}</span>
                                        <span className="font-bold text-blue-500">DEF {card.def_}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Card Detail Modal */}
            {selectedCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
                    <div className="metal-panel chrome-border relative w-full max-w-4xl overflow-hidden rounded-[32px] p-6 shadow-2xl">
                        <button onClick={() => setSelectedCard(null)} className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                            ✕
                        </button>
                        <div className="flex flex-col gap-8 md:flex-row">
                            <div className={`relative aspect-[2/3] w-full md:w-1/2 flex-shrink-0 rounded-2xl border-4 ${rarityBorder[selectedCard.rarity] || 'border-zinc-500'} bg-zinc-900 overflow-hidden`}>
                                {selectedCard.image ? (
                                    <img src={selectedCard.image} alt={selectedCard.name} className="absolute inset-0 w-full h-full object-cover" />
                                ) : null}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end p-8">
                                    <h3 className="font-[var(--font-display)] text-5xl uppercase drop-shadow-2xl text-white">{selectedCard.name}</h3>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className={`w-max rounded px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${rarityBadge[selectedCard.rarity] || rarityBadge.Common}`}>
                                    {selectedCard.rarity} Rarity
                                </span>
                                <p className="mt-2 text-xs uppercase tracking-widest text-[var(--text-secondary)]">{selectedCard.type}</p>
                                <div className="mt-8 grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Attack</p>
                                        <div className="h-3 w-full max-w-[200px] overflow-hidden rounded-full bg-black">
                                            <div className="h-full bg-red-500" style={{ width: `${selectedCard.att}%` }} />
                                        </div>
                                        <p className="font-bold text-red-500">{selectedCard.att}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Defense</p>
                                        <div className="h-3 w-full max-w-[200px] overflow-hidden rounded-full bg-black">
                                            <div className="h-full bg-[var(--accent-smackdown)]" style={{ width: `${selectedCard.def_}%` }} />
                                        </div>
                                        <p className="font-bold text-[var(--accent-smackdown)]">{selectedCard.def_}</p>
                                    </div>
                                </div>
                                <div className="mt-8 space-y-4 rounded-xl border border-white/10 bg-black/40 p-5">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--text-secondary)]">Signature Move</p>
                                        <p className="font-[var(--font-heading)] text-xl text-white">{selectedCard.signature || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--text-secondary)]">Finisher</p>
                                        <p className="font-[var(--font-heading)] text-xl text-white">{selectedCard.finisher || '—'}</p>
                                    </div>
                                </div>
                                <div className="mt-8 flex gap-4 text-xs text-[var(--text-secondary)] uppercase tracking-widest">
                                    <span>Qty: {selectedCard.quantity}</span>
                                    <span>•</span>
                                    <span>Price: {selectedCard.price.toLocaleString()} coins</span>
                                </div>
                                <div className="mt-6 flex gap-4">
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
