"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { VehicleForm, VehicleFormData } from "@/components/inventory/VehicleForm"
import { decodeVINFull } from "@/lib/vin-decoder"
import { useToast } from "@/components/ui/toast"
import { addUserVehicle, generateId } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import type { Vehicle } from "@/types"

function NuevoVehiculoContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { addToast } = useToast()
    const { user } = useAuth()
    const [isSaving, setIsSaving] = useState(false)
    const [initialData, setInitialData] = useState<Partial<VehicleFormData> | undefined>(undefined)
    const [isLoadingVIN, setIsLoadingVIN] = useState(false)
    const [vinInfo, setVinInfo] = useState<{ make: string; model: string; year: string } | null>(null)

    // Read VIN from URL params and decode it
    useEffect(() => {
        const vinFromUrl = searchParams.get('vin')
        if (vinFromUrl && vinFromUrl.length === 17) {
            setIsLoadingVIN(true)

            // Decode VIN using NHTSA API
            decodeVINFull(vinFromUrl).then(info => {
                // Map fuel type from English to Spanish
                const fuelMap: Record<string, string> = {
                    'Gasoline': 'gasolina',
                    'Diesel': 'diesel',
                    'Electric': 'electrico',
                    'Hybrid': 'hibrido',
                    'Plug-in Hybrid': 'hibrido_enchufable',
                }

                // Map transmission
                const transmissionMap: Record<string, string> = {
                    'Automatic': 'automatico',
                    'Manual': 'manual',
                    'CVT': 'automatico',
                }

                // Map body class to carroceria
                const bodyMap: Record<string, string> = {
                    'Sedan': 'berlina',
                    'Hatchback': 'compacto',
                    'Coupe': 'coupe',
                    'Convertible': 'cabrio',
                    'Wagon': 'familiar',
                    'SUV': 'suv',
                    'Crossover': 'suv',
                    'Pickup': 'pick_up',
                    'Van': 'monovolumen',
                    'Minivan': 'monovolumen',
                }

                const detectedFuel = Object.entries(fuelMap).find(
                    ([eng]) => info.fuelType?.toLowerCase().includes(eng.toLowerCase())
                )?.[1] || ''

                const detectedTransmission = Object.entries(transmissionMap).find(
                    ([eng]) => info.transmission?.toLowerCase().includes(eng.toLowerCase())
                )?.[1] || ''

                const detectedBody = Object.entries(bodyMap).find(
                    ([eng]) => info.bodyClass?.toLowerCase().includes(eng.toLowerCase())
                )?.[1] || ''

                setInitialData({
                    vin: vinFromUrl.toUpperCase(),
                    marca: info.make || '',
                    modelo: info.model || '',
                    año_fabricacion: info.year || '',
                    año_matriculacion: info.year || '',
                    combustible: detectedFuel,
                    transmision: detectedTransmission,
                    tipo_carroceria: detectedBody,
                    potencia_cv: info.engineCylinders ? '' : '', // Would need HP data
                    cilindrada: info.engineDisplacement ? Math.round(parseFloat(info.engineDisplacement) * 1000).toString() : '',
                    num_puertas: info.doors || '5',
                })

                setVinInfo({
                    make: info.make || info.manufacturer,
                    model: info.model || '',
                    year: info.year || '',
                })

                setIsLoadingVIN(false)
            }).catch(() => {
                // Fallback to basic data
                setInitialData({ vin: vinFromUrl.toUpperCase() })
                setIsLoadingVIN(false)
            })
        }
    }, [searchParams])

    const handleSave = async (formData: VehicleFormData) => {
        setIsSaving(true)

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500))

        // Create vehicle object with all required fields
        const newVehicle: Vehicle = {
            id: generateId(),
            vin: formData.vin || '',
            matricula: formData.matricula || '',
            stock_id: generateId(),
            estado: 'disponible',
            destacado: false,
            en_oferta: false,
            marca: formData.marca,
            modelo: formData.modelo,
            version: formData.version || '',
            año_fabricacion: parseInt(formData.año_fabricacion) || parseInt(formData.año_matriculacion) || 2024,
            año_matriculacion: parseInt(formData.año_matriculacion) || 2024,
            tipo_motor: formData.combustible || 'gasolina',
            cilindrada: parseInt(formData.cilindrada) || 0,
            potencia_cv: parseInt(formData.potencia_cv) || 0,
            potencia_kw: Math.round((parseInt(formData.potencia_cv) || 0) * 0.7355),
            combustible: (formData.combustible || 'gasolina') as Vehicle['combustible'],
            consumo_mixto: 0,
            emisiones_co2: 0,
            etiqueta_dgt: 'C',
            transmision: (formData.transmision || 'manual') as Vehicle['transmision'],
            num_marchas: 5,
            traccion: 'delantera',
            tipo_carroceria: formData.tipo_carroceria || 'berlina',
            num_puertas: parseInt(formData.num_puertas) || 5,
            num_plazas: parseInt(formData.num_plazas) || 5,
            color_exterior: formData.color_exterior || '',
            color_interior: formData.color_interior || '',
            kilometraje: parseInt(formData.kilometraje) || 0,
            num_propietarios: parseInt(formData.num_propietarios) || 1,
            es_nacional: true,
            primera_mano: parseInt(formData.num_propietarios) === 1,
            precio_compra: parseFloat(formData.precio_compra) || 0,
            gastos_compra: parseFloat(formData.gastos_compra) || 0,
            coste_reparaciones: parseFloat(formData.coste_reparaciones) || 0,
            precio_venta: parseFloat(formData.precio_venta) || 0,
            descuento: parseFloat(formData.descuento) || 0,
            margen_bruto: (parseFloat(formData.precio_venta) || 0) - (parseFloat(formData.precio_compra) || 0) - (parseFloat(formData.gastos_compra) || 0) - (parseFloat(formData.coste_reparaciones) || 0),
            fecha_entrada_stock: new Date().toISOString().split('T')[0],
            dias_en_stock: 0,
            garantia_meses: parseInt(formData.garantia_meses) || 12,
            tipo_garantia: 'Garantía comercial',
            imagen_principal: '/placeholder-car.jpg',
            imagenes: [],
            equipamiento: formData.equipamiento || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: user?.id || undefined,
        }

        // Guardar en el data store
        addUserVehicle(newVehicle)

        // Show success notification
        addToast(`Vehículo creado: ${formData.marca} ${formData.modelo}`, 'success')
        setIsSaving(false)

        // Redirect to inventory
        router.push('/inventario')
    }

    return (
        <div className="space-y-6 animate-in">
            <div className="flex items-center gap-4">
                <Link href="/inventario">
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Nuevo Vehículo</h1>
                    {isLoadingVIN ? (
                        <p className="text-muted-foreground flex items-center gap-2">
                            <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            Decodificando VIN...
                        </p>
                    ) : vinInfo?.make ? (
                        <p className="text-muted-foreground">
                            <span className="font-medium text-blue-600">{vinInfo.make}</span>
                            {vinInfo.model && <span> {vinInfo.model}</span>}
                            {vinInfo.year && <span className="text-gray-400"> ({vinInfo.year})</span>}
                        </p>
                    ) : initialData?.vin ? (
                        <p className="text-muted-foreground">VIN: {initialData.vin}</p>
                    ) : (
                        <p className="text-muted-foreground">Añade un nuevo vehículo al inventario</p>
                    )}
                </div>
            </div>

            {isLoadingVIN ? (
                <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
                        <p className="text-sm text-gray-500">Obteniendo información del vehículo...</p>
                    </div>
                </div>
            ) : (
                <VehicleForm
                    initialData={initialData}
                    onSubmit={handleSave}
                    isSubmitting={isSaving}
                />
            )}
        </div>
    )
}

export default function NuevoVehiculoPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
            </div>
        }>
            <NuevoVehiculoContent />
        </Suspense>
    )
}
