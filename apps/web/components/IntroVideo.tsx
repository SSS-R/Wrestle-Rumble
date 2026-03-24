'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const INTRO_KEY = 'wr_intro_seen';
const INTRO_VIDEO_PATH = '/videos/wrestle-rumble-intro.mp4';

export function IntroVideo() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [showSkip, setShowSkip] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    const stopIntroPlayback = () => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        video.pause();
        video.currentTime = 0;
    };

    const preloadLink = useMemo(() => {
        if (typeof document === 'undefined') {
            return null;
        }

        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = INTRO_VIDEO_PATH;

        return link;
    }, []);

    useEffect(() => {
        if (sessionStorage.getItem(INTRO_KEY) === 'true') {
            router.replace('/lobby');
            return;
        }

        if (preloadLink) {
            document.head.appendChild(preloadLink);
        }

        const handleSkip = (event: KeyboardEvent) => {
            if (hasStarted && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                handleExit();
            }
        };

        window.addEventListener('keydown', handleSkip);

        return () => {
            window.removeEventListener('keydown', handleSkip);
            preloadLink?.remove();
        };
    }, [hasStarted, preloadLink, router]);

    const handleExit = () => {
        if (isLeaving) {
            return;
        }

        stopIntroPlayback();
        sessionStorage.setItem(INTRO_KEY, 'true');
        setIsLeaving(true);
        window.setTimeout(() => router.replace('/lobby'), 500);
    };

    const handleStartGame = async () => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        try {
            video.muted = false;
            await video.play();
            setHasStarted(true);
            window.setTimeout(() => setShowSkip(true), 2000);
        } catch {
            setHasStarted(false);
        }
    };

    return (
        <main className="page-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white">
            <video
                ref={videoRef}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${isLeaving ? 'opacity-0' : 'opacity-100'
                    }`}
                playsInline
                preload="auto"
                onEnded={handleExit}
            >
                <source src={INTRO_VIDEO_PATH} type="video/mp4" />
            </video>

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/40" />

            {!hasStarted ? (
                <button
                    type="button"
                    onClick={handleStartGame}
                    className="metal-panel chrome-border absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full px-6 py-4 text-sm font-bold uppercase tracking-[0.26em] text-white"
                >
                    Start Game ▶
                </button>
            ) : null}

            <div className="absolute left-6 top-6 rounded-full border border-white/20 bg-black/35 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-zinc-300 backdrop-blur-md md:left-10 md:top-10">
                Wrestle Rumble Intro
            </div>

            <button
                type="button"
                onClick={handleExit}
                className={`absolute bottom-8 right-6 rounded-full border border-white/15 bg-black/45 px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-200 backdrop-blur-md transition-all duration-500 md:bottom-10 md:right-10 ${showSkip ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                    }`}
            >
                Press Enter or Space to skip ▸
            </button>
        </main>
    );
}
