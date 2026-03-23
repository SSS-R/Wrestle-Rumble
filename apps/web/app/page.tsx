const featureGroups = [
    {
        title: 'Player Systems',
        items: ['Account creation', 'Secure login', 'Profile stats and collection'],
    },
    {
        title: 'Card Loop',
        items: ['WWE card catalog', 'Daily pack opening', 'Coins + store economy'],
    },
    {
        title: 'Competitive Loop',
        items: ['Friend-only trading', 'PvP arena fights', 'Trophy leaderboard'],
    },
];

export default function HomePage() {
    return (
        <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-12">
            <section className="rounded-3xl border border-arena-steel/20 bg-arena-panel/80 p-8 shadow-2xl shadow-black/30 backdrop-blur">
                <p className="mb-3 text-sm uppercase tracking-[0.3em] text-arena-gold">
                    Wrestle Rumble MVP Scaffold
                </p>
                <h1 className="mb-4 text-5xl font-black uppercase tracking-tight text-white">
                    Enter the arena.
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-zinc-300">
                    This repository is structured for a Next.js frontend and FastAPI backend based on the
                    initial product idea and current UI direction.
                </p>
            </section>

            <section className="mt-8 grid gap-6 md:grid-cols-3">
                {featureGroups.map((group) => (
                    <article
                        key={group.title}
                        className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                    >
                        <h2 className="mb-4 text-2xl font-bold text-arena-gold">{group.title}</h2>
                        <ul className="space-y-3 text-zinc-200">
                            {group.items.map((item) => (
                                <li key={item} className="rounded-lg border border-white/5 bg-black/20 px-4 py-3">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
            </section>
        </main>
    );
}
