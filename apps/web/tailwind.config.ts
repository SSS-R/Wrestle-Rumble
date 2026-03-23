import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './app/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                arena: {
                    black: '#0A0A0F',
                    panel: '#12121A',
                    steel: '#C0C0C8',
                    raw: '#E21A2C',
                    smackdown: '#005BBB',
                    gold: '#D4AF37',
                },
            },
        },
    },
    plugins: [],
};

export default config;
