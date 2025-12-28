"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { VehicleForm, VehicleFormData } from "@/components/inventory/VehicleForm"

export default function NuevoVehiculoPage() {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async (formData: VehicleFormData) => {
        setIsSaving(true)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Create vehicle object
        const newVehicle = {
            id: `v${Date.now()}`,
            ...formData,
            kilometraje: parseInt(formData.kilometraje) || 0,
            año_matriculacion: parseInt(formData.año_matriculacion) || 2024,
            año_fabricacion: parseInt(formData.año_fabricacion) || parseInt(formData.año_matriculacion) || 2024,
            potencia_cv: parseInt(formData.potencia_cv) || 0,
            cilindrada: parseInt(formData.cilindrada) || 0,
            num_puertas: parseInt(formData.num_puertas) || 5,
            num_plazas: parseInt(formData.num_plazas) || 5,
            num_propietarios: parseInt(formData.num_propietarios) || 1,
            precio_compra: parseFloat(formData.precio_compra) || 0,
            gastos_compra: parseFloat(formData.gastos_compra) || 0,
            coste_reparaciones: parseFloat(formData.coste_reparaciones) || 0,
            precio_venta: parseFloat(formData.precio_venta) || 0,
            descuento: parseFloat(formData.descuento) || 0,
            garantia_meses: parseInt(formData.garantia_meses) || 12,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        // Show success notification
        alert(`✓ Vehículo creado: ${formData.marca} ${formData.modelo}`)
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
                    <p className="text-muted-foreground">
                        Añade un nuevo vehículo al inventario
                    </p>
                </div>
            </div>

            <VehicleForm onSubmit={handleSave} isSubmitting={isSaving} />
        </div>
    )
}
