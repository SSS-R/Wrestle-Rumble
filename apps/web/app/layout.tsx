import './globals.css';
import type { Metadata } from 'next';
import { Inter, Oswald, Russo_One } from 'next/font/google';
import { ReactNode } from 'react';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-body',
});

const oswald = Oswald({
    subsets: ['latin'],
    variable: '--font-heading',
});

const russoOne = Russo_One({
    subsets: ['latin'],
    weight: '400',
    variable: '--font-display',
});

export const metadata: Metadata = {
    title: 'Wrestle Rumble',
    description: 'WWE-inspired card battle platform built with Next.js and FastAPI.',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

type RootLayoutProps = {
    children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${oswald.variable} ${russoOne.variable}`}>{children}</body>
        </html>
    );
}
