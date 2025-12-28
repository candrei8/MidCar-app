"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    MoreHorizontal,
    Eye,
    Edit,
    Trash,
    Copy,
    QrCode,
    Globe,
    Printer,
} from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import type { Vehicle } from "@/types"
import Link from "next/link"
import { VehicleAdGenerator } from "./VehicleAdGenerator"
import { WebLinkModal } from "./WebLinkModal"

interface VehicleTableProps {
    vehicles: Vehicle[]
}

export function VehicleTable({ vehicles }: VehicleTableProps) {
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
    const [showAdGenerator, setShowAdGenerator] = useState(false)
    const [showWebLink, setShowWebLink] = useState(false)

    const handleOpenAdGenerator = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle)
        setShowAdGenerator(true)
    }

    const handleOpenWebLink = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle)
        setShowWebLink(true)
    }

    const handleSaveWebLink = (url: string) => {
        alert(`✓ Enlace web guardado: ${url}`)
    }

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'disponible':
                return <Badge variant="disponible">Disponible</Badge>
            case 'reservado':
                return <Badge variant="reservado">Reservado</Badge>
            case 'vendido':
                return <Badge variant="vendido">Vendido</Badge>
            case 'taller':
                return <Badge variant="danger">En Taller</Badge>
            default:
                return <Badge variant="secondary">{estado}</Badge>
        }
    }

    const getDaysInStockColor = (days: number) => {
        if (days > 60) return 'text-danger'
        if (days > 30) return 'text-warning'
        return 'text-muted-foreground'
    }

    return (
        <>
            <Card className="card-premium overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-background hover:bg-background">
                            <TableHead className="w-[80px]">Imagen</TableHead>
                            <TableHead>Vehículo</TableHead>
                            <TableHead className="w-[100px]">Año</TableHead>
                            <TableHead className="w-[100px]">Km</TableHead>
                            <TableHead className="w-[100px]">Combustible</TableHead>
                            <TableHead className="w-[120px]">Precio</TableHead>
                            <TableHead className="w-[110px]">Estado</TableHead>
                            <TableHead className="w-[100px]">Días Stock</TableHead>
                            <TableHead className="w-[80px] text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vehicles.map((vehicle) => (
                            <TableRow key={vehicle.id}>
                                <TableCell>
                                    <div
                                        className="w-16 h-12 rounded bg-cover bg-center"
                                        style={{ backgroundImage: `url(${vehicle.imagen_principal})` }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-foreground">
                                            {vehicle.marca} {vehicle.modelo}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {vehicle.version}
                                        </span>
                                        <span className="text-xs text-muted">
                                            {vehicle.matricula}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>{vehicle.año_matriculacion}</TableCell>
                                <TableCell>{vehicle.kilometraje.toLocaleString()}</TableCell>
                                <TableCell className="capitalize">{vehicle.combustible}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-foreground">
                                            {formatCurrency(vehicle.precio_venta - vehicle.descuento)}
                                        </span>
                                        {vehicle.descuento > 0 && (
                                            <span className="text-xs line-through text-muted-foreground">
                                                {formatCurrency(vehicle.precio_venta)}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{getEstadoBadge(vehicle.estado)}</TableCell>
                                <TableCell>
                                    <span className={cn("text-sm font-medium", getDaysInStockColor(vehicle.dias_en_stock))}>
                                        {vehicle.dias_en_stock} días
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <Link href={`/inventario/${vehicle.id}`}>
                                                <DropdownMenuItem>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Ver detalle
                                                </DropdownMenuItem>
                                            </Link>
                                            <DropdownMenuItem>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleOpenAdGenerator(vehicle)}>
                                                <QrCode className="mr-2 h-4 w-4" />
                                                Generar Anuncio
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenWebLink(vehicle)}>
                                                <Globe className="mr-2 h-4 w-4" />
                                                Vincular Web
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem>
                                                <Copy className="mr-2 h-4 w-4" />
                                                Duplicar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-danger">
                                                <Trash className="mr-2 h-4 w-4" />
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Modals */}
            {selectedVehicle && (
                <>
                    <VehicleAdGenerator
                        vehicle={selectedVehicle}
                        open={showAdGenerator}
                        onClose={() => {
                            setShowAdGenerator(false)
                            setSelectedVehicle(null)
                        }}
                    />
                    <WebLinkModal
                        vehicle={selectedVehicle}
                        open={showWebLink}
                        onClose={() => {
                            setShowWebLink(false)
                            setSelectedVehicle(null)
                        }}
                        onSave={handleSaveWebLink}
                    />
                </>
            )}
        </>
    )
}
