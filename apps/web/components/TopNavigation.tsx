'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MOCK_USER } from '../lib/mockData';

const topNav = [
    { label: 'Lobby', href: '/lobby' },
    { label: 'Roster', href: '/roster' },
    { label: 'Store', href: '/store' },
    { label: 'Leaderboard', href: '/leaderboard' },
];

export function TopNavigation() {
    const pathname = usePathname();
    const [user, setUser] = useState<{username: string, level: number} | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('wr_user');
        if (stored) {
            const data = JSON.parse(stored);
            setUser({
                username: data.user?.name || MOCK_USER.username,
                // In a real app level would come from the backend or player data
                level: 1 
            });
        } else {
            setUser({ username: MOCK_USER.username, level: MOCK_USER.level });
        }
    }, []);

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
                <div className="chrome-border relative flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-lg">
                    <span>🔔</span>
                    {MOCK_USER.notifications > 0 && (
                        <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-raw)] text-[10px] font-bold text-white">
                            {MOCK_USER.notifications}
                        </span>
                    )}
                </div>
                {user && (
                    <Link href="/profile" className="chrome-border flex cursor-pointer items-center gap-3 rounded-full bg-white/5 px-3 py-2 transition hover:bg-white/10">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-raw)]" />
                        <div>
                            <p className="text-sm font-semibold text-white">{user.username}</p>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">
                                Level {user.level}
                            </p>
                        </div>
                    </Link>
                )}
            </div>
        </header>
    );
}
