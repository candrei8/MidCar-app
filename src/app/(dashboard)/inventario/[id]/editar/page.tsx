"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { VehicleForm, VehicleFormData } from "@/components/inventory/VehicleForm"
import { mockVehicles } from "@/lib/mock-data"
import { notFound } from "next/navigation"

interface PageProps {
    params: { id: string }
}

export default function EditarVehiculoPage({ params }: PageProps) {
    const router = useRouter()
    const { id } = params
    const [isSaving, setIsSaving] = useState(false)
    const [initialData, setInitialData] = useState<Partial<VehicleFormData> | null>(null)

    useEffect(() => {
        const vehicle = mockVehicles.find(v => v.id === id)
        if (!vehicle) {
            notFound()
        }

        // Map existing images to UploadedFile format
        const fotos = vehicle.imagenes.map((url, index) => ({
            id: `existing-${index}`,
            name: `Foto ${index + 1}`,
            preview: url,
            size: 0,
            type: 'image/jpeg',
            lastModified: Date.now(),
            slice: () => new Blob(),
            stream: () => new ReadableStream(),
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
            text: () => Promise.resolve(""),
        } as any));

        // Add principal image if not in list
        if (vehicle.imagen_principal && !vehicle.imagenes.includes(vehicle.imagen_principal)) {
            fotos.unshift({
                id: 'principal-existing',
                name: 'Foto Principal',
                preview: vehicle.imagen_principal,
                size: 0,
                type: 'image/jpeg',
                lastModified: Date.now(),
                slice: () => new Blob(),
                stream: () => new ReadableStream(),
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
                text: () => Promise.resolve(""),
            } as any)
        }

        const formData: Partial<VehicleFormData> = {
            marca: vehicle.marca,
            modelo: vehicle.modelo,
            version: vehicle.version,
            matricula: vehicle.matricula,
            vin: vehicle.vin,
            año_matriculacion: vehicle.año_matriculacion.toString(),
            año_fabricacion: vehicle.año_fabricacion.toString(),
            kilometraje: vehicle.kilometraje.toString(),
            combustible: vehicle.combustible,
            transmision: vehicle.transmision,
            estado: vehicle.estado,
            tipo_carroceria: vehicle.tipo_carroceria,
            num_puertas: vehicle.num_puertas.toString(),
            num_plazas: vehicle.num_plazas.toString(),
            potencia_cv: vehicle.potencia_cv.toString(),
            cilindrada: vehicle.cilindrada.toString(),
            etiqueta_dgt: vehicle.etiqueta_dgt,
            color_exterior: vehicle.color_exterior,
            color_interior: vehicle.color_interior,
            num_propietarios: vehicle.num_propietarios.toString(),
            primera_mano: vehicle.primera_mano,
            es_nacional: vehicle.es_nacional,
            precio_compra: vehicle.precio_compra.toString(),
            gastos_compra: vehicle.gastos_compra.toString(),
            coste_reparaciones: vehicle.coste_reparaciones.toString(),
            precio_venta: vehicle.precio_venta.toString(),
            descuento: vehicle.descuento.toString(),
            garantia_meses: vehicle.garantia_meses.toString(),
            descripcion: '', // Not in mock data
            destacado: vehicle.destacado,
            en_oferta: vehicle.en_oferta,
            fotos: fotos,
            foto_principal: fotos.length > 0 ? fotos[0].id : null,
            documentos: [] // No documents in mock data
        }

        setInitialData(formData)
    }, [id])

    const handleSave = async (formData: VehicleFormData) => {
        setIsSaving(true)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Show success and redirect
        alert('✓ Vehículo actualizado correctamente')
        setIsSaving(false)

        // Redirect to detail
        router.push(`/inventario/${id}`)
    }

    if (!initialData) {
        return <div className="p-8 text-center">Cargando...</div>
    }

    return (
        <div className="space-y-6 animate-in">
            <div className="flex items-center gap-4">
                <Link href={`/inventario/${id}`}>
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Editar Vehículo</h1>
                    <p className="text-muted-foreground">
                        {initialData.marca} {initialData.modelo} - {initialData.matricula}
                    </p>
                </div>
            </div>

            <VehicleForm
                initialData={initialData}
                onSubmit={handleSave}
                isSubmitting={isSaving}
            />
        </div>
    )
}