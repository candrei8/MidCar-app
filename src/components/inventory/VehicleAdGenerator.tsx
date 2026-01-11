"use client"

import { useState, useRef } from "react"
import type { Vehicle } from "@/types"
import { formatCurrency, cn } from "@/lib/utils"

interface FlyerGeneratorProps {
    vehicle: Vehicle
    open: boolean
    onClose: () => void
}

export function VehicleAdGenerator({ vehicle, open, onClose }: FlyerGeneratorProps) {
    const printRef = useRef<HTMLDivElement>(null)
    const [paperSize, setPaperSize] = useState<'A4' | 'A5'>('A4')
    const [showPrice, setShowPrice] = useState(true)
    const [showEquipment, setShowEquipment] = useState(true)
    const [includeQR, setIncludeQR] = useState(true)

    if (!open) return null

    const imageUrl = vehicle.imagen_principal || vehicle.imagenes?.[0]?.url ||
        'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop'

    // Fuel type display
    const fuelDisplay: Record<string, string> = {
        'gasolina': 'Gasolina',
        'diesel': 'Diésel',
        'hibrido': 'Híbrido',
        'electrico': 'Eléctrico',
        'glp': 'GLP',
        'gnc': 'GNC'
    }

    // Transmission display
    const transmissionDisplay: Record<string, string> = {
        'manual': 'Manual',
        'automatico': 'Automático',
        'semiautomatico': 'Semiautomático'
    }

    const handlePrint = () => {
        const printContent = printRef.current
        if (!printContent) return

        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const pageSize = paperSize === 'A4' ? 'A4' : 'A5'

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Flyer - ${vehicle.marca} ${vehicle.modelo}</title>
                <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Manrope', sans-serif;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    @page { size: ${pageSize}; margin: 0; }
                    .material-symbols-outlined {
                        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `)

        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 500)
    }

    const handleDownloadPDF = () => {
        // For now, use print dialog with PDF option
        handlePrint()
    }

    // QR Code SVG (simplified pattern)
    const qrCodeSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 80 80'%3E%3Cpath fill='%23111318' d='M0 0h20v20H0V0zm25 0h10v10H25V0zm15 0h15v15H40V0zm20 0h20v20H60V0zM5 5v10h10V5H5zm25 0v5h5V5h-5zm35 0v10h10V5H65zM0 25h15v15H0V25zm20 0h5v5h-5v-5zm10 0h10v10H30V25zm15 0h10v5h-5v5h-5V25zm20 0h15v15H65V25zM5 30v5h5v-5H5zm30 0v5h5v-5h-5zm45 0v5h10v-5h-10zM0 45h10v10H0V45zm15 0h20v20H15V45zm45 0h20v20H60V45zM5 50v5h5v-5H5zm60 0v10h10V50H65zM0 70h20v10H0V70zm25 0h10v10H25V70zm25 0h10v10H50V70zm15 0h15v10H65V70z'/%3E%3C/svg%3E`

    return (
        <>
            {/* Dimmed Backdrop Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Full Page Modal */}
            <div className="fixed inset-0 z-50 bg-[#f6f6f8] flex flex-col overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center bg-white p-4 pb-2 justify-between border-b border-gray-100">
                    <button
                        onClick={onClose}
                        className="flex size-12 shrink-0 items-center justify-start cursor-pointer text-gray-900"
                    >
                        <span className="material-symbols-outlined text-2xl">arrow_back</span>
                    </button>
                    <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-12">
                        Generar Flyer
                    </h2>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto pb-32">
                    {/* Vehicle Selected */}
                    <div className="p-4">
                        <h3 className="text-gray-900 text-base font-bold leading-tight px-1 mb-3">Vehículo seleccionado</h3>
                        <div className="flex items-stretch justify-between gap-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                            <div className="flex flex-[2_2_0px] flex-col gap-3 justify-between">
                                <div className="flex flex-col gap-1">
                                    <p className="text-gray-900 text-base font-bold leading-tight">{vehicle.marca} {vehicle.modelo}</p>
                                    <p className="text-gray-500 text-sm font-normal leading-normal">{vehicle.año_matriculacion} • {vehicle.kilometraje.toLocaleString('es-ES')} km</p>
                                    <p className="text-[#135bec] text-base font-bold leading-normal mt-1">{formatCurrency(vehicle.precio_venta - vehicle.descuento)}</p>
                                </div>
                            </div>
                            <div
                                className="w-24 sm:w-32 bg-center bg-no-repeat bg-cover rounded-lg shrink-0"
                                style={{ backgroundImage: `url('${imageUrl}')` }}
                            />
                        </div>
                    </div>

                    {/* Configuration */}
                    <div className="px-4 pt-2">
                        <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-tight pb-3">Configuración</h2>

                        {/* Paper Size Toggle */}
                        <div className="flex mb-6">
                            <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-gray-200 p-1">
                                <label className={cn(
                                    "flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium leading-normal transition-all",
                                    paperSize === 'A4'
                                        ? "bg-white shadow-sm text-gray-900"
                                        : "text-gray-500"
                                )}>
                                    <span className="truncate">A4 (Folio)</span>
                                    <input
                                        checked={paperSize === 'A4'}
                                        className="invisible w-0"
                                        name="paper-size"
                                        type="radio"
                                        value="A4"
                                        onChange={() => setPaperSize('A4')}
                                    />
                                </label>
                                <label className={cn(
                                    "flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium leading-normal transition-all",
                                    paperSize === 'A5'
                                        ? "bg-white shadow-sm text-gray-900"
                                        : "text-gray-500"
                                )}>
                                    <span className="truncate">A5 (Cuartilla)</span>
                                    <input
                                        className="invisible w-0"
                                        name="paper-size"
                                        type="radio"
                                        value="A5"
                                        onChange={() => setPaperSize('A5')}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-1 mb-6">
                            {/* Show Price */}
                            <label className="flex gap-x-3 py-3 items-center justify-between cursor-pointer group">
                                <span className="text-gray-900 text-base font-normal leading-normal">Mostrar precio</span>
                                <div className="relative flex items-center">
                                    <input
                                        checked={showPrice}
                                        onChange={(e) => setShowPrice(e.target.checked)}
                                        className="peer h-6 w-6 cursor-pointer appearance-none rounded border-2 border-gray-300 bg-transparent transition-all checked:border-[#135bec] checked:bg-[#135bec] hover:border-[#135bec] focus:outline-none"
                                        type="checkbox"
                                    />
                                    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                        <span className="material-symbols-outlined text-sm font-bold">check</span>
                                    </span>
                                </div>
                            </label>
                            <div className="h-px bg-gray-200 w-full" />

                            {/* Show Equipment */}
                            <label className="flex gap-x-3 py-3 items-center justify-between cursor-pointer group">
                                <span className="text-gray-900 text-base font-normal leading-normal">Mostrar equipamiento destacado</span>
                                <div className="relative flex items-center">
                                    <input
                                        checked={showEquipment}
                                        onChange={(e) => setShowEquipment(e.target.checked)}
                                        className="peer h-6 w-6 cursor-pointer appearance-none rounded border-2 border-gray-300 bg-transparent transition-all checked:border-[#135bec] checked:bg-[#135bec] hover:border-[#135bec] focus:outline-none"
                                        type="checkbox"
                                    />
                                    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                        <span className="material-symbols-outlined text-sm font-bold">check</span>
                                    </span>
                                </div>
                            </label>
                            <div className="h-px bg-gray-200 w-full" />

                            {/* Include QR */}
                            <label className="flex gap-x-3 py-3 items-center justify-between cursor-pointer group">
                                <span className="text-gray-900 text-base font-normal leading-normal">Incluir código QR</span>
                                <div className="relative flex items-center">
                                    <input
                                        checked={includeQR}
                                        onChange={(e) => setIncludeQR(e.target.checked)}
                                        className="peer h-6 w-6 cursor-pointer appearance-none rounded border-2 border-gray-300 bg-transparent transition-all checked:border-[#135bec] checked:bg-[#135bec] hover:border-[#135bec] focus:outline-none"
                                        type="checkbox"
                                    />
                                    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                        <span className="material-symbols-outlined text-sm font-bold">check</span>
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="px-4 pb-8">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-tight">Vista Previa</h2>
                            <span className="text-xs font-medium text-[#135bec] bg-[#135bec]/10 px-2 py-1 rounded">Escala 1:4</span>
                        </div>
                        <div className="w-full flex justify-center bg-gray-300 p-6 rounded-xl overflow-hidden">
                            {/* Preview Container */}
                            <div
                                ref={printRef}
                                className="relative bg-white w-[280px] aspect-[1/1.414] shadow-xl flex flex-col overflow-hidden"
                            >
                                {/* Hero Image */}
                                <div
                                    className="h-[45%] w-full bg-cover bg-center"
                                    style={{ backgroundImage: `url('${imageUrl}')` }}
                                >
                                    <div className="w-full h-full bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                                        <div className="text-white font-bold text-xs uppercase tracking-wider bg-[#135bec] px-2 py-0.5 rounded-sm w-fit mb-1">
                                            MidCar Certified
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-4 flex flex-col">
                                    <h1 className="text-gray-900 text-xl font-extrabold leading-tight mb-1">
                                        {vehicle.marca} {vehicle.modelo}
                                    </h1>
                                    <p className="text-gray-500 text-xs font-medium mb-3">
                                        {vehicle.version}
                                    </p>

                                    {showPrice && (
                                        <div className="text-[#135bec] text-3xl font-bold tracking-tight mb-4">
                                            {formatCurrency(vehicle.precio_venta - vehicle.descuento)}
                                        </div>
                                    )}

                                    {/* Specs Grid */}
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-auto">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '16px' }}>calendar_today</span>
                                            <span className="text-gray-900 text-xs font-semibold">{vehicle.año_matriculacion}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '16px' }}>speed</span>
                                            <span className="text-gray-900 text-xs font-semibold">{vehicle.kilometraje.toLocaleString('es-ES')} km</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '16px' }}>local_gas_station</span>
                                            <span className="text-gray-900 text-xs font-semibold">{fuelDisplay[vehicle.combustible] || vehicle.combustible}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '16px' }}>settings</span>
                                            <span className="text-gray-900 text-xs font-semibold">{transmissionDisplay[vehicle.transmision] || vehicle.transmision}</span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    {includeQR && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase">Escanea para ver más</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[#135bec]" style={{ fontSize: '14px' }}>verified</span>
                                                    <span className="text-[10px] font-bold text-gray-900">Garantía {vehicle.garantia_meses} meses</span>
                                                </div>
                                            </div>
                                            <div className="bg-white p-1 rounded border border-gray-100 shadow-sm">
                                                <div
                                                    className="size-14 bg-white"
                                                    style={{
                                                        backgroundImage: `url('${qrCodeSvg}')`,
                                                        backgroundSize: 'contain',
                                                        backgroundRepeat: 'no-repeat'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-6 sm:pb-4 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-20">
                    <div className="flex gap-3 max-w-2xl mx-auto">
                        <button
                            onClick={handleDownloadPDF}
                            className="flex h-12 flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-gray-300 bg-transparent text-gray-900 text-base font-bold leading-normal tracking-tight hover:bg-gray-50 transition active:scale-95"
                        >
                            <span className="material-symbols-outlined mr-2">picture_as_pdf</span>
                            <span className="truncate">PDF</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex h-12 flex-[2] cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-[#135bec] text-white shadow-lg shadow-blue-500/30 text-base font-bold leading-normal tracking-tight hover:bg-blue-700 transition active:scale-95"
                        >
                            <span className="material-symbols-outlined mr-2">print</span>
                            <span className="truncate">Imprimir Flyer</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
