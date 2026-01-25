"use client"

import { memo, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Calendar,
    Gauge as GaugeIcon,
    User,
} from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import type { Vehicle } from "@/types"
import Link from "next/link"

// Helper para obtener imagen válida (excluye URLs de Azure CDN que no existen)
const getValidImageUrl = (url: string | null | undefined): string => {
    if (!url || url.includes('midcar.azureedge.net')) {
        return '/placeholder-car.svg'
    }
    return url
}

interface VehicleCardProps {
    vehicle: Vehicle
    showCreator?: boolean // Para mostrar quién creó el vehículo
}

export const VehicleCard = memo(function VehicleCard({ vehicle, showCreator = true }: VehicleCardProps) {
    const precioFinal = useMemo(
        () => vehicle.precio_venta - vehicle.descuento,
        [vehicle.precio_venta, vehicle.descuento]
    )

    // Formatear la fecha de creación de forma corta
    const formattedCreatedAt = useMemo(() => {
        if (!vehicle.created_at) return null
        const date = new Date(vehicle.created_at)
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        })
    }, [vehicle.created_at])

    const imageUrl = getValidImageUrl(vehicle.imagen_principal)

    return (
        <Link href={`/inventario/${vehicle.id}`}>
            <Card className="group overflow-hidden bg-surface-100 border-0 hover:bg-surface-200 transition-all cursor-pointer">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url(${imageUrl})` }}
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Status badge - only if not disponible */}
                    {vehicle.estado !== 'disponible' && (
                        <div className="absolute top-3 left-3">
                            <Badge
                                className={cn(
                                    "text-xs font-medium",
                                    vehicle.estado === 'reservado' && "bg-amber-500 text-white",
                                    vehicle.estado === 'taller' && "bg-red-500 text-white",
                                    vehicle.estado === 'vendido' && "bg-emerald-500 text-white"
                                )}
                            >
                                {vehicle.estado === 'reservado' && 'Reservado'}
                                {vehicle.estado === 'taller' && 'En taller'}
                                {vehicle.estado === 'vendido' && 'Vendido'}
                            </Badge>
                        </div>
                    )}

                    {/* Offer badge */}
                    {vehicle.en_oferta && vehicle.descuento > 0 && (
                        <div className="absolute top-3 right-3">
                            <Badge className="bg-primary text-white text-xs">
                                -{Math.round((vehicle.descuento / vehicle.precio_venta) * 100)}%
                            </Badge>
                        </div>
                    )}

                    {/* Price - bottom right */}
                    <div className="absolute bottom-3 right-3">
                        <span className="text-xl font-bold text-white drop-shadow-lg">
                            {formatCurrency(precioFinal)}
                        </span>
                    </div>
                </div>

                {/* Content - Minimal */}
                <div className="p-4 space-y-2">
                    {/* Title */}
                    <div>
                        <h3 className="font-semibold text-foreground leading-tight">
                            {vehicle.marca} {vehicle.modelo}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                            {vehicle.version}
                        </p>
                    </div>

                    {/* Specs - Very minimal */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {vehicle.año_matriculacion}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <GaugeIcon className="h-3.5 w-3.5" />
                            {(vehicle.kilometraje / 1000).toFixed(0)}k km
                        </span>
                        <span className="capitalize">
                            {vehicle.combustible}
                        </span>
                    </div>

                    {/* Creator info - shows who created the vehicle and when */}
                    {showCreator && vehicle.created_by_name && (
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span className="font-medium text-primary truncate max-w-[120px]">
                                    {vehicle.created_by_name}
                                </span>
                            </span>
                            {formattedCreatedAt && (
                                <span className="text-xs text-muted-foreground">
                                    {formattedCreatedAt}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </Link>
    )
})
