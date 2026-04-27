"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem('wr_user');
        if (!stored) {
            router.push('/login');
            return;
        }
        const data = JSON.parse(stored);
        if (data.role !== 'admin') {
            router.push('/lobby');
            return;
        }
        setUser(data.user);
    }, [router]);

    if (!user) return <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-secondary)]">Authenticating...</div>;

    return (
        <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-8">
            <div className="max-w-4xl mx-auto">
                <header className="metal-panel p-6 rounded-xl flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold" style={{ fontFamily: '"Russo One", sans-serif' }}>ADMINISTRATOR CONSOLE</h1>
                        <p className="text-[var(--text-secondary)]">Welcome, {user.name}</p>
                    </div>
                    <button 
                        onClick={() => {
                            localStorage.removeItem('wr_user');
                            router.push('/login');
                        }}
                        className="bg-[var(--accent-raw)] px-6 py-2 rounded font-bold uppercase hover:bg-red-600 transition-colors"
                    >
                        Logout
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="metal-panel p-6 rounded-xl chrome-border">
                        <h2 className="text-xl font-bold mb-4 border-b border-[var(--accent-silver)] pb-2 opacity-80">Server Status</h2>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-3 h-3 rounded-full bg-[var(--success)] glow-pulse"></div>
                            <span>PostgreSQL Database Online</span>
                        </div>
                    </div>
                    
                    <div className="metal-panel p-6 rounded-xl chrome-border">
                        <h2 className="text-xl font-bold mb-4 border-b border-[var(--accent-silver)] pb-2 opacity-80">Quick Actions</h2>
                        <div className="flex flex-col gap-3">
                            <button className="bg-[var(--bg-tertiary)] chrome-border hover:bg-[var(--accent-smackdown)] p-3 rounded text-left transition-colors text-sm font-bold uppercase tracking-wider">Manage Users</button>
                            <button className="bg-[var(--bg-tertiary)] chrome-border hover:bg-[var(--accent-smackdown)] p-3 rounded text-left transition-colors text-sm font-bold uppercase tracking-wider">Configure Packs</button>
                            <button className="bg-[var(--bg-tertiary)] chrome-border hover:bg-[var(--accent-smackdown)] p-3 rounded text-left transition-colors text-sm font-bold uppercase tracking-wider">Live Events</button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
