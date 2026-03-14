"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { useFilteredData } from "@/hooks/useFilteredData"
import { ViewToggle } from "@/components/auth/ViewToggle"
import { LogOut } from "lucide-react"

const desktopNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/inventario', label: 'Inventario', icon: 'directions_car' },
    { href: '/crm', label: 'CRM', icon: 'group' },
    { href: '/contactos', label: 'Contactos', icon: 'contacts' },
    { href: '/seguro', label: 'Seguros', icon: 'shield' },
    { href: '/gestion-web', label: 'Gestión Web', icon: 'language' },
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
    const { vehicles, clients } = useFilteredData()
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [showResults, setShowResults] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)
    const userMenuRef = useRef<HTMLDivElement>(null)

    const userName = profile ? `${profile.nombre} ${profile.apellidos}` : 'Usuario'

    const [showMobileSearch, setShowMobileSearch] = useState(false)
    const mobileSearchRef = useRef<HTMLDivElement>(null)

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                // Only close if we didn't click inside the mobile search either
                if (!mobileSearchRef.current || !mobileSearchRef.current.contains(event.target as Node)) {
                    setShowResults(false)
                }
            }
            if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
                if (!searchRef.current || !searchRef.current.contains(event.target as Node)) {
                    setShowResults(false)
                }
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

    // Search logic - optimizado con debounce más corto
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([])
            return
        }

        const timer = setTimeout(() => {
            const results: SearchResult[] = []
            const query = searchQuery.toLowerCase()
            const maxResults = 5

            // Search in vehicles (con early exit)
            for (const v of vehicles) {
                if (results.length >= maxResults) break
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
            }

            // Search in clients (con early exit)
            for (const c of clients) {
                if (results.length >= maxResults) break
                if (
                    c.nombre?.toLowerCase().includes(query) ||
                    c.apellidos?.toLowerCase().includes(query)
                ) {
                    results.push({
                        id: c.id,
                        type: 'cliente',
                        title: `${c.nombre || ''} ${c.apellidos || ''}`.trim(),
                        subtitle: c.email || '',
                        url: `/contactos`,
                        icon: 'person'
                    })
                }
            }

            setSearchResults(results)
            setShowResults(true)
        }, 150)

        return () => clearTimeout(timer)
    }, [searchQuery, vehicles, clients])

    const handleResultClick = (url: string) => {
        router.push(url)
        setShowResults(false)
        setSearchQuery("")
        setShowMobileSearch(false)
    }

    return (
        <>
            {/* Mobile Header */}
            <header className="lg:hidden sticky top-0 z-20 bg-white shadow-sm border-b border-slate-100">
                <div className="flex items-center justify-between p-4">
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

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowMobileSearch(!showMobileSearch)}
                            className={cn(
                                "flex items-center justify-center size-9 rounded-full transition-colors",
                                showMobileSearch ? "bg-[#135bec]/10 text-[#135bec]" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                            )}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                                {showMobileSearch ? 'close' : 'search'}
                            </span>
                        </button>
                        <ViewToggle />
                    </div>
                </div>

                {/* Mobile Search Bar Expandable */}
                {showMobileSearch && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                        <div ref={mobileSearchRef} className="relative">
                            <div className="flex items-center h-12 rounded-xl bg-slate-100 shadow-inner border border-transparent focus-within:border-[#135bec]/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#135bec]/10 transition-all">
                                <div className="flex items-center justify-center pl-4 text-slate-400">
                                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>search</span>
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                                    placeholder="Buscar vehículos, contactos..."
                                    className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 focus:ring-0 px-3 text-base"
                                    autoFocus
                                />
                            </div>

                            {/* Search Results (Mobile) */}
                            {showResults && searchQuery.length >= 2 && (
                                <div className="absolute top-full mt-2 left-0 right-0 max-h-[60vh] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-in fade-in">
                                    <div className="py-2">
                                        {searchResults.length > 0 ? (
                                            searchResults.map((result) => (
                                                <button
                                                    key={`${result.type}-${result.id}`}
                                                    onClick={() => handleResultClick(result.url)}
                                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                            <span className="material-symbols-outlined text-slate-500" style={{ fontSize: '20px' }}>
                                                                {result.icon}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-900 truncate">
                                                                {result.title}
                                                            </p>
                                                            <p className="text-xs text-slate-500 truncate mt-0.5">
                                                                {result.subtitle}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-8 flex flex-col items-center justify-center text-center">
                                                <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">search_off</span>
                                                <p className="text-sm font-semibold text-slate-700">No hay resultados</p>
                                                <p className="text-xs text-slate-500 mt-1">Prueba con otra palabra clave</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
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
                                    <Link
                                        href="/configuracion"
                                        onClick={() => setShowUserMenu(false)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings</span>
                                        Configuración
                                    </Link>
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