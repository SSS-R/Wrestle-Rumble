'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopNavigation } from './TopNavigation';
import { fetchApi } from '../lib/api';

type Friend = {
    id: number;
    name: string;
    trophy: number;
    is_online: boolean;
};

type FriendRequest = {
    id: number;
    sender_id: number;
    sender_name: string;
    sender_trophy: number;
};

type Challenge = {
    id: number;
    challenger_id: number;
    challenger_name: string;
    challenger_trophy: number;
};

type Card = {
    id: number;
    name: string;
    rarity: string;
    atk: number;
    def: number;
    signature: string | null;
    finisher: string | null;
    quantity?: number;
    is_active?: boolean;
};

type TradeOffer = {
    cards: Card[];
    coins: number;
};

export function SocialScreen() {
    const router = useRouter();
    const [playerId, setPlayerId] = useState<number | null>(null);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addFriendName, setAddFriendName] = useState('');
    const [addFriendError, setAddFriendError] = useState('');
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [tradePartner, setTradePartner] = useState<Friend | null>(null);
    const [userCards, setUserCards] = useState<Card[]>([]);
    const [yourOffer, setYourOffer] = useState<TradeOffer>({ cards: [], coins: 0 });
    const [theirOffer, setTheirOffer] = useState<TradeOffer>({ cards: [], coins: 0 });
    const [tradeError, setTradeError] = useState('');
    const [challengeSent, setChallengeSent] = useState<number | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('wr_user');
        if (stored) {
            const data = JSON.parse(stored);
            const id = data.user?.id || data.player?.id;
            if (id) setPlayerId(id);
        }
    }, []);

    useEffect(() => {
        if (playerId) {
            loadFriends();
            loadRequests();
            loadChallenges();
        }
    }, [playerId]);

    useEffect(() => {
        if (playerId && showTradeModal) {
            loadUserCards();
        }
    }, [playerId, showTradeModal]);

    const loadUserCards = async () => {
        try {
            const data = await fetchApi(`/player/${playerId}/inventory`);
            const cards = data.cards.map((c: any) => ({
                id: c.card_id || c.id,
                name: c.name,
                rarity: c.rarity,
                atk: c.att,
                def: c.def_,
                signature: c.signature,
                finisher: c.finisher,
                quantity: c.quantity,
                is_active: c.is_active,
            }));
            setUserCards(cards);
        } catch (err) {
            console.error('Failed to load cards:', err);
        }
    };

    const loadFriends = async () => {
        try {
            const data = await fetchApi(`/social/${playerId}/friends`);
            setFriends(data);
        } catch (err) {
            console.error('Failed to load friends:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadRequests = async () => {
        try {
            const data = await fetchApi(`/social/${playerId}/requests`);
            setRequests(data);
        } catch (err) {
            console.error('Failed to load requests:', err);
        }
    };

    const loadChallenges = async () => {
        try {
            const data = await fetchApi(`/social/${playerId}/challenges`);
            setChallenges(data);
        } catch (err) {
            console.error('Failed to load challenges:', err);
        }
    };

    const handleAddFriend = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddFriendError('');
        
        try {
            await fetchApi(`/social/${playerId}/add`, {
                method: 'POST',
                body: JSON.stringify({ friend_name: addFriendName }),
            });
            setShowAddModal(false);
            setAddFriendName('');
            loadFriends();
        } catch (err: any) {
            setAddFriendError(err.message || 'Failed to add friend');
        }
    };

    const handleAcceptRequest = async (senderId: number) => {
        try {
            await fetchApi(`/social/${playerId}/requests/${senderId}/accept`, {
                method: 'POST',
            });
            loadRequests();
            loadFriends();
        } catch (err) {
            console.error('Failed to accept request:', err);
        }
    };

    const handleRejectRequest = async (senderId: number) => {
        try {
            await fetchApi(`/social/${playerId}/requests/${senderId}/reject`, {
                method: 'POST',
            });
            loadRequests();
        } catch (err) {
            console.error('Failed to reject request:', err);
        }
    };

    const handleRemoveFriend = async (friendId: number) => {
        if (!confirm('Remove this friend?')) return;
        
        try {
            await fetchApi(`/social/${playerId}/friends/${friendId}`, {
                method: 'DELETE',
            });
            loadFriends();
        } catch (err) {
            console.error('Failed to remove friend:', err);
        }
    };

    const filteredFriends = friends.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const challengeFriend = async (friendId: number) => {
        try {
            await fetchApi(`/social/${playerId}/challenge`, {
                method: 'POST',
                body: JSON.stringify({ friend_id: friendId }),
            });
            setChallengeSent(friendId);
            setTimeout(() => setChallengeSent(null), 3000);
        } catch (err: any) {
            alert(err.message || 'Failed to send challenge');
        }
    };

    const handleAcceptChallenge = async (challengeId: number, challengerId: number) => {
        try {
            const result = await fetchApi(`/social/${playerId}/challenges/${challengeId}/accept`, {
                method: 'POST',
            });
            // Redirect to battle with the challenger
            router.push(`/battle?opponent=${challengerId}&challenge=${challengeId}`);
        } catch (err: any) {
            alert(err.message || 'Failed to accept challenge');
        }
    };

    const handleRejectChallenge = async (challengeId: number) => {
        try {
            await fetchApi(`/social/${playerId}/challenges/${challengeId}/reject`, {
                method: 'POST',
            });
            loadChallenges();
        } catch (err: any) {
            alert(err.message || 'Failed to reject challenge');
        }
    };

    const openTradeModal = (friend: Friend) => {
        setTradePartner(friend);
        setYourOffer({ cards: [], coins: 0 });
        setTheirOffer({ cards: [], coins: 0 });
        setTradeError('');
        setShowTradeModal(true);
    };

    const toggleCardInOffer = (card: Card) => {
        const exists = yourOffer.cards.find(c => c.id === card.id);
        if (exists) {
            setYourOffer(prev => ({
                ...prev,
                cards: prev.cards.filter(c => c.id !== card.id),
            }));
        } else {
            setYourOffer(prev => ({
                ...prev,
                cards: [...prev.cards, card],
            }));
        }
    };

    const handleProposeTrade = async () => {
        if (yourOffer.cards.length === 0 && yourOffer.coins === 0) {
            setTradeError('You must offer at least one card or some coins');
            return;
        }

        try {
            await fetchApi(`/social/${playerId}/trade`, {
                method: 'POST',
                body: JSON.stringify({
                    friend_id: tradePartner?.id,
                    offer: {
                        card_ids: yourOffer.cards.map(c => c.id),
                        coins: yourOffer.coins,
                    },
                    request: {
                        card_ids: theirOffer.cards.map(c => c.id),
                        coins: theirOffer.coins,
                    },
                }),
            });
            setShowTradeModal(false);
            setTradePartner(null);
        } catch (err: any) {
            setTradeError(err.message || 'Failed to propose trade');
        }
    };

    const viewProfile = (friendId: number) => {
        router.push(`/profile?id=${friendId}`);
    };

    return (
        <main className="page-shell min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-6 pt-4 lg:px-6">
                <TopNavigation />

                <div className="mb-8 text-center">
                    <h2 className="font-[var(--font-display)] text-5xl uppercase tracking-[0.15em] text-white">
                        🎭 The Backstage
                    </h2>
                    <p className="mt-2 text-sm uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                        Friends & Rivals
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Friends List */}
                    <div className="lg:col-span-1">
                        <div className="metal-panel chrome-border rounded-[24px] p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-[var(--font-display)] text-xl uppercase tracking-[0.1em] text-white">
                                    Friends
                                </h3>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="rounded-full bg-[var(--accent-raw)] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-red-600 transition"
                                >
                                    + Add
                                </button>
                            </div>

                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Search friends..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-raw)]"
                                />
                            </div>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {loading ? (
                                    <div className="text-center py-8 text-[var(--text-secondary)]">Loading...</div>
                                ) : filteredFriends.length === 0 ? (
                                    <>
                                        <div className="text-center py-8 text-[var(--text-secondary)]">
                                            {searchQuery ? 'No friends found' : 'No friends yet'}
                                        </div>
                                        <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
                                            <p className="text-sm text-[var(--text-secondary)] mb-2">Demo friend for testing:</p>
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                                    <div>
                                                        <p className="font-bold text-white">DemoUser (for testing)</p>
                                                        <p className="text-xs text-[var(--text-secondary)]">150 🏆</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => challengeFriend(1)}
                                                        disabled={challengeSent === 1}
                                                        className={`text-xs px-3 py-1 rounded font-bold transition ${
                                                            challengeSent === 1
                                                                ? 'bg-green-600 text-white cursor-default'
                                                                : 'bg-[var(--accent-raw)] text-white hover:bg-red-600'
                                                        }`}
                                                    >
                                                        {challengeSent === 1 ? '✓ Sent' : '⚔️ Challenge'}
                                                    </button>
                                                    <button
                                                        onClick={() => openTradeModal({ id: 1, name: 'DemoUser', trophy: 150, is_online: true })}
                                                        className="text-xs bg-[var(--accent-smackdown)] px-3 py-1 rounded font-bold text-white hover:bg-blue-600 transition"
                                                    >
                                                        🤝 Trade
                                                    </button>
                                                    <button
                                                        onClick={() => viewProfile(1)}
                                                        className="text-xs bg-purple-600 px-3 py-1 rounded font-bold text-white hover:bg-purple-500 transition"
                                                    >
                                                        👤 View
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    filteredFriends.map(friend => (
                                        <div
                                            key={friend.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${friend.is_online ? 'bg-green-500' : 'bg-zinc-600'}`} />
                                                <div>
                                                    <p className="font-bold text-white">{friend.name}</p>
                                                    <p className="text-xs text-[var(--text-secondary)]">{friend.trophy} 🏆</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => challengeFriend(friend.id)}
                                                    disabled={challengeSent === friend.id}
                                                    className={`text-xs px-3 py-1 rounded font-bold transition ${
                                                        challengeSent === friend.id
                                                            ? 'bg-green-600 text-white cursor-default'
                                                            : 'bg-[var(--accent-raw)] text-white hover:bg-red-600'
                                                    }`}
                                                >
                                                    {challengeSent === friend.id ? '✓ Sent' : '⚔️ Challenge'}
                                                </button>
                                                <button
                                                    onClick={() => openTradeModal(friend)}
                                                    className="text-xs bg-[var(--accent-smackdown)] px-3 py-1 rounded font-bold text-white hover:bg-blue-600 transition"
                                                >
                                                    🤝 Trade
                                                </button>
                                                <button
                                                    onClick={() => viewProfile(friend.id)}
                                                    className="text-xs bg-purple-600 px-3 py-1 rounded font-bold text-white hover:bg-purple-500 transition"
                                                >
                                                    👤 View
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveFriend(friend.id)}
                                                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-raw)]"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {requests.length > 0 && (
                                <>
                                    <div className="mt-6 pt-4 border-t border-white/10">
                                        <h4 className="font-bold text-sm uppercase tracking-[0.1em] text-[var(--text-secondary)] mb-3">
                                            Requests ({requests.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {requests.map(req => (
                                                <div
                                                    key={req.id}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                                                >
                                                    <div>
                                                        <p className="font-bold text-white">{req.sender_name}</p>
                                                        <p className="text-xs text-[var(--text-secondary)]">{req.sender_trophy} 🏆</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAcceptRequest(req.sender_id)}
                                                            className="rounded bg-green-600 px-3 py-1 text-xs font-bold text-white hover:bg-green-500"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectRequest(req.sender_id)}
                                                            className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-500"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {challenges.length > 0 && (
                                <>
                                    <div className="mt-6 pt-4 border-t border-white/10">
                                        <h4 className="font-bold text-sm uppercase tracking-[0.1em] text-[var(--accent-raw)] mb-3">
                                            ⚔️ Challenge Requests ({challenges.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {challenges.map(challenge => (
                                                <div
                                                    key={challenge.id}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--accent-raw)]/10 border border-[var(--accent-raw)]/30"
                                                >
                                                    <div>
                                                        <p className="font-bold text-white">{challenge.challenger_name}</p>
                                                        <p className="text-xs text-[var(--text-secondary)]">{challenge.challenger_trophy} 🏆</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAcceptChallenge(challenge.id, challenge.challenger_id)}
                                                            className="rounded bg-green-600 px-3 py-1 text-xs font-bold text-white hover:bg-green-500"
                                                        >
                                                            ✓ Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectChallenge(challenge.id)}
                                                            className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-500"
                                                        >
                                                            ✕ Decline
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Chat / Activity Area */}
                    <div className="lg:col-span-2">
                        <div className="metal-panel chrome-border rounded-[24px] p-6 h-[600px] flex flex-col">
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-gold)] to-amber-700 flex items-center justify-center text-xl font-bold">
                                    ?
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-white">Select a friend</p>
                                    <p className="text-sm text-[var(--text-secondary)]">Choose someone to interact with</p>
                                </div>
                            </div>

                            <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
                                <div className="text-center">
                                    <div className="text-6xl mb-4">💬</div>
                                    <p className="text-lg">Select a friend to start interacting</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Friend Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="metal-panel chrome-border rounded-[24px] p-8 max-w-md w-full mx-4">
                        <h3 className="font-[var(--font-display)] text-2xl uppercase tracking-[0.1em] text-white mb-6">
                            Add Friend
                        </h3>
                        
                        <form onSubmit={handleAddFriend}>
                            <div className="mb-6">
                                <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={addFriendName}
                                    onChange={(e) => setAddFriendName(e.target.value)}
                                    placeholder="Enter username"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-raw)]"
                                    required
                                />
                            </div>

                            {addFriendError && (
                                <div className="mb-4 p-3 rounded bg-[var(--accent-raw)]/20 border border-[var(--accent-raw)] text-sm text-white">
                                    {addFriendError}
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setAddFriendName('');
                                        setAddFriendError('');
                                    }}
                                    className="flex-1 rounded-lg border border-white/10 bg-transparent px-6 py-3 text-sm font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)] hover:border-white hover:text-white transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 rounded-lg bg-[var(--accent-raw)] px-6 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white hover:bg-red-600 transition"
                                >
                                    Send Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Trade Modal */}
            {showTradeModal && tradePartner && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto py-8">
                    <div className="metal-panel chrome-border rounded-[24px] p-8 max-w-4xl w-full mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-[var(--font-display)] text-2xl uppercase tracking-[0.1em] text-white">
                                🤝 Trade with: {tradePartner.name}
                            </h3>
                            <button
                                onClick={() => setShowTradeModal(false)}
                                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            {/* Your Offer */}
                            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                                <h4 className="font-bold text-lg uppercase tracking-[0.1em] text-white mb-4">
                                    Your Offer
                                </h4>
                                
                                {/* Cards offered */}
                                <div className="mb-4 space-y-2 min-h-[100px]">
                                    {yourOffer.cards.length === 0 ? (
                                        <p className="text-sm text-[var(--text-secondary)] text-center py-4">No cards selected</p>
                                    ) : (
                                        yourOffer.cards.map(card => (
                                            <div key={card.id} className="flex items-center justify-between p-2 rounded bg-white/5">
                                                <div>
                                                    <p className="font-bold text-sm text-white">{card.name}</p>
                                                    <p className="text-xs text-[var(--text-secondary)]">ATK {card.atk} • DEF {card.def}</p>
                                                </div>
                                                <button
                                                    onClick={() => toggleCardInOffer(card)}
                                                    className="text-red-400 hover:text-red-300 text-sm"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Coins offered */}
                                <div className="mb-4">
                                    <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-2">
                                        Coins to Add
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={yourOffer.coins}
                                        onChange={(e) => setYourOffer(prev => ({ ...prev, coins: parseInt(e.target.value) || 0 }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--accent-gold)]"
                                    />
                                </div>

                                {/* Add cards from inventory */}
                                <div className="border-t border-white/10 pt-4">
                                    <p className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-3">
                                        Select from your inventory
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                        {userCards.filter(c => !yourOffer.cards.find(oc => oc.id === c.id)).map(card => (
                                            <button
                                                key={card.id}
                                                onClick={() => toggleCardInOffer(card)}
                                                className="p-2 rounded bg-white/5 hover:bg-white/10 text-left transition"
                                            >
                                                <p className="font-bold text-xs text-white truncate">{card.name}</p>
                                                <p className="text-[10px] text-[var(--text-secondary)]">ATK {card.atk} DEF {card.def}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Their Offer */}
                            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                                <h4 className="font-bold text-lg uppercase tracking-[0.1em] text-white mb-4">
                                    Their Offer
                                </h4>
                                
                                {/* Cards requested */}
                                <div className="mb-4 space-y-2 min-h-[100px]">
                                    {theirOffer.cards.length === 0 ? (
                                        <p className="text-sm text-[var(--text-secondary)] text-center py-4">No cards selected</p>
                                    ) : (
                                        theirOffer.cards.map(card => (
                                            <div key={card.id} className="flex items-center justify-between p-2 rounded bg-white/5">
                                                <div>
                                                    <p className="font-bold text-sm text-white">{card.name}</p>
                                                    <p className="text-xs text-[var(--text-secondary)]">ATK {card.atk} • DEF {card.def}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Coins requested */}
                                <div className="mb-4">
                                    <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-2">
                                        Coins to Request
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={theirOffer.coins}
                                        onChange={(e) => setTheirOffer(prev => ({ ...prev, coins: parseInt(e.target.value) || 0 }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--accent-gold)]"
                                    />
                                </div>

                                {/* Request cards from their inventory (placeholder) */}
                                <div className="border-t border-white/10 pt-4">
                                    <p className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-3">
                                        Request from their inventory
                                    </p>
                                    <div className="text-center py-8 text-sm text-[var(--text-secondary)]">
                                        <p>Select cards you want from {tradePartner.name}</p>
                                        <p className="text-xs mt-1">(Feature coming soon)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {tradeError && (
                            <div className="mb-4 p-3 rounded bg-[var(--accent-raw)]/20 border border-[var(--accent-raw)] text-sm text-white">
                                {tradeError}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setShowTradeModal(false)}
                                className="flex-1 rounded-lg border border-white/10 bg-transparent px-6 py-3 text-sm font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)] hover:border-white hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProposeTrade}
                                className="flex-1 rounded-lg bg-[var(--accent-gold)] px-6 py-3 text-sm font-bold uppercase tracking-[0.15em] text-black hover:bg-yellow-400 transition"
                            >
                                Propose Trade
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
