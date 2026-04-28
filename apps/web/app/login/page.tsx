"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../lib/api';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const data = await fetchApi('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ name, password }),
                });
                localStorage.setItem('wr_user', JSON.stringify(data));
                router.push(data.role === 'admin' ? '/admin' : '/lobby');
            } else {
                const data = await fetchApi('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, password, role: 'player' }),
                });
                localStorage.setItem('wr_user', JSON.stringify(data));
                router.push(data.role === 'admin' ? '/admin' : '/lobby');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="metal-panel p-8 rounded-xl w-full max-w-md relative z-10">
                <h1 className="text-4xl text-center mb-6 text-[var(--text-primary)]" style={{ fontFamily: '"Russo One", sans-serif' }}>
                    WRESTLE RUMBLE
                </h1>

                <div className="flex gap-4 mb-8 border-b border-[var(--accent-silver)] pb-2 opacity-80">
                    <button
                        className={`flex-1 text-center pb-2 font-bold uppercase text-sm tracking-wider transition-colors ${isLogin ? 'text-[var(--accent-raw)] border-b-2 border-[var(--accent-raw)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
                        onClick={() => { setIsLogin(true); setError(''); }}
                    >
                        Login
                    </button>
                    <button
                        className={`flex-1 text-center pb-2 font-bold uppercase text-sm tracking-wider transition-colors ${!isLogin ? 'text-[var(--accent-smackdown)] border-b-2 border-[var(--accent-smackdown)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
                        onClick={() => { setIsLogin(false); setError(''); }}
                    >
                        Register
                    </button>
                </div>

                {error && (
                    <div className="bg-[var(--accent-raw)]/20 border border-[var(--accent-raw)] text-white p-3 mb-6 rounded text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-1">Username</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[var(--bg-tertiary)] chrome-border rounded px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-raw)] transition-colors"
                            placeholder="Enter username"
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[var(--bg-tertiary)] chrome-border rounded px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-smackdown)] transition-colors"
                                placeholder="Enter email"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[var(--bg-tertiary)] chrome-border rounded px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-raw)] transition-colors"
                            placeholder="Enter password"
                        />
                    </div>



                    <button
                        type="submit"
                        disabled={loading}
                        className={`mt-4 w-full py-4 rounded font-bold uppercase tracking-wider text-white transition-all sheen overflow-hidden relative ${
                            isLogin ? 'bg-[var(--accent-raw)] glow-pulse' : 'bg-[var(--accent-smackdown)]'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Enter The Ring' : 'Join The Roster')}
                    </button>
                </form>
            </div>
        </main>
    );
}
