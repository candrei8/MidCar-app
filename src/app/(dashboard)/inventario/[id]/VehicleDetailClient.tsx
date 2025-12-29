"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ArrowLeft,
    Calendar,
    Fuel,
    Gauge as GaugeIcon,
    Car,
    Settings,
    FileText,
    Wrench,
    Shield,
    Edit,
    Check,
    X,
    Heart
} from "lucide-react"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import Link from "next/link"
import { notFound } from "next/navigation"
import { VehicleActions } from "@/components/inventory/VehicleActions"
import { mockVehicles } from "@/lib/mock-data"
import { EQUIPAMIENTO_VEHICULO } from "@/lib/constants"

interface VehicleDetailClientProps {
    id: string
}

export function VehicleDetailClient({ id }: VehicleDetailClientProps) {
    const vehicle = mockVehicles.find(v => v.id === id)

    if (!vehicle) {
        notFound()
    }

    const margen = vehicle.precio_venta - vehicle.descuento - vehicle.precio_compra - vehicle.gastos_compra - vehicle.coste_reparaciones
    const margenPorcentaje = (margen / (vehicle.precio_venta - vehicle.descuento)) * 100

    return (
        <div className="space-y-6 animate-in">
            {/* Back button and actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <Link href="/inventario">
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Volver al inventario
                    </Button>
                </Link>
                <div className="flex gap-2">
                    <VehicleActions vehicle={vehicle} />
                    <Link href={`/inventario/${vehicle.id}/editar`}>
                        <Button size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Hero section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image Gallery */}
                <Card className="card-premium overflow-hidden">
                    <div className="relative h-80 lg:h-96">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${vehicle.imagen_principal})` }}
                        />
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            <Badge variant={vehicle.estado as 'disponible' | 'reservado'}>
                                {vehicle.estado.charAt(0).toUpperCase() + vehicle.estado.slice(1)}
                            </Badge>
                            {vehicle.en_oferta && (
                                <Badge className="bg-primary text-white">OFERTA</Badge>
                            )}
                            {vehicle.destacado && (
                                <Badge className="bg-yellow-500 text-black">DESTACADO</Badge>
                            )}
                        </div>
                        {/* DGT Label */}
                        {vehicle.etiqueta_dgt !== 'SIN' && (
                            <div className={cn(
                                "absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white",
                                vehicle.etiqueta_dgt === '0' && "bg-blue-500",
                                vehicle.etiqueta_dgt === 'ECO' && "bg-green-500",
                                vehicle.etiqueta_dgt === 'C' && "bg-green-600",
                                vehicle.etiqueta_dgt === 'B' && "bg-yellow-500",
                            )}>
                                {vehicle.etiqueta_dgt}
                            </div>
                        )}
                    </div>
                    {/* Thumbnail gallery placeholder */}
                    <div className="flex gap-2 p-4 overflow-x-auto">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="w-20 h-16 rounded bg-surface-300 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                style={{ backgroundImage: `url(${vehicle.imagen_principal})`, backgroundSize: 'cover' }}
                            />
                        ))}
                    </div>
                </Card>

                {/* Main Info */}
                <div className="space-y-4">
                    <Card className="card-premium">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">
                                        {vehicle.marca} {vehicle.modelo}
                                    </h1>
                                    <p className="text-lg text-muted-foreground">{vehicle.version}</p>
                                </div>

                                <div className="flex items-end gap-3">
                                    {vehicle.descuento > 0 && (
                                        <span className="text-xl line-through text-muted-foreground">
                                            {formatCurrency(vehicle.precio_venta)}
                                        </span>
                                    )}
                                    <span className="text-3xl font-bold text-primary">
                                        {formatCurrency(vehicle.precio_venta - vehicle.descuento)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-card-border">
                                    <div className="text-center">
                                        <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                        <p className="text-lg font-semibold">{vehicle.año_matriculacion}</p>
                                        <p className="text-xs text-muted-foreground">Año</p>
                                    </div>
                                    <div className="text-center">
                                        <GaugeIcon className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                        <p className="text-lg font-semibold">{vehicle.kilometraje.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">Kilómetros</p>
                                    </div>
                                    <div className="text-center">
                                        <Fuel className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                        <p className="text-lg font-semibold capitalize">{vehicle.combustible}</p>
                                        <p className="text-xs text-muted-foreground">Combustible</p>
                                    </div>
                                    <div className="text-center">
                                        <Settings className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                        <p className="text-lg font-semibold capitalize">{vehicle.transmision}</p>
                                        <p className="text-xs text-muted-foreground">Transmisión</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Commercial Summary */}
                    <Card className="card-premium">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Resumen Comercial
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Precio compra</span>
                                <span className="font-medium">{formatCurrency(vehicle.precio_compra)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Gastos</span>
                                <span className="font-medium">{formatCurrency(vehicle.gastos_compra)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Reparaciones</span>
                                <span className="font-medium">{formatCurrency(vehicle.coste_reparaciones)}</span>
                            </div>
                            <div className="border-t border-card-border pt-3">
                                <div className="flex justify-between">
                                    <span className="font-medium">Margen bruto</span>
                                    <span className={cn(
                                        "font-bold",
                                        margen > 0 ? "text-success" : "text-danger"
                                    )}>
                                        {formatCurrency(margen)} ({margenPorcentaje.toFixed(1)}%)
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Días en stock</span>
                                <span className={cn(
                                    "font-medium",
                                    vehicle.dias_en_stock > 60 ? "text-danger" :
                                        vehicle.dias_en_stock > 30 ? "text-warning" : "text-foreground"
                                )}>
                                    {vehicle.dias_en_stock} días
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Warranty */}
                    <Card className="card-premium border-success/30">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                                <Shield className="h-6 w-6 text-success" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">
                                    Garantía {vehicle.garantia_meses} meses
                                </p>
                                <p className="text-sm text-muted-foreground">{vehicle.tipo_garantia}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general" className="gap-2">
                        <Car className="h-4 w-4" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="tecnico" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Técnico
                    </TabsTrigger>
                    <TabsTrigger value="equipamiento" className="gap-2">
                        <Heart className="h-4 w-4" />
                        Equipamiento
                    </TabsTrigger>
                    <TabsTrigger value="historial" className="gap-2">
                        <Wrench className="h-4 w-4" />
                        Historial
                    </TabsTrigger>
                    <TabsTrigger value="documentos" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Documentos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card className="card-premium">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-foreground">Identificación</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Matrícula</span>
                                            <span className="font-mono">{vehicle.matricula}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">VIN</span>
                                            <span className="font-mono text-xs">{vehicle.vin}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Stock ID</span>
                                            <span>{vehicle.stock_id}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-foreground">Carrocería</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tipo</span>
                                            <span>{vehicle.tipo_carroceria}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Puertas</span>
                                            <span>{vehicle.num_puertas}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Plazas</span>
                                            <span>{vehicle.num_plazas}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Color exterior</span>
                                            <span>{vehicle.color_exterior}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Color interior</span>
                                            <span>{vehicle.color_interior}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-foreground">Historial</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Propietarios</span>
                                            <span>{vehicle.num_propietarios}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Primera mano</span>
                                            <span>{vehicle.primera_mano ? 'Sí' : 'No'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Nacional</span>
                                            <span>{vehicle.es_nacional ? 'Sí' : 'No'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tecnico">
                    <Card className="card-premium">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-foreground">Motor</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tipo</span>
                                            <span>{vehicle.tipo_motor}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Cilindrada</span>
                                            <span>{vehicle.cilindrada} cc</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Potencia</span>
                                            <span>{vehicle.potencia_cv} CV / {vehicle.potencia_kw} kW</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Combustible</span>
                                            <span className="capitalize">{vehicle.combustible}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-foreground">Transmisión</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tipo</span>
                                            <span className="capitalize">{vehicle.transmision}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Marchas</span>
                                            <span>{vehicle.num_marchas || 'CVT'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tracción</span>
                                            <span>{vehicle.traccion}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-foreground">Consumo y Emisiones</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Consumo mixto</span>
                                            <span>{vehicle.consumo_mixto} L/100km</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Emisiones CO2</span>
                                            <span>{vehicle.emisiones_co2} g/km</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Etiqueta DGT</span>
                                            <span>{vehicle.etiqueta_dgt}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="equipamiento">
                    <Card className="card-premium">
                        <CardContent className="p-6">
                            <EquipmentDisplay equipamiento={vehicle.equipamiento || []} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="historial">
                    <Card className="card-premium">
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 p-4 bg-surface-200 rounded-lg">
                                    <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                                        <Check className="h-5 w-5 text-success" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Entrada en stock</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDate(vehicle.fecha_entrada_stock)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-surface-200 rounded-lg">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Wrench className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Revisión pre-venta completada</p>
                                        <p className="text-sm text-muted-foreground">
                                            Cambio de aceite, filtros y revisión general
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documentos">
                    <Card className="card-premium">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <DocumentCard title="Permiso de circulación" available onClick={() => alert("Abriendo Permiso de Circulación...")} />
                                <DocumentCard title="Ficha técnica" available onClick={() => alert("Abriendo Ficha Técnica...")} />
                                <DocumentCard title="Última ITV" available onClick={() => alert("Abriendo Informe ITV...")} />
                                <DocumentCard title="Informe DGT" available onClick={() => window.open('https://sede.dgt.gob.es', '_blank')} />
                                <DocumentCard title="CARFAX" available={false} />
                                <DocumentCard title="Libro de mantenimiento" available onClick={() => alert("Abriendo Libro de Mantenimiento...")} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function EquipmentItem({ label, available }: { label: string; available: boolean }) {
    return (
        <div className="flex items-center gap-2">
            {available ? (
                <Check className="h-4 w-4 text-success" />
            ) : (
                <X className="h-4 w-4 text-muted" />
            )}
            <span className={available ? "text-foreground" : "text-muted"}>{label}</span>
        </div>
    )
}

function EquipmentDisplay({ equipamiento }: { equipamiento: string[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {Object.entries(EQUIPAMIENTO_VEHICULO).map(([categoryKey, category]) => {
                const categoryItems = category.items.filter(item => equipamiento.includes(item.id))
                const hasItems = categoryItems.length > 0

                return (
                    <div key={categoryKey} className="space-y-3">
                        <h4 className="font-semibold text-foreground">{category.label}</h4>
                        <div className="space-y-2 text-sm">
                            {category.items.map((item) => (
                                <EquipmentItem
                                    key={item.id}
                                    label={item.label}
                                    available={equipamiento.includes(item.id)}
                                />
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function DocumentCard({ title, available, onClick }: { title: string; available: boolean; onClick?: () => void }) {
    return (
        <div className={cn(
            "flex items-center gap-3 p-4 rounded-lg border",
            available ? "border-card-border bg-surface-100" : "border-dashed border-muted/30 bg-transparent"
        )}>
            <FileText className={cn("h-5 w-5", available ? "text-primary" : "text-muted")} />
            <div className="flex-1">
                <p className={cn("font-medium", available ? "text-foreground" : "text-muted")}>{title}</p>
                <p className="text-xs text-muted-foreground">
                    {available ? "Disponible" : "No disponible"}
                </p>
            </div>
            {available && (
                <Button variant="ghost" size="sm" onClick={onClick}>Ver</Button>
            )}
        </div>
    )
}
