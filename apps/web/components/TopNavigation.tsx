'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MOCK_USER } from '../lib/mockData';

const topNav = [
    { label: 'Lobby', href: '/lobby' },
    { label: 'Roster', href: '/roster' },
    { label: 'Store', href: '/store' },
    { label: 'Leaderboard', href: '/leaderboard' },
];

interface GiftCard {
    id: number;
    name: string;
    att: number;
    def_: number;
    rarity: string;
    type: string;
    image: string | null;
}

interface GiftResult {
    coins_awarded: number;
    cards: GiftCard[];
    message: string;
}

const rarityBorder: Record<string, string> = {
    Legendary: 'border-[var(--accent-gold)]',
    Gold: 'border-purple-500',
    Rare: 'border-[var(--accent-smackdown)]',
    Common: 'border-zinc-600',
};

export function TopNavigation() {
    const pathname = usePathname();
    const [user, setUser] = useState<{ id: number; username: string; level: number } | null>(null);
    const [giftAvailable, setGiftAvailable] = useState(false);
    const [bellOpen, setBellOpen] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [giftResult, setGiftResult] = useState<GiftResult | null>(null);
    const bellRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const stored = localStorage.getItem('wr_user');
        if (!stored) return;
        const userData = JSON.parse(stored);
        setUser(userData);
        const playerId = userData.user?.id || userData.player?.id;
        if (playerId) {
            checkGiftStatus(playerId);
        }
    }, []);

    const checkGiftStatus = async (playerId: number) => {
        try {
            const res = await fetch(`http://localhost:8000/api/player/${playerId}/gift-status`);
            if (res.ok) {
                const data = await res.json();
                setGiftAvailable(data.gift_available);
            }
        } catch {
            // Ignore errors
        }
    };

    useEffect(() => {
        if (user) {
            const playerId = user.user?.id || user.player?.id;
            if (playerId) {
                checkGiftStatus(playerId);
            }
        }
    }, [user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
                setBellOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const claimGift = async () => {
        const playerId = user?.user?.id || user?.player?.id;
        if (!playerId || claiming) return;
        setClaiming(true);
        try {
            const res = await fetch(`http://localhost:8000/api/player/${playerId}/claim-gift`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setGiftResult(data);
                setGiftAvailable(false);
            } else {
                const err = await res.json();
                alert(err.detail || 'Failed to claim gift');
            }
        } catch {
            alert('Network error claiming gift');
        } finally {
            setClaiming(false);
        }
    };

    return (
        <header className="metal-panel chrome-border sticky top-4 z-20 mb-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4">
            <div>
                <p className="font-[var(--font-display)] text-2xl uppercase tracking-[0.18em] text-[var(--accent-gold)] md:text-3xl">
                    Wrestle Rumble
                </p>
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-secondary)]">
                    The Arena Lobby
                </p>
            </div>

            <nav className="flex flex-wrap items-center gap-5 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-secondary)] md:text-sm">
                {topNav.map((item) => {
                    const isActive = pathname === item.href || (pathname === '/' && item.href === '/lobby');
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`relative pb-2 transition hover:text-white ${isActive ? 'text-white' : ''}`}
                        >
                            {item.label}
                            {isActive && (
                                <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[var(--accent-raw)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <div ref={bellRef} className="relative">
                    <button
                        onClick={() => setBellOpen(p => !p)}
                        className="chrome-border relative flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-lg hover:bg-white/10 transition-colors"
                    >
                        🔔
                        {giftAvailable && (
                            <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-raw)] text-[10px] font-bold text-white animate-pulse">
                                1
                            </span>
                        )}
                    </button>

                    {bellOpen && (
                        <div className="absolute right-0 top-14 w-80 metal-panel chrome-border rounded-2xl p-4 shadow-2xl z-50">
                            <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-3">Notifications</p>

                            {giftResult ? (
                                /* Post-Claim Reveal */
                                <div className="space-y-3">
                                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-center">
                                        <p className="text-emerald-400 font-bold text-sm">🎉 Pack Claimed!</p>
                                        <p className="text-white font-bold text-xl mt-1">+{giftResult.coins_awarded} Coins</p>
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider text-center">Cards Received</p>
                                    <div className="flex gap-3">
                                        {giftResult.cards.map(card => (
                                            <div key={card.id} className={`flex-1 relative aspect-[2/3] rounded-xl border-2 overflow-hidden bg-zinc-900 ${rarityBorder[card.rarity] || 'border-zinc-600'}`}>
                                                {card.image ? (
                                                    <img src={card.image} alt={card.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                                                ) : null}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                                <div className="absolute bottom-2 left-0 right-0 text-center px-1">
                                                    <p className="text-[8px] font-bold uppercase text-[var(--accent-gold)] mb-0.5">{card.rarity}</p>
                                                    <p className="text-[10px] font-bold text-white leading-tight">{card.name}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => { setGiftResult(null); setBellOpen(false); }}
                                        className="w-full text-xs text-[var(--text-secondary)] hover:text-white transition-colors mt-1"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : giftAvailable ? (
                                /* Unclaimed Gift */
                                <div className="rounded-xl border border-[var(--accent-gold)]/40 bg-gradient-to-br from-yellow-950/30 to-black p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">🎁</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-white">Welcome Gift Pack!</p>
                                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                                The Arena is gifting you a starter pack: random coins + 2 random cards from the roster!
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={claimGift}
                                        disabled={claiming}
                                        className="mt-4 w-full rounded-xl bg-[var(--accent-gold)] py-2.5 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-yellow-400 disabled:opacity-50 shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                                    >
                                        {claiming ? 'Opening Pack...' : '🎁 Claim Free Pack'}
                                    </button>
                                </div>
                            ) : (
                                /* No Notifications */
                                <div className="py-6 text-center text-[var(--text-secondary)] text-sm">
                                    <p className="text-2xl mb-2">✓</p>
                                    <p>All caught up!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {user && (
                    <Link href="/profile" className="chrome-border flex cursor-pointer items-center gap-3 rounded-full bg-white/5 px-3 py-2 transition hover:bg-white/10">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-raw)] flex items-center justify-center text-xs font-bold text-white">
                            {(user.user?.name || user.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">{user.user?.name || user.username || 'User'}</p>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">
                                Level {user.player?.age || 18}
                            </p>
                        </div>
                    </Link>
                )}
            </div>
        </header>
    );
}
