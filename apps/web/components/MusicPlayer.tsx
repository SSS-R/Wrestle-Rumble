'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Track = {
    title: string;
    artist: string;
    src: string;
};

const MUSIC_STORAGE_KEY = 'wr_music_enabled';

const tracks: Track[] = [
    {
        title: 'Metalingus',
        artist: 'Edge',
        src: '/music/edge-metalingus.mp3',
    },
    {
        title: 'Voices',
        artist: 'Randy Orton ft. Rev Theory',
        src: '/music/randy-orton-voices.mp3',
    },
    {
        title: 'Are You Ready?',
        artist: 'D-Generation X',
        src: '/music/dx-are-you-ready.mp3',
    },
    {
        title: 'The Game',
        artist: 'Triple H',
        src: '/music/triple-h-the-game.mp3',
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

            <div className="metal-panel chrome-border fixed bottom-4 left-4 right-4 z-30 rounded-2xl px-4 py-3 md:left-auto md:right-6 md:w-[380px]">
                <div className="flex items-center justify-between gap-4">
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

                    <div className="flex items-center gap-2">
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
                            Shuffle Next
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
