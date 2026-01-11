import type { Metadata, Viewport } from "next"
import { Manrope } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/ui/toast"
import { AuthProvider } from "@/lib/auth-context"
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration"

const manrope = Manrope({
    subsets: ["latin"],
    variable: "--font-manrope",
})

export const metadata: Metadata = {
    title: "MidCar | Gestion de Concesionario",
    description: "Sistema de gestion integral para MidCar - Concesionario de vehiculos de ocasion en Madrid",
    keywords: ["concesionario", "coches", "vehiculos", "CRM", "gestion", "MidCar", "Madrid"],
    authors: [{ name: "MidCar" }],
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "MidCar",
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: [
            { url: "/favicon.ico" },
            { url: "/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
            { url: "/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
        ],
        apple: [
            { url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
        ],
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f6f6f8' },
        { media: '(prefers-color-scheme: dark)', color: '#101622' },
    ],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es" className="light">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className={`${manrope.className} antialiased`} suppressHydrationWarning>
                <AuthProvider>
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                </AuthProvider>
                <ServiceWorkerRegistration />
            </body>
        </html>
    )
}
