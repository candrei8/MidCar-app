"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
import { mockVehicles, mockClients } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { ViewToggle } from "@/components/auth/ViewToggle"
import { LogOut } from "lucide-react"

const desktopNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/inventario', label: 'Inventario', icon: 'directions_car' },
    { href: '/crm', label: 'CRM', icon: 'group' },
    { href: '/contactos', label: 'Contactos', icon: 'contacts' },
    { href: '/seguro', label: 'Seguros', icon: 'shield' },
    { href: '/informes', label: 'Informes', icon: 'bar_chart' },
    { href: '/reportes', label: 'Reportes', icon: 'summarize' },
]


type SearchResult = {
    id: string
    type: 'vehiculo' | 'cliente' | 'lead'
    title: string
    subtitle: string
    url: string
    icon: string
}

export function Header() {
    const pathname = usePathname()
    const router = useRouter()
    const { profile, signOut, isFullView } = useAuth()
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [showResults, setShowResults] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)
    const userMenuRef = useRef<HTMLDivElement>(null)

    const userName = profile ? `${profile.nombre} ${profile.apellidos}` : 'Usuario'

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false)
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSignOut = async () => {
        await signOut()
        router.push("/login")
    }

    // Search logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length < 2) {
                setSearchResults([])
                return
            }

            const results: SearchResult[] = []
            const query = searchQuery.toLowerCase()

            mockVehicles.slice(0, 3).forEach(v => {
                if (
                    v.marca.toLowerCase().includes(query) ||
                    v.modelo.toLowerCase().includes(query) ||
                    v.matricula.toLowerCase().includes(query)
                ) {
                    results.push({
                        id: v.id,
                        type: 'vehiculo',
                        title: `${v.marca} ${v.modelo}`,
                        subtitle: `${v.matricula} • ${v.estado}`,
                        url: `/inventario/${v.id}`,
                        icon: 'directions_car'
                    })
                }
            })

            mockClients.slice(0, 2).forEach(c => {
                if (
                    c.nombre.toLowerCase().includes(query) ||
                    c.apellidos.toLowerCase().includes(query)
                ) {
                    results.push({
                        id: c.id,
                        type: 'cliente',
                        title: `${c.nombre} ${c.apellidos}`,
                        subtitle: c.email,
                        url: `/contactos`,
                        icon: 'person'
                    })
                }
            })

            setSearchResults(results.slice(0, 5))
            setShowResults(true)
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const handleResultClick = (url: string) => {
        router.push(url)
        setShowResults(false)
        setSearchQuery("")
    }

    return (
        <>
            {/* Mobile Header */}
            <header className="lg:hidden sticky top-0 z-20 flex items-center bg-white p-4 shadow-sm justify-between border-b border-slate-100">
                {/* User Avatar */}
                <div className="flex items-center gap-3">
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-[#135bec]/20"
                        style={{ backgroundImage: profile?.avatar_url ? `url("${profile.avatar_url}")` : 'url("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face")' }}
                    />
                    <div>
                        <h2 className="text-slate-900 text-lg font-bold leading-tight">
                            Hola, {profile?.nombre || 'Usuario'}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">
                            {isFullView ? 'Visión Completa' : 'Mi Vista'}
                        </p>
                    </div>
                </div>
                <ViewToggle />
            </header>

            {/* Desktop Header */}
            <header className="hidden lg:flex sticky top-0 z-20 items-center bg-white px-6 py-3 shadow-sm border-b border-slate-100">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2 mr-8">
                    <div className="w-8 h-8 bg-[#135bec] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <span className="font-bold text-lg text-slate-900">
                        MidCar
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="flex items-center gap-1">
                    {desktopNavItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname?.startsWith(item.href))
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-[#135bec]/10 text-[#135bec]"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Right side */}
                <div className="ml-auto flex items-center gap-4">
                    {/* Search */}
                    <div ref={searchRef} className="relative">
                        <div className="flex items-center h-10 rounded-xl bg-[#f6f6f8] shadow-sm border border-transparent focus-within:border-[#135bec] focus-within:ring-1 focus-within:ring-[#135bec]/20">
                            <div className="flex items-center justify-center pl-4 text-slate-500">
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                                placeholder="Buscar..."
                                className="w-48 bg-transparent border-none text-slate-900 placeholder:text-slate-400 focus:ring-0 px-3 text-sm"
                            />
                        </div>

                        {/* Search Results */}
                        {showResults && searchQuery.length >= 2 && (
                            <div className="absolute top-full mt-2 left-0 w-72 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in">
                                <div className="py-1">
                                    {searchResults.length > 0 ? (
                                        searchResults.map((result) => (
                                            <button
                                                key={`${result.type}-${result.id}`}
                                                onClick={() => handleResultClick(result.url)}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-slate-500" style={{ fontSize: '20px' }}>
                                                        {result.icon}
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">
                                                            {result.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {result.subtitle}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-6 text-center text-sm text-slate-500">
                                            No se encontraron resultados
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* View Toggle */}
                    <ViewToggle />

                    {/* User */}
                    <div ref={userMenuRef} className="relative flex items-center gap-3 pl-4 border-l border-slate-200">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                            <div
                                className="bg-center bg-no-repeat bg-cover rounded-full size-9"
                                style={{ backgroundImage: profile?.avatar_url ? `url("${profile.avatar_url}")` : 'url("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face")' }}
                            />
                            <div className="hidden xl:block text-left">
                                <p className="text-sm font-medium text-slate-900">
                                    {userName}
                                </p>
                            </div>
                        </button>

                        {/* User Menu Dropdown */}
                        {showUserMenu && (
                            <div className="absolute top-full mt-2 right-0 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in">
                                <div className="p-3 border-b border-slate-100">
                                    <p className="text-sm font-medium text-slate-900">{userName}</p>
                                    <p className="text-xs text-slate-500">{profile?.email}</p>
                                </div>
                                <div className="p-2">
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Cerrar sesión
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    )
}