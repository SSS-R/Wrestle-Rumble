"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    
    // Add Card Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cardMode, setCardMode] = useState<'base' | 'event'>('base');
    
    const defaultVariants = [
        { rarity: 'Common', name: '', att: 50, def: 50, finisher: '', signature: '', image: '', price: 100 },
        { rarity: 'Rare', name: '', att: 55, def: 55, finisher: '', signature: '', image: '', price: 250 },
        { rarity: 'Gold', name: '', att: 60, def: 60, finisher: '', signature: '', image: '', price: 500 },
        { rarity: 'Legendary', name: '', att: 65, def: 65, finisher: '', signature: '', image: '', price: 1000 },
    ];
    
    const [baseVariants, setBaseVariants] = useState(defaultVariants);
    const [activeVariantTab, setActiveVariantTab] = useState(0);

    const [eventData, setEventData] = useState({
        name: '', att: 50, def: 50, finisher: '', signature: '', image: '', rarity: 'Common', type: '', price: 100
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

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

    const handleFileUpload = async (file: File, callback: (url: string) => void) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const res = await fetch('http://localhost:8000/api/admin/upload', {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                callback(data.url);
            } else {
                alert("Image upload failed");
            }
        } catch (error) {
            alert("Network error during upload");
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let endpoint = '';
            let payload = {};

            if (cardMode === 'base') {
                endpoint = '/api/admin/cards/base';
                payload = { variants: baseVariants };
            } else {
                endpoint = '/api/admin/cards/event';
                payload = {
                    ...eventData,
                    att: Number(eventData.att),
                    def: Number(eventData.def),
                    price: Number(eventData.price),
                    type: eventData.type || 'Event'
                };
            }

            const res = await fetch(`http://localhost:8000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Card(s) added successfully!');
                setIsModalOpen(false);
                setBaseVariants(defaultVariants);
                setEventData({ name: '', att: 50, def: 50, finisher: '', signature: '', image: '', rarity: 'Common', type: '', price: 100 });
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail || 'Failed to add card'}`);
            }
        } catch (error) {
            alert('Network error failed to add card.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateActiveVariant = (field: string, value: any) => {
        const newVariants = [...baseVariants];
        newVariants[activeVariantTab] = { ...newVariants[activeVariantTab], [field]: value };
        // Sync name across variants if updating name on first tab as a convenience (optional)
        if (field === 'name') {
            newVariants.forEach(v => v.name = value);
        }
        setBaseVariants(newVariants);
    };

    if (!user) return <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-secondary)]">Authenticating...</div>;

    const renderImageInput = (currentImage: string, onUpload: (url: string) => void) => (
        <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Card Image</label>
            <div className="flex items-center gap-3">
                {currentImage && (
                    <img src={currentImage} alt="Preview" className="w-10 h-10 object-cover rounded border border-white/20" />
                )}
                <div className="relative flex-1">
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                handleFileUpload(e.target.files[0], onUpload);
                            }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isUploading}
                    />
                    <div className={`w-full bg-black/60 border ${isUploading ? 'border-yellow-500' : 'border-white/10 hover:border-white/30'} rounded p-2 text-white flex items-center justify-center gap-2 transition-colors`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="text-sm font-bold uppercase tracking-wider">
                            {isUploading ? 'Uploading...' : currentImage ? 'Change Image' : 'Select Image from PC'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    const activeVariant = baseVariants[activeVariantTab];

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
                            <button onClick={() => setIsModalOpen(true)} className="bg-[var(--accent-gold)] text-black hover:bg-yellow-500 p-3 rounded text-left transition-colors text-sm font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                                + Add Cards
                            </button>
                            <button className="bg-[var(--bg-tertiary)] chrome-border hover:bg-[var(--accent-smackdown)] p-3 rounded text-left transition-colors text-sm font-bold uppercase tracking-wider">Manage Users</button>
                            <button className="bg-[var(--bg-tertiary)] chrome-border hover:bg-[var(--accent-smackdown)] p-3 rounded text-left transition-colors text-sm font-bold uppercase tracking-wider">Configure Packs</button>
                            <button className="bg-[var(--bg-tertiary)] chrome-border hover:bg-[var(--accent-smackdown)] p-3 rounded text-left transition-colors text-sm font-bold uppercase tracking-wider">Live Events</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Card Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
                    <div className="metal-panel chrome-border relative w-full max-w-3xl overflow-hidden rounded-2xl p-6 shadow-2xl">
                        <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                            ✕
                        </button>
                        
                        <h2 className="text-2xl font-bold mb-6 font-[var(--font-heading)] uppercase text-white">Create New Card</h2>
                        
                        <div className="flex gap-4 mb-6">
                            <button 
                                onClick={() => setCardMode('base')}
                                className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wider border transition-colors ${cardMode === 'base' ? 'bg-[var(--accent-smackdown)] border-blue-400 text-white shadow-[0_0_15px_rgba(0,91,187,0.5)]' : 'bg-black/50 border-white/20 text-gray-400'}`}
                            >
                                Base Player (4 variants)
                            </button>
                            <button 
                                onClick={() => setCardMode('event')}
                                className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wider border transition-colors ${cardMode === 'event' ? 'bg-[var(--accent-gold)] border-yellow-400 text-black shadow-[0_0_15px_rgba(212,175,55,0.5)]' : 'bg-black/50 border-white/20 text-gray-400'}`}
                            >
                                Event Card (1 special)
                            </button>
                        </div>

                        <form onSubmit={handleAddCard} className="space-y-6">
                            {cardMode === 'base' ? (
                                <div className="border border-white/10 rounded-xl p-4 bg-black/20">
                                    <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
                                        {baseVariants.map((v, idx) => (
                                            <button 
                                                key={v.rarity}
                                                type="button"
                                                onClick={() => setActiveVariantTab(idx)}
                                                className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
                                                    activeVariantTab === idx 
                                                        ? (v.rarity === 'Legendary' ? 'bg-[var(--accent-gold)] text-black' : 
                                                           v.rarity === 'Gold' ? 'bg-purple-500 text-white' : 
                                                           v.rarity === 'Rare' ? 'bg-[var(--accent-smackdown)] text-white' : 
                                                           'bg-zinc-300 text-black')
                                                        : 'bg-black/40 text-gray-500 hover:bg-black/60'
                                                }`}
                                            >
                                                {v.rarity}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Wrestler Name</label>
                                                <input required type="text" value={activeVariant.name} onChange={e => updateActiveVariant('name', e.target.value)} className="w-full bg-black/60 border border-white/10 rounded p-2 text-white" placeholder="e.g. John Cena" />
                                            </div>
                                            {renderImageInput(activeVariant.image, (url) => updateActiveVariant('image', url))}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Attack</label>
                                                <input required type="number" min="0" max="100" value={activeVariant.att} onChange={e => updateActiveVariant('att', Number(e.target.value))} className="w-full bg-black/60 border border-white/10 rounded p-2 text-white" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Defense</label>
                                                <input required type="number" min="0" max="100" value={activeVariant.def} onChange={e => updateActiveVariant('def', Number(e.target.value))} className="w-full bg-black/60 border border-white/10 rounded p-2 text-white" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Finisher</label>
                                                <input type="text" value={activeVariant.finisher} onChange={e => updateActiveVariant('finisher', e.target.value)} className="w-full bg-black/60 border border-white/10 rounded p-2 text-white" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Signature Move</label>
                                                <input type="text" value={activeVariant.signature} onChange={e => updateActiveVariant('signature', e.target.value)} className="w-full bg-black/60 border border-white/10 rounded p-2 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Wrestler Name</label>
                                            <input required type="text" value={eventData.name} onChange={e => setEventData({...eventData, name: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded p-2 text-white" placeholder="e.g. John Cena" />
                                        </div>
                                        {renderImageInput(eventData.image, (url) => setEventData({...eventData, image: url}))}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Attack</label>
                                            <input required type="number" min="0" max="100" value={eventData.att} onChange={e => setEventData({...eventData, att: Number(e.target.value)})} className="w-full bg-black/60 border border-white/10 rounded p-2 text-white" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Defense</label>
                                            <input required type="number" min="0" max="100" value={eventData.def} onChange={e => setEventData({...eventData, def: Number(e.target.value)})} className="w-full bg-black/60 border border-white/10 rounded p-2 text-white" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Finisher</label>
                                            <input type="text" value={eventData.finisher} onChange={e => setEventData({...eventData, finisher: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded p-2 text-white" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Signature Move</label>
                                            <input type="text" value={eventData.signature} onChange={e => setEventData({...eventData, signature: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded p-2 text-white" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4 mt-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Event Name (Type)</label>
                                            <input required type="text" value={eventData.type} onChange={e => setEventData({...eventData, type: e.target.value})} className="w-full bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/50 rounded p-2 text-white" placeholder="WrestleMania 40" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Rarity</label>
                                            <select value={eventData.rarity} onChange={e => setEventData({...eventData, rarity: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded p-2 text-white">
                                                <option>Common</option>
                                                <option>Rare</option>
                                                <option>Gold</option>
                                                <option>Legendary</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Price</label>
                                            <input required type="number" min="0" value={eventData.price} onChange={e => setEventData({...eventData, price: Number(e.target.value)})} className="w-full bg-black/60 border border-white/10 rounded p-2 text-white" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button 
                                disabled={isSubmitting || isUploading}
                                type="submit" 
                                className="w-full bg-[var(--success)] hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-colors uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Processing...' : cardMode === 'base' ? 'Submit All 4 Variants' : 'Mint Event Card'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
