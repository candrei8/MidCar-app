"use client"

import { useState, useMemo } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Search,
    Car,
    Check,
} from "lucide-react"
import { mockVehicles } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/utils"

interface VehicleSelectorProps {
    open: boolean
    onClose: () => void
    onSelect: (vehicleIds: string[]) => void
    excludeIds?: string[]
}

export function VehicleSelector({ open, onClose, onSelect, excludeIds = [] }: VehicleSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // Filter available vehicles
    const availableVehicles = useMemo(() => {
        return mockVehicles
            .filter(v => !excludeIds.includes(v.id))
            .filter(v => v.estado === 'disponible' || v.estado === 'reservado')
    }, [excludeIds])

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

    const getEstadoBadgeVariant = (estado: string) => {
        switch (estado) {
            case 'disponible': return 'vendido' as const
            case 'reservado': return 'contactado' as const
            default: return 'secondary' as const
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Car className="h-5 w-5 text-primary" />
                        Seleccionar Vehículos de Interés
                    </DialogTitle>
                    <DialogDescription>
                        Selecciona los vehículos por los que el cliente ha mostrado interés
                    </DialogDescription>
                </DialogHeader>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <Input
                        placeholder="Buscar por marca, modelo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Selected count */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                        <Check className="h-4 w-4" />
                        {selectedIds.length} vehículo{selectedIds.length > 1 ? 's' : ''} seleccionado{selectedIds.length > 1 ? 's' : ''}
                    </div>
                )}

                {/* Vehicle list */}
                <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-2 pb-4">
                        {filteredVehicles.map((vehicle) => {
                            const isSelected = selectedIds.includes(vehicle.id)
                            return (
                                <div
                                    key={vehicle.id}
                                    className={`
                                        flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors
                                        ${isSelected
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50 hover:bg-muted/30'
                                        }
                                    `}
                                    onClick={() => toggleVehicle(vehicle.id)}
                                >
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleVehicle(vehicle.id)}
                                        className="pointer-events-none"
                                    />
                                    <div
                                        className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0"
                                        style={{ backgroundImage: `url(${vehicle.imagen_principal})` }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="font-semibold truncate">
                                                    {vehicle.marca} {vehicle.modelo}
                                                </h4>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {vehicle.version}
                                                </p>
                                            </div>
                                            <Badge variant={getEstadoBadgeVariant(vehicle.estado)} className="flex-shrink-0">
                                                {vehicle.estado === 'disponible' ? 'Disponible' : 'Reservado'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-lg font-bold text-primary">
                                                {formatCurrency(vehicle.precio_venta)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {vehicle.año_matriculacion} • {vehicle.kilometraje.toLocaleString()} km
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {filteredVehicles.length === 0 && (
                            <div className="p-8 text-center">
                                <Car className="h-12 w-12 mx-auto text-muted mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-2">
                                    No se encontraron vehículos
                                </h3>
                                <p className="text-muted-foreground">
                                    {searchQuery
                                        ? "Intenta con otros términos de búsqueda"
                                        : "No hay vehículos disponibles para añadir"
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={selectedIds.length === 0}
                        className="gap-2"
                    >
                        <Check className="h-4 w-4" />
                        Añadir {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
