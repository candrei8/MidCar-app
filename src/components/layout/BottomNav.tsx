"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
    {
        href: '/dashboard',
        label: 'Inicio',
        icon: 'dashboard'
    },
    {
        href: '/inventario',
        label: 'Inventario',
        icon: 'directions_car'
    },
    {
        href: '/crm',
        label: 'Ventas',
        icon: 'euro_symbol',
        badge: true
    },
    {
        href: '/contactos',
        label: 'Clientes',
        icon: 'group'
    },
]

export function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 pb-safe lg:hidden">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname?.startsWith(item.href))

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
                                isActive
                                    ? "text-[#135bec]"
                                    : "text-slate-400 hover:text-[#135bec]"
                            )}
                        >
                            <div className="relative">
                                <span
                                    className={cn(
                                        "material-symbols-outlined",
                                        isActive && "fill-current"
                                    )}
                                    style={{ fontSize: '24px' }}
                                >
                                    {item.icon}
                                </span>
                                {item.badge && (
                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white" />
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px]",
                                isActive ? "font-bold" : "font-medium"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
