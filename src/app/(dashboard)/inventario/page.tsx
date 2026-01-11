"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { formatCurrency, cn } from "@/lib/utils"
import { MARCAS, COMBUSTIBLES } from "@/lib/constants"
import type { Vehicle } from "@/types"
import { useFilteredData } from "@/hooks/useFilteredData"

type StatusFilterType = 'todos' | 'disponible' | 'reservado' | 'vendido'
type PriceRangeType = 'todos' | 'bajo' | 'medio' | 'alto' | 'premium'
type YearRangeType = 'todos' | 'nuevo' | 'reciente' | 'medio' | 'antiguo'

export default function InventarioPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<StatusFilterType>("todos")
    const [brandFilter, setBrandFilter] = useState<string>("todos")
    const [fuelFilter, setFuelFilter] = useState<string>("todos")
    const [priceFilter, setPriceFilter] = useState<PriceRangeType>("todos")
    const [yearFilter, setYearFilter] = useState<YearRangeType>("todos")
    const [showFilters, setShowFilters] = useState(false)

    // Obtener vehículos filtrados por vista (Mi Vista vacío / Visión Completa con datos)
    const { vehicles: baseVehicles, isFullView } = useFilteredData()

    // Count active filters
    const activeFiltersCount = useMemo(() => {
        let count = 0
        if (statusFilter !== "todos") count++
        if (brandFilter !== "todos") count++
        if (fuelFilter !== "todos") count++
        if (priceFilter !== "todos") count++
        if (yearFilter !== "todos") count++
        return count
    }, [statusFilter, brandFilter, fuelFilter, priceFilter, yearFilter])

    // Filter vehicles
    const filteredVehicles = useMemo(() => {
        return baseVehicles.filter(vehicle => {
            const searchLower = searchQuery.toLowerCase()
            const matchesSearch =
                vehicle.marca.toLowerCase().includes(searchLower) ||
                vehicle.modelo.toLowerCase().includes(searchLower) ||
                vehicle.matricula.toLowerCase().includes(searchLower)

            const matchesStatus = statusFilter === "todos" || vehicle.estado === statusFilter
            const matchesBrand = brandFilter === "todos" || vehicle.marca === brandFilter
            const matchesFuel = fuelFilter === "todos" || vehicle.combustible === fuelFilter

            // Price ranges
            let matchesPrice = true
            if (priceFilter === "bajo") matchesPrice = vehicle.precio_venta < 10000
            else if (priceFilter === "medio") matchesPrice = vehicle.precio_venta >= 10000 && vehicle.precio_venta < 20000
            else if (priceFilter === "alto") matchesPrice = vehicle.precio_venta >= 20000 && vehicle.precio_venta < 30000
            else if (priceFilter === "premium") matchesPrice = vehicle.precio_venta >= 30000

            // Year ranges
            let matchesYear = true
            const year = vehicle.año_matriculacion
            if (yearFilter === "nuevo") matchesYear = year >= 2024
            else if (yearFilter === "reciente") matchesYear = year >= 2020 && year < 2024
            else if (yearFilter === "medio") matchesYear = year >= 2015 && year < 2020
            else if (yearFilter === "antiguo") matchesYear = year < 2015

            return matchesSearch && matchesStatus && matchesBrand && matchesFuel && matchesPrice && matchesYear
        })
    }, [searchQuery, statusFilter, brandFilter, fuelFilter, priceFilter, yearFilter])

    // Stats
    const stats = {
        total: baseVehicles.length,
        disponible: baseVehicles.filter(v => v.estado === 'disponible').length,
        reservado: baseVehicles.filter(v => v.estado === 'reservado').length,
        vendido: baseVehicles.filter(v => v.estado === 'vendido').length,
    }

    // Get unique brands from vehicles
    const availableBrands = useMemo(() => {
        const brands = new Set(baseVehicles.map(v => v.marca))
        return Array.from(brands).sort()
    }, [])

    const clearAllFilters = () => {
        setSearchQuery("")
        setStatusFilter("todos")
        setBrandFilter("todos")
        setFuelFilter("todos")
        setPriceFilter("todos")
        setYearFilter("todos")
    }

    const getStatusBadge = (estado: string) => {
        const config: Record<string, { bg: string, text: string }> = {
            'disponible': { bg: 'bg-green-500/90', text: 'Disponible' },
            'reservado': { bg: 'bg-amber-500/90', text: 'Reservado' },
            'vendido': { bg: 'bg-slate-500/90', text: 'Vendido' },
            'en_transito': { bg: 'bg-blue-500/90', text: 'En Tránsito' },
        }
        return config[estado] || { bg: 'bg-slate-500/90', text: estado }
    }

    return (
        <div className="min-h-screen bg-[#f6f6f8] flex flex-col">
            {/* Sticky Header */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
                {/* Top App Bar */}
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center">
                        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Inventario</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500 hidden sm:inline">{stats.total} vehículos</span>
                        {/* Desktop Add Button */}
                        <Link
                            href="/inventario/nuevo"
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#135bec] text-white rounded-lg font-semibold text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Añadir Vehículo
                        </Link>
                    </div>
                </div>

                {/* Search Bar + Filter Toggle */}
                <div className="px-4 pb-2 flex gap-2">
                    <div className="group flex flex-1 items-center rounded-xl bg-slate-100 h-11 border-2 border-transparent focus-within:border-[#135bec]/50 focus-within:bg-white transition-all duration-200">
                        <div className="flex items-center justify-center pl-3 pr-2 text-slate-400 group-focus-within:text-[#135bec] transition-colors">
                            <span className="material-symbols-outlined text-[22px]">search</span>
                        </div>
                        <input
                            className="flex w-full bg-transparent border-none text-base font-medium placeholder:text-slate-400 focus:ring-0 text-slate-900 h-full p-0 pr-4"
                            placeholder="Buscar marca, modelo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Filter Toggle Button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 h-11 rounded-xl transition-all",
                            showFilters || activeFiltersCount > 0
                                ? "bg-[#135bec] text-white shadow-lg shadow-blue-500/30"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                    >
                        <span className="material-symbols-outlined text-[20px]">tune</span>
                        {activeFiltersCount > 0 && (
                            <span className="flex items-center justify-center h-5 min-w-[20px] px-1 text-xs font-bold bg-white text-[#135bec] rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Status Filter Chips */}
                <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar items-center">
                    <button
                        onClick={() => setStatusFilter("todos")}
                        className={cn(
                            "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 h-9 shadow-sm transition active:scale-95",
                            statusFilter === "todos"
                                ? "bg-[#135bec] text-white shadow-blue-500/30"
                                : "bg-white border border-gray-200 text-slate-600 hover:border-[#135bec]/50"
                        )}
                    >
                        <span className="text-sm font-bold leading-none">Todos ({stats.total})</span>
                    </button>

                    <button
                        onClick={() => setStatusFilter("disponible")}
                        className={cn(
                            "flex shrink-0 items-center justify-center rounded-full px-4 py-1.5 h-9 transition active:scale-95",
                            statusFilter === "disponible"
                                ? "bg-green-500 text-white shadow-sm shadow-green-500/30"
                                : "bg-white border border-gray-200 text-slate-600 hover:border-green-500/50"
                        )}
                    >
                        <span className="text-sm font-medium leading-none">Disponible ({stats.disponible})</span>
                    </button>

                    <button
                        onClick={() => setStatusFilter("reservado")}
                        className={cn(
                            "flex shrink-0 items-center justify-center rounded-full px-4 py-1.5 h-9 transition active:scale-95",
                            statusFilter === "reservado"
                                ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                                : "bg-white border border-gray-200 text-slate-600 hover:border-amber-500/50"
                        )}
                    >
                        <span className="text-sm font-medium leading-none">Reservado ({stats.reservado})</span>
                    </button>

                    <button
                        onClick={() => setStatusFilter("vendido")}
                        className={cn(
                            "flex shrink-0 items-center justify-center rounded-full px-4 py-1.5 h-9 transition active:scale-95",
                            statusFilter === "vendido"
                                ? "bg-gray-500 text-white shadow-sm"
                                : "bg-white border border-gray-200 text-slate-600 hover:border-gray-400"
                        )}
                    >
                        <span className="text-sm font-medium leading-none">Vendido ({stats.vendido})</span>
                    </button>
                </div>

                {/* Extended Filters Panel */}
                {showFilters && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Brand Filter */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Marca</label>
                                <select
                                    value={brandFilter}
                                    onChange={(e) => setBrandFilter(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-slate-700 focus:border-[#135bec] focus:ring-2 focus:ring-[#135bec]/20 transition-all"
                                >
                                    <option value="todos">Todas las marcas</option>
                                    {availableBrands.map(brand => (
                                        <option key={brand} value={brand}>{brand}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Fuel Filter */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Combustible</label>
                                <select
                                    value={fuelFilter}
                                    onChange={(e) => setFuelFilter(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-slate-700 focus:border-[#135bec] focus:ring-2 focus:ring-[#135bec]/20 transition-all"
                                >
                                    <option value="todos">Todos</option>
                                    {COMBUSTIBLES.map(c => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Price Filter */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Precio</label>
                                <select
                                    value={priceFilter}
                                    onChange={(e) => setPriceFilter(e.target.value as PriceRangeType)}
                                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-slate-700 focus:border-[#135bec] focus:ring-2 focus:ring-[#135bec]/20 transition-all"
                                >
                                    <option value="todos">Todos los precios</option>
                                    <option value="bajo">Menos de 10.000€</option>
                                    <option value="medio">10.000€ - 20.000€</option>
                                    <option value="alto">20.000€ - 30.000€</option>
                                    <option value="premium">Más de 30.000€</option>
                                </select>
                            </div>

                            {/* Year Filter */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Año</label>
                                <select
                                    value={yearFilter}
                                    onChange={(e) => setYearFilter(e.target.value as YearRangeType)}
                                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-slate-700 focus:border-[#135bec] focus:ring-2 focus:ring-[#135bec]/20 transition-all"
                                >
                                    <option value="todos">Todos los años</option>
                                    <option value="nuevo">2024 o posterior</option>
                                    <option value="reciente">2020 - 2023</option>
                                    <option value="medio">2015 - 2019</option>
                                    <option value="antiguo">Anterior a 2015</option>
                                </select>
                            </div>
                        </div>

                        {/* Clear Filters Button */}
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#135bec] hover:text-blue-700 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                                Limpiar todos los filtros ({activeFiltersCount})
                            </button>
                        )}
                    </div>
                )}
            </header>

            {/* Main Content: Vehicle Grid */}
            <main className="flex-1 px-4 py-4 pb-32 md:pb-8">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                    {filteredVehicles.map((vehicle) => (
                        <VehicleCard key={vehicle.id} vehicle={vehicle} getStatusBadge={getStatusBadge} />
                    ))}
                </div>

                {/* Empty State */}
                {filteredVehicles.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">search_off</span>
                        <h3 className="text-lg font-semibold text-slate-600 mb-1">No se encontraron vehículos</h3>
                        <p className="text-sm text-slate-400">Intenta ajustar los filtros de búsqueda</p>
                        <button
                            onClick={clearAllFilters}
                            className="mt-4 text-[#135bec] font-medium hover:underline"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}

                {/* Footer count */}
                {filteredVehicles.length > 0 && (
                    <div className="w-full flex justify-center py-6">
                        <p className="text-sm text-slate-400">
                            Mostrando {filteredVehicles.length} de {baseVehicles.length} vehículos
                        </p>
                    </div>
                )}
            </main>

            {/* Mobile Floating Action Button - Hidden on desktop */}
            <div className="fixed bottom-24 right-4 z-40 md:hidden">
                <Link
                    href="/inventario/nuevo"
                    className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#135bec] text-white shadow-xl shadow-blue-500/40 hover:bg-blue-600 transition-transform active:scale-95"
                >
                    <span className="material-symbols-outlined text-[28px]">add</span>
                </Link>
            </div>
        </div>
    )
}

// Vehicle Card Component
function VehicleCard({
    vehicle,
    getStatusBadge
}: {
    vehicle: Vehicle
    getStatusBadge: (estado: string) => { bg: string, text: string }
}) {
    const badge = getStatusBadge(vehicle.estado)

    return (
        <Link href={`/inventario/${vehicle.id}`}>
            <article className="flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 cursor-pointer">
                {/* Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <img
                        className="h-full w-full object-cover"
                        src={vehicle.imagen_principal || vehicle.imagenes?.[0]?.url || '/placeholder-car.jpg'}
                        alt={`${vehicle.marca} ${vehicle.modelo}`}
                    />
                    {/* Status Badge */}
                    {vehicle.estado !== 'disponible' && (
                        <div className="absolute top-2 right-2">
                            <span className="inline-flex items-center rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#135bec] backdrop-blur-sm shadow-sm ring-1 ring-black/5">
                                {badge.text}
                            </span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-col p-3 gap-1">
                    <h3 className="text-sm font-bold leading-tight text-[#111318] line-clamp-1">
                        {vehicle.marca} {vehicle.modelo}
                    </h3>
                    <p className="text-xs font-medium text-gray-500">
                        {vehicle.año_matriculacion} • {vehicle.kilometraje.toLocaleString()} km
                    </p>
                    <p className="text-base font-bold text-[#135bec] mt-1">
                        {formatCurrency(vehicle.precio_venta)}
                    </p>
                </div>
            </article>
        </Link>
    )
}
