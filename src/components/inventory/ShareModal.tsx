"use client"

import { useState } from "react"
import { Vehicle } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { EQUIPAMIENTO_VEHICULO } from "@/lib/constants"
import { jsPDF } from "jspdf"
import QRCode from "qrcode"

// Helper para obtener imagen válida
const getValidImageUrl = (url: string | null | undefined): string => {
    if (!url) return ''
    return url
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
    automatico: 'Automático',
}

interface ShareModalProps {
    vehicle: Vehicle
    open: boolean
    onClose: () => void
}

// Customization options for the PDF
interface PDFOptions {
    showPhoto: boolean
    showSpecs: boolean
    showFichaTecnica: boolean
    showEquipamiento: boolean
    showGarantia: boolean
    showObservaciones: boolean
    showQR: boolean
}

// Helper: load image via canvas
function loadImageFromElement(img: HTMLImageElement): { data: string; width: number; height: number } | null {
    try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return null
        ctx.drawImage(img, 0, 0)
        const data = canvas.toDataURL('image/jpeg', 0.85)
        return { data, width: img.naturalWidth, height: img.naturalHeight }
    } catch {
        return null
    }
}

// Helper: load image as base64 for jsPDF (with proxy fallback for CORS)
function loadImageAsBase64(url: string): Promise<{ data: string; width: number; height: number } | null> {
    return new Promise((resolve) => {
        if (!url) { resolve(null); return }
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            const result = loadImageFromElement(img)
            if (result) {
                resolve(result)
            } else {
                // Canvas tainted, try proxy
                loadViaProxy(url).then(resolve)
            }
        }
        img.onerror = () => {
            // CORS blocked, try proxy
            loadViaProxy(url).then(resolve)
        }
        img.src = url
    })
}

// Fallback: load image through server-side proxy to bypass CORS
function loadViaProxy(url: string): Promise<{ data: string; width: number; height: number } | null> {
    return new Promise((resolve) => {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`
        const img = new Image()
        img.onload = () => resolve(loadImageFromElement(img))
        img.onerror = () => resolve(null)
        img.src = proxyUrl
    })
}

// Helper: get equipment label from id
function getEquipmentLabel(eqId: string): string {
    for (const category of Object.values(EQUIPAMIENTO_VEHICULO)) {
        const item = category.items.find(i => i.id === eqId)
        if (item) return item.label
    }
    // Fallback: capitalize the id
    return eqId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export function ShareModal({ vehicle, open, onClose }: ShareModalProps) {
    const [generatingPDF, setGeneratingPDF] = useState(false)
    const [options, setOptions] = useState<PDFOptions>({
        showPhoto: true,
        showSpecs: true,
        showFichaTecnica: true,
        showEquipamiento: true,
        showGarantia: true,
        showObservaciones: true,
        showQR: true,
    })

    if (!open) return null

    // Get best available image
    const vehicleImage = getValidImageUrl(vehicle.imagen_principal)
        || getValidImageUrl(vehicle.imagenes?.[0]?.url)
        || ''

    const toggleOption = (key: keyof PDFOptions) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const handleGeneratePDF = async () => {
        setGeneratingPDF(true)

        try {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
            const pageWidth = doc.internal.pageSize.getWidth() // 210
            const pageHeight = doc.internal.pageSize.getHeight() // 297
            const margin = 12
            const contentWidth = pageWidth - margin * 2

            // Colors - Red & White theme
            const primary: [number, number, number] = [200, 30, 30]
            const primaryLight: [number, number, number] = [220, 50, 50]
            const dark: [number, number, number] = [17, 24, 39]
            const gray: [number, number, number] = [107, 114, 128]
            const lightGray: [number, number, number] = [156, 163, 175]
            const white: [number, number, number] = [255, 255, 255]

            // Helper to draw rounded rect with fill
            const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, fillColor: [number, number, number]) => {
                doc.setFillColor(...fillColor)
                doc.roundedRect(x, y, w, h, r, r, 'F')
            }

            // Helper: draw a spec pill (red accent)
            const drawSpecPill = (x: number, y: number, w: number, _icon: string, label: string, value: string) => {
                drawRoundedRect(x, y, w, 18, 2, [255, 245, 245])
                // Red top accent line
                doc.setFillColor(...primary)
                doc.rect(x + 4, y, w - 8, 0.8, 'F')
                doc.setFontSize(7)
                doc.setTextColor(...gray)
                doc.setFont('helvetica', 'normal')
                doc.text(label.toUpperCase(), x + w / 2, y + 6, { align: 'center' })
                doc.setFontSize(10)
                doc.setTextColor(...dark)
                doc.setFont('helvetica', 'bold')
                doc.text(value, x + w / 2, y + 13, { align: 'center' })
            }

            let y = 0

            // ═══════════════════════════════════════════════════
            // HEADER BAR - Red theme, MIDCar - vehiculos de confianza
            // ═══════════════════════════════════════════════════
            doc.setFillColor(...primary)
            doc.rect(0, 0, pageWidth, 14, 'F')

            doc.setTextColor(...white)
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text('MIDCar', margin, 9)

            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.text('- vehículos de confianza', margin + 27, 9)

            // No date on the right (removed as requested)

            y = 18

            // ═══════════════════════════════════════════════════
            // VEHICLE PHOTO - Large, centered
            // ═══════════════════════════════════════════════════
            if (options.showPhoto) {
                const imgData = vehicleImage ? await loadImageAsBase64(vehicleImage) : null

                const photoAreaHeight = 85
                const photoX = margin
                const photoY = y
                const photoW = contentWidth
                const photoH = photoAreaHeight

                // Photo background (light gray placeholder)
                drawRoundedRect(photoX, photoY, photoW, photoH, 3, [240, 240, 245])

                if (imgData) {
                    // Calculate aspect ratio to fit image
                    const imgAspect = imgData.width / imgData.height
                    const boxAspect = photoW / photoH
                    let drawW: number, drawH: number, drawX: number, drawY: number

                    if (imgAspect > boxAspect) {
                        drawW = photoW
                        drawH = photoW / imgAspect
                        drawX = photoX
                        drawY = photoY + (photoH - drawH) / 2
                    } else {
                        drawH = photoH
                        drawW = photoH * imgAspect
                        drawX = photoX + (photoW - drawW) / 2
                        drawY = photoY
                    }

                    doc.addImage(imgData.data, 'JPEG', drawX, drawY, drawW, drawH)
                } else {
                    doc.setTextColor(...lightGray)
                    doc.setFontSize(12)
                    doc.setFont('helvetica', 'normal')
                    doc.text('Sin fotografía disponible', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' })
                }

                // Photo count badge
                if (vehicle.imagenes && vehicle.imagenes.length > 1) {
                    const badgeText = `${vehicle.imagenes.length} fotos`
                    drawRoundedRect(photoX + photoW - 28, photoY + photoH - 10, 26, 8, 2, [0, 0, 0])
                    doc.setTextColor(...white)
                    doc.setFontSize(7)
                    doc.setFont('helvetica', 'bold')
                    doc.text(badgeText, photoX + photoW - 15, photoY + photoH - 5, { align: 'center' })
                }

                y = photoY + photoH + 6
            }

            // ═══════════════════════════════════════════════════
            // VEHICLE TITLE + PRICE + IVA
            // ═══════════════════════════════════════════════════
            doc.setTextColor(...dark)
            doc.setFontSize(18)
            doc.setFont('helvetica', 'bold')

            const fullTitle = `${vehicle.marca} ${vehicle.modelo}`
            doc.text(fullTitle, margin, y + 6)

            // Version below title
            if (vehicle.version) {
                doc.setFontSize(10)
                doc.setTextColor(...gray)
                doc.setFont('helvetica', 'normal')
                const versionLines = doc.splitTextToSize(vehicle.version, contentWidth - 70)
                doc.text(versionLines, margin, y + 12)
            }

            // Matriculacion (month/year)
            const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
            const mesText = vehicle.mes_matriculacion ? MESES[vehicle.mes_matriculacion - 1] : ''
            const matriculacionText = vehicle.año_matriculacion
                ? `Matriculado: ${mesText ? mesText + ' ' : ''}${vehicle.año_matriculacion}`
                : ''
            if (matriculacionText) {
                doc.setFontSize(8)
                doc.setTextColor(...gray)
                doc.setFont('helvetica', 'normal')
                doc.text(matriculacionText, margin, y + 17)
            }

            // Price - right aligned with +IVA incluido
            const finalPrice = vehicle.precio_venta - (vehicle.descuento || 0)
            const priceText = formatCurrency(finalPrice)

            doc.setTextColor(...primary)
            doc.setFontSize(20)
            doc.setFont('helvetica', 'bold')
            doc.text(priceText, pageWidth - margin, y + 6, { align: 'right' })

            // +IVA incluido below price
            doc.setFontSize(8)
            doc.setTextColor(...primaryLight)
            doc.setFont('helvetica', 'normal')
            doc.text('+IVA incluido', pageWidth - margin, y + 11, { align: 'right' })

            // Old price if discount
            if (vehicle.descuento > 0) {
                doc.setTextColor(...lightGray)
                doc.setFontSize(9)
                doc.setFont('helvetica', 'normal')
                const oldPrice = formatCurrency(vehicle.precio_venta)
                doc.text(oldPrice, pageWidth - margin, y + 16, { align: 'right' })
                const oldPriceWidth = doc.getTextWidth(oldPrice)
                doc.setDrawColor(...lightGray)
                doc.setLineWidth(0.3)
                doc.line(pageWidth - margin - oldPriceWidth, y + 15, pageWidth - margin, y + 15)
            }

            y += 22

            // Thin red separator
            doc.setDrawColor(...primary)
            doc.setLineWidth(0.5)
            doc.line(margin, y, pageWidth - margin, y)

            y += 5

            // ═══════════════════════════════════════════════════
            // KEY SPECS - 4 pill cards (red theme)
            // ═══════════════════════════════════════════════════
            if (options.showSpecs) {
                const pillW = (contentWidth - 9) / 4
                const pillGap = 3

                const matricPillText = vehicle.mes_matriculacion
                    ? `${MESES[vehicle.mes_matriculacion - 1]?.substring(0, 3)}. ${vehicle.año_matriculacion}`
                    : vehicle.año_matriculacion?.toString() || '-'
                drawSpecPill(margin, y, pillW, '', 'Matriculación', matricPillText)
                drawSpecPill(margin + pillW + pillGap, y, pillW, '', 'Kilómetros', `${vehicle.kilometraje?.toLocaleString('es-ES')} km`)
                drawSpecPill(margin + (pillW + pillGap) * 2, y, pillW, '', 'Combustible', FUEL_LABELS[vehicle.combustible] || vehicle.combustible || '-')
                drawSpecPill(margin + (pillW + pillGap) * 3, y, pillW, '', 'Cambio', TRANSMISSION_LABELS[vehicle.transmision] || vehicle.transmision || '-')

                y += 22

                // Second row
                drawSpecPill(margin, y, pillW, '', 'Potencia', vehicle.potencia_cv ? `${vehicle.potencia_cv} CV` : '-')
                drawSpecPill(margin + pillW + pillGap, y, pillW, '', 'Color', vehicle.color_exterior || '-')
                drawSpecPill(margin + (pillW + pillGap) * 2, y, pillW, '', 'Puertas', vehicle.num_puertas?.toString() || '-')
                drawSpecPill(margin + (pillW + pillGap) * 3, y, pillW, '', 'Etiqueta DGT', vehicle.etiqueta_dgt || '-')

                y += 24
            }

            // ═══════════════════════════════════════════════════
            // FICHA TÉCNICA - Detailed specs table
            // ═══════════════════════════════════════════════════
            if (options.showFichaTecnica) {
                doc.setFontSize(11)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(...dark)
                doc.text('Ficha Técnica', margin, y)

                y += 2

                // Red line under section title
                doc.setDrawColor(...primary)
                doc.setLineWidth(0.6)
                doc.line(margin, y, margin + 22, y)

                y += 5

                const detailSpecs = [
                    { label: 'Marca', value: vehicle.marca || '-' },
                    { label: 'Modelo', value: vehicle.modelo || '-' },
                    { label: 'Versión', value: vehicle.version || '-' },
                    { label: 'Matriculación', value: vehicle.mes_matriculacion
                        ? `${MESES[vehicle.mes_matriculacion - 1]} ${vehicle.año_matriculacion}`
                        : vehicle.año_matriculacion?.toString() || '-' },
                    { label: 'Kilómetros', value: vehicle.kilometraje ? `${vehicle.kilometraje.toLocaleString('es-ES')} km` : '-' },
                    { label: 'Combustible', value: FUEL_LABELS[vehicle.combustible] || vehicle.combustible || '-' },
                    { label: 'Transmisión', value: TRANSMISSION_LABELS[vehicle.transmision] || vehicle.transmision || '-' },
                    { label: 'Potencia', value: vehicle.potencia_cv ? `${vehicle.potencia_cv} CV (${vehicle.potencia_kw} kW)` : '-' },
                    { label: 'Cilindrada', value: vehicle.cilindrada ? `${(vehicle.cilindrada / 1000).toFixed(1)}L` : '-' },
                    { label: 'Color exterior', value: vehicle.color_exterior || '-' },
                    { label: 'Puertas', value: vehicle.num_puertas?.toString() || '-' },
                    { label: 'Etiqueta DGT', value: vehicle.etiqueta_dgt || '-' },
                ]

                const colW = contentWidth / 2
                const rowH = 6.5

                detailSpecs.forEach((spec, idx) => {
                    const col = idx % 2
                    const row = Math.floor(idx / 2)
                    const x = margin + col * colW
                    const rowY = y + row * rowH

                    // Alternate row background (light red tint)
                    if (row % 2 === 0) {
                        doc.setFillColor(255, 248, 248)
                        doc.rect(margin, rowY - 1.5, contentWidth, rowH, 'F')
                    }

                    doc.setFontSize(8)
                    doc.setTextColor(...gray)
                    doc.setFont('helvetica', 'normal')
                    doc.text(spec.label, x + 2, rowY + 2.5)

                    doc.setTextColor(...dark)
                    doc.setFont('helvetica', 'bold')
                    doc.text(spec.value, x + 35, rowY + 2.5)
                })

                y += Math.ceil(detailSpecs.length / 2) * rowH + 6
            }

            // ═══════════════════════════════════════════════════
            // EQUIPAMIENTO
            // ═══════════════════════════════════════════════════
            if (options.showEquipamiento && vehicle.equipamiento && vehicle.equipamiento.length > 0) {
                doc.setFontSize(11)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(...dark)
                doc.text('Equipamiento', margin, y)

                // Red underline
                doc.setDrawColor(...primary)
                doc.setLineWidth(0.6)
                doc.line(margin, y + 2, margin + 24, y + 2)

                y += 6

                const eqLabels = vehicle.equipamiento.map(eqId => getEquipmentLabel(eqId))
                const eqCols = 3
                const eqColW = contentWidth / eqCols
                const eqRowH = 5

                doc.setFontSize(7.5)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(...gray)

                eqLabels.forEach((label, idx) => {
                    const col = idx % eqCols
                    const row = Math.floor(idx / eqCols)
                    const x = margin + col * eqColW
                    const eqY = y + row * eqRowH

                    if (eqY > pageHeight - 50) return

                    // Red check mark
                    doc.setTextColor(...primary)
                    doc.setFont('helvetica', 'bold')
                    doc.text('✓', x, eqY)

                    doc.setTextColor(...dark)
                    doc.setFont('helvetica', 'normal')
                    doc.text(label, x + 5, eqY)
                })

                y += Math.ceil(eqLabels.length / eqCols) * eqRowH + 4
            }

            // ═══════════════════════════════════════════════════
            // GARANTÍA BANNER (red theme)
            // ═══════════════════════════════════════════════════
            if (options.showGarantia) {
                if (y > pageHeight - 50) y = pageHeight - 50

                drawRoundedRect(margin, y, contentWidth, 12, 2, [255, 240, 240])
                doc.setDrawColor(...primary)
                doc.setLineWidth(0.4)
                doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'S')

                doc.setTextColor(...primary)
                doc.setFontSize(10)
                doc.setFont('helvetica', 'bold')
                doc.text(`✓  ${vehicle.garantia_meses || 12} meses de garantía incluida`, margin + 6, y + 7.5)

                doc.setTextColor(...primary)
                doc.setFontSize(10)
                doc.setFont('helvetica', 'bold')
                doc.text(`${formatCurrency(finalPrice)} +IVA incl.`, pageWidth - margin - 4, y + 7.5, { align: 'right' })

                y += 16
            }

            // ═══════════════════════════════════════════════════
            // DESCRIPTION / NOTES
            // ═══════════════════════════════════════════════════
            if (options.showObservaciones && (vehicle as any).observaciones) {
                if (y < pageHeight - 45) {
                    doc.setFontSize(11)
                    doc.setFont('helvetica', 'bold')
                    doc.setTextColor(...dark)
                    doc.text('Observaciones', margin, y)

                    doc.setDrawColor(...primary)
                    doc.setLineWidth(0.6)
                    doc.line(margin, y + 2, margin + 26, y + 2)

                    y += 6
                    doc.setFontSize(8)
                    doc.setFont('helvetica', 'normal')
                    doc.setTextColor(...gray)
                    const maxLines = Math.floor((pageHeight - 45 - y) / 4)
                    const obsLines = doc.splitTextToSize((vehicle as any).observaciones, contentWidth)
                    doc.text(obsLines.slice(0, maxLines), margin, y)
                }
            }

            // ═══════════════════════════════════════════════════
            // FOOTER - Red theme, with QR code, NO dates
            // ═══════════════════════════════════════════════════
            const footerH = 28
            const footerY = pageHeight - footerH

            // Footer background
            doc.setFillColor(255, 245, 245)
            doc.rect(0, footerY, pageWidth, footerH, 'F')

            // Red top line
            doc.setDrawColor(...primary)
            doc.setLineWidth(0.5)
            doc.line(0, footerY, pageWidth, footerY)

            // QR Code
            if (options.showQR) {
                const qrUrl = vehicle.url_web || `https://midcar.es/vehiculos/${vehicle.matricula.replace(/\s/g, '')}`
                try {
                    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
                        width: 200,
                        margin: 1,
                        color: { dark: '#C81E1E', light: '#FFFFFF' }
                    })
                    const qrSize = 18
                    const qrX = pageWidth - margin - qrSize
                    const qrY = footerY + 2
                    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

                    // Small text under QR
                    doc.setFontSize(5)
                    doc.setTextColor(...gray)
                    doc.setFont('helvetica', 'normal')
                    doc.text('Escanea para ver online', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' })
                } catch {
                    // QR generation failed, skip
                }
            }

            // Company info (left side)
            doc.setTextColor(...primary)
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.text('MIDCar', margin, footerY + 7)

            doc.setFontSize(7)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...dark)
            doc.text('Vehículos de confianza', margin + 24, footerY + 7)

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(7)
            doc.setTextColor(...gray)
            doc.text('Tel: +34 900 123 456  |  info@midcar.es  |  www.midcar.es', margin, footerY + 13)

            // Reference
            doc.setTextColor(...lightGray)
            doc.setFontSize(7)
            doc.text(`Ref: ${vehicle.matricula}  |  Stock: ${vehicle.stock_id || '-'}`, margin, footerY + 18)

            // No dates anywhere in footer (removed as requested)

            // Save PDF
            doc.save(`MidCar_${vehicle.marca}_${vehicle.modelo}_${vehicle.matricula.replace(/\s/g, '')}.pdf`)
        } catch (error) {
            console.error('Error generating PDF:', error)
        } finally {
            setGeneratingPDF(false)
        }
    }

    const optionItems: { key: keyof PDFOptions; label: string; icon: string }[] = [
        { key: 'showPhoto', label: 'Fotografía', icon: 'photo_camera' },
        { key: 'showSpecs', label: 'Especificaciones', icon: 'speed' },
        { key: 'showFichaTecnica', label: 'Ficha técnica', icon: 'description' },
        { key: 'showEquipamiento', label: 'Equipamiento', icon: 'checklist' },
        { key: 'showGarantia', label: 'Garantía', icon: 'verified' },
        { key: 'showObservaciones', label: 'Observaciones', icon: 'notes' },
        { key: 'showQR', label: 'Código QR web', icon: 'qr_code_2' },
    ]

    return (
        <>
            {/* Dimmed Backdrop Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Bottom Sheet Modal */}
            <div className="fixed bottom-0 left-0 right-0 w-full bg-white z-50 rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex flex-col animate-slide-up max-h-[90vh] overflow-y-auto">
                {/* Handle */}
                <div className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                    <div className="w-10 h-1 rounded-full bg-gray-300" />
                </div>

                {/* Title */}
                <div className="px-6 pb-3 pt-1 text-center">
                    <h2 className="text-xl font-bold text-gray-900">Descargar Ficha</h2>
                    <p className="text-gray-400 text-xs mt-1">Personaliza el contenido del PDF</p>
                </div>

                {/* Content */}
                <div className="px-5 pb-8 space-y-4">
                    {/* Vehicle Preview Card */}
                    <div className="bg-[#f6f6f8] p-3 rounded-2xl flex items-center gap-4 border border-gray-100 shadow-sm">
                        {/* Thumbnail */}
                        <div
                            className="w-24 h-20 shrink-0 rounded-xl bg-cover bg-center shadow-inner relative overflow-hidden bg-gray-200"
                            style={vehicleImage ? { backgroundImage: `url('${vehicleImage}')` } : undefined}
                        >
                            {!vehicleImage && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-gray-400 text-2xl">no_photography</span>
                                </div>
                            )}
                        </div>
                        {/* Info */}
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                            <h3 className="text-gray-900 font-bold text-base leading-snug truncate">
                                {vehicle.marca} {vehicle.modelo}
                            </h3>
                            <p className="text-gray-500 text-xs font-medium mt-0.5 truncate">
                                {vehicle.version}
                            </p>
                            <p className="text-gray-400 text-xs mt-0.5">
                                {vehicle.mes_matriculacion ? `${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][vehicle.mes_matriculacion - 1]} ` : ''}{vehicle.año_matriculacion} &bull; {vehicle.kilometraje?.toLocaleString('es-ES')} km &bull; {FUEL_LABELS[vehicle.combustible] || vehicle.combustible}
                            </p>
                            <p className="text-red-600 font-bold text-lg mt-1 tracking-tight">
                                {formatCurrency(vehicle.precio_venta - (vehicle.descuento || 0))}
                                <span className="text-red-400 text-xs font-normal ml-1">+IVA incl.</span>
                            </p>
                        </div>
                    </div>

                    {/* Customization Toggles */}
                    <div className="bg-gray-50 rounded-2xl p-3 space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">Secciones del PDF</p>
                        {optionItems.map(({ key, label, icon }) => (
                            <button
                                key={key}
                                onClick={() => toggleOption(key)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                    options[key]
                                        ? 'bg-white shadow-sm border border-gray-100'
                                        : 'opacity-50'
                                }`}
                            >
                                <span className="material-symbols-outlined text-gray-500" style={{ fontSize: '20px' }}>{icon}</span>
                                <span className="flex-1 text-left text-sm font-medium text-gray-700">{label}</span>
                                <div className={`w-9 h-5 rounded-full transition-colors relative ${options[key] ? 'bg-red-500' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${options[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* PDF Download Button */}
                    <button
                        onClick={handleGeneratePDF}
                        disabled={generatingPDF}
                        className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/25 active:scale-[0.98] transition-all group disabled:opacity-70"
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
                                {generatingPDF ? 'Generando ficha...' : 'Descargar Ficha PDF'}
                            </p>
                            <p className="text-white/80 text-sm">Ficha personalizada para el cliente</p>
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
