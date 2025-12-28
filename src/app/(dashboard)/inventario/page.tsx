"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Search,
    LayoutGrid,
    List,
    Plus,
    Car,
    ArrowUpDown,
    ChevronDown
} from "lucide-react"
import { mockVehicles } from "@/lib/mock-data"
import { formatCurrency, cn } from "@/lib/utils"
import { COMBUSTIBLES } from "@/lib/constants"
import { VehicleCard } from "@/components/inventory/VehicleCard"
import { VehicleTable } from "@/components/inventory/VehicleTable"
import Link from "next/link"

type SortOption = 'reciente' | 'precio_asc' | 'precio_desc' | 'dias_stock' | 'margen'
type StatusFilter = 'todos' | 'disponible' | 'reservado' | 'taller'

export default function InventarioPage() {
    const [view, setView] = useState<'grid' | 'table'>('grid')
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos")
    const [marcaFilter, setMarcaFilter] = useState<string>("todos")
    const [sortBy, setSortBy] = useState<SortOption>("reciente")

    // Calculate stats
    const stats = useMemo(() => {
        const disponibles = mockVehicles.filter(v => v.estado === 'disponible')
        const valorStock = disponibles.reduce((acc, v) => acc + v.precio_venta - v.descuento, 0)

        return {
            total: mockVehicles.length,
            disponibles: disponibles.length,
            valorStock,
        }
    }, [])

    // Filter and sort vehicles
    const filteredVehicles = useMemo(() => {
        let vehicles = [...mockVehicles]

        // Status filter
        if (statusFilter !== 'todos') {
            vehicles = vehicles.filter(v => v.estado === statusFilter)
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            vehicles = vehicles.filter(v =>
                v.marca.toLowerCase().includes(query) ||
                v.modelo.toLowerCase().includes(query) ||
                v.matricula.toLowerCase().includes(query)
            )
        }

        // Brand filter
        if (marcaFilter !== 'todos') {
            vehicles = vehicles.filter(v => v.marca === marcaFilter)
        }

        // Sorting
        switch (sortBy) {
            case 'precio_asc':
                vehicles.sort((a, b) => (a.precio_venta - a.descuento) - (b.precio_venta - b.descuento))
                break
            case 'precio_desc':
                vehicles.sort((a, b) => (b.precio_venta - b.descuento) - (a.precio_venta - a.descuento))
                break
            case 'dias_stock':
                vehicles.sort((a, b) => b.dias_en_stock - a.dias_en_stock)
                break
            case 'margen':
                vehicles.sort((a, b) => {
                    const margenA = (a.precio_venta - a.descuento) - a.precio_compra - a.gastos_compra - a.coste_reparaciones
                    const margenB = (b.precio_venta - b.descuento) - b.precio_compra - b.gastos_compra - b.coste_reparaciones
                    return margenB - margenA
                })
                break
            default:
                vehicles.sort((a, b) => new Date(b.fecha_entrada_stock).getTime() - new Date(a.fecha_entrada_stock).getTime())
        }

        return vehicles
    }, [statusFilter, searchQuery, marcaFilter, sortBy])

    // Get unique brands
    const brandsInStock = Array.from(new Set(mockVehicles.map(v => v.marca))).sort()

    return (
        <div className="space-y-8 animate-in">
            {/* Header - Clean and simple */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Inventario</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {stats.disponibles} vehículos disponibles · {formatCurrency(stats.valorStock)} en stock
                    </p>
                </div>
                <Link href="/inventario/nuevo">
                    <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Añadir
                    </Button>
                </Link>
            </div>

            {/* Filters Bar - Single row, clean */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <Input
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-surface-100 border-0 h-9"
                    />
                </div>

                <div className="flex gap-2 flex-wrap">
                    {/* Status Pills */}
                    <div className="flex bg-surface-100 rounded-lg p-0.5">
                        {[
                            { value: 'todos', label: 'Todos' },
                            { value: 'disponible', label: 'Disponibles' },
                            { value: 'reservado', label: 'Reservados' },
                        ].map((status) => (
                            <button
                                key={status.value}
                                onClick={() => setStatusFilter(status.value as StatusFilter)}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                    statusFilter === status.value
                                        ? "bg-white text-foreground shadow-sm dark:bg-surface-300"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>

                    {/* Brand Filter */}
                    <Select value={marcaFilter} onValueChange={setMarcaFilter}>
                        <SelectTrigger className="w-[130px] h-9 bg-surface-100 border-0">
                            <SelectValue placeholder="Marca" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todas</SelectItem>
                            {brandsInStock.map(marca => (
                                <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Sort */}
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                        <SelectTrigger className="w-[140px] h-9 bg-surface-100 border-0">
                            <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="reciente">Recientes</SelectItem>
                            <SelectItem value="precio_asc">Precio ↑</SelectItem>
                            <SelectItem value="precio_desc">Precio ↓</SelectItem>
                            <SelectItem value="margen">Mayor margen</SelectItem>
                            <SelectItem value="dias_stock">Más tiempo</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* View Toggle */}
                    <div className="flex bg-surface-100 rounded-lg p-0.5">
                        <button
                            onClick={() => setView('grid')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                view === 'grid' ? "bg-white shadow-sm dark:bg-surface-300" : "text-muted-foreground"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setView('table')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                view === 'table' ? "bg-white shadow-sm dark:bg-surface-300" : "text-muted-foreground"
                            )}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Results count */}
            {(searchQuery || marcaFilter !== 'todos' || statusFilter !== 'todos') && (
                <p className="text-sm text-muted-foreground">
                    {filteredVehicles.length} {filteredVehicles.length === 1 ? 'resultado' : 'resultados'}
                    {marcaFilter !== 'todos' && <span className="ml-1">en {marcaFilter}</span>}
                </p>
            )}

            {/* Vehicles Display */}
            {view === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredVehicles.map(vehicle => (
                        <VehicleCard key={vehicle.id} vehicle={vehicle} />
                    ))}
                </div>
            ) : (
                <VehicleTable vehicles={filteredVehicles} />
            )}

            {/* Empty state */}
            {filteredVehicles.length === 0 && (
                <div className="text-center py-16">
                    <Car className="h-12 w-12 mx-auto text-muted mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Sin resultados</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                        No hay vehículos que coincidan con tu búsqueda
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setStatusFilter("todos")
                            setMarcaFilter("todos")
                            setSearchQuery("")
                        }}
                    >
                        Limpiar filtros
                    </Button>
                </div>
            )}
        </div>
    )
}
