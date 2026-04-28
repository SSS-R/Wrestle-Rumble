'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopNavigation } from './TopNavigation';

const actionCards = [
    {
        title: 'Quick Match',
        text: 'Find an opponent and step into the ring.',
        accent: 'from-red-600/30 to-red-950/60',
        cta: 'Start Queue',
        href: '/battle',
    },
    {
        title: 'Daily Pack',
        text: "Open your free pack and reveal tonight's pulls.",
        accent: 'from-amber-400/25 to-zinc-900/80',
        cta: 'Claim Pack',
        href: '/store',
    },
    {
        title: 'Leaderboard',
        text: 'Track the top champions and trophy counts.',
        accent: 'from-blue-500/25 to-zinc-950/80',
        cta: 'View Rankings',
        href: '/leaderboard',
    },
];

const friends = [
    { name: 'AJ_StylesFan', status: 'Online', color: 'bg-emerald-400' },
    { name: 'TribalChief01', status: 'In Match', color: 'bg-amber-400' },
    { name: 'IyoSkyHigh', status: 'Online', color: 'bg-emerald-400' },
    { name: 'LegendKane', status: 'Offline', color: 'bg-zinc-500' },
];

interface LobbyStats {
    username: string;
    trophy: number;
    coins: number;
    total_matches: number;
    total_wins: number;
    recent_matches: {
        match_id: number;
        result: string;
        opponent_name: string;
        user_score: number;
        opponent_score: number;
        date_label: string;
    }[];
}

export function LobbyScreen() {
    const router = useRouter();
    const [lobbyStats, setLobbyStats] = useState<LobbyStats | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('wr_user');
        if (!stored) return;
        const data = JSON.parse(stored);
        const playerId = data.user?.id;
        if (!playerId) return;

        fetch(`http://localhost:8000/api/player/${playerId}/lobby`)
            .then(res => res.ok ? res.json() : null)
            .then(json => { if (json) setLobbyStats(json); })
            .catch(() => {});
    }, []);

    const wins = lobbyStats?.total_wins ?? 0;
    const total = lobbyStats?.total_matches ?? 0;
    const losses = total - wins;

    return (
        <main className="page-shell min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-6 pt-4 lg:px-6">
                <TopNavigation />

                <section className="grid flex-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)_280px]">
                    {/* ── Player Card ── */}
                    <aside className="metal-panel chrome-border slide-in-panel relative overflow-hidden rounded-[28px] p-5">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--accent-raw)] via-[var(--accent-gold)] to-[var(--accent-smackdown)]" />
                        <div className="mx-auto mt-4 h-28 w-28 rounded-full border-4 border-[rgba(192,192,200,0.35)] bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-raw)] shadow-[0_0_24px_rgba(212,175,55,0.15)] flex items-center justify-center text-3xl font-bold text-white">
                            {lobbyStats ? lobbyStats.username.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="mt-5 text-center">
                            <p className="font-[var(--font-heading)] text-2xl uppercase">
                                {lobbyStats?.username ?? 'Player Card'}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)]">Heavyweight Division</p>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3 text-center">
                            {[
                                ['Rank', total > 0 ? `#${Math.max(1, 100 - wins * 5)}` : '—'],
                                ['W / L', total > 0 ? `${wins}/${losses}` : '0/0'],
                                ['Coins', lobbyStats ? lobbyStats.coins.toLocaleString() : '—'],
                                ['Trophies', lobbyStats ? String(lobbyStats.trophy) : '—'],
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-2xl border border-white/8 bg-black/20 px-3 py-4">
                                    <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                                        {label}
                                    </p>
                                    <p className="mt-2 text-xl font-bold text-white">{value}</p>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => router.push('/battle')}
                            className="glow-pulse mt-6 w-full rounded-2xl bg-[var(--accent-raw)] px-5 py-4 text-sm font-bold uppercase tracking-[0.28em] text-white transition hover:scale-[1.01]"
                        >
                            ▶ Quick Match
                        </button>
                    </aside>

                    {/* ── Main Column ── */}
                    <section className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            {actionCards.map((card) => (
                                <article
                                    key={card.title}
                                    className={`metal-panel chrome-border sheen slide-in-panel relative overflow-hidden rounded-[26px] bg-gradient-to-br ${card.accent} p-5`}
                                >
                                    <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--text-secondary)]">
                                        Main Action
                                    </p>
                                    <h2 className="mt-4 font-[var(--font-heading)] text-3xl uppercase text-white">
                                        {card.title}
                                    </h2>
                                    <p className="mt-3 max-w-xs text-sm leading-7 text-zinc-300">{card.text}</p>
                                    <Link
                                        href={card.href}
                                        className="mt-8 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white inline-block"
                                    >
                                        {card.cta}
                                    </Link>
                                </article>
                            ))}
                        </div>

                        <article className="metal-panel chrome-border slide-in-panel relative overflow-hidden rounded-[30px] px-6 py-7">
                            <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.18),transparent_60%)]" />
                            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent-gold)]">Featured Event</p>
                            <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <h2 className="font-[var(--font-display)] text-4xl uppercase md:text-5xl">
                                        WrestleMania Season Clash
                                    </h2>
                                    <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
                                        Queue for weekend arena battles, collect premium packs, and chase legendary drops with a Raw-vs-SmackDown stage presentation.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-[rgba(212,175,55,0.25)] bg-black/25 px-5 py-4 text-sm text-zinc-200">
                                    <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">Season Bonus</p>
                                    <p className="mt-2 text-2xl font-bold text-[var(--accent-gold)]">+25% coin rewards</p>
                                </div>
                            </div>
                        </article>

                        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                            {/* Recent Matches */}
                            <article className="metal-panel chrome-border slide-in-panel rounded-[28px] p-5">
                                <div className="mb-5 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">Match History</p>
                                        <h3 className="font-[var(--font-heading)] text-2xl uppercase">Recent Matches</h3>
                                    </div>
                                    <Link href="/battle" className="text-xs uppercase tracking-[0.24em] text-[var(--accent-smackdown)]">
                                        View All
                                    </Link>
                                </div>

                                {lobbyStats && lobbyStats.recent_matches.length > 0 ? (
                                    <div className="grid gap-3 md:grid-cols-3">
                                        {lobbyStats.recent_matches.map((match, index) => (
                                            <article
                                                key={match.match_id}
                                                className="rounded-2xl border border-white/8 bg-black/25 p-4"
                                                style={{ animationDelay: `${index * 100}ms` }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] ${
                                                        match.result === 'W'
                                                            ? 'bg-emerald-500/15 text-emerald-300'
                                                            : 'bg-red-500/15 text-red-300'
                                                    }`}>
                                                        {match.result}
                                                    </span>
                                                    <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                                                        {match.date_label}
                                                    </span>
                                                </div>
                                                <p className="mt-4 text-lg font-semibold text-white">vs {match.opponent_name}</p>
                                                <p className="mt-2 text-sm text-zinc-300">
                                                    Score {match.user_score} – {match.opponent_score}
                                                </p>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-white/10 rounded-2xl bg-black/20">
                                        <p className="text-sm text-[var(--text-secondary)]">No matches played yet.</p>
                                        <Link href="/battle" className="mt-4 text-xs font-bold uppercase tracking-wider text-[var(--accent-raw)] hover:underline">
                                            Start Your First Match
                                        </Link>
                                    </div>
                                )}
                            </article>

                            {/* Leaderboard (unchanged, still mock) */}
                            <article className="metal-panel chrome-border slide-in-panel rounded-[28px] p-5">
                                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">Live Rankings</p>
                                <h3 className="mt-2 font-[var(--font-heading)] text-2xl uppercase">Leaderboard</h3>

                                <div className="mt-5 space-y-3">
                                    {[
                                        ['1', 'BeltCollector', '542'],
                                        ['2', 'RafiTheChampion', '318'],
                                        ['3', 'RumbleQueen', '301'],
                                    ].map(([position, name, score]) => (
                                        <div key={name} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/25 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 font-bold text-[var(--accent-gold)]">
                                                    {position}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white">{name}</p>
                                                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Trophy Count</p>
                                                </div>
                                            </div>
                                            <span className="text-lg font-bold text-[var(--accent-gold)]">{score}</span>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        </section>
                    </section>

                    {/* ── Right Sidebar (Backstage — unchanged) ── */}
                    <aside className="metal-panel chrome-border slide-in-panel rounded-[28px] p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">Chat & Activity</p>
                                <h3 className="font-[var(--font-heading)] text-2xl uppercase">Backstage</h3>
                            </div>
                            <button type="button" className="text-xs uppercase tracking-[0.22em] text-[var(--accent-smackdown)]">Open</button>
                        </div>

                        <div className="mt-5 space-y-3">
                            {friends.map((friend) => (
                                <div key={friend.name} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/25 px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`h-3 w-3 rounded-full ${friend.color}`} />
                                        <div>
                                            <p className="font-medium text-white">{friend.name}</p>
                                            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">{friend.status}</p>
                                        </div>
                                    </div>
                                    <button type="button" className="text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)]">Chat</button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 rounded-[24px] border border-white/8 bg-black/30 p-4">
                            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">Global Feed</p>
                            <div className="mt-4 space-y-4 text-sm leading-6 text-zinc-300">
                                <p><span className="font-semibold text-white">ArenaBot</span> — Daily pack reset is live. Claim before the next bell rings.</p>
                                <p><span className="font-semibold text-white">Trade Alert</span> — AJ_StylesFan wants to swap a Rare striker for 120 coins.</p>
                            </div>
                        </div>
                    </aside>
                </section>

                <footer className="metal-panel chrome-border mt-4 flex flex-col gap-2 rounded-2xl px-5 py-4 text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)] md:flex-row md:items-center md:justify-between">
                    <span>Online Players: 1,234</span>
                    <span>Server: OK</span>
                    <span>Daily Pack resets in 14h 32m</span>
                </footer>
            </div>
        </main>
    );
}
