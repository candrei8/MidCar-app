"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { EQUIPAMIENTO_VEHICULO } from "@/lib/constants"
import { cn, formatCurrency } from "@/lib/utils"
import { ShareModal } from "@/components/inventory/ShareModal"
import { ContractGeneratorModal } from "@/components/inventory/ContractGeneratorModal"
import { InvoiceGeneratorModal } from "@/components/inventory/InvoiceGeneratorModal"
import { DocumentGeneratorModal } from "@/components/documents"
import { getVehicleById, getContractsByVehicle, getInvoicesByVehicle, type ContractDB, type InvoiceDB } from "@/lib/supabase-service"
import { getContacts } from "@/lib/db/contacts"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/lib/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import jsPDF from "jspdf"
import type { Vehicle, Contact } from "@/types"

// Función para regenerar PDF de contrato desde datos guardados
const generateContractPDF = (contract: ContractDB, vehicle: Vehicle) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let y = 20

    // Helper
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    // ===== CABECERA =====
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(19, 91, 236)
    doc.text('CONTRATO DE COMPRAVENTA', pageWidth / 2, y, { align: 'center' })

    y += 10
    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(`Nº ${contract.numero_contrato}`, pageWidth / 2, y, { align: 'center' })

    // ===== DATOS EMPRESA VENDEDORA =====
    y += 15
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text('VENDEDOR:', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.text(contract.empresa_nombre || 'Empresa no especificada', margin, y)
    y += 5
    doc.text(`CIF: ${contract.empresa_cif || '-'}`, margin, y)
    y += 5
    doc.text(contract.empresa_direccion || '', margin, y)

    // ===== DATOS COMPRADOR =====
    y += 12
    doc.setFont('helvetica', 'bold')
    doc.text('COMPRADOR:', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.text(`${contract.comprador_nombre || ''} ${contract.comprador_apellidos || ''}`.trim() || 'No especificado', margin, y)
    y += 5
    doc.text(`${contract.comprador_documento_tipo || 'DNI'}: ${contract.comprador_documento || '-'}`, margin, y)
    y += 5
    const direccionComprador = [contract.comprador_direccion, contract.comprador_cp, contract.comprador_localidad, contract.comprador_provincia].filter(Boolean).join(', ')
    if (direccionComprador) doc.text(direccionComprador, margin, y)
    y += 5
    if (contract.comprador_telefono) doc.text(`Tel: ${contract.comprador_telefono}`, margin, y)
    if (contract.comprador_email) {
        y += 5
        doc.text(`Email: ${contract.comprador_email}`, margin, y)
    }

    // ===== DATOS VEHÍCULO =====
    y += 12
    doc.setFont('helvetica', 'bold')
    doc.text('VEHÍCULO:', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.text(`${contract.vehiculo_marca || vehicle.marca} ${contract.vehiculo_modelo || vehicle.modelo}`, margin, y)
    y += 5
    doc.text(`Matrícula: ${contract.vehiculo_matricula || vehicle.matricula}`, margin, y)
    y += 5
    doc.text(`Bastidor: ${contract.vehiculo_vin || vehicle.vin}`, margin, y)
    y += 5
    doc.text(`Kilómetros: ${(contract.vehiculo_km || vehicle.kilometraje).toLocaleString('es-ES')} km`, margin, y)

    // ===== CONDICIONES ECONÓMICAS =====
    y += 12
    doc.setFont('helvetica', 'bold')
    doc.text('CONDICIONES ECONÓMICAS:', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.text(`Precio de venta: ${formatCurrency(contract.precio_venta)}`, margin, y)
    y += 5
    if (contract.forma_pago) doc.text(`Forma de pago: ${contract.forma_pago}`, margin, y)

    // ===== GARANTÍA =====
    if (contract.garantia_meses) {
        y += 12
        doc.setFont('helvetica', 'bold')
        doc.text('GARANTÍA:', margin, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.text(`${contract.garantia_meses} meses${contract.garantia_km ? ` / ${contract.garantia_km.toLocaleString()} km` : ''}`, margin, y)
        if (contract.garantia_tipo) {
            y += 5
            doc.text(`Tipo: ${contract.garantia_tipo}`, margin, y)
        }
    }

    // ===== CLÁUSULAS =====
    if (contract.clausulas_adicionales) {
        y += 12
        doc.setFont('helvetica', 'bold')
        doc.text('CLÁUSULAS ADICIONALES:', margin, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        const splitText = doc.splitTextToSize(contract.clausulas_adicionales, pageWidth - 2 * margin)
        doc.text(splitText, margin, y)
    }

    // ===== FIRMAS =====
    y = doc.internal.pageSize.getHeight() - 50
    doc.setDrawColor(200)
    doc.line(margin, y, margin + 60, y)
    doc.line(pageWidth - margin - 60, y, pageWidth - margin, y)
    y += 5
    doc.setFontSize(9)
    doc.text('Firma del Vendedor', margin + 30, y, { align: 'center' })
    doc.text('Firma del Comprador', pageWidth - margin - 30, y, { align: 'center' })

    // ===== PIE =====
    y += 15
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Fecha: ${contract.fecha_firma ? formatDate(contract.fecha_firma) : formatDate(contract.created_at)}`, margin, y)
    doc.text(`Generado: ${formatDate(new Date().toISOString())}`, pageWidth - margin, y, { align: 'right' })

    // Guardar
    doc.save(`Contrato_${contract.numero_contrato}_${contract.vehiculo_matricula || vehicle.matricula}.pdf`)
}

// Función para regenerar PDF de factura desde datos guardados
const generateInvoicePDF = (invoice: InvoiceDB, vehicle: Vehicle) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let y = 20

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    // ===== CABECERA EMPRESA =====
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text(invoice.empresa_nombre || 'Empresa', margin, y)
    y += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80)
    doc.text(`CIF: ${invoice.empresa_cif || '-'}`, margin, y)
    y += 4
    doc.text(invoice.empresa_direccion || '', margin, y)

    // ===== TÍTULO FACTURA =====
    y += 12
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(19, 91, 236)
    doc.text('FACTURA', pageWidth - margin, y, { align: 'right' })

    y += 8
    doc.setFontSize(10)
    doc.setTextColor(60)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nº: ${invoice.numero_factura}`, pageWidth - margin, y, { align: 'right' })
    y += 5
    doc.text(`Fecha: ${formatDate(invoice.fecha_factura)}`, pageWidth - margin, y, { align: 'right' })
    if (invoice.fecha_vencimiento) {
        y += 5
        doc.text(`Vencimiento: ${formatDate(invoice.fecha_vencimiento)}`, pageWidth - margin, y, { align: 'right' })
    }

    // ===== LÍNEA SEPARADORA =====
    y += 8
    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)

    // ===== DATOS CLIENTE =====
    y += 10
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text('FACTURAR A:', margin, y)
    y += 6
    doc.setFontSize(11)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')
    doc.text(invoice.cliente_nombre || 'Cliente no especificado', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.text(`${invoice.cliente_documento_tipo || 'NIF'}: ${invoice.cliente_documento || '-'}`, margin, y)
    if (invoice.cliente_direccion) {
        y += 5
        doc.text(invoice.cliente_direccion, margin, y)
    }

    // ===== DATOS VEHÍCULO =====
    y += 10
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text('DATOS DEL VEHÍCULO:', margin, y)
    y += 6
    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text(invoice.vehiculo_descripcion || `${vehicle.marca} ${vehicle.modelo} - ${vehicle.matricula}`, margin, y)

    // ===== CONCEPTO =====
    y += 15
    doc.setFillColor(245, 247, 250)
    doc.rect(margin, y - 5, pageWidth - 2 * margin, 10, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(60)
    doc.text('CONCEPTO', margin + 5, y)
    doc.text('IMPORTE', pageWidth - margin - 5, y, { align: 'right' })

    y += 12
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text(`Venta de vehículo - ${invoice.vehiculo_descripcion || vehicle.matricula}`, margin + 5, y)
    doc.text(formatCurrency(invoice.base_imponible), pageWidth - margin - 5, y, { align: 'right' })

    // ===== RESUMEN FISCAL =====
    y += 20
    doc.setDrawColor(220)
    doc.line(pageWidth - 90, y, pageWidth - margin, y)

    y += 8
    doc.setFontSize(10)
    doc.setTextColor(80)
    doc.text('Base imponible:', pageWidth - 90, y)
    doc.setTextColor(0)
    doc.text(formatCurrency(invoice.base_imponible), pageWidth - margin - 5, y, { align: 'right' })

    y += 7
    doc.setTextColor(80)
    doc.text(`IVA (${invoice.tipo_iva}%):`, pageWidth - 90, y)
    doc.setTextColor(0)
    doc.text(formatCurrency(invoice.iva), pageWidth - margin - 5, y, { align: 'right' })

    y += 3
    doc.line(pageWidth - 90, y, pageWidth - margin, y)

    y += 10
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL:', pageWidth - 90, y)
    doc.setTextColor(19, 91, 236)
    doc.text(formatCurrency(invoice.total), pageWidth - margin - 5, y, { align: 'right' })

    // ===== FORMA DE PAGO =====
    if (invoice.forma_pago) {
        y += 20
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100)
        doc.text('FORMA DE PAGO:', margin, y)
        y += 5
        doc.setTextColor(0)
        doc.setFontSize(10)
        doc.text(invoice.forma_pago, margin, y)
    }

    // ===== NOTAS =====
    if (invoice.notas) {
        y += 15
        doc.setFontSize(9)
        doc.setTextColor(100)
        doc.text('OBSERVACIONES:', margin, y)
        y += 5
        doc.setTextColor(60)
        const splitNotas = doc.splitTextToSize(invoice.notas, pageWidth - 2 * margin)
        doc.text(splitNotas, margin, y)
    }

    // ===== PIE =====
    const footerY = doc.internal.pageSize.getHeight() - 15
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`${invoice.empresa_nombre} - CIF: ${invoice.empresa_cif}`, pageWidth / 2, footerY, { align: 'center' })

    // Guardar
    doc.save(`Factura_${invoice.numero_factura}_${vehicle.matricula}.pdf`)
}

// Helper para verificar si una URL de imagen es válida (excluye Azure CDN que no existe)
const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false
    return !url.includes('midcar.azureedge.net')
}

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
    const { user, isFullView } = useAuth()
    const { addToast } = useToast()

    const [vehicle, setVehicle] = useState<Vehicle | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [showAllEquipment, setShowAllEquipment] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showContractModal, setShowContractModal] = useState(false)
    const [showInvoiceModal, setShowInvoiceModal] = useState(false)
    const [showDocumentModal, setShowDocumentModal] = useState(false)
    const [contacts, setContacts] = useState<Contact[]>([])

    // Document history
    const [vehicleContracts, setVehicleContracts] = useState<ContractDB[]>([])
    const [vehicleInvoices, setVehicleInvoices] = useState<InvoiceDB[]>([])
    const [showDocumentHistory, setShowDocumentHistory] = useState(false)

    // Document detail modal
    const [selectedDocument, setSelectedDocument] = useState<{ type: 'contract' | 'invoice', data: ContractDB | InvoiceDB } | null>(null)

    // Load vehicle from Supabase
    useEffect(() => {
        const loadVehicle = async () => {
            setIsLoading(true)
            const vehicleData = await getVehicleById(id)
            setVehicle(vehicleData)
            setIsLoading(false)
        }
        loadVehicle()
    }, [id])

    // Load contacts for document generator
    useEffect(() => {
        const loadContacts = async () => {
            try {
                const contactsData = await getContacts()
                setContacts(contactsData)
            } catch (error) {
                console.error('Error loading contacts:', error)
            }
        }
        loadContacts()
    }, [])

    // Load document history for this vehicle
    useEffect(() => {
        const loadDocuments = async () => {
            if (!id) return
            try {
                const [contracts, invoices] = await Promise.all([
                    getContractsByVehicle(id),
                    getInvoicesByVehicle(id)
                ])
                setVehicleContracts(contracts)
                setVehicleInvoices(invoices)
            } catch (error) {
                console.error('Error loading document history:', error)
            }
        }
        loadDocuments()

        // Listen for document updates
        const handleDataUpdate = (event: CustomEvent) => {
            if (event.detail?.type === 'contracts' || event.detail?.type === 'invoices') {
                loadDocuments()
            }
        }
        window.addEventListener('midcar-data-updated', handleDataUpdate as EventListener)
        return () => window.removeEventListener('midcar-data-updated', handleDataUpdate as EventListener)
    }, [id])

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">Cargando vehículo...</p>
                </div>
            </div>
        )
    }

    if (!vehicle) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <span className="material-symbols-outlined text-6xl text-gray-300">search_off</span>
                <h2 className="text-xl font-semibold text-foreground">Vehículo no encontrado</h2>
                <p className="text-muted-foreground">El vehículo que buscas no existe o ha sido eliminado.</p>
                <Link href="/inventario">
                    <button className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                        Volver al inventario
                    </button>
                </Link>
            </div>
        )
    }

    // Verificar si el usuario puede editar este vehículo
    // Puede editar si es el creador O si tiene acceso a la vista completa (isFullView)
    const canEdit = vehicle.created_by === user?.id || isFullView

    // Get all equipment for this vehicle
    const vehicleEquipment = Object.entries(EQUIPAMIENTO_VEHICULO).flatMap(([_, category]) =>
        category.items.filter(item => vehicle.equipamiento?.includes(item.id))
    ).slice(0, showAllEquipment ? undefined : 4)

    // Use actual vehicle images if available, otherwise just show main image
    // Filter out Azure CDN images that don't exist
    const galleryImages = vehicle.imagenes && vehicle.imagenes.length > 0
        ? vehicle.imagenes
            .filter(img => isValidImageUrl(img.url))
            .map((img, idx) => ({
                url: img.url,
                label: img.tipo ? img.tipo.charAt(0).toUpperCase() + img.tipo.slice(1) : `Foto ${idx + 1}`
            }))
        : isValidImageUrl(vehicle.imagen_principal)
            ? [{ url: vehicle.imagen_principal!, label: 'Principal' }]
            : []

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
                        {canEdit && (
                            <Link href={`/inventario/${vehicle.id}/editar`}>
                                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors">
                                    <span className="material-symbols-outlined">edit</span>
                                </button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Hero Image Gallery (Mobile) */}
                <div className="relative w-full h-[40vh] bg-gray-200 dark:bg-gray-800">
                    {galleryImages.length > 0 ? (
                        <>
                            <div
                                className="w-full h-full bg-center bg-cover bg-no-repeat transition-all duration-300"
                                style={{ backgroundImage: `url("${galleryImages[currentImageIndex]?.url || ''}")` }}
                            />
                            {galleryImages.length > 1 && (
                                <>
                                    <div className="absolute bottom-6 right-4 bg-black/90 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg" style={{ color: '#FFFFFF' }}>
                                        {currentImageIndex + 1} / {galleryImages.length}
                                    </div>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {galleryImages.slice(0, 5).map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={cn("w-2 h-2 rounded-full cursor-pointer transition-colors", idx === currentImageIndex ? "bg-white" : "bg-white/50")}
                                                onClick={() => setCurrentImageIndex(idx)}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-400 text-6xl">no_photography</span>
                        </div>
                    )}
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
                        onGenerateContract={() => setShowContractModal(true)}
                        onGenerateInvoice={() => setShowInvoiceModal(true)}
                        onGenerateDocument={() => setShowDocumentModal(true)}
                        vehicleContracts={vehicleContracts}
                        vehicleInvoices={vehicleInvoices}
                        onSelectDocument={setSelectedDocument}
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
                        {canEdit && (
                            <Link href={`/inventario/${vehicle.id}/editar`}>
                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-medium">
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                    Editar
                                </button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-12 gap-6">

                    {/* Left Column - Gallery */}
                    <div className="col-span-7 space-y-4">
                        {/* Main Image */}
                        <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-lg">
                            {galleryImages.length > 0 ? (
                                <>
                                    <div
                                        className="w-full h-full bg-center bg-cover bg-no-repeat transition-all duration-300"
                                        style={{ backgroundImage: `url("${galleryImages[currentImageIndex]?.url || ''}")` }}
                                    />
                                    {galleryImages.length > 1 && (
                                        <div className="absolute bottom-4 right-4 bg-black/90 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg" style={{ color: '#FFFFFF' }}>
                                            {currentImageIndex + 1} / {galleryImages.length}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-gray-400 text-6xl">no_photography</span>
                                </div>
                            )}
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

                        {/* Thumbnail Gallery - only show if multiple images */}
                        {galleryImages.length > 1 && (
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
                        )}

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
                                {(vehicle.created_by_name || vehicle.created_at) && (
                                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-2">
                                        {vehicle.created_by_name && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Creado por</span>
                                                <span className="font-medium text-primary">{vehicle.created_by_name}</span>
                                            </div>
                                        )}
                                        {vehicle.created_at && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Fecha creación</span>
                                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                                    {new Date(vehicle.created_at).toLocaleDateString('es-ES', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Documents */}
                        {vehicle.documentos && vehicle.documentos.length > 0 && (
                            <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Documentación</h3>
                                <div className="space-y-2">
                                    {vehicle.documentos.map((doc) => (
                                        <a
                                            key={doc.id}
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download={doc.nombre}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-primary">description</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{doc.nombre}</p>
                                                <p className="text-xs text-gray-500 capitalize">{doc.tipo.replace(/_/g, ' ')}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-gray-400 text-[18px]">download</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions - Documents */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Documentos</h3>
                            <div className="space-y-3">
                                {/* New Enterprise Document Generator */}
                                <button
                                    onClick={() => setShowDocumentModal(true)}
                                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20 border border-primary/30 transition-all group"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-500 text-white shadow-lg">
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-semibold text-gray-900 dark:text-white">Generar Documento</p>
                                        <p className="text-xs text-gray-500">Contratos, facturas, proformas...</p>
                                    </div>
                                    <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </button>

                                {/* Legacy buttons - can be removed later */}
                                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <p className="text-xs text-gray-400 mb-2">Acceso rápido (legado)</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowContractModal(true)}
                                            className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">description</span>
                                            Contrato
                                        </button>
                                        <button
                                            onClick={() => setShowInvoiceModal(true)}
                                            className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">receipt</span>
                                            Factura
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Document History */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-primary">history</span>
                                    Historial de Documentos
                                </h3>
                                {(vehicleContracts.length > 0 || vehicleInvoices.length > 0) && (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                        {vehicleContracts.length + vehicleInvoices.length}
                                    </span>
                                )}
                            </div>

                            {vehicleContracts.length === 0 && vehicleInvoices.length === 0 ? (
                                <div className="text-center py-6 text-gray-400">
                                    <span className="material-symbols-outlined text-4xl mb-2 block">folder_off</span>
                                    <p className="text-sm">No hay documentos generados</p>
                                    <p className="text-xs mt-1">Los contratos y facturas aparecerán aquí</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {/* Contracts */}
                                    {vehicleContracts.map((contract) => (
                                        <div
                                            key={contract.id}
                                            onClick={() => setSelectedDocument({ type: 'contract', data: contract })}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer group border border-transparent hover:border-blue-200"
                                        >
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                                                <span className="material-symbols-outlined text-[18px]">description</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">
                                                    Contrato {contract.numero_contrato}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {contract.comprador_nombre || 'Sin comprador'} • {new Date(contract.created_at).toLocaleDateString('es-ES')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                                    contract.estado === 'firmado' ? "bg-green-100 text-green-700" :
                                                    contract.estado === 'pendiente' ? "bg-yellow-100 text-yellow-700" :
                                                    "bg-gray-100 text-gray-600"
                                                )}>
                                                    {contract.estado}
                                                </span>
                                                <span className="text-sm font-bold text-primary">
                                                    {formatCurrency(contract.precio_venta)}
                                                </span>
                                                <span className="material-symbols-outlined text-gray-400 group-hover:text-primary text-[18px]">chevron_right</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Invoices */}
                                    {vehicleInvoices.map((invoice) => (
                                        <div
                                            key={invoice.id}
                                            onClick={() => setSelectedDocument({ type: 'invoice', data: invoice })}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors cursor-pointer group border border-transparent hover:border-green-200"
                                        >
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600">
                                                <span className="material-symbols-outlined text-[18px]">receipt</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">
                                                    Factura {invoice.numero_factura}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {invoice.cliente_nombre || 'Sin cliente'} • {new Date(invoice.created_at).toLocaleDateString('es-ES')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                                    invoice.estado === 'pagada' ? "bg-green-100 text-green-700" :
                                                    invoice.estado === 'pendiente' ? "bg-yellow-100 text-yellow-700" :
                                                    "bg-gray-100 text-gray-600"
                                                )}>
                                                    {invoice.estado}
                                                </span>
                                                <span className="text-sm font-bold text-primary">
                                                    {formatCurrency(invoice.total)}
                                                </span>
                                                <span className="material-symbols-outlined text-gray-400 group-hover:text-primary text-[18px]">chevron_right</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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

            {/* Contract Generator Modal */}
            <ContractGeneratorModal
                vehicle={vehicle}
                open={showContractModal}
                onOpenChange={setShowContractModal}
                onSuccess={() => addToast('Contrato generado correctamente', 'success')}
            />

            {/* Invoice Generator Modal */}
            <InvoiceGeneratorModal
                vehicle={vehicle}
                open={showInvoiceModal}
                onOpenChange={setShowInvoiceModal}
                onSuccess={() => addToast('Factura generada correctamente', 'success')}
            />

            {/* Enterprise Document Generator Modal */}
            <DocumentGeneratorModal
                isOpen={showDocumentModal}
                onClose={() => setShowDocumentModal(false)}
                vehicle={vehicle}
                contacts={contacts}
                onDocumentGenerated={(type) => {
                    addToast(`Documento ${type} generado correctamente`, 'success')
                }}
            />

            {/* Document Detail Modal */}
            {selectedDocument && (
                <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
                    <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3">
                                <div className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-lg",
                                    selectedDocument.type === 'contract' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                                )}>
                                    <span className="material-symbols-outlined">
                                        {selectedDocument.type === 'contract' ? 'description' : 'receipt'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-lg font-bold">
                                        {selectedDocument.type === 'contract'
                                            ? `Contrato ${(selectedDocument.data as ContractDB).numero_contrato}`
                                            : `Factura ${(selectedDocument.data as InvoiceDB).numero_factura}`
                                        }
                                    </p>
                                    <p className="text-sm text-gray-500 font-normal">
                                        {new Date(selectedDocument.data.created_at).toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            {/* Estado */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <span className="text-sm text-gray-600">Estado</span>
                                <span className={cn(
                                    "text-xs font-bold px-3 py-1 rounded-full uppercase",
                                    selectedDocument.data.estado === 'firmado' || selectedDocument.data.estado === 'pagada'
                                        ? "bg-green-100 text-green-700"
                                        : selectedDocument.data.estado === 'pendiente'
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-gray-100 text-gray-600"
                                )}>
                                    {selectedDocument.data.estado}
                                </span>
                            </div>

                            {/* Detalles según tipo */}
                            {selectedDocument.type === 'contract' ? (
                                <>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Datos del Comprador</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <p className="text-xs text-gray-500">Nombre</p>
                                                <p className="text-sm font-medium">{(selectedDocument.data as ContractDB).comprador_nombre || '-'}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <p className="text-xs text-gray-500">Documento</p>
                                                <p className="text-sm font-medium">{(selectedDocument.data as ContractDB).comprador_documento || '-'}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <p className="text-xs text-gray-500">Teléfono</p>
                                                <p className="text-sm font-medium">{(selectedDocument.data as ContractDB).comprador_telefono || '-'}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <p className="text-xs text-gray-500">Email</p>
                                                <p className="text-sm font-medium truncate">{(selectedDocument.data as ContractDB).comprador_email || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Datos Económicos</h4>
                                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Precio de venta</span>
                                                <span className="text-2xl font-bold text-primary">
                                                    {formatCurrency((selectedDocument.data as ContractDB).precio_venta)}
                                                </span>
                                            </div>
                                            {(selectedDocument.data as ContractDB).forma_pago && (
                                                <p className="text-sm text-gray-500 mt-2">
                                                    Forma de pago: <span className="font-medium">{(selectedDocument.data as ContractDB).forma_pago}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {(selectedDocument.data as ContractDB).garantia_meses && (
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-3">
                                            <span className="material-symbols-outlined text-blue-600">verified_user</span>
                                            <div>
                                                <p className="text-sm font-medium text-blue-800">Garantía incluida</p>
                                                <p className="text-xs text-blue-600">
                                                    {(selectedDocument.data as ContractDB).garantia_meses} meses
                                                    {(selectedDocument.data as ContractDB).garantia_km && ` / ${(selectedDocument.data as ContractDB).garantia_km?.toLocaleString()} km`}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Datos del Cliente</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <p className="text-xs text-gray-500">Nombre</p>
                                                <p className="text-sm font-medium">{(selectedDocument.data as InvoiceDB).cliente_nombre || '-'}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <p className="text-xs text-gray-500">NIF/CIF</p>
                                                <p className="text-sm font-medium">{(selectedDocument.data as InvoiceDB).cliente_documento || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Desglose</h4>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Base imponible</span>
                                                <span>{formatCurrency((selectedDocument.data as InvoiceDB).base_imponible)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">IVA ({(selectedDocument.data as InvoiceDB).tipo_iva}%)</span>
                                                <span>{formatCurrency((selectedDocument.data as InvoiceDB).iva)}</span>
                                            </div>
                                            <div className="border-t pt-2 flex justify-between">
                                                <span className="font-semibold">Total</span>
                                                <span className="text-xl font-bold text-primary">
                                                    {formatCurrency((selectedDocument.data as InvoiceDB).total)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {(selectedDocument.data as InvoiceDB).fecha_vencimiento && (
                                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center gap-3">
                                            <span className="material-symbols-outlined text-yellow-600">event</span>
                                            <div>
                                                <p className="text-sm font-medium text-yellow-800">Fecha de vencimiento</p>
                                                <p className="text-xs text-yellow-600">
                                                    {new Date((selectedDocument.data as InvoiceDB).fecha_vencimiento!).toLocaleDateString('es-ES')}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Notas */}
                            {selectedDocument.data.notas && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Notas</h4>
                                    <p className="text-sm text-gray-600 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        {selectedDocument.data.notas}
                                    </p>
                                </div>
                            )}

                            {/* Creado por */}
                            {selectedDocument.data.created_by_name && (
                                <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t">
                                    <span className="material-symbols-outlined text-[14px]">person</span>
                                    Creado por {selectedDocument.data.created_by_name}
                                </div>
                            )}
                        </div>

                        {/* Acciones */}
                        <div className="space-y-3 mt-6 pt-4 border-t">
                            {/* Botón principal - Descargar PDF */}
                            <Button
                                className="w-full bg-primary hover:bg-primary/90 h-12"
                                onClick={() => {
                                    if (selectedDocument.type === 'contract') {
                                        generateContractPDF(selectedDocument.data as ContractDB, vehicle)
                                    } else {
                                        generateInvoicePDF(selectedDocument.data as InvoiceDB, vehicle)
                                    }
                                    addToast('PDF descargado correctamente', 'success')
                                }}
                            >
                                <span className="material-symbols-outlined mr-2 text-[20px]">download</span>
                                Descargar PDF
                            </Button>

                            {/* Botones secundarios */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setSelectedDocument(null)}
                                >
                                    Cerrar
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        if (selectedDocument.type === 'contract') {
                                            router.push('/contratos')
                                        } else {
                                            router.push('/facturacion')
                                        }
                                        setSelectedDocument(null)
                                    }}
                                >
                                    <span className="material-symbols-outlined mr-1 text-[16px]">open_in_new</span>
                                    Ir a {selectedDocument.type === 'contract' ? 'Contratos' : 'Facturas'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
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
    setShowAllEquipment,
    onGenerateContract,
    onGenerateInvoice,
    onGenerateDocument,
    vehicleContracts,
    vehicleInvoices,
    onSelectDocument
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

            {/* Creator Info (Mobile) */}
            {(vehicle.created_by_name || vehicle.created_at) && (
                <div className="px-5 pb-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                        {vehicle.created_by_name && (
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-gray-400">person</span>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Creado por</p>
                                    <p className="text-sm font-semibold text-primary">{vehicle.created_by_name}</p>
                                </div>
                            </div>
                        )}
                        {vehicle.created_at && (
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Fecha</p>
                                <p className="text-sm font-medium text-gray-600">
                                    {new Date(vehicle.created_at).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="h-2 w-full bg-gray-100" />

            {/* Gallery Carousel - only show if there are multiple images */}
            {galleryImages.length > 1 && (
                <div className="pt-6 pb-2 pl-5">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">photo_library</span>
                        Galería ({galleryImages.length} fotos)
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
            )}

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

            {/* Documents (Mobile) */}
            {vehicle.documentos && vehicle.documentos.length > 0 && (
                <div className="px-5 pb-8">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">folder_open</span>
                        Documentación
                    </h3>
                    <div className="space-y-2">
                        {vehicle.documentos.map((doc: any) => (
                            <a
                                key={doc.id}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={doc.nombre}
                                className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm active:bg-gray-50"
                            >
                                <span className="material-symbols-outlined text-primary">description</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{doc.nombre}</p>
                                    <p className="text-xs text-gray-500 capitalize">{doc.tipo.replace(/_/g, ' ')}</p>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">download</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions - Documents (Mobile) */}
            <div className="px-5 pb-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">fact_check</span>
                    Documentos
                </h3>
                <div className="space-y-3">
                    {/* New Enterprise Document Generator */}
                    <button
                        onClick={onGenerateDocument}
                        className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 active:from-primary/20 active:to-purple-500/20 border border-primary/30 transition-colors"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-500 text-white shadow-lg">
                            <span className="material-symbols-outlined">auto_awesome</span>
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-semibold text-gray-900">Generar Documento</p>
                            <p className="text-xs text-gray-500">Contratos, facturas, proformas...</p>
                        </div>
                        <span className="material-symbols-outlined text-primary">arrow_forward</span>
                    </button>

                    {/* Legacy quick access */}
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={onGenerateContract}
                            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 active:bg-gray-100 border border-gray-200 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px] text-gray-500">description</span>
                            <span className="text-sm font-medium text-gray-700">Contrato</span>
                        </button>
                        <button
                            onClick={onGenerateInvoice}
                            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 active:bg-gray-100 border border-gray-200 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px] text-gray-500">receipt</span>
                            <span className="text-sm font-medium text-gray-700">Factura</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Document History (Mobile) */}
            <div className="px-5 pb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">history</span>
                        Historial
                    </h3>
                    {(vehicleContracts?.length > 0 || vehicleInvoices?.length > 0) && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            {(vehicleContracts?.length || 0) + (vehicleInvoices?.length || 0)}
                        </span>
                    )}
                </div>

                {(!vehicleContracts || vehicleContracts.length === 0) && (!vehicleInvoices || vehicleInvoices.length === 0) ? (
                    <div className="text-center py-6 bg-white rounded-xl border border-gray-100">
                        <span className="material-symbols-outlined text-4xl mb-2 text-gray-300 block">folder_off</span>
                        <p className="text-sm text-gray-400">No hay documentos generados</p>
                        <p className="text-xs text-gray-300 mt-1">Los contratos y facturas aparecerán aquí</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Contracts */}
                        {vehicleContracts?.map((contract: any) => (
                            <div
                                key={contract.id}
                                onClick={() => onSelectDocument?.({ type: 'contract', data: contract })}
                                className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm active:bg-blue-50 active:border-blue-200 cursor-pointer transition-colors"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                    <span className="material-symbols-outlined text-[20px]">description</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">
                                        {contract.numero_contrato}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {contract.comprador_nombre || 'Sin comprador'} • {new Date(contract.created_at).toLocaleDateString('es-ES')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-primary block">
                                            {formatCurrency(contract.precio_venta)}
                                        </span>
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                            contract.estado === 'firmado' ? "bg-green-100 text-green-700" :
                                            contract.estado === 'pendiente' ? "bg-yellow-100 text-yellow-700" :
                                            "bg-gray-100 text-gray-600"
                                        )}>
                                            {contract.estado}
                                        </span>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-400 text-[20px]">chevron_right</span>
                                </div>
                            </div>
                        ))}

                        {/* Invoices */}
                        {vehicleInvoices?.map((invoice: any) => (
                            <div
                                key={invoice.id}
                                onClick={() => onSelectDocument?.({ type: 'invoice', data: invoice })}
                                className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm active:bg-green-50 active:border-green-200 cursor-pointer transition-colors"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                    <span className="material-symbols-outlined text-[20px]">receipt</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">
                                        {invoice.numero_factura}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {invoice.cliente_nombre || 'Sin cliente'} • {new Date(invoice.created_at).toLocaleDateString('es-ES')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-primary block">
                                            {formatCurrency(invoice.total)}
                                        </span>
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                            invoice.estado === 'pagada' ? "bg-green-100 text-green-700" :
                                            invoice.estado === 'pendiente' ? "bg-yellow-100 text-yellow-700" :
                                            "bg-gray-100 text-gray-600"
                                        )}>
                                            {invoice.estado}
                                        </span>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-400 text-[20px]">chevron_right</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="h-20" />
        </>
    )
}
