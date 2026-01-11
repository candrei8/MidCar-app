"use client"

import { useState } from "react"
import Link from "next/link"
import { notFound, useRouter } from "next/navigation"
import { mockVehicles } from "@/lib/mock-data"
import { EQUIPAMIENTO_VEHICULO } from "@/lib/constants"
import { cn, formatCurrency } from "@/lib/utils"
import { ShareModal } from "@/components/inventory/ShareModal"
import { getUserVehicles, getVehicleOverrides } from "@/lib/data-store"

interface VehicleDetailClientProps {
    id: string
}

// Fuel type display
const FUEL_LABELS: Record<string, string> = {
    gasolina: 'Gasolina',
    diesel: 'Diésel',
    hibrido: 'Híbrido',
    electrico: 'Eléctrico',
    gnc: 'GNC',
    glp: 'GLP',
}

// Transmission display
const TRANSMISSION_LABELS: Record<string, string> = {
    manual: 'Manual',
    automatico: 'Auto',
}

// DGT label colors
const DGT_COLORS: Record<string, string> = {
    '0': 'bg-blue-500 text-white',
    'ECO': 'bg-green-500 text-white',
    'C': 'bg-green-600 text-white',
    'B': 'bg-yellow-500 text-black',
    'SIN': 'bg-gray-400 text-white',
}

export function VehicleDetailClient({ id }: VehicleDetailClientProps) {
    const router = useRouter()

    // Buscar vehículo en mock y user vehicles, aplicando overrides
    const userVehicles = getUserVehicles()
    const overrides = getVehicleOverrides()

    let vehicle = mockVehicles.find(v => v.id === id)
    if (vehicle && overrides[id]) {
        vehicle = { ...vehicle, ...overrides[id] }
    }
    if (!vehicle) {
        vehicle = userVehicles.find(v => v.id === id)
    }

    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [showAllEquipment, setShowAllEquipment] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)

    if (!vehicle) {
        notFound()
    }

    // Get all equipment for this vehicle
    const vehicleEquipment = Object.entries(EQUIPAMIENTO_VEHICULO).flatMap(([_, category]) =>
        category.items.filter(item => vehicle.equipamiento?.includes(item.id))
    ).slice(0, showAllEquipment ? undefined : 4)

    // Mock gallery images (using the main image repeated for demo)
    const galleryImages = [
        { url: vehicle.imagen_principal, label: 'Principal' },
        { url: vehicle.imagen_principal, label: 'Frontal' },
        { url: vehicle.imagen_principal, label: 'Lateral' },
        { url: vehicle.imagen_principal, label: 'Interior' },
        { url: vehicle.imagen_principal, label: 'Trasera' },
    ]

    // Calculate price with discount
    const finalPrice = vehicle.precio_venta - (vehicle.descuento || 0)
    const hasDiscount = vehicle.descuento > 0

    // Technical specs
    const technicalSpecs = [
        { label: 'Potencia', value: `${vehicle.potencia_cv} CV (${vehicle.potencia_kw} kW)` },
        { label: 'Tracción', value: vehicle.traccion },
        { label: 'Motor', value: `${(vehicle.cilindrada / 1000).toFixed(1)} ${vehicle.tipo_motor}` },
        { label: 'Color Exterior', value: vehicle.color_exterior, colorDot: true },
        { label: 'Puertas', value: String(vehicle.num_puertas) },
        { label: 'Etiqueta DGT', value: vehicle.etiqueta_dgt, badge: true },
    ]

    // Commercial summary
    const margen = vehicle.precio_venta - vehicle.descuento - vehicle.precio_compra - vehicle.gastos_compra - vehicle.coste_reparaciones
    const margenPorcentaje = (margen / (vehicle.precio_venta - vehicle.descuento)) * 100

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111318] dark:text-white min-h-screen">

            {/* MOBILE VIEW */}
            <div className="lg:hidden relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden pb-24">

                {/* Top Navigation (Mobile - Transparent absolute) */}
                <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent lg:hidden">
                    <button
                        onClick={() => router.back()}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
                        >
                            <span className="material-symbols-outlined">share</span>
                        </button>
                        <Link href={`/inventario/${vehicle.id}/editar`}>
                            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors">
                                <span className="material-symbols-outlined">edit</span>
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Hero Image Gallery (Mobile) */}
                <div className="relative w-full h-[40vh] bg-gray-200 dark:bg-gray-800">
                    <div
                        className="w-full h-full bg-center bg-cover bg-no-repeat transition-all duration-300"
                        style={{ backgroundImage: `url("${galleryImages[currentImageIndex].url}")` }}
                    />
                    <div className="absolute bottom-6 right-4 bg-black/90 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg">
                        {currentImageIndex + 1} / {galleryImages.length}
                    </div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {galleryImages.slice(0, 3).map((_, idx) => (
                            <div
                                key={idx}
                                className={cn("w-2 h-2 rounded-full cursor-pointer transition-colors", idx === currentImageIndex ? "bg-white" : "bg-white/50")}
                                onClick={() => setCurrentImageIndex(idx)}
                            />
                        ))}
                    </div>
                </div>

                {/* Main Content (Mobile) */}
                <div className="relative z-10 -mt-4 rounded-t-2xl bg-background-light dark:bg-background-dark w-full shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
                    {/* Mobile content sections */}
                    <MobileContent
                        vehicle={vehicle}
                        finalPrice={finalPrice}
                        hasDiscount={hasDiscount}
                        galleryImages={galleryImages}
                        currentImageIndex={currentImageIndex}
                        setCurrentImageIndex={setCurrentImageIndex}
                        technicalSpecs={technicalSpecs}
                        vehicleEquipment={vehicleEquipment}
                        showAllEquipment={showAllEquipment}
                        setShowAllEquipment={setShowAllEquipment}
                    />
                </div>


            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden lg:block max-w-7xl mx-auto px-6 py-6">

                {/* Desktop Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span className="text-sm font-medium">Volver al inventario</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                        >
                            <span className="material-symbols-outlined text-[18px]">share</span>
                            Compartir
                        </button>
                        <Link href={`/inventario/${vehicle.id}/editar`}>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-medium">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                Editar
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-12 gap-6">

                    {/* Left Column - Gallery */}
                    <div className="col-span-7 space-y-4">
                        {/* Main Image */}
                        <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-lg">
                            <div
                                className="w-full h-full bg-center bg-cover bg-no-repeat transition-all duration-300"
                                style={{ backgroundImage: `url("${galleryImages[currentImageIndex].url}")` }}
                            />
                            <div className="absolute bottom-4 right-4 bg-black/90 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg">
                                {currentImageIndex + 1} / {galleryImages.length}
                            </div>
                            {/* DGT Badge */}
                            {vehicle.etiqueta_dgt !== 'SIN' && (
                                <div className={cn(
                                    "absolute top-4 right-4 w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shadow-lg",
                                    DGT_COLORS[vehicle.etiqueta_dgt] || 'bg-gray-400 text-white'
                                )}>
                                    {vehicle.etiqueta_dgt}
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Gallery */}
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                            {galleryImages.map((img, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    className={cn(
                                        "w-24 h-20 rounded-lg bg-cover bg-center cursor-pointer transition-all shrink-0 border-2",
                                        currentImageIndex === idx
                                            ? "border-primary ring-2 ring-primary/30 scale-105"
                                            : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                                    )}
                                    style={{ backgroundImage: `url("${img.url}")` }}
                                />
                            ))}
                        </div>

                        {/* Technical Specs (Desktop - Full Width Card) */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">tune</span>
                                Ficha Técnica
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                {technicalSpecs.map((spec, idx) => (
                                    <div key={idx} className="flex flex-col">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{spec.label}</span>
                                        {spec.badge ? (
                                            <span className={cn("text-xs font-bold px-2 py-0.5 rounded w-fit", DGT_COLORS[spec.value] || 'bg-gray-100 text-gray-800')}>
                                                {spec.value}
                                            </span>
                                        ) : spec.colorDot ? (
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full bg-gray-900 border border-gray-300" />
                                                <span className="text-sm font-semibold">{spec.value}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm font-semibold">{spec.value}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Equipment Section (Desktop) */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">format_list_bulleted</span>
                                Equipamiento
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {vehicleEquipment.length > 0 ? vehicleEquipment.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                        <span className="material-symbols-outlined text-green-600 text-[18px]">check_circle</span>
                                        <span className="text-sm">{item.label}</span>
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-500 col-span-2">No hay equipamiento registrado</p>
                                )}
                            </div>
                            {(vehicle.equipamiento?.length || 0) > 4 && (
                                <button
                                    onClick={() => setShowAllEquipment(!showAllEquipment)}
                                    className="mt-4 w-full py-2 text-sm font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                                >
                                    {showAllEquipment ? 'Ver menos' : `Ver todo (${vehicle.equipamiento?.length || 0})`}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Info */}
                    <div className="col-span-5 space-y-4">

                        {/* Vehicle Header Card */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                            <div className="space-y-4">
                                <div>
                                    <span className="text-sm font-semibold text-primary uppercase tracking-wider">{vehicle.marca}</span>
                                    <h1 className="text-2xl font-bold mt-1">{vehicle.modelo}</h1>
                                    <p className="text-gray-500 dark:text-gray-400">{vehicle.version}</p>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <span className="text-3xl font-bold text-primary">{formatCurrency(finalPrice)}</span>
                                        {hasDiscount && (
                                            <span className="ml-2 text-sm text-gray-400 line-through">{formatCurrency(vehicle.precio_venta)}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Status Tags */}
                                <div className="flex flex-wrap gap-2">
                                    <div className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold uppercase",
                                        vehicle.estado === 'disponible'
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200"
                                            : vehicle.estado === 'reservado'
                                                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 border-yellow-200"
                                                : "bg-gray-100 text-gray-700 border-gray-200"
                                    )}>
                                        <span className={cn("w-2 h-2 rounded-full", vehicle.estado === 'disponible' && "bg-green-500 animate-pulse")} />
                                        {vehicle.estado}
                                    </div>
                                    <div className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 text-xs font-medium">
                                        Garantía {vehicle.garantia_meses} meses
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Specs */}
                        <div className="grid grid-cols-4 gap-3">
                            <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                <span className="material-symbols-outlined text-primary mb-1 text-[22px]">calendar_today</span>
                                <p className="text-[10px] font-medium text-gray-400 uppercase">Año</p>
                                <p className="text-sm font-bold">{vehicle.año_matriculacion}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                <span className="material-symbols-outlined text-primary mb-1 text-[22px]">speed</span>
                                <p className="text-[10px] font-medium text-gray-400 uppercase">Km</p>
                                <p className="text-sm font-bold">{Math.round(vehicle.kilometraje / 1000)}k</p>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                <span className="material-symbols-outlined text-primary mb-1 text-[22px]">local_gas_station</span>
                                <p className="text-[10px] font-medium text-gray-400 uppercase">Comb.</p>
                                <p className="text-sm font-bold">{FUEL_LABELS[vehicle.combustible] || vehicle.combustible}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                <span className="material-symbols-outlined text-primary mb-1 text-[22px]">auto_transmission</span>
                                <p className="text-[10px] font-medium text-gray-400 uppercase">Caja</p>
                                <p className="text-sm font-bold">{TRANSMISSION_LABELS[vehicle.transmision] || vehicle.transmision}</p>
                            </div>
                        </div>

                        {/* Commercial Summary */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Resumen Comercial</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Precio compra</span>
                                    <span className="font-medium">{formatCurrency(vehicle.precio_compra)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Gastos</span>
                                    <span className="font-medium">{formatCurrency(vehicle.gastos_compra)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Reparaciones</span>
                                    <span className="font-medium">{formatCurrency(vehicle.coste_reparaciones)}</span>
                                </div>
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Margen bruto</span>
                                        <span className={cn("font-bold", margen > 0 ? "text-green-600" : "text-red-600")}>
                                            {formatCurrency(margen)} ({margenPorcentaje.toFixed(1)}%)
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">Días en stock</span>
                                    <span className={cn(
                                        "font-medium",
                                        vehicle.dias_en_stock > 60 ? "text-red-500" : vehicle.dias_en_stock > 30 ? "text-yellow-500" : "text-gray-600"
                                    )}>
                                        {vehicle.dias_en_stock} días
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Identification */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Identificación</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Matrícula</span>
                                    <span className="font-mono font-semibold">{vehicle.matricula}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">VIN</span>
                                    <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{vehicle.vin}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Stock ID</span>
                                    <span className="font-semibold">{vehicle.stock_id}</span>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </div>

            {/* Share Modal */}
            <ShareModal
                vehicle={vehicle}
                open={showShareModal}
                onClose={() => setShowShareModal(false)}
            />
        </div>
    )
}

// Mobile Content Component
function MobileContent({
    vehicle,
    finalPrice,
    hasDiscount,
    galleryImages,
    currentImageIndex,
    setCurrentImageIndex,
    technicalSpecs,
    vehicleEquipment,
    showAllEquipment,
    setShowAllEquipment
}: any) {
    const DGT_COLORS: Record<string, string> = {
        '0': 'bg-blue-500 text-white',
        'ECO': 'bg-green-500 text-white',
        'C': 'bg-green-600 text-white',
        'B': 'bg-yellow-500 text-black',
        'SIN': 'bg-gray-400 text-white',
    }

    return (
        <>
            {/* Header Section */}
            <div className="p-5 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">{vehicle.marca}</h2>
                        <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em]">
                            {vehicle.modelo} <span className="font-normal text-gray-500 text-lg">{vehicle.version}</span>
                        </h1>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-2xl font-bold text-primary tracking-tight">{formatCurrency(finalPrice)}</span>
                        {hasDiscount && <span className="text-xs text-gray-500 line-through">{formatCurrency(vehicle.precio_venta)}</span>}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border",
                        vehicle.estado === 'disponible' ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200"
                    )}>
                        <span className={cn("w-2 h-2 rounded-full", vehicle.estado === 'disponible' && "bg-green-500 animate-pulse")} />
                        <span className="text-xs font-bold uppercase">{vehicle.estado}</span>
                    </div>
                    <div className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 text-xs font-medium">
                        Garantía {vehicle.garantia_meses} meses
                    </div>
                </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="px-5 pb-6">
                <div className="grid grid-cols-4 gap-3">
                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <span className="material-symbols-outlined text-primary mb-1 text-[24px]">calendar_today</span>
                        <p className="text-[11px] font-medium text-gray-400 uppercase">Año</p>
                        <p className="text-sm font-bold">{vehicle.año_matriculacion}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <span className="material-symbols-outlined text-primary mb-1 text-[24px]">speed</span>
                        <p className="text-[11px] font-medium text-gray-400 uppercase">Km</p>
                        <p className="text-sm font-bold">{Math.round(vehicle.kilometraje / 1000)}k</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <span className="material-symbols-outlined text-primary mb-1 text-[24px]">local_gas_station</span>
                        <p className="text-[11px] font-medium text-gray-400 uppercase">Comb.</p>
                        <p className="text-sm font-bold">{vehicle.combustible}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <span className="material-symbols-outlined text-primary mb-1 text-[24px]">auto_transmission</span>
                        <p className="text-[11px] font-medium text-gray-400 uppercase">Caja</p>
                        <p className="text-sm font-bold">{vehicle.transmision === 'automatico' ? 'Auto' : 'Manual'}</p>
                    </div>
                </div>
            </div>

            <div className="h-2 w-full bg-gray-100" />

            {/* Gallery Carousel */}
            <div className="pt-6 pb-2 pl-5">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">photo_library</span>
                    Vistas Detalladas
                </h3>
                <div className="flex w-full overflow-x-auto no-scrollbar pr-4">
                    <div className="flex flex-row items-start justify-start gap-3">
                        {galleryImages.map((img: any, idx: number) => (
                            <div key={idx} className="flex flex-col gap-2 w-28 shrink-0 cursor-pointer group" onClick={() => setCurrentImageIndex(idx)}>
                                <div
                                    className={cn("w-full aspect-[3/4] bg-cover bg-center rounded-lg shadow-sm transition-all border",
                                        currentImageIndex === idx ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                                    )}
                                    style={{ backgroundImage: `url("${img.url}")` }}
                                />
                                <p className="text-center text-xs font-semibold text-gray-700">{img.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Technical Data */}
            <div className="px-5 py-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">tune</span>
                    Ficha Técnica
                </h3>
                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                    {technicalSpecs.map((spec: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-4">
                            <span className="text-sm text-gray-500">{spec.label}</span>
                            {spec.badge ? (
                                <span className={cn("text-xs font-bold px-2 py-0.5 rounded border", DGT_COLORS[spec.value] || 'bg-gray-100')}>
                                    {spec.value}
                                </span>
                            ) : (
                                <span className="text-sm font-semibold">{spec.value}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Equipment */}
            <div className="px-5 pb-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">format_list_bulleted</span>
                    Equipamiento
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {vehicleEquipment.length > 0 ? vehicleEquipment.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                            <span className="material-symbols-outlined text-green-600 text-[20px] mt-0.5">check_circle</span>
                            <p className="text-sm font-semibold">{item.label}</p>
                        </div>
                    )) : (
                        <p className="text-sm text-gray-500">No hay equipamiento registrado</p>
                    )}
                </div>
                {(vehicle.equipamiento?.length || 0) > 4 && (
                    <button
                        onClick={() => setShowAllEquipment(!showAllEquipment)}
                        className="mt-4 w-full py-2 text-sm font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                        {showAllEquipment ? 'Ver menos' : 'Ver todo el equipamiento'}
                    </button>
                )}
            </div>

            <div className="h-20" />
        </>
    )
}
