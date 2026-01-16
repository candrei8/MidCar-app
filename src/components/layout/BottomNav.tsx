"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useMemo, memo } from "react"
import { cn } from "@/lib/utils"

const navItems = [
    {
        href: '/dashboard',
        label: 'Dashboard',
        icon: 'dashboard'
    },
    {
        href: '/inventario',
        label: 'Inventario',
        icon: 'directions_car'
    },
    {
        href: '/crm',
        label: 'CRM',
        icon: 'group'
    },
    {
        href: '/contactos',
        label: 'Contactos',
        icon: 'contacts'
    },
]

const moreItems = [
    {
        href: '/seguro',
        label: 'Seguros',
        icon: 'shield'
    },
    {
        href: '/configuracion',
        label: 'Configuración',
        icon: 'settings'
    },
]

export const BottomNav = memo(function BottomNav() {
    const pathname = usePathname()
    const [isMoreOpen, setIsMoreOpen] = useState(false)

    // Check if current path is in moreItems - memoizado
    const isMoreActive = useMemo(() =>
        moreItems.some(item => pathname === item.href || pathname?.startsWith(item.href)),
        [pathname]
    )

    return (
        <>
            {/* Overlay when menu is open */}
            {isMoreOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                    onClick={() => setIsMoreOpen(false)}
                />
            )}

            {/* More menu popup */}
            {isMoreOpen && (
                <div className="fixed bottom-20 right-4 z-50 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden lg:hidden">
                    {moreItems.map((item) => {
                        const isActive = pathname === item.href ||
                            pathname?.startsWith(item.href)

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={false}
                                onClick={() => setIsMoreOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3",
                                    isActive
                                        ? "bg-blue-50 text-[#135bec]"
                                        : "text-slate-600 hover:bg-slate-50"
                                )}
                                style={{ transition: 'background-color 0.1s ease' }}
                            >
                                <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: '22px' }}
                                >
                                    {item.icon}
                                </span>
                                <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            )}

            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 pb-safe lg:hidden">
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname?.startsWith(item.href))

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={false}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 w-full h-full",
                                    isActive
                                        ? "text-[#135bec]"
                                        : "text-slate-400 hover:text-[#135bec]"
                                )}
                                style={{ transition: 'color 0.1s ease' }}
                            >
                                <span
                                    className={cn(
                                        "material-symbols-outlined",
                                        isActive && "fill-current"
                                    )}
                                    style={{ fontSize: '24px' }}
                                >
                                    {item.icon}
                                </span>
                                <span className={cn(
                                    "text-[10px]",
                                    isActive ? "font-bold" : "font-medium"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}

                    {/* More button */}
                    <button
                        onClick={() => setIsMoreOpen(!isMoreOpen)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 w-full h-full",
                            isMoreActive || isMoreOpen
                                ? "text-[#135bec]"
                                : "text-slate-400 hover:text-[#135bec]"
                        )}
                        style={{ transition: 'color 0.1s ease' }}
                    >
                        <span
                            className={cn(
                                "material-symbols-outlined",
                                (isMoreActive || isMoreOpen) && "fill-current"
                            )}
                            style={{ fontSize: '24px' }}
                        >
                            {isMoreOpen ? 'close' : 'more_horiz'}
                        </span>
                        <span className={cn(
                            "text-[10px]",
                            (isMoreActive || isMoreOpen) ? "font-bold" : "font-medium"
                        )}>
                            Más
                        </span>
                    </button>
                </div>
            </nav>
        </>
    )
})
