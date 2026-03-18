"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Search,
    Car,
    Check,
    X,
} from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { useFilteredData } from "@/hooks/useFilteredData"

// Helper para obtener imagen válida
const getValidImageUrl = (url: string | null | undefined): string => {
    if (!url) return '/placeholder-proximamente.svg'
    return url
}

interface VehicleSelectorProps {
    open: boolean
    onClose: () => void
    onSelect: (vehicleIds: string[]) => void
    excludeIds?: string[]
}

export function VehicleSelector({ open, onClose, onSelect, excludeIds = [] }: VehicleSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const { vehicles } = useFilteredData()

    // Filter available vehicles
    const availableVehicles = useMemo(() => {
        return vehicles
            .filter(v => !excludeIds.includes(v.id))
            .filter(v => v.estado === 'disponible' || v.estado === 'reservado')
    }, [excludeIds, vehicles])

    // Filter by search
    const filteredVehicles = useMemo(() => {
        if (!searchQuery.trim()) return availableVehicles

        const query = searchQuery.toLowerCase()
        return availableVehicles.filter(v =>
            v.marca.toLowerCase().includes(query) ||
            v.modelo.toLowerCase().includes(query) ||
            v.version.toLowerCase().includes(query) ||
            v.matricula?.toLowerCase().includes(query)
        )
    }, [availableVehicles, searchQuery])

    const toggleVehicle = (vehicleId: string) => {
        setSelectedIds(prev =>
            prev.includes(vehicleId)
                ? prev.filter(id => id !== vehicleId)
                : [...prev, vehicleId]
        )
    }

    const handleConfirm = () => {
        onSelect(selectedIds)
        setSelectedIds([])
        setSearchQuery("")
    }

    const handleClose = () => {
        setSelectedIds([])
        setSearchQuery("")
        onClose()
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

            {/* Modal */}
            <div className="relative w-full sm:max-w-[600px] h-[85vh] sm:h-auto sm:max-h-[80vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200">

                {/* Header - fixed */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Car className="h-5 w-5 text-[#135bec]" />
                        <h2 className="text-lg font-bold text-slate-900">Seleccionar Vehículos</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Search - fixed */}
                <div className="p-4 pb-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por marca, modelo, matrícula..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-11 bg-slate-50 border-slate-200"
                        />
                    </div>
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-[#135bec] font-medium mt-2">
                            <Check className="h-4 w-4" />
                            {selectedIds.length} vehículo{selectedIds.length > 1 ? 's' : ''} seleccionado{selectedIds.length > 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                {/* Scrollable vehicle list */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div className="space-y-2">
                        {filteredVehicles.map((vehicle) => {
                            const isSelected = selectedIds.includes(vehicle.id)
                            return (
                                <button
                                    key={vehicle.id}
                                    type="button"
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left active:scale-[0.98]",
                                        isSelected
                                            ? "border-[#135bec] bg-blue-50 ring-1 ring-[#135bec]/30"
                                            : "border-gray-200 hover:border-gray-300 bg-white"
                                    )}
                                    onClick={() => toggleVehicle(vehicle.id)}
                                >
                                    {/* Checkbox indicator */}
                                    <div className={cn(
                                        "flex-shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors",
                                        isSelected ? "bg-[#135bec] border-[#135bec]" : "border-gray-300"
                                    )}>
                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                    </div>

                                    {/* Image */}
                                    <div
                                        className="w-14 h-14 rounded-lg bg-cover bg-center bg-gray-100 flex-shrink-0"
                                        style={{ backgroundImage: `url(${getValidImageUrl(vehicle.imagen_principal)})` }}
                                    />

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-slate-900 truncate">
                                            {vehicle.marca} {vehicle.modelo}
                                        </h4>
                                        <p className="text-xs text-slate-500 truncate">
                                            {vehicle.version} {vehicle.matricula ? `• ${vehicle.matricula}` : ''}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-sm font-bold text-[#135bec]">
                                                {formatCurrency(vehicle.precio_venta)}
                                            </span>
                                            <span className="text-[11px] text-slate-400">
                                                {vehicle.año_matriculacion} • {vehicle.kilometraje.toLocaleString()} km
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status badge */}
                                    <span className={cn(
                                        "flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                        vehicle.estado === 'disponible' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                        {vehicle.estado === 'disponible' ? 'Disponible' : 'Reservado'}
                                    </span>
                                </button>
                            )
                        })}

                        {filteredVehicles.length === 0 && (
                            <div className="py-12 text-center">
                                <Car className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                                <h3 className="text-base font-semibold text-slate-600 mb-1">
                                    No se encontraron vehículos
                                </h3>
                                <p className="text-sm text-slate-400">
                                    {searchQuery
                                        ? "Intenta con otros términos"
                                        : "No hay vehículos disponibles"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer - fixed */}
                <div className="flex gap-3 p-4 border-t border-gray-100 bg-white">
                    <Button variant="outline" onClick={handleClose} className="flex-1 sm:flex-none">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={selectedIds.length === 0}
                        className="flex-1 sm:flex-none gap-2 bg-[#135bec] hover:bg-blue-700"
                    >
                        <Check className="h-4 w-4" />
                        Añadir {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                    </Button>
                </div>
            </div>
        </div>
    )
}
