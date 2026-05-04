'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopNavigation } from './TopNavigation';

const friends = [
    { name: 'AJ_StylesFan', status: 'Online', color: 'bg-emerald-400' },
    { name: 'TribalChief01', status: 'In Match', color: 'bg-amber-400' },
    { name: 'IyoSkyHigh', status: 'Online', color: 'bg-emerald-400' },
    { name: 'LegendKane', status: 'Offline', color: 'bg-zinc-500' },
];

const rarityColor: Record<string, string> = {
    Legendary: 'border-[var(--accent-gold)] text-[var(--accent-gold)]',
    Gold: 'border-purple-400 text-purple-400',
    Rare: 'border-blue-400 text-blue-400',
    Special: 'border-pink-400 text-pink-400',
    Common: 'border-zinc-500 text-zinc-400',
};

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

interface FeaturedEvent {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    entry_trophy: number;
}

interface LeaderboardEntry {
    rank: number;
    player_id: number;
    name: string;
    trophy: number;
}

interface DailyPackCard {
    id: number;
    name: string;
    rarity: string;
    att: number;
    def: number;
    image: string | null;
}

interface DailyPackResult {
    coins_gained: number;
    cards: DailyPackCard[];
}

export function LobbyScreen() {
    const router = useRouter();
    const [playerId, setPlayerId] = useState<number | null>(null);
    const [lobbyStats, setLobbyStats] = useState<LobbyStats | null>(null);
    const [featuredEvent, setFeaturedEvent] = useState<FeaturedEvent | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    // Daily pack state
    const [dailyAvailable, setDailyAvailable] = useState(false);
    const [dailyNextReset, setDailyNextReset] = useState<string | null>(null);
    const [dailyClaiming, setDailyClaiming] = useState(false);
    const [dailyResult, setDailyResult] = useState<DailyPackResult | null>(null);
    const [dailyModalOpen, setDailyModalOpen] = useState(false);
    const [countdown, setCountdown] = useState('');

    // ── Fetch lobby stats (live polling every 10s) ──────────────────────────
    const fetchLobby = useCallback(async (pid: number) => {
        try {
            const res = await fetch(`http://localhost:8000/api/player/${pid}/lobby`);
            if (res.ok) setLobbyStats(await res.json());
        } catch {}
    }, []);

    // ── Fetch daily pack status ─────────────────────────────────────────────
    const fetchDailyStatus = useCallback(async (pid: number) => {
        try {
            const res = await fetch(`http://localhost:8000/api/player/${pid}/daily-pack/status`);
            if (res.ok) {
                const data = await res.json();
                setDailyAvailable(data.available);
                setDailyNextReset(data.next_reset);
            }
        } catch {}
    }, []);

    // ── Fetch active events ─────────────────────────────────────────────────
    const fetchEvent = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:8000/api/admin/events');
            if (res.ok) {
                const events: FeaturedEvent[] = await res.json();
                const now = new Date();
                const active = events.find(e => new Date(e.start_time) <= now && new Date(e.end_time) >= now);
                setFeaturedEvent(active || events[0] || null);
            }
        } catch {}
    }, []);

    // ── Fetch leaderboard ───────────────────────────────────────────────────
    const fetchLeaderboard = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:8000/api/leaderboard?limit=3');
            if (res.ok) setLeaderboard(await res.json());
        } catch {}
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem('wr_user');
        if (!stored) return;
        const data = JSON.parse(stored);
        const pid = data.user?.id;
        if (!pid) return;
        setPlayerId(pid);

        fetchLobby(pid);
        fetchDailyStatus(pid);
        fetchEvent();
        fetchLeaderboard();

        // Live poll every 10 seconds
        const interval = setInterval(() => {
            fetchLobby(pid);
            fetchLeaderboard();
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchLobby, fetchDailyStatus, fetchEvent, fetchLeaderboard]);

    // ── Countdown timer for daily pack reset ───────────────────────────────
    useEffect(() => {
        if (!dailyNextReset) { setCountdown(''); return; }
        const tick = () => {
            const diff = new Date(dailyNextReset).getTime() - Date.now();
            if (diff <= 0) { setCountdown(''); setDailyAvailable(true); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setCountdown(`${h}h ${m}m ${s}s`);
        };
        tick();
        const t = setInterval(tick, 1000);
        return () => clearInterval(t);
    }, [dailyNextReset]);

    // ── Claim daily pack ────────────────────────────────────────────────────
    const claimDailyPack = async () => {
        if (!playerId || dailyClaiming) return;
        setDailyClaiming(true);
        try {
            const res = await fetch(`http://localhost:8000/api/player/${playerId}/daily-pack/claim`, { method: 'POST' });
            if (res.ok) {
                const data: DailyPackResult = await res.json();
                setDailyResult(data);
                setDailyAvailable(false);
                setDailyModalOpen(true);
                if (playerId) fetchDailyStatus(playerId);
                if (playerId) fetchLobby(playerId);
            } else {
                const err = await res.json();
                alert(err.detail || 'Failed to claim daily pack');
            }
        } catch { alert('Network error'); }
        finally { setDailyClaiming(false); }
    };

    const wins = lobbyStats?.total_wins ?? 0;
    const total = lobbyStats?.total_matches ?? 0;
    const losses = total - wins;

    return (
        <main className="page-shell min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-6 pt-4 lg:px-6">
                <TopNavigation />

                <section className="grid flex-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
                    {/* ── Player Card ── */}
                    <aside className="metal-panel chrome-border slide-in-panel relative overflow-hidden rounded-[28px] p-5">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--accent-raw)] via-[var(--accent-gold)] to-[var(--accent-smackdown)]" />
                        <div className="mx-auto mt-4 h-28 w-28 rounded-full border-4 border-[rgba(192,192,200,0.35)] bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-raw)] shadow-[0_0_24px_rgba(212,175,55,0.15)] flex items-center justify-center text-3xl font-bold text-white">
                            {lobbyStats ? lobbyStats.username.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="mt-5 text-center">
                            <p className="font-[var(--font-heading)] text-2xl uppercase">
                                {lobbyStats?.username ?? 'Loading...'}
                            </p>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3 text-center">
                            {[
                                ['W / L', total > 0 ? `${wins}/${losses}` : '0/0'],
                                ['Coins', lobbyStats ? lobbyStats.coins.toLocaleString() : '—'],
                                ['Trophies', lobbyStats ? String(lobbyStats.trophy) : '—'],
                                ['Matches', String(total)],
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-2xl border border-white/8 bg-black/20 px-3 py-4">
                                    <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">{label}</p>
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
                        {/* Action Cards */}
                        <div className="grid gap-4 md:grid-cols-3">
                            {/* Quick Match */}
                            <article className="metal-panel chrome-border sheen slide-in-panel relative overflow-hidden rounded-[26px] bg-gradient-to-br from-red-600/30 to-red-950/60 p-5">
                                <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--text-secondary)]">Main Action</p>
                                <h2 className="mt-4 font-[var(--font-heading)] text-3xl uppercase text-white">Quick Match</h2>
                                <p className="mt-3 max-w-xs text-sm leading-7 text-zinc-300">Find an opponent and step into the ring.</p>
                                <Link href="/battle" className="mt-8 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white inline-block">
                                    Start Queue
                                </Link>
                            </article>

                            {/* Daily Pack */}
                            <article className="metal-panel chrome-border sheen slide-in-panel relative overflow-hidden rounded-[26px] bg-gradient-to-br from-amber-400/25 to-zinc-900/80 p-5">
                                <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--text-secondary)]">Main Action</p>
                                <h2 className="mt-4 font-[var(--font-heading)] text-3xl uppercase text-white">Daily Pack</h2>
                                <p className="mt-3 max-w-xs text-sm leading-7 text-zinc-300">
                                    {dailyAvailable ? "Open your free Basic Pack and reveal tonight's pulls." : `Next pack in: ${countdown}`}
                                </p>
                                <button
                                    onClick={claimDailyPack}
                                    disabled={!dailyAvailable || dailyClaiming}
                                    className="mt-8 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white inline-block disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                                >
                                    {dailyClaiming ? 'Opening...' : dailyAvailable ? 'Claim Pack' : 'On Cooldown'}
                                </button>
                            </article>

                            {/* Leaderboard */}
                            <article className="metal-panel chrome-border sheen slide-in-panel relative overflow-hidden rounded-[26px] bg-gradient-to-br from-blue-500/25 to-zinc-950/80 p-5">
                                <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--text-secondary)]">Main Action</p>
                                <h2 className="mt-4 font-[var(--font-heading)] text-3xl uppercase text-white">Leaderboard</h2>
                                <p className="mt-3 max-w-xs text-sm leading-7 text-zinc-300">Track the top champions and trophy counts.</p>
                                <Link href="/leaderboard" className="mt-8 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white inline-block">
                                    View Rankings
                                </Link>
                            </article>
                        </div>

                        {/* Featured Event */}
                        <article className="metal-panel chrome-border slide-in-panel relative overflow-hidden rounded-[30px] px-6 py-7">
                            <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.18),transparent_60%)]" />
                            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent-gold)]">Featured Event</p>
                            {featuredEvent ? (
                                <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <h2 className="font-[var(--font-display)] text-4xl uppercase md:text-5xl">{featuredEvent.name}</h2>
                                        <p className="mt-3 text-sm leading-7 text-zinc-300">
                                            Entry Trophy: <span className="text-[var(--accent-gold)] font-bold">{featuredEvent.entry_trophy}</span> &nbsp;·&nbsp;
                                            Ends: <span className="text-white font-bold">{new Date(featuredEvent.end_time).toLocaleDateString()}</span>
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-[rgba(212,175,55,0.25)] bg-black/25 px-5 py-4 text-sm text-zinc-200 shrink-0">
                                        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">Special Cards Available</p>
                                        <p className="mt-2 text-2xl font-bold text-[var(--accent-gold)]">Event Pack</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4">
                                    <h2 className="font-[var(--font-display)] text-3xl uppercase text-zinc-500">No Active Event</h2>
                                    <p className="mt-2 text-sm text-zinc-500">Check back soon for upcoming events!</p>
                                </div>
                            )}
                        </article>

                        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                            {/* Recent Matches */}
                            <article className="metal-panel chrome-border slide-in-panel rounded-[28px] p-5">
                                <div className="mb-5 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">Match History</p>
                                        <h3 className="font-[var(--font-heading)] text-2xl uppercase">Recent Matches</h3>
                                    </div>
                                    <Link href="/battle" className="text-xs uppercase tracking-[0.24em] text-[var(--accent-smackdown)]">View All</Link>
                                </div>
                                {lobbyStats && lobbyStats.recent_matches.length > 0 ? (
                                    <div className="grid gap-3 md:grid-cols-3">
                                        {lobbyStats.recent_matches.map((match, index) => (
                                            <article key={match.match_id} className="rounded-2xl border border-white/8 bg-black/25 p-4" style={{ animationDelay: `${index * 100}ms` }}>
                                                <div className="flex items-center justify-between">
                                                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] ${match.result === 'W' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
                                                        {match.result}
                                                    </span>
                                                    <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">{match.date_label}</span>
                                                </div>
                                                <p className="mt-4 text-lg font-semibold text-white">vs {match.opponent_name}</p>
                                                <p className="mt-2 text-sm text-zinc-300">Score {match.user_score} – {match.opponent_score}</p>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-white/10 rounded-2xl bg-black/20">
                                        <p className="text-sm text-[var(--text-secondary)]">No matches played yet.</p>
                                        <Link href="/battle" className="mt-4 text-xs font-bold uppercase tracking-wider text-[var(--accent-raw)] hover:underline">Start Your First Match</Link>
                                    </div>
                                )}
                            </article>

                            {/* Live Leaderboard */}
                            <article className="metal-panel chrome-border slide-in-panel rounded-[28px] p-5">
                                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">Live Rankings</p>
                                <h3 className="mt-2 font-[var(--font-heading)] text-2xl uppercase">Leaderboard</h3>
                                <div className="mt-5 space-y-3">
                                    {leaderboard.length > 0 ? leaderboard.map((entry) => (
                                        <div key={entry.player_id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/25 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 font-bold text-[var(--accent-gold)]">{entry.rank}</div>
                                                <div>
                                                    <p className="font-semibold text-white">{entry.name}</p>
                                                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Trophy Count</p>
                                                </div>
                                                <span className="text-lg font-bold text-[var(--accent-gold)]">{entry.trophy}</span>
                                            </div>
                                            <span className="text-lg font-bold text-[var(--accent-gold)]">{entry.trophy}</span>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-[var(--text-secondary)] text-center py-6">No rankings yet.</p>
                                    )}
                                </div>
                            </article>
                        </section>
                    </section>

                    {/* ── Right Sidebar ── */}
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
                    <span>{dailyAvailable ? 'Daily Pack: Ready!' : countdown ? `Daily Pack resets in ${countdown}` : 'Daily Pack: Loading...'}</span>
                </footer>
            </div>

            {/* ── Daily Pack Result Modal ── */}
            {dailyModalOpen && dailyResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="metal-panel chrome-border rounded-[28px] p-6 w-full max-w-md relative">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-[var(--accent-gold)] to-amber-500 rounded-t-[28px]" />
                        <div className="text-center mb-6">
                            <p className="text-4xl mb-3">🎁</p>
                            <h2 className="font-[var(--font-heading)] text-2xl uppercase text-white">Daily Pack Opened!</h2>
                            <div className="mt-3 inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-4 py-2">
                                <span className="text-emerald-400 font-bold text-lg">+{dailyResult.coins_gained} Coins</span>
                            </div>
                        </div>

                        <p className="text-[11px] uppercase tracking-widest text-[var(--text-secondary)] text-center mb-4">Cards Received</p>
                        <div className="flex gap-3 justify-center mb-6">
                            {dailyResult.cards.map((card, i) => (
                                <div key={i} className={`flex-1 max-w-[130px] relative aspect-[2/3] rounded-2xl border-2 overflow-hidden bg-zinc-900 ${rarityColor[card.rarity]?.split(' ')[0] || 'border-zinc-600'}`}>
                                    {card.image ? (
                                        <img src={card.image} alt={card.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-black" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-2 text-center">
                                        <p className={`text-[9px] font-bold uppercase mb-1 ${rarityColor[card.rarity]?.split(' ')[1] || 'text-zinc-400'}`}>{card.rarity}</p>
                                        <p className="text-[11px] font-bold text-white leading-tight">{card.name}</p>
                                        <p className="text-[9px] text-zinc-400 mt-1">ATT {card.att} / DEF {card.def}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => { setDailyModalOpen(false); setDailyResult(null); }}
                            className="w-full rounded-2xl bg-[var(--accent-gold)] py-3 text-sm font-bold uppercase tracking-widest text-black hover:bg-yellow-400 transition-colors"
                        >
                            Collect & Close
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
