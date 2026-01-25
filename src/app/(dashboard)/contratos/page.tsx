"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { formatCurrency, cn } from "@/lib/utils"
import { useFilteredData } from "@/hooks/useFilteredData"
import { useAuth } from "@/lib/auth-context"
import type { Vehicle, Contract, PersonData, ContractEconomics, ContractWarranty, EmpresaVendedora, TipoDocumentoIdentidad, TipoCliente, EstadoITV } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import jsPDF from "jspdf"

// Helper para verificar si una URL de imagen es válida (excluye Azure CDN que no existe)
const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false
    return !url.includes('midcar.azureedge.net')
}

import {
    getEmpresasActivas,
    getEmpresaById,
    initDefaultEmpresas,
} from "@/lib/empresas"
import {
    getContracts,
    createContract,
    generateContractNumber,
    type ContractDB,
} from "@/lib/supabase-service"
import {
    PROVINCIAS,
    COMUNIDADES_AUTONOMAS,
    TIPOS_DOCUMENTO,
    TIPOS_CLIENTE,
    ESTADOS_ITV,
    FORMAS_PAGO,
    validarDNI,
    validarNIE,
    validarMatricula,
} from "@/lib/constants"

// Format date for display
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ContratosPage() {
    const { user, profile } = useAuth()
    const { vehicles: allVehicles, contacts } = useFilteredData()

    // Mobile view state - wizard steps
    const [mobileStep, setMobileStep] = useState<'list' | 'form'>('list')

    // Saved contracts from Supabase
    const [savedContracts, setSavedContracts] = useState<ContractDB[]>([])
    const [showHistory, setShowHistory] = useState(false)
    const [isLoadingContracts, setIsLoadingContracts] = useState(false)

    // Preview modal
    const [showPreview, setShowPreview] = useState(false)

    // Estado
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

    // Formulario del comprador
    const [comprador, setComprador] = useState<PersonData>({
        nombre: '',
        apellidos: '',
        dni_nie: '',
        direccion: '',
        codigo_postal: '',
        municipio: '',
        provincia: '',
        telefono: '',
        email: '',
    })

    // Datos economicos
    const [economico, setEconomico] = useState<Partial<ContractEconomics>>({
        precio_venta: 0,
        iva_porcentaje: 21,
        iva_importe: 0,
        precio_total: 0,
        forma_pago: 'contado',
    })

    // Garantia
    const [garantia, setGarantia] = useState<ContractWarranty>({
        tiene_garantia: true,
        meses_garantia: 12,
        tipo_garantia: 'legal',
    })

    // Documentacion
    const [documentacion, setDocumentacion] = useState({
        tiene_permiso_circulacion: true,
        tiene_ficha_tecnica: true,
        tiene_itv_vigente: true,
        tiene_justificante_pago_impuesto: true,
    })

    // Fecha y lugar
    const [fechaContrato, setFechaContrato] = useState(new Date().toISOString().split('T')[0])
    const [lugarFirma, setLugarFirma] = useState('Madrid')

    // NUEVOS CAMPOS - Empresas vendedoras
    const [empresas, setEmpresas] = useState<EmpresaVendedora[]>([])
    const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('')

    // NUEVOS CAMPOS - Cliente extendido
    const [tipoCliente, setTipoCliente] = useState<TipoCliente>('particular')
    const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoIdentidad>('DNI')
    const [escaleraPiso, setEscaleraPiso] = useState('')
    const [comunidad, setComunidad] = useState('')

    // NUEVOS CAMPOS - ITV y vehículo
    const [estadoITV, setEstadoITV] = useState<EstadoITV>('Auto')
    const [kmVenta, setKmVenta] = useState<number>(0)
    const [proximoITV, setProximoITV] = useState('')

    // NUEVOS CAMPOS - Transacción
    const [reserva, setReserva] = useState<number>(0)
    const [fechaTransaccion, setFechaTransaccion] = useState(new Date().toISOString().slice(0, 16))
    const [distribuidor, setDistribuidor] = useState('')
    const [clausulasAdicionales, setClausulasAdicionales] = useState('')

    // Calcular total a pagar (precio - reserva)
    const totalPago = useMemo(() => {
        return (economico.precio_venta || 0) - reserva
    }, [economico.precio_venta, reserva])

    // Empresa seleccionada
    const empresaSeleccionada = useMemo(() => {
        if (!selectedEmpresaId) return null
        return empresas.find(e => e.id === selectedEmpresaId) || null
    }, [selectedEmpresaId, empresas])

    // Load saved contracts and empresas on mount
    useEffect(() => {
        const loadData = async () => {
            setIsLoadingContracts(true)
            try {
                await initDefaultEmpresas()
                const [contracts, empList] = await Promise.all([
                    getContracts(),
                    getEmpresasActivas()
                ])
                setSavedContracts(contracts)
                setEmpresas(empList)
                if (empList.length > 0) {
                    setSelectedEmpresaId(empList[0].id)
                }
            } catch (error) {
                console.error('Error loading data:', error)
            } finally {
                setIsLoadingContracts(false)
            }
        }
        loadData()
    }, [])

    // Filtrar vehiculos disponibles (allVehicles ya incluye mock + user vehicles)
    const vehiculosDisponibles = useMemo(() => {
        const disponibles = allVehicles.filter(
            v => v.estado === 'disponible' || v.estado === 'reservado'
        )
        if (!searchQuery) return disponibles

        const query = searchQuery.toLowerCase()
        return disponibles.filter(v =>
            v.marca.toLowerCase().includes(query) ||
            v.modelo.toLowerCase().includes(query) ||
            v.matricula.toLowerCase().includes(query)
        )
    }, [allVehicles, searchQuery])

    // Calcular IVA y total cuando cambia el precio
    useEffect(() => {
        const precio = economico.precio_venta || 0
        const ivaPct = economico.iva_porcentaje || 0
        const ivaImporte = (precio * ivaPct) / 100
        const total = precio + ivaImporte

        setEconomico(prev => ({
            ...prev,
            iva_importe: ivaImporte,
            precio_total: total,
        }))
    }, [economico.precio_venta, economico.iva_porcentaje])

    // Cuando se selecciona un vehiculo
    const handleSelectVehicle = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle)
        setEconomico(prev => ({
            ...prev,
            precio_venta: vehicle.precio_venta,
        }))

        // Buscar contacto asociado (si hay)
        const contactoAsociado = contacts.find(c =>
            c.vehiculos_interes?.includes(vehicle.id)
        )
        if (contactoAsociado) {
            setComprador({
                nombre: contactoAsociado.nombre || '',
                apellidos: contactoAsociado.apellidos || '',
                dni_nie: contactoAsociado.dni_cif || '',
                direccion: contactoAsociado.direccion || '',
                codigo_postal: contactoAsociado.codigo_postal || '',
                municipio: contactoAsociado.municipio || '',
                provincia: contactoAsociado.provincia || '',
                telefono: contactoAsociado.telefono || '',
                email: contactoAsociado.email || '',
            })
        }

        // Move to form on mobile
        setMobileStep('form')
    }

    // Generate PDF
    const generatePDF = useCallback(() => {
        if (!selectedVehicle) return null

        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        const margin = 20
        let y = 20

        // Helper function to add text
        const addText = (text: string, x: number, yPos: number, options: any = {}) => {
            doc.text(text, x, yPos, options)
        }

        // Header
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        addText('CONTRATO DE COMPRAVENTA DE VEHICULO', pageWidth / 2, y, { align: 'center' })

        y += 15
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        // Usar fecha y matricula como identificador temporal hasta que se guarde
        const tempContractNum = `CV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
        addText(`Numero de Contrato: ${tempContractNum}`, pageWidth / 2, y, { align: 'center' })

        y += 10
        addText(`En ${lugarFirma}, a ${formatDate(fechaContrato)}`, pageWidth / 2, y, { align: 'center' })

        // Separator
        y += 10
        doc.setDrawColor(200)
        doc.line(margin, y, pageWidth - margin, y)

        // REUNIDOS
        y += 15
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        addText('REUNIDOS', margin, y)

        // Vendedor
        y += 10
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        addText('DE UNA PARTE (VENDEDOR):', margin, y)
        doc.setFont('helvetica', 'normal')
        y += 6
        const emp = empresaSeleccionada
        addText(`${emp?.razon_social || emp?.nombre_comercial || 'Empresa no seleccionada'}`, margin, y)
        y += 5
        addText(`CIF: ${emp?.cif || ''}`, margin, y)
        y += 5
        addText(`Domicilio: ${emp?.direccion || ''}, ${emp?.codigo_postal || ''} ${emp?.localidad || ''} (${emp?.provincia || ''})`, margin, y)
        y += 5
        addText(`Representante legal de la empresa`, margin, y)

        // Comprador
        y += 12
        doc.setFont('helvetica', 'bold')
        addText('DE OTRA PARTE (COMPRADOR):', margin, y)
        doc.setFont('helvetica', 'normal')
        y += 6
        addText(`D/Da. ${comprador.nombre} ${comprador.apellidos}`, margin, y)
        y += 5
        addText(`DNI/NIE: ${comprador.dni_nie}`, margin, y)
        y += 5
        const direccionComprador = `${comprador.direccion}, ${comprador.codigo_postal} ${comprador.municipio} (${comprador.provincia})`
        addText(`Domicilio: ${direccionComprador}`, margin, y)
        y += 5
        addText(`Telefono: ${comprador.telefono} - Email: ${comprador.email}`, margin, y)

        // Separator
        y += 10
        doc.line(margin, y, pageWidth - margin, y)

        // EXPONEN
        y += 10
        doc.setFont('helvetica', 'bold')
        addText('EXPONEN', margin, y)

        y += 8
        doc.setFont('helvetica', 'normal')
        const exposicion = `Que el VENDEDOR es propietario del vehiculo que se describe a continuacion y desea venderlo, y que el COMPRADOR esta interesado en adquirirlo en las condiciones que se especifican en el presente contrato.`
        const exposicionLines = doc.splitTextToSize(exposicion, pageWidth - 2 * margin)
        doc.text(exposicionLines, margin, y)
        y += exposicionLines.length * 5 + 5

        // DATOS DEL VEHICULO
        y += 5
        doc.setFont('helvetica', 'bold')
        addText('DATOS DEL VEHICULO', margin, y)

        y += 8
        doc.setFont('helvetica', 'normal')
        const vehiculoData = [
            ['Marca/Modelo:', `${selectedVehicle.marca} ${selectedVehicle.modelo} ${selectedVehicle.version || ''}`],
            ['Matricula:', selectedVehicle.matricula],
            ['Bastidor (VIN):', selectedVehicle.vin],
            ['Fecha 1a Matriculacion:', String(selectedVehicle.año_matriculacion)],
            ['Kilometraje:', `${selectedVehicle.kilometraje.toLocaleString()} km`],
            ['Combustible:', selectedVehicle.combustible.charAt(0).toUpperCase() + selectedVehicle.combustible.slice(1)],
            ['Color:', selectedVehicle.color_exterior],
        ]

        vehiculoData.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold')
            addText(label, margin, y)
            doc.setFont('helvetica', 'normal')
            addText(value, margin + 45, y)
            y += 5
        })

        // CONDICIONES ECONOMICAS
        y += 8
        doc.setFont('helvetica', 'bold')
        addText('CONDICIONES ECONOMICAS', margin, y)

        y += 8
        doc.setFont('helvetica', 'normal')
        addText(`Precio de venta (sin IVA): ${formatCurrency(economico.precio_venta || 0)}`, margin, y)
        y += 5
        addText(`IVA (${economico.iva_porcentaje}%): ${formatCurrency(economico.iva_importe || 0)}`, margin, y)
        y += 5
        doc.setFont('helvetica', 'bold')
        addText(`PRECIO TOTAL: ${formatCurrency(economico.precio_total || 0)}`, margin, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        addText(`Forma de pago: ${economico.forma_pago?.charAt(0).toUpperCase()}${economico.forma_pago?.slice(1)}`, margin, y)

        // GARANTIA
        y += 12
        doc.setFont('helvetica', 'bold')
        addText('GARANTIA', margin, y)

        y += 8
        doc.setFont('helvetica', 'normal')
        if (garantia.tiene_garantia) {
            addText(`El vehiculo cuenta con garantia de ${garantia.meses_garantia} meses (${garantia.tipo_garantia}).`, margin, y)
        } else {
            addText('El vehiculo se vende sin garantia.', margin, y)
        }

        // DOCUMENTACION
        y += 12
        doc.setFont('helvetica', 'bold')
        addText('DOCUMENTACION ENTREGADA', margin, y)

        y += 8
        doc.setFont('helvetica', 'normal')
        const docs = []
        if (documentacion.tiene_permiso_circulacion) docs.push('Permiso de Circulacion')
        if (documentacion.tiene_ficha_tecnica) docs.push('Ficha Tecnica')
        if (documentacion.tiene_itv_vigente) docs.push('ITV Vigente')
        if (documentacion.tiene_justificante_pago_impuesto) docs.push('Justificante Pago Impuesto')
        addText(docs.join(', '), margin, y)

        // CLAUSULAS
        y += 15
        doc.setFont('helvetica', 'bold')
        addText('CLAUSULAS', margin, y)

        y += 8
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')

        const clausulas = [
            'PRIMERA.- El vendedor transmite al comprador la plena propiedad del vehiculo descrito.',
            'SEGUNDA.- El comprador declara conocer el estado actual del vehiculo.',
            'TERCERA.- El vendedor garantiza ser el legitimo propietario del vehiculo y que este se encuentra libre de cargas.',
            'CUARTA.- Los gastos de transferencia seran por cuenta del comprador.',
            'QUINTA.- El comprador asume la responsabilidad del vehiculo desde la firma del presente contrato.',
        ]

        clausulas.forEach((clausula) => {
            const lines = doc.splitTextToSize(clausula, pageWidth - 2 * margin)
            if (y + lines.length * 4 > 270) {
                doc.addPage()
                y = 20
            }
            doc.text(lines, margin, y)
            y += lines.length * 4 + 3
        })

        // FIRMAS
        y = Math.max(y + 20, 240)
        if (y > 260) {
            doc.addPage()
            y = 40
        }

        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        addText('EL VENDEDOR', margin + 20, y, { align: 'center' })
        addText('EL COMPRADOR', pageWidth - margin - 20, y, { align: 'center' })

        y += 25
        doc.line(margin, y, margin + 60, y)
        doc.line(pageWidth - margin - 60, y, pageWidth - margin, y)

        y += 5
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        addText(empresaSeleccionada?.nombre_comercial || 'Vendedor', margin + 30, y, { align: 'center' })
        addText(`${comprador.nombre} ${comprador.apellidos}`, pageWidth - margin - 30, y, { align: 'center' })

        return doc
    }, [selectedVehicle, comprador, economico, garantia, documentacion, fechaContrato, lugarFirma, empresaSeleccionada])

    // Save contract and generate PDF
    const handleGenerarContrato = async () => {
        if (!selectedVehicle) {
            alert('Selecciona un vehiculo primero')
            return
        }

        if (!comprador.nombre || !comprador.dni_nie) {
            alert('Completa los datos del comprador (nombre y DNI/NIE son obligatorios)')
            return
        }

        const doc = generatePDF()
        if (!doc) return

        // Save PDF
        doc.save(`Contrato_${selectedVehicle.matricula}_${comprador.apellidos || 'comprador'}.pdf`)

        // Save contract to Supabase
        const creatorName = profile ? `${profile.nombre} ${profile.apellidos}`.trim() : user?.email?.split('@')[0] || 'Usuario'

        try {
            const numeroContrato = await generateContractNumber()

            const contractData = {
                numero_contrato: numeroContrato,
                empresa_id: empresaSeleccionada?.id,
                empresa_nombre: empresaSeleccionada?.nombre_comercial,
                empresa_cif: empresaSeleccionada?.cif,
                empresa_direccion: empresaSeleccionada ? `${empresaSeleccionada.direccion}, ${empresaSeleccionada.codigo_postal} ${empresaSeleccionada.localidad}` : undefined,
                vehiculo_id: selectedVehicle.id,
                vehiculo_marca: selectedVehicle.marca,
                vehiculo_modelo: selectedVehicle.modelo,
                vehiculo_matricula: selectedVehicle.matricula,
                vehiculo_vin: selectedVehicle.vin,
                vehiculo_km: selectedVehicle.kilometraje,
                vehiculo_precio: selectedVehicle.precio_venta,
                comprador_tipo: tipoCliente,
                comprador_nombre: comprador.nombre,
                comprador_apellidos: comprador.apellidos,
                comprador_documento_tipo: tipoDocumento,
                comprador_documento: comprador.dni_nie,
                comprador_direccion: comprador.direccion,
                comprador_cp: comprador.codigo_postal,
                comprador_localidad: comprador.municipio,
                comprador_provincia: comprador.provincia,
                comprador_telefono: comprador.telefono,
                comprador_email: comprador.email,
                precio_venta: economico.precio_venta || 0,
                forma_pago: economico.forma_pago || 'contado',
                entrega_inicial: reserva,
                financiado: economico.importe_financiado || 0,
                garantia_meses: garantia.meses_garantia,
                garantia_tipo: garantia.tipo_garantia,
                estado: 'firmado',
                fecha_firma: fechaContrato,
                clausulas_adicionales: clausulasAdicionales,
                created_by: user?.id,
                created_by_name: creatorName,
            }

            const savedContract = await createContract(contractData)

            if (savedContract) {
                setSavedContracts(prev => [savedContract, ...prev])
            }
        } catch (error) {
            console.error('Error saving contract:', error)
            alert('Error al guardar el contrato en la base de datos')
        }
    }

    // Preview contract
    const handlePreview = () => {
        if (!selectedVehicle) {
            alert('Selecciona un vehiculo primero')
            return
        }
        setShowPreview(true)
    }

    // Delete contract from history (Supabase)
    const handleDeleteContract = async (contractId: string) => {
        const { deleteContract } = await import('@/lib/supabase-service')
        const success = await deleteContract(contractId)
        if (success) {
            setSavedContracts(prev => prev.filter(c => c.id !== contractId))
        }
    }

    // Re-download a saved contract
    const handleDownloadSavedContract = (contract: ContractDB) => {
        // Set form data from saved contract
        setComprador({
            nombre: contract.comprador_nombre,
            apellidos: contract.comprador_apellidos || '',
            dni_nie: contract.comprador_documento,
            direccion: contract.comprador_direccion || '',
            codigo_postal: contract.comprador_cp || '',
            municipio: contract.comprador_localidad || '',
            provincia: contract.comprador_provincia || '',
            telefono: contract.comprador_telefono || '',
            email: contract.comprador_email || '',
        })
        setEconomico({
            precio_venta: contract.precio_venta,
            forma_pago: (contract.forma_pago as any) || 'contado',
            importe_financiado: contract.financiado,
            iva_porcentaje: 0,
            iva_importe: 0,
            precio_total: contract.precio_venta,
        })
        setGarantia({
            tiene_garantia: true,
            meses_garantia: contract.garantia_meses || 12,
            tipo_garantia: (contract.garantia_tipo as 'legal' | 'comercial' | 'extendida') || 'legal',
        })
        if (contract.fecha_firma) {
            setFechaContrato(contract.fecha_firma)
        }

        // Find matching vehicle
        const vehicle = allVehicles.find(v => v.id === contract.vehiculo_id)
        if (vehicle) {
            setSelectedVehicle(vehicle)
            // Generate and download PDF
            setTimeout(() => {
                const doc = generatePDF()
                if (doc) {
                    doc.save(`Contrato_${contract.vehiculo_matricula}_${contract.comprador_apellidos || 'comprador'}.pdf`)
                }
            }, 100)
        }
    }

    // Reset form and go back
    const handleBack = () => {
        setSelectedVehicle(null)
        setMobileStep('list')
        setComprador({
            nombre: '',
            apellidos: '',
            dni_nie: '',
            direccion: '',
            codigo_postal: '',
            municipio: '',
            provincia: '',
            telefono: '',
            email: '',
        })
    }

    // Stats
    const stats = {
        disponibles: vehiculosDisponibles.length,
        contratos: savedContracts.length,
    }

    return (
        <div className="min-h-screen bg-[#f6f6f8] flex flex-col">
            {/* ============ MOBILE VIEW ============ */}
            <div className="lg:hidden flex flex-col min-h-screen">
                {/* Sticky Header */}
                <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
                    {/* Top App Bar */}
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                            {mobileStep === 'form' && (
                                <button
                                    onClick={handleBack}
                                    className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-600"
                                >
                                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                                </button>
                            )}
                            <div>
                                <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                                    {mobileStep === 'list' ? 'Contratos' : 'Nuevo Contrato'}
                                </h1>
                                {mobileStep === 'form' && selectedVehicle && (
                                    <p className="text-xs text-slate-500">
                                        {selectedVehicle.marca} {selectedVehicle.modelo}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {mobileStep === 'list' && (
                                <button
                                    onClick={() => setShowHistory(true)}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                                >
                                    <span className="material-symbols-outlined text-[20px]">history</span>
                                </button>
                            )}
                            {mobileStep === 'form' && selectedVehicle && (
                                <button
                                    onClick={handlePreview}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                                >
                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Search Bar - Only on list view */}
                    {mobileStep === 'list' && (
                        <div className="px-4 pb-3">
                            <div className="group flex w-full items-center rounded-xl bg-slate-100 h-11 border-2 border-transparent focus-within:border-[#135bec]/50 focus-within:bg-white transition-all duration-200">
                                <div className="flex items-center justify-center pl-3 pr-2 text-slate-400 group-focus-within:text-[#135bec] transition-colors">
                                    <span className="material-symbols-outlined text-[22px]">search</span>
                                </div>
                                <input
                                    className="flex w-full bg-transparent border-none text-base font-medium placeholder:text-slate-400 focus:ring-0 text-slate-900 h-full p-0 pr-4"
                                    placeholder="Buscar vehiculo..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Selected Vehicle Info - Only on form view */}
                    {mobileStep === 'form' && selectedVehicle && (
                        <div className="px-4 pb-3">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <div className="h-14 w-14 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                                    {isValidImageUrl(selectedVehicle.imagen_principal) ? (
                                        <img
                                            src={selectedVehicle.imagen_principal!}
                                            alt={selectedVehicle.marca}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-slate-400">directions_car</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 truncate">
                                        {selectedVehicle.marca} {selectedVehicle.modelo}
                                    </p>
                                    <p className="text-xs text-slate-500">{selectedVehicle.matricula}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-[#135bec]">
                                        {formatCurrency(economico.precio_total || 0)}
                                    </p>
                                    <p className="text-[10px] text-slate-400">IVA incluido</p>
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                {/* Main Content */}
                <main className="flex-1 px-4 py-4 pb-32">
                    {/* STEP 1: Vehicle List */}
                    {mobileStep === 'list' && (
                        <div className="flex flex-col gap-3">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[#135bec]">directions_car</span>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-[#135bec]">{stats.disponibles}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Disponibles</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-green-600">description</span>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-green-600">{stats.contratos}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Contratos</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section Header */}
                            <div className="flex items-center justify-between mt-2 mb-1">
                                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                    Selecciona un vehiculo
                                </h2>
                                <span className="text-xs text-slate-400">{vehiculosDisponibles.length} disponibles</span>
                            </div>

                            {/* Vehicle Cards */}
                            {vehiculosDisponibles.map(vehicle => (
                                <button
                                    key={vehicle.id}
                                    onClick={() => handleSelectVehicle(vehicle)}
                                    className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden text-left active:scale-[0.98] transition-transform"
                                >
                                    <div className="flex items-center p-3 gap-3">
                                        <div className="h-16 w-16 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                            {isValidImageUrl(vehicle.imagen_principal) ? (
                                                <img
                                                    src={vehicle.imagen_principal!}
                                                    alt={vehicle.marca}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-slate-300 text-[28px]">directions_car</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 truncate">
                                                {vehicle.marca} {vehicle.modelo}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {vehicle.matricula} • {vehicle.año_matriculacion}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {vehicle.kilometraje.toLocaleString()} km • {vehicle.combustible}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-lg font-bold text-[#135bec]">
                                                {formatCurrency(vehicle.precio_venta)}
                                            </p>
                                            <span className={cn(
                                                "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                                                vehicle.estado === 'disponible' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                            )}>
                                                {vehicle.estado === 'disponible' ? 'Disponible' : 'Reservado'}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}

                            {/* Empty State */}
                            {vehiculosDisponibles.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">search_off</span>
                                    <h3 className="text-lg font-semibold text-slate-600 mb-1">No hay vehiculos</h3>
                                    <p className="text-sm text-slate-400">Intenta ajustar la busqueda</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: Contract Form */}
                    {mobileStep === 'form' && selectedVehicle && (
                        <div className="space-y-4">
                            {/* Fecha y Lugar */}
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                                    Fecha y Lugar
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">Fecha</Label>
                                        <Input
                                            type="date"
                                            value={fechaContrato}
                                            onChange={(e) => setFechaContrato(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">Lugar</Label>
                                        <Input
                                            value={lugarFirma}
                                            onChange={(e) => setLugarFirma(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* NUEVA SECCIÓN: Empresa Vendedora */}
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">business</span>
                                    Empresa Vendedora
                                </h3>
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">Empresa *</Label>
                                        <Select value={selectedEmpresaId} onValueChange={setSelectedEmpresaId}>
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Seleccionar empresa" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {empresas.map(emp => (
                                                    <SelectItem key={emp.id} value={emp.id}>
                                                        {emp.nombre_comercial}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {empresaSeleccionada && (
                                        <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                                            <p className="font-medium text-slate-700">{empresaSeleccionada.razon_social}</p>
                                            <p className="text-slate-500">CIF: {empresaSeleccionada.cif}</p>
                                            <p className="text-slate-500">{empresaSeleccionada.direccion}, {empresaSeleccionada.codigo_postal} {empresaSeleccionada.localidad}</p>
                                        </div>
                                    )}
                                    {empresas.length === 0 && (
                                        <p className="text-xs text-amber-600 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">warning</span>
                                            Configura empresas en Configuracion
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Datos del Comprador */}
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">person</span>
                                    Datos del Comprador
                                </h3>
                                <div className="space-y-3">
                                    {/* Tipo de cliente */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-slate-500">Tipo cliente</Label>
                                            <Select value={tipoCliente} onValueChange={(v) => setTipoCliente(v as TipoCliente)}>
                                                <SelectTrigger className="h-11">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TIPOS_CLIENTE.map(t => (
                                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-slate-500">Tipo documento</Label>
                                            <Select value={tipoDocumento} onValueChange={(v) => setTipoDocumento(v as TipoDocumentoIdentidad)}>
                                                <SelectTrigger className="h-11">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TIPOS_DOCUMENTO.map(t => (
                                                        <SelectItem key={t.value} value={t.value.toUpperCase()}>{t.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-slate-500">Nombre *</Label>
                                            <Input
                                                value={comprador.nombre}
                                                onChange={(e) => setComprador({ ...comprador, nombre: e.target.value })}
                                                className="h-11"
                                                placeholder="Nombre"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-slate-500">Apellidos *</Label>
                                            <Input
                                                value={comprador.apellidos}
                                                onChange={(e) => setComprador({ ...comprador, apellidos: e.target.value })}
                                                className="h-11"
                                                placeholder="Apellidos"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">{tipoDocumento} *</Label>
                                        <Input
                                            value={comprador.dni_nie}
                                            onChange={(e) => setComprador({ ...comprador, dni_nie: e.target.value })}
                                            className="h-11"
                                            placeholder="12345678A"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-slate-500">Telefono</Label>
                                            <Input
                                                value={comprador.telefono}
                                                onChange={(e) => setComprador({ ...comprador, telefono: e.target.value })}
                                                className="h-11"
                                                placeholder="+34 600..."
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-slate-500">Email</Label>
                                            <Input
                                                type="email"
                                                value={comprador.email}
                                                onChange={(e) => setComprador({ ...comprador, email: e.target.value })}
                                                className="h-11"
                                                placeholder="email@..."
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">Direccion</Label>
                                        <Input
                                            value={comprador.direccion}
                                            onChange={(e) => setComprador({ ...comprador, direccion: e.target.value })}
                                            className="h-11"
                                            placeholder="Calle, numero..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-slate-500">CP</Label>
                                            <Input
                                                value={comprador.codigo_postal}
                                                onChange={(e) => setComprador({ ...comprador, codigo_postal: e.target.value })}
                                                className="h-11"
                                                placeholder="28001"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-1.5">
                                            <Label className="text-xs text-slate-500">Municipio</Label>
                                            <Input
                                                value={comprador.municipio}
                                                onChange={(e) => setComprador({ ...comprador, municipio: e.target.value })}
                                                className="h-11"
                                                placeholder="Madrid"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">Provincia</Label>
                                        <Select
                                            value={comprador.provincia}
                                            onValueChange={(value) => setComprador({ ...comprador, provincia: value })}
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PROVINCIAS.map(prov => (
                                                    <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Condiciones Economicas */}
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">euro</span>
                                    Condiciones Economicas
                                </h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-slate-500">Precio Venta *</Label>
                                            <Input
                                                type="number"
                                                value={economico.precio_venta || ''}
                                                onChange={(e) => setEconomico({ ...economico, precio_venta: parseFloat(e.target.value) || 0 })}
                                                className="h-11"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-slate-500">Reserva/Senal</Label>
                                            <Input
                                                type="number"
                                                value={reserva || ''}
                                                onChange={(e) => setReserva(parseFloat(e.target.value) || 0)}
                                                className="h-11"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                            <span className="text-xs font-medium text-blue-700">PRECIO TOTAL</span>
                                            <span className="text-lg font-bold text-blue-700">
                                                {formatCurrency(economico.precio_total || 0)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                            <span className="text-xs font-medium text-green-700">A PAGAR</span>
                                            <span className="text-lg font-bold text-green-700">
                                                {formatCurrency(totalPago)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-slate-500">IVA</Label>
                                            <Select
                                                value={String(economico.iva_porcentaje)}
                                                onValueChange={(value) => setEconomico({ ...economico, iva_porcentaje: parseInt(value) })}
                                            >
                                                <SelectTrigger className="h-11">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="21">21%</SelectItem>
                                                    <SelectItem value="10">10%</SelectItem>
                                                    <SelectItem value="4">4%</SelectItem>
                                                    <SelectItem value="0">0%</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-slate-500">Forma de Pago</Label>
                                            <Select
                                                value={economico.forma_pago}
                                                onValueChange={(value: any) => setEconomico({ ...economico, forma_pago: value })}
                                            >
                                                <SelectTrigger className="h-11">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="contado">Contado</SelectItem>
                                                    <SelectItem value="transferencia">Transferencia</SelectItem>
                                                    <SelectItem value="financiacion">Financiacion</SelectItem>
                                                    <SelectItem value="mixto">Mixto</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* NUEVA SECCIÓN: Clausulas Adicionales */}
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">edit_note</span>
                                    Clausulas Adicionales
                                </h3>
                                <Textarea
                                    value={clausulasAdicionales}
                                    onChange={(e) => setClausulasAdicionales(e.target.value)}
                                    placeholder="Anade condiciones especiales, forma de pago, entrega, etc."
                                    className="min-h-[100px]"
                                />
                            </div>

                            {/* Garantia */}
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">shield</span>
                                    Garantia
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="tiene_garantia"
                                            checked={garantia.tiene_garantia}
                                            onCheckedChange={(checked) => setGarantia({ ...garantia, tiene_garantia: checked as boolean })}
                                        />
                                        <Label htmlFor="tiene_garantia" className="text-sm">Incluye garantia</Label>
                                    </div>
                                    {garantia.tiene_garantia && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <Select
                                                value={String(garantia.meses_garantia)}
                                                onValueChange={(value) => setGarantia({ ...garantia, meses_garantia: parseInt(value) })}
                                            >
                                                <SelectTrigger className="h-11">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="6">6 meses</SelectItem>
                                                    <SelectItem value="12">12 meses</SelectItem>
                                                    <SelectItem value="24">24 meses</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select
                                                value={garantia.tipo_garantia}
                                                onValueChange={(value: any) => setGarantia({ ...garantia, tipo_garantia: value })}
                                            >
                                                <SelectTrigger className="h-11">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="legal">Legal</SelectItem>
                                                    <SelectItem value="comercial">Comercial</SelectItem>
                                                    <SelectItem value="extendida">Extendida</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Documentacion */}
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">folder_open</span>
                                    Documentacion
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="permiso"
                                            checked={documentacion.tiene_permiso_circulacion}
                                            onCheckedChange={(checked) => setDocumentacion({ ...documentacion, tiene_permiso_circulacion: checked as boolean })}
                                        />
                                        <Label htmlFor="permiso" className="text-xs">Permiso</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="ficha"
                                            checked={documentacion.tiene_ficha_tecnica}
                                            onCheckedChange={(checked) => setDocumentacion({ ...documentacion, tiene_ficha_tecnica: checked as boolean })}
                                        />
                                        <Label htmlFor="ficha" className="text-xs">Ficha Tecnica</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="itv"
                                            checked={documentacion.tiene_itv_vigente}
                                            onCheckedChange={(checked) => setDocumentacion({ ...documentacion, tiene_itv_vigente: checked as boolean })}
                                        />
                                        <Label htmlFor="itv" className="text-xs">ITV Vigente</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="impuesto"
                                            checked={documentacion.tiene_justificante_pago_impuesto}
                                            onCheckedChange={(checked) => setDocumentacion({ ...documentacion, tiene_justificante_pago_impuesto: checked as boolean })}
                                        />
                                        <Label htmlFor="impuesto" className="text-xs">Just. Impuesto</Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Mobile Bottom Action Bar - Only on form view */}
                {mobileStep === 'form' && selectedVehicle && (
                    <div className="fixed bottom-16 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-3 shadow-lg">
                        <button
                            onClick={handleGenerarContrato}
                            className="w-full flex items-center justify-center gap-2 h-12 bg-[#135bec] text-white rounded-xl font-bold text-base shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-transform"
                        >
                            <span className="material-symbols-outlined text-[22px]">download</span>
                            Generar Contrato PDF
                        </button>
                    </div>
                )}
            </div>

            {/* ============ DESKTOP VIEW ============ */}
            <div className="hidden lg:flex h-[calc(100vh-4rem)]">
                {/* Left Column - Vehicle List */}
                <div className="w-[320px] bg-white border-r border-slate-200 flex flex-col">
                    <div className="p-4 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#135bec]">directions_car</span>
                                Vehiculos
                            </h2>
                            <button
                                onClick={() => setShowHistory(true)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">history</span>
                            </button>
                        </div>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                            <Input
                                placeholder="Buscar vehiculo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {vehiculosDisponibles.map(vehicle => (
                            <button
                                key={vehicle.id}
                                onClick={() => handleSelectVehicle(vehicle)}
                                className={cn(
                                    "w-full p-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100",
                                    selectedVehicle?.id === vehicle.id && "bg-blue-50 border-l-4 border-l-[#135bec]"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                        {isValidImageUrl(vehicle.imagen_principal) ? (
                                            <img
                                                src={vehicle.imagen_principal!}
                                                alt={vehicle.marca}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-300">directions_car</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 text-sm truncate">
                                            {vehicle.marca} {vehicle.modelo}
                                        </p>
                                        <p className="text-xs text-slate-500">{vehicle.matricula}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-[#135bec]">
                                            {formatCurrency(vehicle.precio_venta)}
                                        </p>
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                            vehicle.estado === 'disponible' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                        )}>
                                            {vehicle.estado === 'disponible' ? 'Disponible' : 'Reservado'}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Column - Contract Form */}
                <div className="flex-1 overflow-y-auto bg-slate-50">
                    <div className="p-6">
                        <div className="max-w-3xl mx-auto space-y-6">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#135bec]">description</span>
                                        Contrato de Compraventa
                                    </h1>
                                    <p className="text-slate-500 mt-1">
                                        {selectedVehicle
                                            ? `${selectedVehicle.marca} ${selectedVehicle.modelo} - ${selectedVehicle.matricula}`
                                            : 'Selecciona un vehiculo para comenzar'}
                                    </p>
                                </div>
                                {selectedVehicle && (
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={handlePreview}>
                                            <span className="material-symbols-outlined mr-2 text-[18px]">visibility</span>
                                            Vista previa
                                        </Button>
                                        <Button onClick={handleGenerarContrato} className="bg-[#135bec] hover:bg-blue-700">
                                            <span className="material-symbols-outlined mr-2 text-[18px]">download</span>
                                            Generar PDF
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {!selectedVehicle ? (
                                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-100">
                                    <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">description</span>
                                    <h3 className="text-lg font-semibold text-slate-600">
                                        Selecciona un vehiculo para crear el contrato
                                    </h3>
                                    <p className="text-slate-400 mt-2">
                                        Elige un vehiculo de la lista de la izquierda
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Vehicle Summary */}
                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="h-20 w-20 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                                                {isValidImageUrl(selectedVehicle.imagen_principal) ? (
                                                    <img
                                                        src={selectedVehicle.imagen_principal!}
                                                        alt={selectedVehicle.marca}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-slate-300 text-3xl">directions_car</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-slate-900">
                                                    {selectedVehicle.marca} {selectedVehicle.modelo}
                                                </h3>
                                                <p className="text-sm text-slate-500">{selectedVehicle.version}</p>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                                    <span>{selectedVehicle.matricula}</span>
                                                    <span>{selectedVehicle.vin}</span>
                                                    <span>{selectedVehicle.kilometraje.toLocaleString()} km</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-[#135bec]">
                                                    {formatCurrency(economico.precio_total || 0)}
                                                </p>
                                                <p className="text-xs text-slate-400">IVA incluido</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Form Grid */}
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Fecha y Lugar */}
                                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                                                Fecha y Lugar
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Fecha del Contrato</Label>
                                                    <Input
                                                        type="date"
                                                        value={fechaContrato}
                                                        onChange={(e) => setFechaContrato(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Lugar de Firma</Label>
                                                    <Input
                                                        value={lugarFirma}
                                                        onChange={(e) => setLugarFirma(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Condiciones Economicas */}
                                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px]">euro</span>
                                                Condiciones Economicas
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <Label>Precio (sin IVA)</Label>
                                                        <Input
                                                            type="number"
                                                            value={economico.precio_venta || ''}
                                                            onChange={(e) => setEconomico({ ...economico, precio_venta: parseFloat(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>IVA</Label>
                                                        <Select
                                                            value={String(economico.iva_porcentaje)}
                                                            onValueChange={(value) => setEconomico({ ...economico, iva_porcentaje: parseInt(value) })}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="21">21%</SelectItem>
                                                                <SelectItem value="10">10%</SelectItem>
                                                                <SelectItem value="4">4%</SelectItem>
                                                                <SelectItem value="0">0%</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Forma de Pago</Label>
                                                    <Select
                                                        value={economico.forma_pago}
                                                        onValueChange={(value: any) => setEconomico({ ...economico, forma_pago: value })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="contado">Contado</SelectItem>
                                                            <SelectItem value="transferencia">Transferencia</SelectItem>
                                                            <SelectItem value="financiacion">Financiacion</SelectItem>
                                                            <SelectItem value="mixto">Mixto</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Datos del Comprador - Full Width */}
                                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">person</span>
                                            Datos del Comprador
                                        </h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>Nombre *</Label>
                                                <Input
                                                    value={comprador.nombre}
                                                    onChange={(e) => setComprador({ ...comprador, nombre: e.target.value })}
                                                    placeholder="Nombre"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Apellidos *</Label>
                                                <Input
                                                    value={comprador.apellidos}
                                                    onChange={(e) => setComprador({ ...comprador, apellidos: e.target.value })}
                                                    placeholder="Apellidos"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>DNI/NIE *</Label>
                                                <Input
                                                    value={comprador.dni_nie}
                                                    onChange={(e) => setComprador({ ...comprador, dni_nie: e.target.value })}
                                                    placeholder="12345678A"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Telefono</Label>
                                                <Input
                                                    value={comprador.telefono}
                                                    onChange={(e) => setComprador({ ...comprador, telefono: e.target.value })}
                                                    placeholder="+34 600..."
                                                />
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <Label>Email</Label>
                                                <Input
                                                    type="email"
                                                    value={comprador.email}
                                                    onChange={(e) => setComprador({ ...comprador, email: e.target.value })}
                                                    placeholder="email@ejemplo.com"
                                                />
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <Label>Direccion</Label>
                                                <Input
                                                    value={comprador.direccion}
                                                    onChange={(e) => setComprador({ ...comprador, direccion: e.target.value })}
                                                    placeholder="Calle, numero, piso..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Codigo Postal</Label>
                                                <Input
                                                    value={comprador.codigo_postal}
                                                    onChange={(e) => setComprador({ ...comprador, codigo_postal: e.target.value })}
                                                    placeholder="28001"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Municipio</Label>
                                                <Input
                                                    value={comprador.municipio}
                                                    onChange={(e) => setComprador({ ...comprador, municipio: e.target.value })}
                                                    placeholder="Madrid"
                                                />
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <Label>Provincia</Label>
                                                <Select
                                                    value={comprador.provincia}
                                                    onValueChange={(value) => setComprador({ ...comprador, provincia: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar provincia" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PROVINCIAS.map(prov => (
                                                            <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Garantia y Documentacion */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px]">shield</span>
                                                Garantia
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id="tiene_garantia_desktop"
                                                        checked={garantia.tiene_garantia}
                                                        onCheckedChange={(checked) => setGarantia({ ...garantia, tiene_garantia: checked as boolean })}
                                                    />
                                                    <Label htmlFor="tiene_garantia_desktop">Incluye garantia</Label>
                                                </div>
                                                {garantia.tiene_garantia && (
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Select
                                                            value={String(garantia.meses_garantia)}
                                                            onValueChange={(value) => setGarantia({ ...garantia, meses_garantia: parseInt(value) })}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="6">6 meses</SelectItem>
                                                                <SelectItem value="12">12 meses</SelectItem>
                                                                <SelectItem value="24">24 meses</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <Select
                                                            value={garantia.tipo_garantia}
                                                            onValueChange={(value: any) => setGarantia({ ...garantia, tipo_garantia: value })}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="legal">Legal</SelectItem>
                                                                <SelectItem value="comercial">Comercial</SelectItem>
                                                                <SelectItem value="extendida">Extendida</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px]">folder_open</span>
                                                Documentacion
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id="permiso_desktop"
                                                        checked={documentacion.tiene_permiso_circulacion}
                                                        onCheckedChange={(checked) => setDocumentacion({ ...documentacion, tiene_permiso_circulacion: checked as boolean })}
                                                    />
                                                    <Label htmlFor="permiso_desktop" className="text-sm">Permiso</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id="ficha_desktop"
                                                        checked={documentacion.tiene_ficha_tecnica}
                                                        onCheckedChange={(checked) => setDocumentacion({ ...documentacion, tiene_ficha_tecnica: checked as boolean })}
                                                    />
                                                    <Label htmlFor="ficha_desktop" className="text-sm">Ficha Tecnica</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id="itv_desktop"
                                                        checked={documentacion.tiene_itv_vigente}
                                                        onCheckedChange={(checked) => setDocumentacion({ ...documentacion, tiene_itv_vigente: checked as boolean })}
                                                    />
                                                    <Label htmlFor="itv_desktop" className="text-sm">ITV Vigente</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id="impuesto_desktop"
                                                        checked={documentacion.tiene_justificante_pago_impuesto}
                                                        onCheckedChange={(checked) => setDocumentacion({ ...documentacion, tiene_justificante_pago_impuesto: checked as boolean })}
                                                    />
                                                    <Label htmlFor="impuesto_desktop" className="text-sm">Just. Impuesto</Label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ============ MODALS ============ */}

            {/* Contract History Modal */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#135bec]">history</span>
                            Historial de Contratos
                        </DialogTitle>
                    </DialogHeader>

                    {savedContracts.length === 0 ? (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">description</span>
                            <p className="text-slate-500">No hay contratos guardados</p>
                            <p className="text-sm text-slate-400">Los contratos generados apareceran aqui</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {savedContracts.map(contract => (
                                <div
                                    key={contract.id}
                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 truncate">
                                            {contract.vehiculo_marca} {contract.vehiculo_modelo}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {contract.comprador_nombre} {contract.comprador_apellidos}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {formatDate(contract.created_at)} - {formatCurrency(contract.precio_venta)}
                                        </p>
                                        {contract.created_by_name && (
                                            <p className="text-xs text-[#135bec] mt-1">
                                                Creado por: {contract.created_by_name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 ml-3">
                                        <button
                                            onClick={() => handleDownloadSavedContract(contract)}
                                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#135bec] hover:bg-blue-50 transition-colors border border-slate-200"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">download</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteContract(contract.id)}
                                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-500 hover:bg-red-50 transition-colors border border-slate-200"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Preview Modal */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#135bec]">visibility</span>
                            Vista Previa
                        </DialogTitle>
                    </DialogHeader>

                    {selectedVehicle && (
                        <div className="space-y-5 text-sm">
                            {/* Header */}
                            <div className="text-center border-b pb-4">
                                <h2 className="text-base font-bold">CONTRATO DE COMPRAVENTA</h2>
                                <p className="text-slate-500 mt-1">En {lugarFirma}, a {formatDate(fechaContrato)}</p>
                            </div>

                            {/* Partes */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <h3 className="font-bold text-[#135bec] text-xs uppercase mb-2">Vendedor</h3>
                                    <p className="font-medium">{empresaSeleccionada?.nombre_comercial || 'Sin empresa'}</p>
                                    <p className="text-slate-500 text-xs">CIF: {empresaSeleccionada?.cif || '-'}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <h3 className="font-bold text-[#135bec] text-xs uppercase mb-2">Comprador</h3>
                                    <p className="font-medium">{comprador.nombre} {comprador.apellidos}</p>
                                    <p className="text-slate-500 text-xs">DNI: {comprador.dni_nie}</p>
                                </div>
                            </div>

                            {/* Vehiculo */}
                            <div className="bg-slate-50 rounded-lg p-3">
                                <h3 className="font-bold text-[#135bec] text-xs uppercase mb-2">Vehiculo</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <p><span className="text-slate-500">Marca/Modelo:</span> {selectedVehicle.marca} {selectedVehicle.modelo}</p>
                                    <p><span className="text-slate-500">Matricula:</span> {selectedVehicle.matricula}</p>
                                    <p><span className="text-slate-500">Bastidor:</span> {selectedVehicle.vin}</p>
                                    <p><span className="text-slate-500">Km:</span> {selectedVehicle.kilometraje.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Economico */}
                            <div className="bg-green-50 rounded-lg p-3">
                                <h3 className="font-bold text-green-700 text-xs uppercase mb-2">Condiciones Economicas</h3>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Precio (sin IVA):</span>
                                        <span>{formatCurrency(economico.precio_venta || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">IVA ({economico.iva_porcentaje}%):</span>
                                        <span>{formatCurrency(economico.iva_importe || 0)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg border-t border-green-200 pt-1 mt-1">
                                        <span>TOTAL:</span>
                                        <span className="text-green-700">{formatCurrency(economico.precio_total || 0)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Garantia */}
                            <div>
                                <h3 className="font-bold text-[#135bec] text-xs uppercase mb-1">Garantia</h3>
                                {garantia.tiene_garantia ? (
                                    <p>{garantia.meses_garantia} meses ({garantia.tipo_garantia})</p>
                                ) : (
                                    <p className="text-slate-500">Sin garantia</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t">
                                <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1">
                                    Cerrar
                                </Button>
                                <Button
                                    className="flex-1 bg-[#135bec] hover:bg-blue-700"
                                    onClick={() => {
                                        handleGenerarContrato()
                                        setShowPreview(false)
                                    }}
                                >
                                    <span className="material-symbols-outlined mr-2 text-[18px]">download</span>
                                    Generar PDF
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
