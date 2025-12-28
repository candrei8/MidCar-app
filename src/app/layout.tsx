import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "MidCar | Gestión de Concesionario Premium",
    description: "Sistema de gestión integral para MidCar - Concesionario de vehículos de ocasión en Madrid",
    keywords: ["concesionario", "coches", "vehículos", "CRM", "gestión", "MidCar", "Madrid"],
    authors: [{ name: "MidCar" }],
    icons: {
        icon: "/favicon.ico",
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es" className="dark">
            <body className={inter.className}>
                {children}
            </body>
        </html>
    )
}
