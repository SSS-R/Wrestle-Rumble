'use client';

import { useState, useEffect } from 'react';
import { TopNavigation } from './TopNavigation';
import { fetchApi } from '../lib/api';

type LeaderboardEntry = {
    rank: number;
    player_id: number;
    name: string;
    trophy: number;
    wins: number;
    losses: number;
};

export function LeaderboardScreen() {
    const [filter, setFilter] = useState<'global' | 'friends'>('global');
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [playerId, setPlayerId] = useState<number | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('wr_user');
        if (stored) {
            const data = JSON.parse(stored);
            const id = data.user?.id || data.player?.id;
            if (id) setPlayerId(id);
        }
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        setLoading(true);
        try {
            const data = await fetchApi(`/combat/leaderboard?limit=10&filter=${filter}`);
            setLeaderboardData(data);
        } catch (err) {
            console.error('Failed to load leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeaderboard();
    }, [filter]);

    const getRankStyle = (rank: number) => {
        if (rank === 1) return 'bg-gradient-to-r from-[var(--accent-gold)] to-amber-600 text-white';
        if (rank === 2) return 'bg-gradient-to-r from-zinc-300 to-zinc-500 text-white';
        if (rank === 3) return 'bg-gradient-to-r from-amber-700 to-amber-900 text-white';
        return 'bg-white/5 text-white';
    };

    return (
        <main className="page-shell min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-6 pt-4 lg:px-6">
                <TopNavigation />

                <div className="mb-8 text-center">
                    <h2 className="font-[var(--font-display)] text-5xl uppercase tracking-[0.15em] text-white">
                        🏆 Leaderboard
                    </h2>
                    <p className="mt-2 text-sm uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                        Top Champions of the Arena
                    </p>
                </div>

                <div className="mb-6 flex justify-center gap-3">
                    {(['global', 'friends'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`rounded-full px-6 py-2 text-xs font-bold uppercase tracking-[0.15em] transition ${
                                filter === f
                                    ? 'bg-[var(--accent-raw)] text-white'
                                    : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'
                            }`}
                        >
                            {f === 'global' ? '🌍 Global' : '👥 Friends Only'}
                        </button>
                    ))}
                </div>

                <div className="mx-auto w-full max-w-4xl">
                    <div className="metal-panel chrome-border overflow-hidden rounded-[24px]">
                        <div className="grid grid-cols-12 gap-4 border-b border-white/10 bg-black/40 px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                            <div className="col-span-2 text-center">Rank</div>
                            <div className="col-span-4">Wrestler</div>
                            <div className="col-span-2 text-center">Trophies</div>
                            <div className="col-span-2 text-center">W</div>
                            <div className="col-span-2 text-center">L</div>
                        </div>

                        {loading ? (
                            <div className="py-12 text-center text-[var(--text-secondary)]">Loading leaderboard...</div>
                        ) : (
                            leaderboardData.map((entry, index) => (
                                <div
                                    key={entry.player_id}
                                    className={`grid grid-cols-12 gap-4 border-b border-white/5 px-6 py-4 transition hover:bg-white/5 ${
                                        entry.player_id === playerId ? 'bg-[var(--accent-gold)]/10' : ''
                                    }`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="col-span-2 flex items-center justify-center">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${getRankStyle(entry.rank)}`}>
                                            {entry.rank}
                                        </div>
                                    </div>
                                    <div className="col-span-4 flex items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${
                                                entry.rank <= 3 
                                                    ? 'from-[var(--accent-gold)] to-amber-700' 
                                                    : 'from-zinc-600 to-zinc-800'
                                            }`} />
                                            <div>
                                                <p className="font-bold text-white">{entry.name}</p>
                                                {entry.player_id === playerId && (
                                                    <p className="text-[10px] uppercase text-[var(--accent-gold)]">You</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 flex items-center justify-center">
                                        <span className="text-lg font-bold text-[var(--accent-gold)]">{entry.trophy}</span>
                                    </div>
                                    <div className="col-span-2 flex items-center justify-center">
                                        <span className="rounded bg-[var(--success)]/20 px-3 py-1 text-sm font-bold text-[var(--success)]">
                                            {entry.wins}
                                        </span>
                                    </div>
                                    <div className="col-span-2 flex items-center justify-center">
                                        <span className="rounded bg-[var(--accent-raw)]/20 px-3 py-1 text-sm font-bold text-[var(--accent-raw)]">
                                            {entry.losses}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {playerId && (
                            <>
                                <div className="metal-panel chrome-border rounded-2xl p-6 text-center">
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Your Rank</p>
                                    <p className="mt-2 text-4xl font-bold text-[var(--accent-gold)]">
                                        #{leaderboardData.find(e => e.player_id === playerId)?.rank || '—'}
                                    </p>
                                </div>
                                <div className="metal-panel chrome-border rounded-2xl p-6 text-center">
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Total Battles</p>
                                    <p className="mt-2 text-4xl font-bold text-white">
                                        {(leaderboardData.find(e => e.player_id === playerId)?.wins || 0) + (leaderboardData.find(e => e.player_id === playerId)?.losses || 0)}
                                    </p>
                                </div>
                                <div className="metal-panel chrome-border rounded-2xl p-6 text-center">
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Win Rate</p>
                                    <p className="mt-2 text-4xl font-bold text-[var(--success)]">
                                        {(() => {
                                            const entry = leaderboardData.find(e => e.player_id === playerId);
                                            if (!entry || (entry.wins + entry.losses) === 0) return '—';
                                            return Math.round((entry.wins / (entry.wins + entry.losses)) * 100) + '%';
                                        })()}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
