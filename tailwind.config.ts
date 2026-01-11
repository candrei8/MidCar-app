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
                // Stitch Design System Colors
                primary: {
                    DEFAULT: "#135bec",
                    hover: "#0d4ed3",
                    light: "#3d7af0",
                    dark: "#0a3da3",
                },

                // Background colors
                background: {
                    light: "#f6f6f8",
                    dark: "#101622",
                },

                // Surface colors
                surface: {
                    light: "#ffffff",
                    dark: "#1a2230",
                    "dark-hover": "#232d3f",
                },

                // Text colors
                text: {
                    primary: {
                        light: "#111318",
                        dark: "#ffffff",
                    },
                    secondary: {
                        light: "#616f89",
                        dark: "#9ca3af",
                    },
                    muted: {
                        light: "#9ca3af",
                        dark: "#6b7280",
                    },
                },

                // Border colors
                border: {
                    light: "#dbdfe6",
                    dark: "#2a3447",
                    "dark-subtle": "rgba(255, 255, 255, 0.1)",
                },

                // Status colors
                success: {
                    DEFAULT: "#10b981",
                    light: "#d1fae5",
                    dark: "rgba(16, 185, 129, 0.3)",
                },
                warning: {
                    DEFAULT: "#f59e0b",
                    light: "#fef3c7",
                    dark: "rgba(245, 158, 11, 0.3)",
                },
                danger: {
                    DEFAULT: "#ef4444",
                    light: "#fee2e2",
                    dark: "rgba(239, 68, 68, 0.3)",
                },
                info: {
                    DEFAULT: "#3b82f6",
                    light: "#dbeafe",
                    dark: "rgba(59, 130, 246, 0.3)",
                },

                // Slate variants for Stitch compatibility
                slate: {
                    100: "#f1f5f9",
                    200: "#e2e8f0",
                    300: "#cbd5e1",
                    400: "#94a3b8",
                    500: "#64748b",
                    600: "#475569",
                    700: "#334155",
                    800: "#1e293b",
                    900: "#0f172a",
                },

                // Gray variants
                gray: {
                    50: "#f9fafb",
                    100: "#f3f4f6",
                    200: "#e5e7eb",
                    300: "#d1d5db",
                    400: "#9ca3af",
                    500: "#6b7280",
                    600: "#4b5563",
                    700: "#374151",
                    800: "#1f2937",
                },
            },
            fontFamily: {
                display: ["Manrope", "sans-serif"],
                body: ["Noto Sans", "sans-serif"],
            },
            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1.4' }],
                'sm': ['0.875rem', { lineHeight: '1.5' }],
                'base': ['1rem', { lineHeight: '1.6' }],
                'lg': ['1.125rem', { lineHeight: '1.5' }],
                'xl': ['1.25rem', { lineHeight: '1.4' }],
                '2xl': ['1.5rem', { lineHeight: '1.3' }],
                '3xl': ['2rem', { lineHeight: '1.2' }],
            },
            boxShadow: {
                'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                'primary': '0 4px 14px 0 rgba(19, 91, 236, 0.3)',
            },
            borderRadius: {
                'DEFAULT': '0.25rem',
                'lg': '0.5rem',
                'xl': '0.75rem',
                '2xl': '1rem',
                'full': '9999px',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
            spacing: {
                'safe': 'env(safe-area-inset-bottom)',
            },
        },
    },
    plugins: [],
}

export default config
