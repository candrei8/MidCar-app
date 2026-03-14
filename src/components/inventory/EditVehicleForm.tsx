"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { VehicleForm, VehicleFormData } from "@/components/inventory/VehicleForm"
import { getVehicleById, updateVehicle } from "@/lib/supabase-service"
import { uploadVehicleImage, deleteVehicleImage } from "@/lib/vehicle-image-service"
import { useToast } from "@/components/ui/toast"

interface EditVehicleFormProps {
    vehicleId: string
}

export function EditVehicleForm({ vehicleId }: EditVehicleFormProps) {
    const router = useRouter()
    const { addToast } = useToast()
    const [isSaving, setIsSaving] = useState(false)
    const [initialData, setInitialData] = useState<Partial<VehicleFormData> | null>(null)
    const [notFoundState, setNotFoundState] = useState(false)
    const [originalImageUrls, setOriginalImageUrls] = useState<string[]>([])


    useEffect(() => {
        // Load vehicle from Supabase
        const loadVehicle = async () => {
            const vehicle = await getVehicleById(vehicleId)

            if (!vehicle) {
                setNotFoundState(true)
                return
            }

            // Map existing images to UploadedFile format
            // Handle both string[] and VehicleImage[] formats
            const rawImages = vehicle.imagenes || []
            const imageUrls = rawImages.map((img: any) =>
                typeof img === 'string' ? img : img.url || img.preview || ''
            ).filter((url: string) => url && url !== '/placeholder-car.svg')

            // Find which image is marked as principal in the DB
            const principalImg = rawImages.find((img: any) =>
                typeof img !== 'string' && img.es_principal
            )
            const principalUrl = principalImg?.url || vehicle.imagen_principal

            const fotos = imageUrls.map((url: string, index: number) => ({
                id: `existing-${index}`,
                name: `Foto ${index + 1}`,
                preview: url,
                file: new File([], `existing-${index}.jpg`),
                progress: 100,
                isExisting: true,
            }));

            // Add principal image if not in list
            if (vehicle.imagen_principal && vehicle.imagen_principal !== '/placeholder-car.svg' && !imageUrls.includes(vehicle.imagen_principal)) {
                fotos.unshift({
                    id: 'principal-existing',
                    name: 'Foto Principal',
                    preview: vehicle.imagen_principal,
                    file: new File([], 'principal.jpg'),
                    progress: 100,
                    isExisting: true,
                })
            }

            // Detect which photo ID should be the principal
            const principalFotoId = fotos.find((f: any) => f.preview === principalUrl)?.id || fotos[0]?.id || null

            // Store original URLs for deletion tracking
            setOriginalImageUrls(fotos.map((f: any) => f.preview))

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
            descripcion: vehicle.descripcion || '',
            destacado: vehicle.destacado,
            en_oferta: vehicle.en_oferta,
            fotos: fotos,
            foto_principal: principalFotoId,
            documentos: [] // No documents in mock data
        }

            setInitialData(formData)
        }
        loadVehicle()
    }, [vehicleId])

    const handleSave = async (formData: VehicleFormData) => {
        setIsSaving(true)

        try {
            // Process images: separate existing (have preview URL) from new (have file)
            const imagenesArray: { url: string; es_principal: boolean; orden: number }[] = []
            let imagenPrincipal = '/placeholder-car.svg'

            if (formData.fotos && formData.fotos.length > 0) {
                // We need a stockId for new image uploads
                const vehicle = await getVehicleById(vehicleId)
                const stockId = vehicle?.stock_id || vehicleId

                let orden = 0
                for (const foto of formData.fotos) {
                    const isPrincipal = formData.foto_principal === foto.id || (orden === 0 && !formData.foto_principal)
                    let url: string

                    if (foto.isExisting && foto.preview) {
                        // Existing photo - keep URL
                        url = foto.preview
                    } else if (foto.file && foto.file.size > 0) {
                        // New photo - upload to Storage
                        url = await uploadVehicleImage(foto.file, stockId, orden)
                    } else {
                        orden++
                        continue
                    }

                    imagenesArray.push({ url, es_principal: isPrincipal, orden })

                    if (isPrincipal) {
                        imagenPrincipal = url
                    }
                    orden++
                }
            }

            // Delete removed existing photos from Supabase Storage
            const currentUrls = imagenesArray.map(img => img.url)
            const removedUrls = originalImageUrls.filter(url => !currentUrls.includes(url))
            for (const url of removedUrls) {
                try {
                    await deleteVehicleImage(url)
                } catch (error) {
                    console.error('Error deleting old image:', error)
                }
            }

            // Convertir formData a formato Vehicle
            const updates: Record<string, any> = {
                marca: formData.marca,
                modelo: formData.modelo,
                version: formData.version,
                matricula: formData.matricula,
                vin: formData.vin,
                año_matriculacion: parseInt(formData.año_matriculacion) || 0,
                año_fabricacion: parseInt(formData.año_fabricacion) || 0,
                kilometraje: parseInt(formData.kilometraje) || 0,
                combustible: formData.combustible as any,
                transmision: formData.transmision as any,
                estado: formData.estado as any,
                tipo_carroceria: formData.tipo_carroceria,
                num_puertas: parseInt(formData.num_puertas) || 0,
                num_plazas: parseInt(formData.num_plazas) || 0,
                potencia_cv: parseInt(formData.potencia_cv) || 0,
                cilindrada: parseInt(formData.cilindrada) || 0,
                etiqueta_dgt: formData.etiqueta_dgt as any,
                color_exterior: formData.color_exterior,
                color_interior: formData.color_interior,
                num_propietarios: parseInt(formData.num_propietarios) || 1,
                primera_mano: formData.primera_mano,
                es_nacional: formData.es_nacional,
                precio_compra: parseInt(formData.precio_compra) || 0,
                gastos_compra: parseInt(formData.gastos_compra) || 0,
                coste_reparaciones: parseInt(formData.coste_reparaciones) || 0,
                precio_venta: parseInt(formData.precio_venta) || 0,
                descuento: parseInt(formData.descuento) || 0,
                garantia_meses: parseInt(formData.garantia_meses) || 12,
                destacado: formData.destacado,
                en_oferta: formData.en_oferta,
                equipamiento: formData.equipamiento || [],
                descripcion: formData.descripcion || '',
                imagen_principal: imagenesArray.length > 0 ? imagenPrincipal : undefined,
                imagenes: imagenesArray,
            }

            // Save changes to Supabase
            const result = await updateVehicle(vehicleId, updates)

            if (result) {
                // Dispatch update event
                window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'vehicles' } }))
                // Show success and redirect
                addToast('Vehículo actualizado correctamente', 'success')
                router.push(`/inventario/${vehicleId}`)
            } else {
                throw new Error('No se pudo actualizar el vehículo')
            }
        } catch (error) {
            console.error('Error saving vehicle:', error)
            addToast('Error al guardar el vehículo', 'error')
        } finally {
            setIsSaving(false)
        }
    }

    if (notFoundState) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-foreground mb-2">Vehículo no encontrado</h1>
                <p className="text-muted-foreground mb-4">El vehículo que buscas no existe.</p>
                <Link href="/inventario">
                    <Button>Volver al inventario</Button>
                </Link>
            </div>
        )
    }

    if (!initialData) {
        return <div className="p-8 text-center">Cargando...</div>
    }

    return (
        <div className="space-y-6 animate-in">
            <div className="flex items-center gap-4">
                <Link href={`/inventario/${vehicleId}`}>
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
