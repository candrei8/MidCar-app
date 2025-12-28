"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Calendar,
    Gauge as GaugeIcon,
} from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import type { Vehicle } from "@/types"
import Link from "next/link"

interface VehicleCardProps {
    vehicle: Vehicle
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
    const precioFinal = vehicle.precio_venta - vehicle.descuento

    return (
        <Link href={`/inventario/${vehicle.id}`}>
            <Card className="group overflow-hidden bg-surface-100 border-0 hover:bg-surface-200 transition-all cursor-pointer">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url(${vehicle.imagen_principal})` }}
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
                </div>
            </Card>
        </Link>
    )
}
