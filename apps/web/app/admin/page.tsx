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

    // Users Management State
    const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
    const [usersList, setUsersList] = useState<any[]>([]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsersList(data);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    // Packs Management State
    const [isPacksModalOpen, setIsPacksModalOpen] = useState(false);
    const [packsList, setPacksList] = useState<any[]>([]);
    const [newCustomPack, setNewCustomPack] = useState({
        type: '',
        price: 500,
        min_coin: 100,
        max_coin: 300,
        is_event: false,
        event_name: '',
        cards_config: '[\n  { "type": "random", "count": 3, "weights": { "Special": 100 } }\n]'
    });

    const fetchPacks = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/admin/packs');
            if (res.ok) {
                const data = await res.json();
                setPacksList(data);
            }
        } catch (error) {
            console.error("Failed to fetch packs:", error);
        }
    };

    const [eventsList, setEventsList] = useState<any[]>([]);

    const fetchEvents = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/admin/events');
            if (res.ok) {
                const data = await res.json();
                setEventsList(data);
            }
        } catch (error) {
            console.error("Failed to fetch events:", error);
        }
    };

    // Event Management State
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [newEventData, setNewEventData] = useState({
        name: '',
        entry_trophy: 0,
        start_time: new Date().toISOString().slice(0, 16),
        end_time: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
        pack_price: 500,
        pack_min_coin: 100,
        pack_max_coin: 300
    });

    // Card Database State
    const [groupedCards, setGroupedCards] = useState<any[]>([]);
    const [expandedWrestler, setExpandedWrestler] = useState<string | null>(null);

    const fetchGroupedCards = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/admin/cards/grouped');
            if (res.ok) {
                const data = await res.json();
                setGroupedCards(data);
            }
        } catch (error) {
            console.error("Failed to fetch cards:", error);
        }
    };

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
        fetchGroupedCards();
        fetchEvents();
        fetchPacks();
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
                    type: eventData.type, // from select
                    rarity: 'Special' // Fixed
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
                fetchGroupedCards(); // Refresh list
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

    const deleteCard = async (cardId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this individual card? It will also be removed from any player inventories.")) return;
        
        try {
            const res = await fetch(`http://localhost:8000/api/admin/cards/${cardId}`, { method: 'DELETE' });
            if (res.ok) fetchGroupedCards();
            else alert("Failed to delete card.");
        } catch (err) {
            alert("Network error during deletion.");
        }
    };

    const deleteWrestlerCards = async (wrestlerName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete ALL cards for ${wrestlerName}?`)) return;
        
        try {
            const res = await fetch(`http://localhost:8000/api/admin/wrestlers/${encodeURIComponent(wrestlerName)}`, { method: 'DELETE' });
            if (res.ok) fetchGroupedCards();
            else alert("Failed to delete wrestler's cards.");
        } catch (err) {
            alert("Network error during deletion.");
        }
    };

    const deleteAllCards = async () => {
        if (!confirm("WARNING: Are you absolutely sure you want to delete EVERY card in the database? This cannot be undone!")) return;
        
        try {
            const res = await fetch(`http://localhost:8000/api/admin/cards`, { method: 'DELETE' });
            if (res.ok) fetchGroupedCards();
            else alert("Failed to delete database.");
        } catch (err) {
            alert("Network error during deletion.");
        }
    };

    const openAddCardForWrestler = (wrestlerName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        // Pre-fill base variants
        const newVariants = defaultVariants.map(v => ({ ...v, name: wrestlerName }));
        setBaseVariants(newVariants);
        // Pre-fill event
        setEventData({ ...eventData, name: wrestlerName });
        
        setCardMode('event'); // Default to event mode when adding to an existing wrestler usually makes sense, but base is fine too.
        setIsModalOpen(true);
    };

    const updateActiveVariant = (field: string, value: any) => {
        const newVariants = [...baseVariants];
        newVariants[activeVariantTab] = { ...newVariants[activeVariantTab], [field]: value };
        if (field === 'name') newVariants.forEach(v => v.name = value);
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
            <div className="max-w-6xl mx-auto">
                <header className="metal-panel p-6 rounded-xl flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold" style={{ fontFamily: '"Russo One", sans-serif' }}>ADMINISTRATOR CONSOLE</h1>
                        <p className="text-[var(--text-secondary)]">Welcome, {user.name}</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => {
                                localStorage.removeItem('wr_user');
                                router.push('/login');
                            }}
                            className="bg-black/40 border border-[var(--accent-silver)] px-6 py-2 rounded font-bold uppercase hover:bg-black/60 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                            <button onClick={() => {
                                setBaseVariants(defaultVariants);
                                setEventData({ ...eventData, name: '' });
                                setIsModalOpen(true);
                            }} className="bg-[var(--accent-gold)] text-black hover:bg-yellow-500 p-3 rounded text-left transition-colors text-sm font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                                + Add Cards
                            </button>
                            <button onClick={() => { setIsUsersModalOpen(true); fetchUsers(); }} className="bg-[var(--bg-tertiary)] chrome-border hover:bg-[var(--accent-smackdown)] p-3 rounded text-left transition-colors text-sm font-bold uppercase tracking-wider">Manage Users</button>
                            <button onClick={() => { setIsPacksModalOpen(true); fetchPacks(); }} className="bg-[var(--bg-tertiary)] chrome-border hover:bg-[var(--accent-smackdown)] p-3 rounded text-left transition-colors text-sm font-bold uppercase tracking-wider">Configure Packs</button>
                            <button onClick={() => setIsEventModalOpen(true)} className="bg-[var(--bg-tertiary)] chrome-border hover:bg-[var(--accent-smackdown)] p-3 rounded text-left transition-colors text-sm font-bold uppercase tracking-wider">Event Management</button>
                        </div>
                    </div>
                </div>

                {/* Card Database Section */}
                <div className="metal-panel p-6 rounded-xl chrome-border">
                    <div className="flex justify-between items-center mb-6 border-b border-[var(--accent-silver)] pb-4">
                        <h2 className="text-2xl font-bold font-[var(--font-heading)] uppercase drop-shadow-md">Card Roster Database</h2>
                        <button onClick={deleteAllCards} className="bg-red-600/20 text-red-500 border border-red-500/50 hover:bg-red-600 hover:text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors">
                            Wipe Entire Database
                        </button>
                    </div>

                    <div className="space-y-4">
                        {groupedCards.length === 0 ? (
                            <p className="text-[var(--text-secondary)] italic">No cards found in database.</p>
                        ) : (
                            groupedCards.map((group) => (
                                <div key={group.name} className="border border-white/10 rounded-xl overflow-hidden bg-black/40 transition-colors hover:border-white/30">
                                    <div 
                                        onClick={() => setExpandedWrestler(expandedWrestler === group.name ? null : group.name)}
                                        className="p-4 flex items-center justify-between cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="font-[var(--font-heading)] text-xl text-white uppercase tracking-wider">{group.name}</span>
                                            <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded font-bold">{group.cards.length} Cards</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={(e) => openAddCardForWrestler(group.name, e)}
                                                className="text-xs bg-[var(--accent-smackdown)] text-white px-3 py-1.5 rounded font-bold uppercase tracking-wider hover:bg-blue-600 transition-colors"
                                            >
                                                + Add Card
                                            </button>
                                            <button 
                                                onClick={(e) => deleteWrestlerCards(group.name, e)}
                                                className="text-xs bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded font-bold uppercase tracking-wider transition-colors border border-red-600/50"
                                            >
                                                Delete All
                                            </button>
                                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedWrestler === group.name ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    
                                    {expandedWrestler === group.name && (
                                        <div className="bg-black/60 p-4 border-t border-white/10">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {group.cards.map((card: any) => (
                                                    <div key={card.id} className="relative bg-zinc-900 border border-white/10 rounded-lg p-3 hover:border-white/30 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                                                card.rarity === 'Legendary' ? 'bg-[var(--accent-gold)] text-black' :
                                                                card.rarity === 'Gold' ? 'bg-purple-500 text-white' :
                                                                card.rarity === 'Rare' ? 'bg-[var(--accent-smackdown)] text-white' :
                                                                'bg-zinc-600 text-white'
                                                            }`}>{card.rarity}</span>
                                                            <span className="text-[10px] text-zinc-400 font-bold tracking-wider">{card.type}</span>
                                                        </div>
                                                        <div className="flex gap-3 items-center mt-3">
                                                            {card.image && <img src={card.image} alt={card.name} className="w-12 h-12 object-cover rounded border border-white/10" />}
                                                            <div>
                                                                <p className="text-xs font-bold text-red-500">ATT: {card.att}</p>
                                                                <p className="text-xs font-bold text-blue-500">DEF: {card.def}</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={(e) => deleteCard(card.id, e)}
                                                            className="absolute bottom-2 right-2 p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                            title="Delete Card"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
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
                                            <select required value={eventData.type} onChange={e => setEventData({...eventData, type: e.target.value})} className="w-full bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/50 rounded p-2 text-white">
                                                <option value="" disabled>Select Event...</option>
                                                {eventsList.map(ev => (
                                                    <option key={ev.id} value={ev.name}>{ev.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Rarity</label>
                                            <select disabled value="Special" className="w-full bg-black/60 border border-white/10 rounded p-2 text-white opacity-50 cursor-not-allowed">
                                                <option value="Special">Special</option>
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

            {/* Manage Users Modal */}
            {isUsersModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
                    <div className="metal-panel chrome-border relative w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col rounded-2xl p-6 shadow-2xl">
                        <button onClick={() => setIsUsersModalOpen(false)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                            ✕
                        </button>
                        
                        <h2 className="text-2xl font-bold mb-6 font-[var(--font-heading)] uppercase text-white">Manage Players</h2>
                        
                        <div className="overflow-y-auto pr-2 flex-1 space-y-4">
                            {usersList.length === 0 ? (
                                <p className="text-[var(--text-secondary)] italic">No players found.</p>
                            ) : (
                                usersList.map((player) => (
                                    <div key={player.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-lg text-white">{player.name}</p>
                                            <p className="text-xs text-gray-400">{player.email}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right flex items-center gap-2">
                                                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Coins:</p>
                                                <input 
                                                    type="number" 
                                                    className="bg-black/60 border border-[var(--accent-gold)] rounded px-2 py-1 text-white w-24 text-right font-bold"
                                                    value={player.coins}
                                                    onChange={(e) => {
                                                        const newUsers = [...usersList];
                                                        const index = newUsers.findIndex(u => u.id === player.id);
                                                        newUsers[index].coins = Number(e.target.value);
                                                        setUsersList(newUsers);
                                                    }}
                                                />
                                            </div>
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`http://localhost:8000/api/admin/users/${player.id}/coins`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ coins: player.coins })
                                                        });
                                                        if (res.ok) {
                                                            alert(`Updated coins for ${player.name} to ${player.coins}`);
                                                        } else {
                                                            alert("Failed to update coins");
                                                        }
                                                    } catch (err) {
                                                        alert("Network error");
                                                    }
                                                }}
                                                className="bg-[var(--success)] hover:bg-green-600 border border-green-500/50 text-white px-4 py-2 rounded font-bold uppercase tracking-wider text-sm transition-colors"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Configure Packs Modal */}
            {isPacksModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
                    <div className="metal-panel chrome-border relative w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl p-6 shadow-2xl">
                        <button onClick={() => setIsPacksModalOpen(false)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                            ✕
                        </button>
                        
                        <h2 className="text-2xl font-bold mb-6 font-[var(--font-heading)] uppercase text-white">Configure Packs</h2>
                        
                        <div className="overflow-y-auto pr-2 flex-1 space-y-6">
                            
                            <div className="mb-2 border border-[var(--accent-gold)]/30 bg-black/40 p-6 rounded-xl">
                                <h3 className="text-xl font-bold mb-4 text-[var(--accent-gold)] uppercase tracking-wider">Create Custom Pack</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pack Name</label>
                                        <input type="text" value={newCustomPack.type} onChange={e => setNewCustomPack({...newCustomPack, type: e.target.value})} className="w-full bg-black/60 border border-white/20 rounded p-2 text-white font-bold" placeholder="e.g. Promo Pack" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Price</label>
                                        <input type="number" value={newCustomPack.price} onChange={e => setNewCustomPack({...newCustomPack, price: Number(e.target.value)})} className="w-full bg-black/60 border border-white/20 rounded p-2 text-white font-bold" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Min Coins</label>
                                        <input type="number" value={newCustomPack.min_coin} onChange={e => setNewCustomPack({...newCustomPack, min_coin: Number(e.target.value)})} className="w-full bg-black/60 border border-white/20 rounded p-2 text-white font-bold" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Max Coins</label>
                                        <input type="number" value={newCustomPack.max_coin} onChange={e => setNewCustomPack({...newCustomPack, max_coin: Number(e.target.value)})} className="w-full bg-black/60 border border-white/20 rounded p-2 text-white font-bold" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                                        <input type="checkbox" checked={newCustomPack.is_event} onChange={e => setNewCustomPack({...newCustomPack, is_event: e.target.checked})} className="w-4 h-4 accent-[var(--accent-gold)]" />
                                        Is Event Pack?
                                    </label>
                                    {newCustomPack.is_event && (
                                        <select value={newCustomPack.event_name} onChange={e => setNewCustomPack({...newCustomPack, event_name: e.target.value, type: e.target.value + ' Pack'})} className="bg-black/60 border border-[var(--accent-gold)] rounded p-2 text-white font-bold flex-1">
                                            <option value="" disabled>Select Event...</option>
                                            {eventsList.map(ev => <option key={ev.id} value={ev.name}>{ev.name}</option>)}
                                        </select>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Cards Config (JSON)</label>
                                    <textarea value={newCustomPack.cards_config} onChange={e => setNewCustomPack({...newCustomPack, cards_config: e.target.value})} className="w-full bg-black/60 border border-white/20 rounded p-3 text-white font-mono text-xs h-24 custom-scrollbar focus:border-[var(--accent-smackdown)] outline-none" />
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={async () => {
                                        try {
                                            const payload = {
                                                ...newCustomPack,
                                                cards_config: JSON.parse(newCustomPack.cards_config),
                                                store_id: 1
                                            };
                                            const res = await fetch(`http://localhost:8000/api/admin/packs`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(payload)
                                            });
                                            if(res.ok) { 
                                                alert("Pack Created Successfully!"); 
                                                fetchPacks(); 
                                                setNewCustomPack({...newCustomPack, type: ''});
                                            } else {
                                                alert("Failed to create custom pack");
                                            }
                                        } catch(e) { 
                                            alert("Invalid JSON format in config."); 
                                        }
                                    }} className="bg-[var(--accent-gold)] text-black px-6 py-2 rounded font-bold uppercase tracking-wider text-sm transition-colors hover:bg-yellow-500 shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                                        + Create Custom Pack
                                    </button>
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold pt-4 mb-2 text-white uppercase tracking-wider border-b border-white/10 pb-2">Existing Packs</h3>
                            {packsList.length === 0 ? (
                                <p className="text-[var(--text-secondary)] italic">No packs found.</p>
                            ) : (
                                packsList.map((pack) => (
                                    <div key={pack.id} className="bg-black/40 border border-white/10 rounded-xl p-6">
                                        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                                            <h3 className="text-xl font-bold text-[var(--accent-gold)] uppercase tracking-wider">{pack.type} Pack</h3>
                                            <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400 font-bold uppercase">{pack.is_event ? 'Event Pack' : 'Base Pack'}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-6 mb-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Price (Coins)</label>
                                                <input type="number" value={pack.price} onChange={(e) => {
                                                    const newPacks = [...packsList];
                                                    const index = newPacks.findIndex(p => p.id === pack.id);
                                                    newPacks[index].price = Number(e.target.value);
                                                    setPacksList(newPacks);
                                                }} className="w-full bg-black/60 border border-white/20 rounded p-2 text-white font-bold" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Min Coins Yield</label>
                                                <input type="number" value={pack.min_coin} onChange={(e) => {
                                                    const newPacks = [...packsList];
                                                    const index = newPacks.findIndex(p => p.id === pack.id);
                                                    newPacks[index].min_coin = Number(e.target.value);
                                                    setPacksList(newPacks);
                                                }} className="w-full bg-black/60 border border-white/20 rounded p-2 text-white font-bold" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Max Coins Yield</label>
                                                <input type="number" value={pack.max_coin} onChange={(e) => {
                                                    const newPacks = [...packsList];
                                                    const index = newPacks.findIndex(p => p.id === pack.id);
                                                    newPacks[index].max_coin = Number(e.target.value);
                                                    setPacksList(newPacks);
                                                }} className="w-full bg-black/60 border border-white/20 rounded p-2 text-white font-bold" />
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Cards Configuration (JSON)</label>
                                            <textarea 
                                                value={typeof pack.cards_config === 'string' ? pack.cards_config : JSON.stringify(pack.cards_config, null, 2)} 
                                                onChange={(e) => {
                                                    const newPacks = [...packsList];
                                                    const index = newPacks.findIndex(p => p.id === pack.id);
                                                    newPacks[index].cards_config = e.target.value;
                                                    setPacksList(newPacks);
                                                }}
                                                className="w-full bg-black/60 border border-white/20 rounded p-3 text-white font-mono text-xs h-32 custom-scrollbar focus:border-[var(--accent-smackdown)] outline-none" 
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        const payload = { ...pack };
                                                        if (typeof payload.cards_config === 'string') {
                                                            payload.cards_config = JSON.parse(payload.cards_config);
                                                        }
                                                        const res = await fetch(`http://localhost:8000/api/admin/packs/${pack.id}`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify(payload)
                                                        });
                                                        if (res.ok) {
                                                            alert(`Successfully updated ${pack.type} Pack`);
                                                        } else {
                                                            alert("Failed to update pack");
                                                        }
                                                    } catch (err) {
                                                        alert("Invalid JSON format. Please ensure the Cards Configuration is valid JSON.");
                                                    }
                                                }}
                                                className="bg-[var(--accent-smackdown)] hover:bg-blue-600 text-white px-6 py-2 rounded font-bold uppercase tracking-wider text-sm transition-colors"
                                            >
                                                Save Pack Configuration
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Event Management Modal */}
            {isEventModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
                    <div className="metal-panel chrome-border relative w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl p-6 shadow-2xl">
                        <button onClick={() => setIsEventModalOpen(false)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                            ✕
                        </button>
                        
                        <h2 className="text-2xl font-bold mb-6 font-[var(--font-heading)] uppercase text-white">Create New Event</h2>
                        
                        <div className="overflow-y-auto pr-2 flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Event Name</label>
                                    <input type="text" value={newEventData.name} onChange={e => setNewEventData({...newEventData, name: e.target.value})} className="w-full bg-black/60 border border-white/20 rounded p-2 text-white font-bold" placeholder="e.g. WrestleMania" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Entry Trophy</label>
                                    <input type="number" value={newEventData.entry_trophy} onChange={e => setNewEventData({...newEventData, entry_trophy: Number(e.target.value)})} className="w-full bg-black/60 border border-white/20 rounded p-2 text-white font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Start Time</label>
                                    <input type="datetime-local" value={newEventData.start_time} onChange={e => setNewEventData({...newEventData, start_time: e.target.value})} className="w-full bg-black/60 border border-white/20 rounded p-2 text-white font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">End Time</label>
                                    <input type="datetime-local" value={newEventData.end_time} onChange={e => setNewEventData({...newEventData, end_time: e.target.value})} className="w-full bg-black/60 border border-white/20 rounded p-2 text-white font-bold" />
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end pt-4">
                                <button 
                                    onClick={async () => {
                                        if(!newEventData.name.trim()) { alert("Please enter an event name."); return; }
                                        try {
                                            const res = await fetch(`http://localhost:8000/api/admin/events`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    name: newEventData.name,
                                                    entry_trophy: newEventData.entry_trophy,
                                                    start_time: new Date(newEventData.start_time).toISOString(),
                                                    end_time: new Date(newEventData.end_time).toISOString(),
                                                })
                                            });
                                            if (res.ok) {
                                                alert(`Event ${newEventData.name} Created successfully!`);
                                                setIsEventModalOpen(false);
                                                fetchEvents(); // refresh events list for dropdowns
                                                setNewEventData({...newEventData, name: ''}); // reset
                                            } else {
                                                alert("Failed to create event");
                                            }
                                        } catch (err) {
                                            alert("Network error");
                                        }
                                    }}
                                    className="w-full bg-[var(--accent-gold)] hover:bg-yellow-600 text-black px-6 py-4 rounded-xl font-bold uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                                >
                                    Create Event
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
