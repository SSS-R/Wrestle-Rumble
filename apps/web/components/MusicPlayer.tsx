'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Track = {
    title: string;
    artist: string;
    src: string;
};

const MUSIC_STORAGE_KEY = 'wr_music_enabled';

const basePath = process.env.NODE_ENV === 'production' ? '/Wrestle-Rumble' : '';

const tracks: Track[] = [
    {
        title: 'Metalingus',
        artist: 'Edge',
        src: `${basePath}/music/edge-metalingus.mp3`,
    },
    {
        title: 'Voices',
        artist: 'Randy Orton',
        src: `${basePath}/music/randy-orton-voices.mp3`,
    },
    {
        title: 'Are You Ready?',
        artist: 'D-Generation X',
        src: `${basePath}/music/dx-are-you-ready.mp3`,
    },
    {
        title: 'The Game',
        artist: 'Triple H',
        src: `${basePath}/music/triple-h-the-game.mp3`,
    },
];

function getRandomIndex(excludedIndex: number | null) {
    if (tracks.length <= 1) {
        return 0;
    }

    let nextIndex = Math.floor(Math.random() * tracks.length);

    while (nextIndex === excludedIndex) {
        nextIndex = Math.floor(Math.random() * tracks.length);
    }

    return nextIndex;
}

export function MusicPlayer() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const currentTrack = useMemo(() => tracks[currentIndex], [currentIndex]);

    const shuffleToNextTrack = useCallback(() => {
        setCurrentIndex((current) => getRandomIndex(current));
    }, []);

    useEffect(() => {
        const savedPreference = window.localStorage.getItem(MUSIC_STORAGE_KEY);
        const shouldPlay = savedPreference !== 'false';

        setCurrentIndex(getRandomIndex(null));
        setIsPlaying(shouldPlay);
        setIsReady(true);
    }, []);

    useEffect(() => {
        if (!isReady) {
            return;
        }

        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        audio.pause();
        audio.load();

        if (isPlaying) {
            void audio.play().catch(() => {
                setIsPlaying(false);
                window.localStorage.setItem(MUSIC_STORAGE_KEY, 'false');
            });
        }
    }, [currentIndex, isPlaying, isReady]);

    const handleTogglePlayback = async () => {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
            window.localStorage.setItem(MUSIC_STORAGE_KEY, 'false');
            return;
        }

        try {
            await audio.play();
            setIsPlaying(true);
            window.localStorage.setItem(MUSIC_STORAGE_KEY, 'true');
        } catch {
            setIsPlaying(false);
        }
    };

    const handleNextTrack = () => {
        window.localStorage.setItem(MUSIC_STORAGE_KEY, 'true');
        setIsPlaying(true);
        shuffleToNextTrack();
    };

    return (
        <>
            <audio
                ref={audioRef}
                src={currentTrack.src}
                preload="auto"
                onEnded={shuffleToNextTrack}
            />

            <div
                className="fixed bottom-4 right-0 z-30"
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >
                <div
                    className={`metal-panel chrome-border flex items-center gap-4 rounded-l-2xl px-4 py-3 transition-transform duration-300 ${isExpanded ? 'translate-x-0' : 'translate-x-[calc(100%-64px)]'
                        }`}
                >
                    <button
                        type="button"
                        onClick={() => setIsExpanded((current) => !current)}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/35 text-2xl text-[var(--accent-gold)]"
                        aria-label="Toggle music tray"
                    >
                        💿
                    </button>

                    <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-secondary)]">
                            Arena Music
                        </p>
                        <p className="truncate font-[var(--font-heading)] text-lg uppercase text-white">
                            {currentTrack.title}
                        </p>
                        <p className="truncate text-xs uppercase tracking-[0.18em] text-[var(--accent-gold)]">
                            {currentTrack.artist}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 pr-1">
                        <button
                            type="button"
                            onClick={handleTogglePlayback}
                            className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white"
                        >
                            {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        <button
                            type="button"
                            onClick={handleNextTrack}
                            className="rounded-full bg-[var(--accent-raw)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
