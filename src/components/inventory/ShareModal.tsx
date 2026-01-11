"use client"

import { useState } from "react"
import { Vehicle } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { jsPDF } from "jspdf"

interface ShareModalProps {
    vehicle: Vehicle
    open: boolean
    onClose: () => void
}

export function ShareModal({ vehicle, open, onClose }: ShareModalProps) {
    const [generatingPDF, setGeneratingPDF] = useState(false)

    if (!open) return null

    const imageUrl = vehicle.imagen_principal || vehicle.imagenes?.[0]?.url ||
        'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop'

    // Generar PDF profesional tipo ficha de vehículo
    const handleGeneratePDF = async () => {
        setGeneratingPDF(true)

        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            const pageWidth = doc.internal.pageSize.getWidth()
            const pageHeight = doc.internal.pageSize.getHeight()
            const margin = 15
            const contentWidth = pageWidth - (margin * 2)

            // Colores corporativos
            const primaryColor: [number, number, number] = [19, 91, 236] // #135bec
            const darkColor: [number, number, number] = [17, 24, 39]
            const grayColor: [number, number, number] = [107, 114, 128]

            // =====================================================
            // HEADER
            // =====================================================
            doc.setFillColor(...primaryColor)
            doc.rect(0, 0, pageWidth, 32, 'F')

            doc.setTextColor(255, 255, 255)
            doc.setFontSize(24)
            doc.setFont('helvetica', 'bold')
            doc.text('MidCar', margin, 18)

            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.text('Concesionario de Vehiculos de Ocasion', margin, 26)

            // =====================================================
            // TITULO + PRECIO (en una caja)
            // =====================================================
            let yPos = 42

            // Caja contenedora para titulo y precio
            doc.setFillColor(250, 250, 252)
            doc.roundedRect(margin, yPos - 5, contentWidth, 38, 3, 3, 'F')
            doc.setDrawColor(230, 230, 235)
            doc.setLineWidth(0.3)
            doc.roundedRect(margin, yPos - 5, contentWidth, 38, 3, 3, 'S')

            // Titulo del vehiculo
            doc.setTextColor(...darkColor)
            doc.setFontSize(18)
            doc.setFont('helvetica', 'bold')
            doc.text(`${vehicle.marca} ${vehicle.modelo}`, margin + 6, yPos + 5)

            // Version
            doc.setFontSize(10)
            doc.setTextColor(...grayColor)
            doc.setFont('helvetica', 'normal')
            doc.text(vehicle.version || '', margin + 6, yPos + 12)

            // Precio
            doc.setTextColor(...primaryColor)
            doc.setFontSize(22)
            doc.setFont('helvetica', 'bold')
            const priceText = formatCurrency(vehicle.precio_venta - vehicle.descuento)
            doc.text(priceText, margin + 6, yPos + 26)

            // Precio anterior si hay descuento
            if (vehicle.descuento > 0) {
                doc.setTextColor(...grayColor)
                doc.setFontSize(10)
                doc.setFont('helvetica', 'normal')
                const priceWidth = doc.getTextWidth(priceText)
                doc.text(`antes ${formatCurrency(vehicle.precio_venta)}`, margin + 10 + priceWidth, yPos + 26)
            }

            // =====================================================
            // CARACTERISTICAS PRINCIPALES (Grid compacto)
            // =====================================================
            yPos += 45

            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...darkColor)
            doc.text('Caracteristicas', margin, yPos)

            yPos += 6

            const specs = [
                { label: 'Ano', value: vehicle.año_matriculacion?.toString() || '-' },
                { label: 'Km', value: `${vehicle.kilometraje?.toLocaleString('es-ES')} km` },
                { label: 'Combustible', value: vehicle.combustible || '-' },
                { label: 'Cambio', value: vehicle.transmision || '-' },
                { label: 'Potencia', value: vehicle.potencia_cv ? `${vehicle.potencia_cv} CV` : '-' },
                { label: 'Color', value: vehicle.color_exterior || '-' },
                { label: 'Puertas', value: vehicle.num_puertas?.toString() || '-' },
                { label: 'Etiqueta', value: vehicle.etiqueta_dgt || '-' },
            ]

            // Dibujar specs en 2 columnas, mas compacto
            const specColWidth = contentWidth / 2
            specs.forEach((spec, index) => {
                const col = index % 2
                const row = Math.floor(index / 2)
                const x = margin + (col * specColWidth)
                const y = yPos + (row * 8)

                doc.setFontSize(8)
                doc.setTextColor(...grayColor)
                doc.setFont('helvetica', 'normal')
                doc.text(`${spec.label}:`, x, y)

                doc.setTextColor(...darkColor)
                doc.setFont('helvetica', 'bold')
                doc.text(spec.value, x + 22, y)
            })

            yPos += 32

            // =====================================================
            // EQUIPAMIENTO (si existe)
            // =====================================================
            if (vehicle.equipamiento && vehicle.equipamiento.length > 0) {
                doc.setFontSize(11)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(...darkColor)
                doc.text('Equipamiento', margin, yPos)

                yPos += 5

                const equipList = vehicle.equipamiento.slice(0, 15)
                const eqColWidth = contentWidth / 3

                doc.setFontSize(8)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(...grayColor)

                equipList.forEach((eq, index) => {
                    const col = index % 3
                    const row = Math.floor(index / 3)
                    const x = margin + (col * eqColWidth)
                    const y = yPos + (row * 5)
                    const truncatedEq = eq.length > 20 ? eq.substring(0, 18) + '..' : eq
                    doc.text(`- ${truncatedEq}`, x, y)
                })

                yPos += Math.ceil(equipList.length / 3) * 5 + 6
            }

            // =====================================================
            // GARANTIA (justo despues del contenido)
            // =====================================================
            doc.setFillColor(236, 253, 245)
            doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F')

            doc.setTextColor(22, 163, 74)
            doc.setFontSize(9)
            doc.setFont('helvetica', 'bold')
            doc.text(`${vehicle.garantia_meses || 12} meses de garantia incluida`, margin + 6, yPos + 8)

            // =====================================================
            // FOOTER (fijo abajo)
            // =====================================================
            const footerY = pageHeight - 22
            doc.setFillColor(245, 247, 250)
            doc.rect(0, footerY - 4, pageWidth, 26, 'F')

            doc.setTextColor(...darkColor)
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text('Contacto', margin, footerY + 4)

            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...grayColor)
            doc.text('Tel: +34 900 123 456  |  info@midcar.es  |  www.midcar.es', margin, footerY + 10)
            doc.text(`Ref: ${vehicle.matricula}  |  ${new Date().toLocaleDateString('es-ES')}`, margin, footerY + 16)

            // Guardar PDF
            doc.save(`MidCar_${vehicle.marca}_${vehicle.modelo}_${vehicle.matricula.replace(/\s/g, '')}.pdf`)
        } catch (error) {
            console.error('Error generating PDF:', error)
        } finally {
            setGeneratingPDF(false)
        }
    }

    return (
        <>
            {/* Dimmed Backdrop Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Bottom Sheet Modal */}
            <div className="fixed bottom-0 left-0 right-0 w-full bg-white z-50 rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex flex-col animate-slide-up">
                {/* Handle */}
                <div className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                    <div className="w-10 h-1 rounded-full bg-gray-300" />
                </div>

                {/* Title */}
                <div className="px-6 pb-4 pt-1 text-center">
                    <h2 className="text-xl font-bold text-gray-900">Descargar Ficha</h2>
                </div>

                {/* Content */}
                <div className="px-5 pb-8 space-y-5">
                    {/* Vehicle Preview Card */}
                    <div className="bg-[#f6f6f8] p-3 rounded-2xl flex items-center gap-4 border border-gray-100 shadow-sm">
                        {/* Thumbnail */}
                        <div
                            className="w-24 h-20 shrink-0 rounded-xl bg-cover bg-center shadow-inner relative overflow-hidden"
                            style={{ backgroundImage: `url('${imageUrl}')` }}
                        >
                            <div className="absolute inset-0 bg-black/5" />
                        </div>
                        {/* Info */}
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                            <h3 className="text-gray-900 font-bold text-base leading-snug truncate">
                                {vehicle.marca} {vehicle.modelo} {vehicle.version}
                            </h3>
                            <p className="text-gray-500 text-xs font-medium mt-0.5">
                                {vehicle.año_matriculacion} • {(vehicle.kilometraje / 1000).toFixed(0)} km
                            </p>
                            <p className="text-[#135bec] font-bold text-lg mt-1 tracking-tight">
                                {formatCurrency(vehicle.precio_venta - vehicle.descuento)}
                            </p>
                        </div>
                    </div>

                    {/* PDF Download - Acción Principal */}
                    <button
                        onClick={handleGeneratePDF}
                        disabled={generatingPDF}
                        className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#135bec] to-blue-600 text-white shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all group disabled:opacity-70"
                    >
                        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            {generatingPDF ? (
                                <span className="material-symbols-outlined animate-spin" style={{ fontSize: '28px' }}>progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>picture_as_pdf</span>
                            )}
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-bold text-lg">
                                {generatingPDF ? 'Generando...' : 'Descargar Ficha PDF'}
                            </p>
                            <p className="text-white/80 text-sm">Ficha profesional para enviar al cliente</p>
                        </div>
                        <span className="material-symbols-outlined text-white/60" style={{ fontSize: '24px' }}>download</span>
                    </button>

                    {/* Cancel Button */}
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl bg-gray-100 text-gray-900 font-bold text-base active:bg-gray-200 active:scale-[0.99] transition-all"
                    >
                        Cancelar
                    </button>
                </div>

                {/* Safe Area Spacer */}
                <div className="h-6 w-full" />
            </div>
        </>
    )
}
