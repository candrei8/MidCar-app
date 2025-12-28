"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    Car,
    MessageSquare,
    BarChart3,
    Settings,
    Search,
    Bell,
    ChevronDown,
    LogOut,
    User,
    Menu,
    X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useState } from "react"

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/crm', label: 'CRM', icon: Users },
    { href: '/inventario', label: 'Inventario', icon: Car },
    { href: '/reportes', label: 'Reportes', icon: BarChart3 },
    { href: '/configuracion', label: 'Ajustes', icon: Settings },
]

// Mock notifications
const mockNotifications = [
    { id: '1', tipo: 'lead', titulo: 'Nuevo lead web', mensaje: 'Carlos García interesado en BMW Serie 3', leida: false },
    { id: '2', tipo: 'venta', titulo: 'Venta completada', mensaje: 'Volkswagen Golf vendido por María López', leida: false },
    { id: '3', tipo: 'alerta', titulo: 'Vehículo 60+ días', mensaje: 'Audi A4 lleva 65 días en stock', leida: true },
]

export function Header() {
    const pathname = usePathname()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const unreadCount = mockNotifications.filter(n => !n.leida).length

    return (
        <>
            {/* Ultra Premium Header */}
            <header className="sticky top-0 z-50 w-full">
                {/* Top highlight line */}
                <div className="h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                {/* Main header */}
                <div className="bg-black/80 backdrop-blur-xl border-b border-white/[0.03]">
                    <div className="flex h-12 items-center px-4 lg:px-6">
                        {/* Mobile menu button */}
                        <button
                            className="lg:hidden mr-3 p-1.5 rounded-md hover:bg-white/[0.04] transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-4 w-4 text-white/60" /> : <Menu className="h-4 w-4 text-white/60" />}
                        </button>

                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center gap-2.5 mr-8 group">
                            <div className="relative">
                                <div className="w-6 h-6 bg-gradient-to-br from-red-500 via-red-600 to-red-800 rounded-md flex items-center justify-center shadow-lg shadow-red-900/30 group-hover:shadow-red-500/40 transition-shadow">
                                    <span className="text-white font-bold text-[10px]">M</span>
                                </div>
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-red-500/20 rounded-md blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="font-semibold text-xs text-white/80 hidden sm:inline tracking-wide uppercase">MidCar</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-0.5">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== '/dashboard' && pathname?.startsWith(item.href))
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "relative px-3 py-1.5 rounded-md flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider transition-all duration-300",
                                            isActive
                                                ? "text-white bg-white/[0.06]"
                                                : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                                        )}
                                    >
                                        <item.icon className="h-3.5 w-3.5" />
                                        <span>{item.label}</span>
                                        {isActive && (
                                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent rounded-full" />
                                        )}
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Right side */}
                        <div className="ml-auto flex items-center gap-1.5">
                            {/* Search */}
                            <div className="hidden md:flex relative group">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20 group-focus-within:text-white/40 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="w-[140px] h-7 pl-7 pr-3 text-[11px] bg-white/[0.02] border border-white/[0.04] rounded-md text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/[0.08] focus:bg-white/[0.03] focus:w-[180px] transition-all duration-300"
                                />
                            </div>

                            {/* Notifications */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="relative p-1.5 rounded-md hover:bg-white/[0.04] transition-colors group">
                                        <Bell className="h-3.5 w-3.5 text-white/40 group-hover:text-white/60 transition-colors" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center shadow-lg shadow-red-500/50">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-72 glass border-white/[0.04] p-0">
                                    <div className="px-3 py-2 flex justify-between items-center border-b border-white/[0.04]">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Notificaciones</span>
                                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">{unreadCount} nuevas</span>
                                    </div>
                                    <div className="max-h-[280px] overflow-y-auto">
                                        {mockNotifications.map((notification) => (
                                            <div key={notification.id} className="px-3 py-2.5 hover:bg-white/[0.02] cursor-pointer border-b border-white/[0.02] last:border-0 transition-colors">
                                                <div className="flex items-start gap-2">
                                                    <span className={cn(
                                                        "w-1.5 h-1.5 rounded-full mt-1 shrink-0",
                                                        notification.leida ? "bg-white/10" : "bg-red-500 shadow-sm shadow-red-500/50"
                                                    )} />
                                                    <div>
                                                        <p className="text-[11px] font-medium text-white/70">{notification.titulo}</p>
                                                        <p className="text-[10px] text-white/30 mt-0.5">{notification.mensaje}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-3 py-2 border-t border-white/[0.04]">
                                        <button className="w-full text-center text-[10px] font-medium text-red-400 hover:text-red-300 transition-colors">
                                            Ver todas las notificaciones
                                        </button>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Divider */}
                            <div className="hidden md:block w-[1px] h-4 bg-white/[0.06] mx-1" />

                            {/* User menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/[0.04] transition-colors group">
                                        <div className="relative">
                                            <Avatar className="h-5 w-5">
                                                <AvatarImage src="/avatars/user.jpg" />
                                                <AvatarFallback className="text-[8px] font-semibold bg-gradient-to-br from-gray-700 to-gray-900 text-white/60">AD</AvatarFallback>
                                            </Avatar>
                                            {/* Online indicator */}
                                            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-black" />
                                        </div>
                                        <span className="hidden md:block text-[10px] font-medium text-white/60 group-hover:text-white/80 transition-colors">Admin</span>
                                        <ChevronDown className="hidden md:block h-2.5 w-2.5 text-white/20" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 glass border-white/[0.04] p-0">
                                    <div className="px-3 py-2.5 border-b border-white/[0.04]">
                                        <p className="text-[11px] font-medium text-white/80">Admin Demo</p>
                                        <p className="text-[10px] text-white/30">admin@midcar.es</p>
                                    </div>
                                    <div className="py-1">
                                        <DropdownMenuItem className="px-3 py-2 text-[11px] text-white/60 hover:text-white/80 hover:bg-white/[0.03] cursor-pointer">
                                            <User className="mr-2 h-3.5 w-3.5" />
                                            Mi perfil
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="px-3 py-2 text-[11px] text-white/60 hover:text-white/80 hover:bg-white/[0.03] cursor-pointer">
                                            <Settings className="mr-2 h-3.5 w-3.5" />
                                            Configuración
                                        </DropdownMenuItem>
                                    </div>
                                    <div className="border-t border-white/[0.04] py-1">
                                        <DropdownMenuItem className="px-3 py-2 text-[11px] text-red-400/80 hover:text-red-400 hover:bg-red-500/5 cursor-pointer">
                                            <LogOut className="mr-2 h-3.5 w-3.5" />
                                            Cerrar sesión
                                        </DropdownMenuItem>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation - Premium Slide */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 top-[49px] z-40">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />

                    {/* Menu */}
                    <nav className="absolute top-0 left-0 w-64 h-full glass border-r border-white/[0.04] p-4 animate-in">
                        <div className="space-y-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== '/dashboard' && pathname?.startsWith(item.href))
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                                            isActive
                                                ? "bg-red-500/10 text-red-400"
                                                : "text-white/40 hover:bg-white/[0.03] hover:text-white/70"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span className="text-xs font-medium uppercase tracking-wide">{item.label}</span>
                                    </Link>
                                )
                            })}
                        </div>

                        {/* Mobile Search */}
                        <div className="mt-6 pt-6 border-t border-white/[0.04]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="w-full h-9 pl-9 pr-3 text-xs bg-white/[0.02] border border-white/[0.04] rounded-lg text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/[0.08]"
                                />
                            </div>
                        </div>
                    </nav>
                </div>
            )}
        </>
    )
}
