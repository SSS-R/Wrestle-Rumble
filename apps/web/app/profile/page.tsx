"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNavigation } from '../../components/TopNavigation';

export default function ProfilePage() {
    const router = useRouter();
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDemoProfile, setIsDemoProfile] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const stored = localStorage.getItem('wr_user');
            if (!stored) {
                router.push('/login');
                return;
            }
            
            const data = JSON.parse(stored);
            if (!data.user?.id) {
                router.push('/login');
                return;
            }

            // Check if viewing another user's profile
            const params = new URLSearchParams(window.location.search);
            const viewUserId = params.get('id');

            // Demo user profile (id=1)
            if (viewUserId === '1') {
                setIsDemoProfile(true);
                setProfileData({
                    username: 'DemoUser',
                    coins: 5000,
                    trophy: 150,
                    highest_trophy: 200,
                    total_matches: 50,
                    total_wins: 30,
                    win_rate: 60,
                    best_card: {
                        name: 'John Cena',
                        rarity: 'Legendary',
                        att: 85,
                        def_: 75,
                        image: '',
                        total_wins: 15,
                        total_played: 20,
                    }
                });
                setLoading(false);
                return;
            }

            const playerId = viewUserId ? parseInt(viewUserId, 10) : data.user.id;

            try {
                const res = await fetch(`http://localhost:8000/api/player/${playerId}/profile`);
                if (res.ok) {
                    const profile = await res.json();
                    setProfileData(profile);
                } else {
                    setError('Failed to load profile data.');
                }
            } catch (err) {
                setError('Network error loading profile.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    if (loading) {
        return (
            <main className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-secondary)] uppercase tracking-wider font-bold">
                Loading Profile...
            </main>
        );
    }

    if (error || !profileData) {
        return (
            <main className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-red-500 uppercase tracking-wider font-bold">
                {error || 'Profile not found'}
            </main>
        );
    }

    return (
        <main className="page-shell min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-6 pt-4 lg:px-6">
                <TopNavigation />

                <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] mt-6">
                    {/* Left Sidebar - Player Identity */}
                    <aside className="metal-panel chrome-border slide-in-panel relative overflow-hidden rounded-[28px] p-6 h-fit">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--accent-raw)] via-[var(--accent-gold)] to-[var(--accent-smackdown)]" />
                        
                        <div className="flex flex-col items-center mt-4">
                            <div className="h-32 w-32 rounded-full border-4 border-[rgba(192,192,200,0.35)] bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-raw)] shadow-[0_0_30px_rgba(212,175,55,0.2)] mb-6 flex items-center justify-center text-4xl font-bold">
                                {profileData.username.charAt(0).toUpperCase()}
                            </div>
                            <h1 className="font-[var(--font-heading)] text-3xl uppercase text-white mb-1">{profileData.username}</h1>
                            <p className="text-sm text-[var(--text-secondary)] uppercase tracking-widest mb-8">Heavyweight Division</p>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 flex justify-between items-center">
                                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Trophies</p>
                                <p className="text-lg font-bold text-[var(--accent-gold)]">{profileData.trophy}</p>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 flex justify-between items-center">
                                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Total Coins</p>
                                <p className="text-lg font-bold text-[var(--accent-gold)]">{profileData.coins.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button 
                            onClick={() => {
                                localStorage.removeItem('wr_user');
                                router.push('/login');
                            }}
                            className="mt-8 w-full border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors rounded-xl py-3 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,0,0,0.1)]"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </aside>

                    {/* Right Content - Career Statistics */}
                    <section className="space-y-6">
                        <div className="metal-panel chrome-border slide-in-panel rounded-[28px] p-8">
                            <div className="flex justify-between items-end mb-8 border-b border-[var(--accent-silver)] pb-4">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--accent-gold)]">Career</p>
                                    <h2 className="font-[var(--font-heading)] text-3xl uppercase mt-2">Combat Statistics</h2>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {/* Win Rate Metric */}
                                <div className="border border-[var(--accent-raw)]/30 bg-gradient-to-br from-red-950/20 to-black rounded-2xl p-6 text-center shadow-[0_0_15px_rgba(255,0,0,0.1)] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-10 -mt-10" />
                                    <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)] mb-4">Win Rate</p>
                                    <div className="text-5xl font-[var(--font-display)] text-white mb-2">{profileData.win_rate}%</div>
                                    <p className="text-sm font-bold text-gray-400">{profileData.total_wins} W / {profileData.total_matches - profileData.total_wins} L</p>
                                </div>

                                {/* Trophy Tracking */}
                                <div className="border border-[var(--accent-gold)]/30 bg-gradient-to-br from-yellow-950/20 to-black rounded-2xl p-6 text-center shadow-[0_0_15px_rgba(212,175,55,0.1)] col-span-1 md:col-span-2 relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                                     <div className="grid grid-cols-2 h-full items-center">
                                         <div className="border-r border-white/10">
                                            <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)] mb-4">Current Trophies</p>
                                            <div className="text-4xl font-[var(--font-display)] text-white">{profileData.trophy}</div>
                                         </div>
                                         <div>
                                            <p className="text-xs uppercase tracking-widest text-[var(--accent-gold)] mb-4">Highest Trophies</p>
                                            <div className="text-4xl font-[var(--font-display)] text-[var(--accent-gold)]">{profileData.highest_trophy}</div>
                                         </div>
                                     </div>
                                </div>
                            </div>

                            {/* Best Card Feature */}
                            <div>
                                <h3 className="font-[var(--font-heading)] text-2xl uppercase mb-6 flex items-center gap-3">
                                    <span className="bg-[var(--accent-smackdown)] text-white text-xs px-2 py-1 rounded">MVP</span>
                                    Signature Superstar
                                </h3>
                                
                                {!profileData.best_card ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-white/10 rounded-2xl bg-black/20">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-bold uppercase text-white mb-2">No Match Data</h3>
                                        <p className="text-sm text-[var(--text-secondary)] max-w-sm">
                                            Enter the ring and start battling to establish your signature superstar!
                                        </p>
                                        <button onClick={() => router.push('/lobby')} className="mt-6 border border-white/20 text-white px-6 py-2 rounded-full font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-colors">
                                            To The Arena
                                        </button>
                                    </div>
                                ) : (
                                    <div className="border border-white/10 rounded-2xl bg-black/40 overflow-hidden flex flex-col md:flex-row">
                                        {/* Card Visual */}
                                        <div className="w-full md:w-64 aspect-[2.5/3.5] relative shrink-0 border-r border-white/10 bg-zinc-900"
                                            style={{
                                                borderBottomColor: 
                                                    profileData.best_card.rarity === 'Legendary' ? '#D4AF37' :
                                                    profileData.best_card.rarity === 'Gold' ? '#9333EA' :
                                                    profileData.best_card.rarity === 'Rare' ? '#005BBB' :
                                                    '#71717A',
                                                borderBottomWidth: '4px'
                                             }}>
                                            {profileData.best_card.image ? (
                                                <img src={profileData.best_card.image} alt={profileData.best_card.name} className="absolute inset-0 w-full h-full object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-black" />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-md mb-2 inline-block ${
                                                    profileData.best_card.rarity === 'Legendary' ? 'bg-[var(--accent-gold)] text-black' :
                                                    profileData.best_card.rarity === 'Gold' ? 'bg-purple-600 text-white' :
                                                    profileData.best_card.rarity === 'Rare' ? 'bg-[var(--accent-smackdown)] text-white' :
                                                    'bg-zinc-700 text-white'
                                                }`}>
                                                    {profileData.best_card.rarity}
                                                </span>
                                                <h4 className="font-[var(--font-heading)] text-2xl uppercase text-white leading-tight drop-shadow-lg">
                                                    {profileData.best_card.name}
                                                </h4>
                                            </div>
                                        </div>

                                        {/* Card Stats */}
                                        <div className="p-6 flex-1 flex flex-col justify-center">
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="bg-black/60 border border-white/5 rounded-xl p-4">
                                                    <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">Card Win Rate</p>
                                                    <p className="text-2xl font-bold text-[var(--success)]">
                                                        {profileData.best_card.total_matches === 0 ? '0' : 
                                                         Math.round((profileData.best_card.total_wins / profileData.best_card.total_played) * 100)}%
                                                    </p>
                                                    <p className="text-xs text-gray-500 font-bold mt-1">{profileData.best_card.total_wins} Wins with Card</p>
                                                </div>
                                                <div className="bg-black/60 border border-white/5 rounded-xl p-4">
                                                    <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">Times Played</p>
                                                    <p className="text-2xl font-bold text-white">{profileData.best_card.total_played}</p>
                                                    <p className="text-xs text-gray-500 font-bold mt-1">Total Appearances</p>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-3">Base Attributes</p>
                                                <div className="flex gap-3">
                                                    <div className="bg-red-600/20 px-4 py-2 rounded-lg border border-red-500/30">
                                                        <span className="text-xs font-bold text-red-400 mr-2">ATT</span>
                                                        <span className="font-bold text-white text-lg">{profileData.best_card.att}</span>
                                                    </div>
                                                    <div className="bg-blue-600/20 px-4 py-2 rounded-lg border border-blue-500/30">
                                                        <span className="text-xs font-bold text-blue-400 mr-2">DEF</span>
                                                        <span className="font-bold text-white text-lg">{profileData.best_card.def_ || profileData.best_card.def}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
