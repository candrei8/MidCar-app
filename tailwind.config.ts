import type { Config } from "tailwindcss"

const config: Config = {
    darkMode: ["class"],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Premium Dark Theme - Refined Neutrals
                background: "#080808",
                foreground: "#f0f0f0",

                // Primary - Refined Red
                primary: {
                    DEFAULT: "#dc2626",
                    hover: "#c41e1e",
                    light: "#ef4444",
                    dark: "#a91d1d",
                    50: "#fef2f2",
                    100: "#fee2e2",
                    500: "#dc2626",
                    600: "#c41e1e",
                    700: "#a91d1d",
                    900: "#7f1d1d",
                },

                // Cards and surfaces - More refined
                card: {
                    DEFAULT: "#121212",
                    hover: "#181818",
                    border: "rgba(255, 255, 255, 0.06)",
                    foreground: "#f0f0f0",
                },

                // Muted - Refined grays
                muted: {
                    DEFAULT: "#505050",
                    foreground: "#808080",
                },

                // Status colors - Slightly softer
                success: "#10b981",
                warning: "#f59e0b",
                danger: "#ef4444",
                info: "#3b82f6",

                // Surface variants - More nuanced
                surface: {
                    50: "#080808",
                    100: "#0f0f0f",
                    200: "#141414",
                    300: "#1a1a1a",
                    400: "#202020",
                    500: "#2a2a2a",
                    600: "#363636",
                },

                // Border colors
                border: {
                    DEFAULT: "rgba(255, 255, 255, 0.06)",
                    subtle: "rgba(255, 255, 255, 0.04)",
                    medium: "rgba(255, 255, 255, 0.1)",
                    strong: "rgba(255, 255, 255, 0.15)",
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
            },
            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
                'sm': ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0' }],
                'base': ['0.875rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
                'lg': ['1rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
                'xl': ['1.125rem', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
                '2xl': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
                '3xl': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
                '4xl': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
            },
            boxShadow: {
                'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
                'sm': '0 2px 4px 0 rgba(0, 0, 0, 0.3)',
                'card': '0 4px 8px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
                'card-hover': '0 8px 16px -2px rgba(0, 0, 0, 0.5), 0 4px 8px -4px rgba(0, 0, 0, 0.4)',
                'elevated': '0 16px 32px -4px rgba(0, 0, 0, 0.6), 0 8px 16px -8px rgba(0, 0, 0, 0.5)',
                'glow': '0 0 30px rgba(220, 38, 38, 0.25)',
                'glow-sm': '0 0 15px rgba(220, 38, 38, 0.2)',
                'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.4)',
                'inner-lg': 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.5)',
            },
            backdropBlur: {
                xs: '2px',
                sm: '4px',
                DEFAULT: '12px',
                lg: '20px',
                xl: '32px',
            },
            animation: {
                'fade-in': 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                'slide-up': 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                'slide-down': 'slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                'scale-in': 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                'gauge-fill': 'gaugeFill 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 4s linear infinite',
                'shimmer': 'shimmer 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.96)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                gaugeFill: {
                    '0%': { strokeDashoffset: '100' },
                    '100%': { strokeDashoffset: 'var(--gauge-value)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            borderRadius: {
                'xl': '0.875rem',
                'lg': '0.625rem',
                'md': '0.5rem',
                'sm': '0.375rem',
            },
            transitionTimingFunction: {
                'premium': 'cubic-bezier(0.4, 0, 0.2, 1)',
                'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            },
            spacing: {
                '18': '4.5rem',
                '22': '5.5rem',
            },
        },
    },
    plugins: [],
}

export default config
