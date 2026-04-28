export type Rarity = 'Common' | 'Rare' | 'Gold' | 'Legendary';
export type Card = {
    id: string;
    name: string;
    type: string;
    rarity: Rarity;
    atk: number;
    def: number;
    signature: string;
    finisher: string;
    price?: number; // for store
    owned?: number; // for roster (count)
};

export const MOCK_CARDS: Card[] = [
    { id: 'c1', name: 'Roman Rampage', type: 'Base', rarity: 'Legendary', atk: 95, def: 90, signature: 'Superman Punch', finisher: 'Spear', owned: 1, price: 1500 },
    { id: 'c2', name: 'Cena Collector', type: 'Base', rarity: 'Gold', atk: 88, def: 85, signature: 'Five Knuckle Shuffle', finisher: 'AA', owned: 0, price: 800 },
    { id: 'c3', name: 'Rhea Rises', type: 'Base', rarity: 'Gold', atk: 86, def: 89, signature: 'Prism Trap', finisher: 'Riptide', owned: 2, price: 750 },
    { id: 'c4', name: 'Seth Visionary', type: 'Base', rarity: 'Legendary', atk: 92, def: 88, signature: 'Sling Blade', finisher: 'Curb Stomp', owned: 1, price: 1400 },
    { id: 'c5', name: 'AJ Phenomenal', type: 'Base', rarity: 'Gold', atk: 87, def: 82, signature: 'Pele Kick', finisher: 'Styles Clash', owned: 3, price: 650 },
    { id: 'c6', name: 'Rey Flyer', type: 'Base', rarity: 'Rare', atk: 78, def: 70, signature: '619', finisher: 'Frog Splash', owned: 1, price: 300 },
    { id: 'c7', name: 'Miz A-Lister', type: 'Base', rarity: 'Common', atk: 70, def: 72, signature: 'It Kicks', finisher: 'Skull Crushing Finale', owned: 5, price: 100 },
    { id: 'c8', name: 'Gunther General', type: 'Base', rarity: 'Gold', atk: 90, def: 92, signature: 'Powerbomb', finisher: 'Symphony', owned: 0, price: 900 },
    { id: 'c9', name: 'Cody Nightmare', type: 'Base', rarity: 'Legendary', atk: 91, def: 87, signature: 'Disaster Kick', finisher: 'Cross Rhodes', owned: 1, price: 1450 },
    { id: 'c10', name: 'Sami Underdog', type: 'Base', rarity: 'Rare', atk: 80, def: 78, signature: 'Blue Thunder Bomb', finisher: 'Helluva Kick', owned: 2, price: 350 },
];

export const MOCK_PACKS = [
    { id: 'p1', name: 'Basic Pack', price: 100, description: '3 Cards. Mostly Common.', image: 'silver-foil', accent: 'from-zinc-400 to-zinc-600', rareChance: 'Low' },
    { id: 'p2', name: 'Silver Pack', price: 250, description: '5 Cards. 1 guaranteed Rare.', image: 'silver-holo', accent: 'from-blue-400 to-blue-600', rareChance: 'Medium' },
    { id: 'p3', name: 'Gold Pack', price: 500, description: '5 Cards. 1 guaranteed Gold.', image: 'gold-foil', accent: 'from-amber-400 to-yellow-600', rareChance: 'High' },
    { id: 'p4', name: 'Legends Pack', price: 1000, description: '5 Cards. 1 guaranteed Legendary.', image: 'legendary-foil', accent: 'from-purple-500 to-purple-800', rareChance: 'Guaranteed' },
];

export const MOCK_USER = {
    username: 'RafiTheChampion',
    level: 27,
    coins: 2450,
    trophies: 318,
    notifications: 2,
};
