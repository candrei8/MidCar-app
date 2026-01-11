import type { Metadata, Viewport } from "next"
import { Manrope } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/ui/toast"
import { AuthProvider } from "@/lib/auth-context"

const manrope = Manrope({
    subsets: ["latin"],
    variable: "--font-manrope",
})

export const metadata: Metadata = {
    title: "MidCar | Gestión de Concesionario",
    description: "Sistema de gestión integral para MidCar - Concesionario de vehículos de ocasión en Madrid",
    keywords: ["concesionario", "coches", "vehículos", "CRM", "gestión", "MidCar", "Madrid"],
    authors: [{ name: "MidCar" }],
    icons: {
        icon: "/favicon.ico",
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
            </body>
        </html>
    )
}
